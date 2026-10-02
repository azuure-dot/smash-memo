import { DEFAULT_LAYOUT, STAGE_LAYOUTS, stageFloorPaths } from "@/lib/game-data";

/**
 * Small, original stage silhouette (floor + platforms) drawn from abstract layout data.
 * Uses currentColor, so it takes the card's status colour.
 */
export function StageGlyph({ name, className }: { name: string; className?: string }) {
  const layout = STAGE_LAYOUTS[name] ?? DEFAULT_LAYOUT;

  return (
    <svg viewBox="0 0 100 44" className={className} aria-hidden fill="currentColor">
      <g transform={layout.tilt ? `rotate(${layout.tilt} 50 30)` : undefined}>
        {stageFloorPaths(layout).map((d, i) => (
          <path key={i} d={d} opacity={0.9} />
        ))}
        {layout.platforms?.map(([px, py, pw], i) => (
          <rect key={i} x={px} y={py} width={pw} height={2.2} rx={1.1} opacity={0.75} />
        ))}
      </g>
      {layout.moving === "vertical" ? (
        <path
          d="M7 3 v8 M5 5 l2 -2 2 2 M5 9 l2 2 2 -2 M93 3 v8 M91 5 l2 -2 2 2 M91 9 l2 2 2 -2"
          stroke="currentColor"
          strokeWidth={1}
          fill="none"
          opacity={0.45}
        />
      ) : layout.moving && (
        <path
          d="M4 8 h6 M8 6 l2 2 -2 2 M96 8 h-6 M92 6 l-2 2 2 2"
          stroke="currentColor"
          strokeWidth={1}
          fill="none"
          opacity={0.45}
        />
      )}
    </svg>
  );
}
