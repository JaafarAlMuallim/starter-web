import type { TRPCRouterRecord } from "@trpc/server";
import { protectedProcedure } from "../trpc";
import { sql, desc } from "drizzle-orm";
import { chirps } from "@/server/db/schema";

export const dashboardRouter = {
  getChirpsByDay: protectedProcedure.query(async ({ ctx }) => {
    const all = await ctx.db
      .select({
        created_at: sql<string>`DATE(${chirps.created_at})`,
        chirps: sql<number>`cast(count(${chirps.id}) as int)`,
      })
      .from(chirps)
      .groupBy(sql`DATE(${chirps.created_at})`)
      .orderBy(desc(sql`DATE(${chirps.created_at})`));
    return all;
  }),
} satisfies TRPCRouterRecord;
