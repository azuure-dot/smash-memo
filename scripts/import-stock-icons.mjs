// Imports character stock icons (default costume only) into public/stock-icons/<game>/ and regenerates
// src/lib/stock-icons.ts, which tells the app which characters have an icon.
//
// Usage (from the project folder; add --dry-run to preview without copying anything):
//   node scripts/import-stock-icons.mjs                 imports the three games with the sources below
//   node scripts/import-stock-icons.mjs --game melee    one game only
//
// Sources (owner's machine, 2026-10-04):
//   ultimate  Documents\Ultimate French Pack 1.1\Personnages\Stock Icon   "[Name] 0.png" = default costume
//             (falls back to "[Name].png" when there's no "0" file, e.g. the Miis)
//   melee     Documents\Stock icons\Melee                                  "[Name]HeadSSBM.webp"
//   roa2      Documents\Stream Tool\Resources\Characters\[Name]\Icons\Default.png
//
// Alternate costumes ("Marth 2.png", "Fox 7.png"…) are always ignored. Icons are resized to 64 px WebP.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const DRY_RUN = args.includes("--dry-run");
const SIZE = 64;
const DOCS = join(homedir(), "Documents");

/**
 * Where each game's icons live and how to read their names.
 * flat:    one folder of files; `stripSuffix` is removed from the name; `slot0` = "prefer" uses "[Name] 0"
 *          first, then "[Name]".
 * folders: one folder per character, icon at `iconFile` inside it.
 */
const SOURCES = {
  ultimate: { layout: "flat", dir: join(DOCS, "Ultimate French Pack 1.1", "Personnages", "Stock Icon"), slot0: "prefer" },
  melee: { layout: "flat", dir: join(DOCS, "Stock icons", "Melee"), stripSuffix: "HeadSSBM" },
  roa2: { layout: "folders", dir: join(DOCS, "Stream Tool", "Resources", "Characters"), iconFile: join("Icons", "Default.png") },
};

/** Other names the icon packs use for a character (French names, abbreviations). */
const ALIASES = {
  "Isabelle": ["Marie"],
  "Piranha Plant": ["Plante"],
  "Jigglypuff": ["Rondoudou"],
  "Villager": ["Villageois"],
  "Zero Suit Samus": ["ZSS"],
  "Mega Man": ["Megaman"],
  "Pyra / Mythra": ["Pyra"],
  "Wii Fit Trainer": ["Wii Fit"],
  "King K. Rool": ["KingKRool"],
  "Pokémon Trainer": ["Pokemon Trainer"],
  "Charizard": ["Dracaufeu"],
  "Squirtle": ["Carapuce"],
  "Ivysaur": ["Herbizarre"],
  "Greninja": ["Amphinobi"],
  "Incineroar": ["Felinferno"],
  "Mr. Game & Watch": ["Mr Game & Watch", "Game & Watch"],
  "Dr. Mario": ["Dr Mario", "Docteur Mario"],
  "Donkey Kong": ["DK"],
  "Diddy Kong": ["Diddy"],
  "Dark Samus": ["Samus Sombre"],
  "Dark Pit": ["Pit Maléfique"],
  "Bowser Jr.": ["Bowser Jr", "Koopalings (Bowser Jr.)"],
  "Ice Climbers": ["IceClimbers"],
  "Duck Hunt": ["Duo Duck Hunt"],
  "Captain Falcon": ["CaptainFalcon"],
  "King Dedede": ["Roi Dadidou"],
  "Hero": ["Heros", "Héros"],
  "Olimar": ["Pikmin"],
  "Steve": ["Minecraft"],
};

const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
const slug = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Rosters straight from src/lib/game-data.ts, so names always match the app. */
function rosters() {
  const src = readFileSync("src/lib/game-data.ts", "utf8");
  const block = src.match(/export const CHARACTERS[\s\S]*?\n};/)[0];
  const out = {};
  for (const m of block.matchAll(/(\w+): \[([\s\S]*?)\]/g)) out[m[1]] = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  return out;
}

const ROSTERS = rosters();
const games = opt("--game") ? [opt("--game")] : Object.keys(SOURCES);

/** Candidate icon files of a source: [{ key: name as written by the pack, path, slot0 }]. */
function listCandidates(src) {
  if (!existsSync(src.dir)) throw new Error(`Folder not found: ${src.dir}`);
  if (src.layout === "folders") {
    return readdirSync(src.dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => ({ key: d.name, path: join(src.dir, d.name, src.iconFile), slot0: false }))
      .filter((c) => existsSync(c.path));
  }
  return readdirSync(src.dir)
    .filter((f) => /\.(png|webp)$/i.test(f))
    .map((f) => {
      let key = f.replace(/\.(png|webp)$/i, "");
      if (src.stripSuffix && key.endsWith(src.stripSuffix)) key = key.slice(0, -src.stripSuffix.length);
      const slot0 = /\s0$/.test(key);
      if (slot0) key = key.replace(/\s0$/, "");
      else if (/\d/.test(key)) return null; // alternate costume ("Marth 2", "Fox 7"): ignored
      return { key, path: join(src.dir, f), slot0 };
    })
    .filter(Boolean);
}

for (const game of games) {
  const src = SOURCES[game];
  if (!src || !ROSTERS[game]) throw new Error(`Unknown game "${game}". Known: ${Object.keys(SOURCES).join(", ")}`);
  const candidates = listCandidates(src);
  const outDir = join("public", "stock-icons", game);
  const found = [];
  const missing = [];
  for (const name of ROSTERS[game]) {
    const wanted = [name, ...(ALIASES[name] ?? [])].map(norm);
    const matches = candidates.filter((c) => wanted.includes(norm(c.key)));
    // Default costume: the "[Name] 0" file when the source prefers it, otherwise the plain "[Name]" file.
    const pick =
      src.slot0 === "prefer"
        ? (matches.find((c) => c.slot0) ?? matches.find((c) => !c.slot0))
        : (matches.find((c) => !c.slot0) ?? matches.find((c) => c.slot0));
    if (pick) found.push({ name, from: pick.path, out: join(outDir, `${slug(name)}.webp`) });
    else missing.push(name);
  }

  console.log(`\n${game}: ${found.length}/${ROSTERS[game].length} characters have an icon in ${src.dir}`);
  for (const f of found) console.log(`  ${f.name.padEnd(20)} <- ${f.from.slice(src.dir.length + 1)}`);
  if (missing.length) console.log(`  No icon: ${missing.join(", ")}`);
  if (DRY_RUN) continue;

  mkdirSync(outDir, { recursive: true });
  for (const f of found) {
    await sharp(f.from)
      .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(f.out);
  }
  console.log(`  Wrote ${found.length} icons to ${outDir}`);
}

if (DRY_RUN) {
  console.log("\nDry run: nothing copied.");
  process.exit(0);
}
// Regenerate the app's list from what is actually on disk, for every game.
const entries = {};
for (const [game, names] of Object.entries(ROSTERS)) {
  const dir = join("public", "stock-icons", game);
  if (!existsSync(dir)) continue;
  const have = new Set(readdirSync(dir));
  const map = Object.fromEntries(names.filter((n) => have.has(`${slug(n)}.webp`)).map((n) => [n, `/stock-icons/${game}/${slug(n)}.webp`]));
  if (Object.keys(map).length) entries[game] = map;
}
writeFileSync(
  "src/lib/stock-icons.ts",
  `// GENERATED by scripts/import-stock-icons.mjs — do not edit by hand, re-run the script instead.
// Character name (as in CHARACTERS) → icon path under /public, per game.
import type { Game } from "./types";

export const STOCK_ICONS: Partial<Record<Game, Record<string, string>>> = ${JSON.stringify(entries, null, 2)};
`,
);
console.log("Updated src/lib/stock-icons.ts");
