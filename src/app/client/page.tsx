"use client";

import { cx } from "class-variance-authority";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import ChirpForm from "@/components/chirp-form";
import { useRef } from "react";
import { useLiveChirps } from "@/hooks/use-live-chirps";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { run } from "@/lib/utils";

const ViewChirps = () => {
  const liveChirps = useLiveChirps();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!liveChirps.chirps) {
    return <div>No Chirps Yet. Start Chirping</div>;
  }
  return (
    <MaxWidthWrapper className="flex flex-col gap-4">
      <ChirpForm />
      <SubscriptionStatus subscription={liveChirps.subscription} />

      <div className="flex flex-col gap-4" ref={scrollRef}>
        {liveChirps.chirps.map((chirp) => (
          <Card key={chirp.id}>
            <CardHeader className="flex flex-row items-center justify-start gap-2">
              <span>{chirp.user.name}</span>
            </CardHeader>
            <CardContent>
              <p>{chirp.chirp}</p>
            </CardContent>
            <CardFooter>
              <p>{new Date(chirp.updated_at).toLocaleString()}</p>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div>
        <Button
          disabled={
            !liveChirps.query.hasNextPage || liveChirps.query.isFetchingNextPage
          }
          onClick={() => {
            void liveChirps.query.fetchNextPage();
          }}
        >
          {liveChirps.query.isFetchingNextPage
            ? "Loading..."
            : !liveChirps.query.hasNextPage
              ? "Fetched everything!"
              : "Load more"}
        </Button>
      </div>
    </MaxWidthWrapper>
  );
};

export default ViewChirps;

function SubscriptionStatus(props: {
  subscription: ReturnType<typeof useLiveChirps>["subscription"];
}) {
  const { subscription } = props;
  const unstable =
    " | This should be realtime using two browsers, but currently unstable using SSE";
  return (
    <div
      className={cx(
        "rounded-md p-2 text-sm transition-colors",
        run(() => {
          switch (subscription.status) {
            case "connecting":
              return "bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-400";
            case "error":
              return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            case "pending":
              return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
          }
        }),
      )}
    >
      {run(() => {
        switch (subscription.status) {
          case "connecting":
            // treat idle and connecting the same

            return (
              <div>
                Connecting...
                {subscription.error && " (There are connection problems)"}
                {unstable}
              </div>
            );
          case "error":
            // something went wrong
            return (
              <div>
                Error - <em>{subscription.error.message}</em>
                <a
                  href="#"
                  onClick={() => {
                    subscription.reset();
                  }}
                  className="hover underline"
                >
                  Try Again
                  {unstable}
                </a>
              </div>
            );
          case "pending":
            // we are polling for new messages
            return (
              <div>
                Connected - awaiting messages
                {unstable}
              </div>
            );
        }
      })}
    </div>
  );
}
