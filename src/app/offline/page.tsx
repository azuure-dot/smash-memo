import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid size-14 place-items-center rounded-2xl border border-line bg-surface">
        <WifiOff className="size-6 text-muted" aria-hidden />
      </div>
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="text-sm text-muted">
        Pages you&apos;ve opened recently are still available. Reconnect to sync new changes.
      </p>
      <Link href="/" className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-on-brand">
        Try again
      </Link>
    </main>
  );
}
