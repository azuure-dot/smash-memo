"use client";

import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import {
  Bold, Heading1, Heading2, Heading3, Italic, List, ListOrdered, Pilcrow,
  Redo2, Table as TableIcon, Underline as UnderlineIcon, Undo2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const SAVE_LABEL: Record<SaveState, string> = {
  idle: "",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save — retrying on next edit",
};

export function NoteEditor({
  matchupId,
  initialContent,
  readOnly = false,
}: {
  matchupId: string;
  initialContent: JSONContent | null;
  /** Shared view: no toolbar, no typing, nothing is saved. */
  readOnly?: boolean;
}) {
  const supabase = createClient();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<JSONContent | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const content = pending.current;
    if (!content) return;
    pending.current = null;
    setSaveState("saving");
    const { error } = await supabase.from("matchups").update({ content }).eq("id", matchupId);
    if (error) {
      pending.current ??= content; // keep it for the next attempt
      setSaveState("error");
    } else {
      setSaveState(pending.current ? "dirty" : "saved");
    }
  }, [matchupId, supabase]);

  const editor = useEditor({
    immediatelyRender: false, // required with SSR
    editable: !readOnly,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }), // includes Bold, Italic, Underline, lists, undo
      TableKit.configure({ table: { resizable: true } }),
    ],
    content: initialContent ?? "",
    editorProps: {
      attributes: {
        class: cn("px-4 py-4 sm:px-6 sm:py-5 focus:outline-none", readOnly ? "min-h-24" : "min-h-[340px]"),
        "aria-label": "Matchup notes",
      },
    },
    onUpdate: ({ editor }) => {
      pending.current = editor.getJSON();
      setSaveState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 800);
    },
  });

  // Save immediately when the app is backgrounded (important for installed PWAs on mobile) or on unmount.
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && void flush();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flush();
    };
  }, [flush]);

  return (
    <section className="rounded-2xl border border-line bg-surface" aria-labelledby="notes-title">
      <div className="flex items-center justify-between px-4 pt-4 sm:px-6">
        <h2 id="notes-title" className="font-semibold">Notes</h2>
        <span
          className={cn("text-xs", saveState === "error" ? "text-red-400" : "text-muted")}
          aria-live="polite"
        >
          {SAVE_LABEL[saveState]}
        </span>
      </div>
      {readOnly ? (
        <div className="mt-3 border-t border-line" />
      ) : (
        <Toolbar editor={editor} />
      )}
      {readOnly && editor?.isEmpty ? (
        <p className="px-4 py-4 text-sm text-muted sm:px-6 sm:py-5">No notes written yet.</p>
      ) : (
        <EditorContent editor={editor} />
      )}
    </section>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const s = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            p: editor.isActive("paragraph"),
            h1: editor.isActive("heading", { level: 1 }),
            h2: editor.isActive("heading", { level: 2 }),
            h3: editor.isActive("heading", { level: 3 }),
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),
            bullet: editor.isActive("bulletList"),
            ordered: editor.isActive("orderedList"),
            table: editor.isActive("table"),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
          }
        : null,
  });

  if (!editor || !s) return <div className="mt-3 h-12 border-y border-line" />;
  const chain = () => editor.chain().focus();

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 mt-3 border-y border-line bg-surface/95 backdrop-blur">
      <div className="flex items-center gap-0.5 overflow-x-auto px-2 py-1.5 sm:px-4" role="toolbar" aria-label="Formatting">
        <ToolButton label="Paragraph" active={s.p} onClick={() => chain().setParagraph().run()}>
          <Pilcrow />
        </ToolButton>
        <ToolButton label="Heading 1" active={s.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}>
          <Heading1 />
        </ToolButton>
        <ToolButton label="Heading 2" active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
          <Heading2 />
        </ToolButton>
        <ToolButton label="Heading 3" active={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
          <Heading3 />
        </ToolButton>
        <Divider />
        <ToolButton label="Bold" active={s.bold} onClick={() => chain().toggleBold().run()}>
          <Bold />
        </ToolButton>
        <ToolButton label="Italic" active={s.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic />
        </ToolButton>
        <ToolButton label="Underline" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
          <UnderlineIcon />
        </ToolButton>
        <Divider />
        <ToolButton label="Bullet list" active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
          <List />
        </ToolButton>
        <ToolButton label="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered />
        </ToolButton>
        <ToolButton
          label="Insert table"
          active={s.table}
          onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <TableIcon />
        </ToolButton>
        <Divider />
        <ToolButton label="Undo" disabled={!s.canUndo} onClick={() => chain().undo().run()}>
          <Undo2 />
        </ToolButton>
        <ToolButton label="Redo" disabled={!s.canRedo} onClick={() => chain().redo().run()}>
          <Redo2 />
        </ToolButton>
      </div>

      {s.table && (
        <div className="flex items-center gap-1 overflow-x-auto border-t border-line px-2 py-1.5 text-xs sm:px-4">
          <span className="mr-1 shrink-0 text-muted">Table</span>
          <TextButton onClick={() => chain().addRowAfter().run()}>+ Row</TextButton>
          <TextButton onClick={() => chain().addColumnAfter().run()}>+ Column</TextButton>
          <TextButton onClick={() => chain().deleteRow().run()}>− Row</TextButton>
          <TextButton onClick={() => chain().deleteColumn().run()}>− Column</TextButton>
          <TextButton onClick={() => chain().toggleHeaderRow().run()}>Header row</TextButton>
          <TextButton danger onClick={() => chain().deleteTable().run()}>Delete table</TextButton>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  label, active, disabled, onClick, children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg transition [&>svg]:size-4",
        active ? "bg-brand text-white" : "text-muted hover:bg-surface-2 hover:text-fg",
        disabled && "pointer-events-none opacity-35",
      )}
    >
      {children}
    </button>
  );
}

function TextButton({
  onClick, danger, children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-md px-2 py-1 transition",
        danger ? "text-red-400 hover:bg-red-500/10" : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden />;
}
