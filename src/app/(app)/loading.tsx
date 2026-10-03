/** Shown instantly while a signed-in page loads, so clicks get immediate feedback. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 motion-reduce:animate-none" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-56 rounded-md bg-surface-2" />
      {/* Game selector */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-24 rounded-lg border border-dashed border-line sm:h-28" />
        ))}
      </div>
      <div className="h-10 w-44 rounded-md bg-surface-2" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="paper h-[92px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
