import AuthButtons from "@/components/auth-buttons";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-slate-100 px-4 py-3">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-xl font-bold">
          MonoRepo Starter
        </Link>

        <Link href="/" className="text-md font-semibold">
          Chirp Server
        </Link>
        <Link href="/client" className="text-md font-semibold">
          Chirp Realtime
        </Link>
        <Link href="/dashboard" className="text-md font-semibold">
          Dashboard
        </Link>
      </div>

      <AuthButtons />
    </nav>
  );
}
