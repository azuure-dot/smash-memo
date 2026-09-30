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
  moving?: boolean;
  tilt?: number;
};

export const STAGE_LAYOUTS: Record<string, StageLayout> = {
  "Battlefield": { main: [16, 68], platforms: [[24, 21, 18], [58, 21, 18], [41, 11, 18]] },
  "Final Destination": { main: [8, 84] },
  "Small Battlefield": { main: [12, 76], platforms: [[22, 21, 18], [60, 21, 18], [41, 11, 18]] },
  "Pokémon Stadium 2": { main: [8, 84], platforms: [[20, 21, 20], [60, 21, 20]] },
  "Pokémon Stadium": { main: [8, 84], platforms: [[20, 21, 20], [60, 21, 20]] },
  "Hollow Bastion": { main: [10, 80], platforms: [[40, 17, 20]] },
  "Smashville": { main: [14, 72], platforms: [[34, 17, 20]], moving: true },
  "Town & City": { main: [14, 72], platforms: [[22, 20, 18], [60, 20, 18]], moving: true },
  "Kalos Pokémon League": { main: [6, 88] },
  "Yoshi's Story": { main: [18, 64], platforms: [[22, 21, 16], [62, 21, 16], [42, 12, 16]] },
  "Lylat Cruise": { main: [14, 72], platforms: [[22, 20, 16], [62, 20, 16], [42, 11, 16]], tilt: -4 },
  "Dream Land": { main: [10, 80], platforms: [[20, 20, 20], [60, 20, 20], [40, 9, 20]] },
  "Fountain of Dreams": { main: [16, 68], platforms: [[22, 20, 16], [62, 20, 16], [42, 11, 16]], moving: true },
};

export const DEFAULT_LAYOUT: StageLayout = { main: [12, 76] };
