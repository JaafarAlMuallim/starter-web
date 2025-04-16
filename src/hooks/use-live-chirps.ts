"use client";
import { api } from "@/trpc/react";
import { useState, useCallback, useEffect } from "react";

export function useLiveChirps() {
  const utils = api.useUtils();
  const [, query] = api.chirp.infinite.useSuspenseInfiniteQuery(
    { take: null },
    {
      getNextPageParam: (d) => (d.nextCursor ? new Date(d.nextCursor) : null),
      // No need to refetch as we have a subscription
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );
  const [chirps, setChirps] = useState(() => {
    const chirps = query.data?.pages.map((page) => page.items).flat();
    return chirps ?? null;
  });
  type Chirp = NonNullable<typeof chirps>[number];

  /**
   * fn to add and dedupe new messages onto state
   */
  const addChirp = useCallback((incoming?: Chirp[]) => {
    setChirps((current) => {
      const map: Record<Chirp["id"], Chirp> = {};
      for (const chirp of current ?? []) {
        if (chirp) {
          map[chirp.id] = chirp;
        }
      }
      for (const chirp of incoming ?? []) {
        console.log("CHIRP INCOMING LOOP ", chirp);
        if (chirp) {
          map[chirp.id] = chirp;
        }
      }
      return Object.values(map).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
    });
  }, []);

  /**
   * when new data from `useInfiniteQuery`, merge with current state
   */
  useEffect(() => {
    const chirps = query.data?.pages.map((page) => page.items).flat();
    addChirp(chirps);
    // debounce it
    setTimeout(() => {
      utils.chirp.invalidate();
    }, 3000);
  }, [query.data?.pages, addChirp]);

  const [lastEventId, setLastEventId] = useState<
    // Query has not been run yet
    | false
    // Empty list
    | null
    // Event id
    | number
  >(false);
  if (chirps && lastEventId === false) {
    // We should only set the lastEventId once, if the SSE-connection is lost, it will automatically reconnect and continue from the last event id
    // Changing this value will trigger a new subscription
    setLastEventId(chirps.at(-1)?.id ?? null);
  }
  type ReturnedEvent = [string, Chirp];
  const subscription = api.chirp.onAdd.useSubscription(
    { lastEventId: lastEventId == false ? null : lastEventId },
    {
      onData(event) {
        const data = event as unknown as ReturnedEvent;
        console.log("[WEB] Received event:", data[1]);
        addChirp([data[1]]);
        utils.chirp.invalidate();
      },
      onStarted() {
        console.log("[WEB] Subscription started");
      },
      onError(err) {
        console.error("Subscription error:", err);

        const lastMessageEventId = chirps?.at(-1)?.id;
        if (lastMessageEventId) {
          // We've lost the connection, let's resubscribe from the last message
          setLastEventId(lastMessageEventId);
        }
      },
    },
  );
  return {
    query,
    chirps,
    subscription,
  };
}
