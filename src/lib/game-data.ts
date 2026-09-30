import type { Game } from "./types";

export const GAME_LABELS: Record<Game, string> = {
  ultimate: "Ultimate",
  melee: "Melee",
};

export const CHARACTERS: Record<Game, string[]> = {
  ultimate: [
    "Mario", "Donkey Kong", "Link", "Samus", "Dark Samus", "Yoshi", "Kirby", "Fox",
    "Pikachu", "Luigi", "Ness", "Captain Falcon", "Jigglypuff", "Peach", "Daisy",
    "Bowser", "Ice Climbers", "Sheik", "Zelda", "Dr. Mario", "Pichu", "Falco", "Marth",
    "Lucina", "Young Link", "Ganondorf", "Mewtwo", "Roy", "Chrom", "Mr. Game & Watch",
    "Meta Knight", "Pit", "Dark Pit", "Zero Suit Samus", "Wario", "Snake", "Ike",
    "Pokémon Trainer", "Diddy Kong", "Lucas", "Sonic", "King Dedede", "Olimar",
    "Lucario", "R.O.B.", "Toon Link", "Wolf", "Villager", "Mega Man", "Wii Fit Trainer",
    "Rosalina & Luma", "Little Mac", "Greninja", "Mii Brawler", "Mii Swordfighter",
    "Mii Gunner", "Palutena", "Pac-Man", "Robin", "Shulk", "Bowser Jr.", "Duck Hunt",
    "Ryu", "Ken", "Cloud", "Corrin", "Bayonetta", "Inkling", "Ridley", "Simon",
    "Richter", "King K. Rool", "Isabelle", "Incineroar", "Piranha Plant", "Joker",
    "Hero", "Banjo & Kazooie", "Terry", "Byleth", "Min Min", "Steve", "Sephiroth",
    "Pyra / Mythra", "Kazuya", "Sora",
  ],
  melee: [
    "Dr. Mario", "Mario", "Luigi", "Bowser", "Peach", "Yoshi", "Donkey Kong",
    "Captain Falcon", "Ganondorf", "Falco", "Fox", "Ness", "Ice Climbers", "Kirby",
    "Samus", "Zelda", "Sheik", "Link", "Young Link", "Pichu", "Pikachu", "Jigglypuff",
    "Mewtwo", "Mr. Game & Watch", "Marth", "Roy",
  ],
};

/** Returns the canonical roster spelling if the input matches a known character. */
export function canonicalCharacter(game: Game, input: string): string {
  const needle = input.trim().toLowerCase();
  return CHARACTERS[game].find((c) => c.toLowerCase() === needle) ?? input.trim();
}

/**
 * Abstract platform layouts used to draw a small, original silhouette for each stage.
 * Coordinates live in a 100 × 44 viewBox. `main` is the stage floor [x, width];
 * `platforms` are [x, y, width]. Unknown / custom stages fall back to a flat stage.
 */
export type StageLayout = {
  main: [number, number];
  platforms?: [number, number, number][];
  /** Floor thickness below the walkable surface (default 9). */
  depth?: number;
  /** How much the floor narrows toward the bottom, as a fraction of its width (default 0.12). */
  taper?: number;
  /** Angle in degrees of the slope next to each ledge (none by default). */
  slope?: number;
  /** Central support under the floor: [width, height]. */
  pillar?: [number, number];
  moving?: boolean;
  tilt?: number;
};

export const STAGE_LAYOUTS: Record<string, StageLayout> = {
  "Battlefield": { main: [16, 68], platforms: [[24, 21, 18], [58, 21, 18], [41, 11, 18]] },
  "Final Destination": { main: [8, 84] },
  // Same two-platform layout as Pokémon Stadium 2, on a smaller stage.
  "Small Battlefield": { main: [18, 64], platforms: [[26, 21, 16], [58, 21, 16]] },
  // Thin deck held up by a central pillar.
  "Pokémon Stadium 2": {
    main: [8, 84],
    platforms: [[20, 21, 20], [60, 21, 20]],
    depth: 4,
    taper: 0.02,
    pillar: [18, 8],
  },
  "Pokémon Stadium": { main: [8, 84], platforms: [[20, 21, 20], [60, 21, 20]] },
  // Centered platform ≈ 45% of the stage width.
  "Hollow Bastion": { main: [8, 84], platforms: [[31, 17, 38]] },
  // Same layout as Hollow Bastion on a smaller stage; platform ≈ 53% of the stage width.
  "Smashville": { main: [16, 68], platforms: [[32, 17, 36]] },
  // As long as Kalos; side platforms high, centre platform low ( -  _  - ).
  "Town & City": { main: [10, 80], platforms: [[16, 13, 18], [41, 21, 18], [66, 13, 18]] },
  // Deep, rectangular stage; each platform is centred right above a ledge.
  "Kalos Pokémon League": { main: [10, 80], platforms: [[2, 19, 16], [82, 19, 16]], depth: 13, taper: 0.02 },
  // Deeper walls and ~15° slopes next to each ledge.
  "Yoshi's Story": {
    main: [18, 64],
    platforms: [[22, 20, 16], [62, 20, 16], [42, 11, 16]],
    depth: 13,
    taper: 0.06,
    slope: 15,
  },
  "Lylat Cruise": { main: [14, 72], platforms: [[22, 20, 16], [62, 20, 16], [42, 11, 16]], tilt: -4 },
  "Dream Land": { main: [10, 80], platforms: [[20, 20, 20], [60, 20, 20], [40, 9, 20]] },
  "Fountain of Dreams": { main: [16, 68], platforms: [[22, 20, 16], [62, 20, 16], [42, 11, 16]], moving: true },
};

export const DEFAULT_LAYOUT: StageLayout = { main: [12, 76] };

/** Top of the stage floor in the 100 × 44 viewBox. */
export const FLOOR_Y = 30;
/** Horizontal length of the sloped section next to each ledge (when `slope` is set). */
const SLOPE_RUN = 7;

const r = (n: number) => Math.round(n * 100) / 100;

/** SVG path data for the stage floor (and its pillar, if any). */
export function stageFloorPaths(layout: StageLayout): string[] {
  const [x, w] = layout.main;
  const depth = layout.depth ?? 9;
  const inset = w * (layout.taper ?? 0.12);
  const run = layout.slope ? SLOPE_RUN : 0;
  const drop = layout.slope ? SLOPE_RUN * Math.tan((layout.slope * Math.PI) / 180) : 0;
  const bottom = FLOOR_Y + depth;

  const floor = [
    `M${r(x)} ${r(FLOOR_Y + drop)}`,
    `L${r(x + run)} ${FLOOR_Y}`,
    `L${r(x + w - run)} ${FLOOR_Y}`,
    `L${r(x + w)} ${r(FLOOR_Y + drop)}`,
    `L${r(x + w - inset)} ${bottom}`,
    `L${r(x + inset)} ${bottom}`,
    "Z",
  ].join(" ");

  if (!layout.pillar) return [floor];

  const [pw, ph] = layout.pillar;
  const cx = x + w / 2;
  const pillar = `M${r(cx - pw / 2)} ${bottom} h${pw} l-1.5 ${ph} h-${pw - 3} Z`;
  return [floor, pillar];
}
