/** Placeholder for the matchup page: header, pre-set reminder, stages (summary), editor. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading">
      <div>
        <div className="mb-4 h-5 w-24 rounded-lg bg-surface-2" />
        <div className="h-5 w-16 rounded-md bg-surface-2" />
        <div className="mt-2 h-9 w-72 max-w-full rounded-xl bg-surface-2" />
      </div>
      <div className="h-40 rounded-2xl border border-brand-from/30 bg-brand-from/[0.04]" />
      <div className="h-20 rounded-2xl border border-line bg-surface md:h-48" />
      <div className="h-80 rounded-2xl border border-line bg-surface" />
    </div>
  );
}
