import { DEFAULT_LAYOUT, platformPath, STAGE_LAYOUTS, stageFloorPaths } from "@/lib/game-data";

/**
 * Small, original stage silhouette (floor + platforms) drawn from abstract layout data.
 * Uses currentColor, so it takes the card's status colour.
 */
export function StageGlyph({ name, className }: { name: string; className?: string }) {
  const layout = STAGE_LAYOUTS[name] ?? DEFAULT_LAYOUT;

  return (
    <svg viewBox="0 0 100 44" className={className} aria-hidden fill="currentColor">
      {stageFloorPaths(layout).map((d, i) => (
        <path key={i} d={d} opacity={0.9} />
      ))}
      {layout.platforms?.map((p, i) => (
        <path key={i} d={platformPath(layout, p)} opacity={0.75} />
      ))}
    </svg>
  );
}
