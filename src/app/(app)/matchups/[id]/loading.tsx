/** Placeholder for the matchup page: header, pre-set reminder, stages (summary), editor. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-5 motion-reduce:animate-none" aria-busy="true" aria-label="Loading">
      <div>
        <div className="mb-4 h-5 w-24 rounded-md bg-surface-2" />
        <div className="h-5 w-16 rounded-[3px] bg-surface-2" />
        <div className="mt-3 h-10 w-72 max-w-full rounded-md bg-surface-2" />
      </div>
      <div className="paper bg-ruled h-40 rounded-lg" />
      <div className="paper h-20 rounded-lg md:h-48" />
      <div className="paper bg-ruled h-80 rounded-lg" />
    </div>
  );
}
