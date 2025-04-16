import { tracked, TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import EventEmitter, { on } from "node:events";

import { protectedProcedure, publicProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { streamToAsyncIterable } from "../lib/stream-to-async";
import { chirps, type ReadChirp, type User } from "@/server/db/schema";

export interface MyEvents {
  add: (data: ReadChirp & { user: User }) => void;
}

declare interface MyEventEmitter {
  on<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  off<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  once<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  emit<TEv extends keyof MyEvents>(
    event: TEv,
    ...args: Parameters<MyEvents[TEv]>
  ): boolean;
}

class MyEventEmitter extends EventEmitter {
  public toIterable<TEv extends keyof MyEvents>(
    event: TEv,
    opts: NonNullable<Parameters<typeof on>[2]>,
  ): AsyncIterable<Parameters<MyEvents[TEv]>> {
    return on(this, event, opts) as any;
  }
}

// In a real app, you would use a better data source like Redis
export const ee = new MyEventEmitter();

export const chirpRouter = {
  addChirp: protectedProcedure
    .input(
      z.object({
        chirp: z.string().min(1).max(140).trim(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      //const chirp: WriteChirp = {
      //  userId: ctx.session.user.id,
      //  chirp: input.chirp,
      //  created_at: new Date().getTime().toString(),
      //  updated_at: new Date().getTime().toString(),
      //};

      // adding one chirp, you can add multiple by using [{objects}]
      const [addedChirp] = await ctx.db
        .insert(chirps)
        .values({
          userId: ctx.session.user.id,
          chirp: input.chirp,
        })
        .returning({
          id: chirps.id,
        });

      if (!addedChirp)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Chirp Failed to Add",
        });

      const chirpUser = await ctx.db.query.chirps.findFirst({
        where: eq(chirps.id, addedChirp.id),
        with: {
          user: true,
        },
      });
      const chirp = chirpUser;

      ee.emit("add", chirp!);
      return chirpUser;
    }),

  getChirps: publicProcedure.query(async ({ ctx }) => {
    const allChirps = await ctx.db.query.chirps.findMany({
      with: {
        user: true,
      },
      orderBy: (fields, ops) => ops.desc(fields.updated_at),
    });
    return allChirps;
  }),

  infinite: protectedProcedure
    .input(
      z.object({
        cursor: z.date().nullish(),
        take: z.number().min(1).max(50).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const take = input.take ?? 20;
      let cursor;
      if (Boolean(input.cursor) && input.cursor) {
        cursor = new Date(input.cursor);
      } else {
        cursor = Date.now();
      }

      const allChirps = await ctx.db.query.chirps.findMany({
        with: {
          user: true,
        },
        where: (fields, ops) => ops.lte(fields.updated_at, cursor.toString()),
        orderBy: (fields, ops) => ops.desc(fields.updated_at),
        limit: take + 1,
      });
      const items = allChirps.reverse();
      let nextCursor: typeof cursor | null = null;
      if (items.length > take) {
        const prev = items.shift();
        nextCursor = new Date(prev!.updated_at);
      }
      return {
        items,
        nextCursor,
      };
    }),
  onAdd: publicProcedure
    .input(
      z.object({
        lastEventId: z.number().nullish(),
      }),
    )
    .subscription(async function* ({ ctx, input, signal }) {
      //const iterable = ee.toIterable("add", {
      //  signal: signal,
      //});

      let unsubscribe = () => {
        //
      };

      // We use a readable stream here to prevent the client from missing events
      // created between the fetching & yield'ing of `newItemsSinceCursor` and the
      // subscription to the ee
      const stream = new ReadableStream<ReadChirp & { user: User }>({
        async start(controller) {
          const onAdd: MyEvents["add"] = (data) => {
            controller.enqueue(data);
          };
          ee.on("add", onAdd);
          unsubscribe = () => {
            ee.off("add", onAdd);
          };

          let lastChirpUpdatedAt = await (async () => {
            const lastEventId = Number(input.lastEventId);
            if (!lastEventId) return null;
            const itemById = await ctx.db.query.chirps.findFirst({
              where: (fields, ops) => ops.eq(fields.id, lastEventId),
              with: {
                user: true,
              },
            });
            return itemById?.created_at ?? null;
          })();

          const newChirpSinceLast = await ctx.db.query.chirps.findMany({
            where: (fields, ops) =>
              lastChirpUpdatedAt
                ? ops.gt(fields.created_at, lastChirpUpdatedAt ?? 0)
                : undefined,
            orderBy: (fields, ops) => ops.desc(fields.created_at),
            with: {
              user: true,
            },
          });
          for (const chirp of newChirpSinceLast) {
            controller.enqueue(chirp);
          }
        },
        cancel() {
          unsubscribe();
        },
      });
      //let lastChirpUpdatedAt = await (async () => {
      //  const lastEventId = input.lastEventId;
      //  if (!lastEventId) return null;
      //  const itemById = await ctx.db.query.chirps.findFirst({
      //    where: (fields, ops) => ops.eq(fields.id, lastEventId),
      //    with: {
      //      user: true,
      //    },
      //  });
      //  return itemById?.created_at ?? null;
      //})();

      //const newChirpSinceLast = await ctx.db.query.chirps.findMany({
      //  where: (fields, ops) =>
      //    lastMessageUpdatedAt
      //      ? ops.gt(fields.created_at, lastMessageUpdatedAt ?? 0)
      //      : undefined,
      //  orderBy: (fields, ops) => ops.desc(fields.created_at),
      //  with: {
      //    user: true,
      //  },
      //});

      for await (const chirp of streamToAsyncIterable(stream, {
        signal: signal,
      })) {
        yield tracked(chirp.id.toString(), chirp);
      }
      //function* generatorYield(chirp: ReadChirp & { user: User }) {
      //  if (lastMessageUpdatedAt && chirp.created_at < lastMessageUpdatedAt) {
      //    console.log("SKIPPING");
      //
      //    return;
      //  }
      //  console.log("YIELDING ", chirp);
      //  yield tracked(chirp.id.toString(), chirp);
      //
      //  lastMessageUpdatedAt = chirp.created_at;
      //}
      //// New Fetched Data
      //for (const chirp of newChirpSinceLast) {
      //  yield* generatorYield(chirp);
      //}
      //
      //// Event Emitter Data
      //for await (const [chirp] of iterable) {
      //  console.log("CHIRP EMITTED ONADD: ", chirp);
      //  yield* generatorYield(chirp);
      //}
    }),
  getUserChirps: protectedProcedure.query(async ({ ctx }) => {
    const userChirps = await ctx.db.query.chirps.findMany({
      with: {
        user: true,
      },
      where: eq(chirps.userId, ctx.session.user.id),
      orderBy: (chirps, { desc }) => [desc(chirps.updated_at)],
    });
    //const userChirps = await db
    //  .select()
    //  .from(chirps)
    //  .where(eq(chirps.userId, ctx.session.user.id))
    //  .orderBy(chirps.updated_at);
    return userChirps;
  }),
} satisfies TRPCRouterRecord;
