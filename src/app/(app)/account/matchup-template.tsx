"use client";

import type { JSONContent } from "@tiptap/react";
import { useCallback } from "react";
import { NoteEditor } from "@/components/matchup/note-editor";
import { createClient } from "@/lib/supabase/client";

/** An editor with nothing in it saves as "no template": new matchups then start with empty notes. */
function isEmptyDoc(doc: JSONContent) {
  return !doc.content?.some((node) => node.type !== "paragraph" || (node.content?.length ?? 0) > 0);
}

/**
 * Account → Matchup template: the Notes every new matchup starts with. Same editor as a matchup's Notes,
 * autosaved to the user's own profile row (profiles.matchup_template, migration 0012).
 */
export function MatchupTemplate({ userId, initialTemplate }: { userId: string; initialTemplate: JSONContent | null }) {
  // Stable, so the editor's autosave doesn't restart on every render.
  const save = useCallback(
    async (content: JSONContent) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, matchup_template: isEmptyDoc(content) ? null : content }, { onConflict: "id" });
      return !error;
    },
    [userId],
  );

  return (
    <NoteEditor
      initialContent={initialTemplate}
      onSave={save}
      heading="Matchup template"
      wrapToolbar
      description="Every new matchup starts with these notes, for example your usual headings. Notes you already wrote don't change."
    />
  );
}
