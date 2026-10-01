/** Shown instantly while a signed-in page loads, so clicks get immediate feedback. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 rounded-xl bg-surface-2" />
      <div className="h-10 w-36 rounded-xl bg-surface-2" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-[92px] rounded-2xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
