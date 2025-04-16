import { env } from "@/env";
import { createAuthClient } from "better-auth/react"; // make sure to import from better-auth/react
import { type NextRequest, NextResponse } from "next/server";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export async function authMiddleware(req: NextRequest) {
  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    },
  });
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
  return NextResponse.next();
}
