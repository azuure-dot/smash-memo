import Link from "next/link";

export default function MatchupNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <h1 className="text-xl font-semibold">Matchup not found</h1>
      <p className="text-sm text-muted">It may have been deleted, or it belongs to another account.</p>
      <Link href="/" className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white">
        Back to matchups
      </Link>
    </div>
  );
}
