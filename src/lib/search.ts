/**
 * Dashboard search: keeps the notes whose title (simple notes) or characters (matchups) contain what was typed.
 * Case, accents, spaces and punctuation are ignored, so "ledgetrap" finds "Ledge trap", "pokemon" finds
 * "Pokémon Trainer" and "dr mario" finds "Dr. Mario".
 */

/** "Pokémon Trainer" → "pokemontrainer". */
export function normalizeSearch(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

type Searchable = {
  kind?: string | null;
  title: string | null;
  my_character: string | null;
  opponent_character: string | null;
};

/** What a note is searched on: its title, or "Marth vs Fox" (so "marth vs fox" works too). */
function haystack(entry: Searchable) {
  return entry.kind === "note"
    ? (entry.title ?? "")
    : `${entry.my_character ?? ""} vs ${entry.opponent_character ?? ""}`;
}

export function matchesSearch(entry: Searchable, query: string) {
  const q = normalizeSearch(query);
  return !q || normalizeSearch(haystack(entry)).includes(q);
}
