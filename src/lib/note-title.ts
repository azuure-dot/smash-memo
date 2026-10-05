/** Simple notes (0011): a title instead of two characters. Same limit as the database check. */
export const NOTE_TITLE_MAX = 100;

/** Trimmed, inner whitespace collapsed, 1 to 100 characters; otherwise an error message for the form. */
export function cleanNoteTitle(raw: unknown): string | { error: string } {
  const title = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!title) return { error: "Give your note a title." };
  if (title.length > NOTE_TITLE_MAX) return { error: `Titles can be up to ${NOTE_TITLE_MAX} characters.` };
  return title;
}
