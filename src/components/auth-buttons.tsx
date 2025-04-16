import Link from "next/link";
import SignoutButton from "@/components/signout-button";
import { Button } from "./ui/button";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";
export default async function AuthButtons() {
  const session = auth.api.getSession({
    headers: await headers(),
  });

  return !session ? (
    <div className="flex justify-center gap-2">
      <Link href="/sign-in">
        <Button>Sign In</Button>
      </Link>
      <Link href="/sign-up">
        <Button>Sign Up</Button>
      </Link>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <SignoutButton />
    </div>
  );
}
