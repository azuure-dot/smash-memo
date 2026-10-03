import Link from "next/link";

export default function MatchupNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <h1 className="font-serif text-2xl font-semibold">Matchup not found</h1>
      <p className="text-sm text-muted">It may have been deleted, or it belongs to another account.</p>
      <Link
        href="/"
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-[filter] hover:brightness-110"
      >
        Back to matchups
      </Link>
    </div>
  );
}
