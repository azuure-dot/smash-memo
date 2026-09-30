import { DEFAULT_LAYOUT, STAGE_LAYOUTS } from "@/lib/game-data";

/**
 * Small, original stage silhouette (floor + platforms) drawn from abstract layout data.
 * Uses currentColor, so it takes the card's status colour.
 */
export function StageGlyph({ name, className }: { name: string; className?: string }) {
  const layout = STAGE_LAYOUTS[name] ?? DEFAULT_LAYOUT;
  const [x, w] = layout.main;
  const floorY = 30;

  return (
    <svg viewBox="0 0 100 44" className={className} aria-hidden fill="currentColor">
      <g transform={layout.tilt ? `rotate(${layout.tilt} 50 30)` : undefined}>
        {/* floor: a slab that tapers toward the bottom */}
        <path
          d={`M${x} ${floorY} h${w} l-${w * 0.12} 9 h-${w * 0.76} z`}
          opacity={0.9}
        />
        {layout.platforms?.map(([px, py, pw], i) => (
          <rect key={i} x={px} y={py} width={pw} height={2.2} rx={1.1} opacity={0.75} />
        ))}
      </g>
      {layout.moving && (
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
