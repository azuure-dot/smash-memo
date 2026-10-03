import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="paper grid size-14 place-items-center rounded-lg">
        <WifiOff className="size-6 text-muted" aria-hidden />
      </div>
      <h1 className="font-serif text-2xl font-semibold">You&apos;re offline</h1>
      <p className="text-sm text-muted">
        Pages you&apos;ve opened recently are still available. Reconnect to sync new changes.
      </p>
      <Link
        href="/"
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-[filter] hover:brightness-110"
      >
        Try again
      </Link>
    </main>
  );
}
