"use client";

import { Node, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";
import { NodeSelection, Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { ExternalLink, ImageOff, Maximize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { imageHost, looksLikeImageUrl, safeImageUrl } from "@/lib/image-url";

/**
 * Image in the notes, Discord style: only the link is stored in the note's JSON, the picture itself stays on
 * the site that hosts it. Shown on a post-it (no tilt) held by masking tape.
 */
export const NoteImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return { src: { default: null }, alt: { default: null } };
  },

  // Also covers "Copy image" in a browser, which pastes an <img> tag.
  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (el) => {
          const src = safeImageUrl(el.getAttribute("src"));
          return src ? { src, alt: el.getAttribute("alt") || null } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = safeImageUrl(HTMLAttributes.src);
    return ["img", src ? { src, alt: HTMLAttributes.alt ?? "", referrerpolicy: "no-referrer" } : {}];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteImageView);
  },

  // Pasting a link that obviously points to an image (…/pic.png) embeds it instead of writing the URL.
  addProseMirrorPlugins() {
    const type = this.type;
    return [
      new Plugin({
        key: new PluginKey("noteImagePaste"),
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData("text/plain")?.trim() ?? "";
            const src = looksLikeImageUrl(text) ? safeImageUrl(text) : null;
            if (!src) return false;
            insertImage(view, type.create({ src }));
            return true;
          },
        },
      }),
    ];
  },
});

/**
 * Inserts an image node at the cursor, or right after the selected block (never replacing it), then puts the
 * cursor on the line below so that typing or pasting again doesn't overwrite the new image.
 */
export function insertImage(view: EditorView, image: PMNode) {
  const { state } = view;
  const sel = state.selection;
  const tr = sel instanceof NodeSelection ? state.tr.insert(sel.to, image) : state.tr.replaceSelectionWith(image);
  if (sel instanceof NodeSelection) tr.setSelection(NodeSelection.create(tr.doc, sel.to));
  if (tr.selection instanceof NodeSelection) {
    const end = tr.selection.to;
    if (!tr.doc.resolve(end).nodeAfter?.isTextblock) tr.insert(end, state.schema.nodes.paragraph.create());
    tr.setSelection(TextSelection.create(tr.doc, end + 1));
  }
  view.dispatch(tr.scrollIntoView());
  view.focus();
}

function NoteImageView({ node, editor, selected, deleteNode }: NodeViewProps) {
  // Stored content comes straight from the browser: re-check the link before loading anything.
  const src = safeImageUrl(node.attrs.src);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(src ? "loading" : "error");
  const [zoomed, setZoomed] = useState(false);
  const editable = editor.isEditable;
  const host = src ? imageHost(src) : "";
  const alt = (node.attrs.alt as string | null) || `Image from ${host}`;
  const outer = useRef<HTMLDivElement>(null);
  const figure = useRef<HTMLElement>(null);

  // Keep the text below sitting on the notebook lines: the block's total height is rounded up to a whole
  // number of rules (half a rule above, at least ~0.4 rule below).
  useEffect(() => {
    const box = outer.current, fig = figure.current;
    if (!box || !fig) return;
    const snap = () => {
      const rule = parseFloat(getComputedStyle(editor.view.dom).lineHeight) || 28;
      const h = fig.getBoundingClientRect().height;
      const top = rule / 2;
      const total = Math.ceil((top + h + rule * 0.4) / rule) * rule;
      box.style.paddingTop = `${top}px`;
      box.style.paddingBottom = `${total - top - h}px`;
    };
    snap();
    const ro = new ResizeObserver(snap);
    ro.observe(fig);
    return () => ro.disconnect();
  }, [editor]);

  const picture =
    src && status !== "error" ? (
      // eslint-disable-next-line @next/next/no-img-element -- external image, not optimisable by next/image
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        decoding="async"
        draggable={false}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        // Editing: a single click selects the image, a double click opens it full size.
        onDoubleClick={editable ? () => setZoomed(true) : undefined}
        className={cn(
          "block max-h-[26rem] w-auto max-w-full rounded-[1px]",
          status === "loading" && "absolute size-px opacity-0",
        )}
      />
    ) : null;

  const corner =
    "grid size-7 place-items-center rounded-full border border-line bg-surface text-muted shadow-sm transition";

  return (
    <NodeViewWrapper>
      <div ref={outer} className="group py-[calc(var(--rule)/2)]" contentEditable={false}>
        <figure
          ref={figure}
          className={cn(
            "relative w-fit max-w-full rounded-[2px] bg-label p-2 text-label-ink sm:p-2.5",
            "shadow-[0_1px_1px_rgb(0_0_0/0.12),0_6px_14px_-8px_rgb(0_0_0/0.45)]",
            // Selected in the editor: thin pencil outline (Delete / Backspace removes it).
            editable && selected && "outline outline-1 outline-offset-4 outline-fg/45",
          )}
        >
          {/* Masking tape holding the post-it. */}
          <span
            aria-hidden
            className="absolute -top-2.5 left-1/2 z-10 h-5 w-16 -translate-x-1/2 rotate-2 bg-tape shadow-[0_1px_1px_rgb(0_0_0/0.08)]"
          />

          {status === "loading" && (
            <div className="grid h-40 w-64 max-w-full place-items-center font-hand text-xl text-label-ink/70">
              Loading image…
            </div>
          )}

          {status === "error" ? (
            <div className="flex w-64 max-w-full flex-col items-center gap-1.5 px-3 py-6 text-center">
              <ImageOff className="size-6 opacity-60" aria-hidden />
              <span className="font-hand text-xl leading-tight">Image unavailable</span>
              {src && (
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="max-w-full truncate text-xs underline decoration-label-accent underline-offset-2"
                >
                  {host}
                </a>
              )}
            </div>
          ) : editable ? (
            picture
          ) : (
            // Read-only: a click opens the image full size.
            <button
              type="button"
              onClick={() => setZoomed(true)}
              aria-label={`View full size: ${alt}`}
              className="block max-w-full cursor-zoom-in"
            >
              {picture}
            </button>
          )}

          {editable && (
            <div
              className={cn(
                "absolute -right-2.5 -top-2.5 z-20 flex gap-1 transition-opacity",
                selected ? "opacity-100" : "opacity-0 focus-within:opacity-100 group-hover:opacity-100",
              )}
            >
              {status === "loaded" && (
                <button
                  type="button"
                  aria-label="View full size"
                  title="View full size"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setZoomed(true)}
                  className={cn(corner, "hover:text-fg")}
                >
                  <Maximize2 className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                aria-label="Remove image"
                title="Remove image"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => deleteNode()}
                className={cn(corner, "hover:text-avoid")}
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </figure>
      </div>
      {zoomed && src && <ImageLightbox src={src} alt={alt} host={host} onClose={() => setZoomed(false)} />}
    </NodeViewWrapper>
  );
}

/**
 * Full-size view: native modal <dialog> (focus kept inside, Escape closes), rendered outside the editor so the
 * editor never sees its clicks. Clicking around the image or the × closes it.
 */
function ImageLightbox({ src, alt, host, onClose }: { src: string; alt: string; host: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    d.showModal();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden"; // no page scrolling behind the image
    return () => {
      root.style.overflow = overflow;
      if (d.open) d.close();
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialog}
      aria-label={alt}
      // The "close" event is fired asynchronously: ignore a stale one arriving after the dialog was reopened
      // (React re-runs effects once in development, which closes and reopens it right away).
      onClose={() => !dialog.current?.open && onClose()}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={cn(
        // `open:flex` only: a class setting display would override the browser's hiding of a closed dialog.
        "fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none flex-col items-center justify-center gap-3 bg-transparent open:flex",
        "px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(3.5rem,env(safe-area-inset-top))]",
        "backdrop:bg-[rgb(20_18_14/0.86)]",
      )}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] grid size-10 place-items-center rounded-full text-[#f6f1e7]/85 transition hover:bg-white/10 hover:text-[#f6f1e7]"
      >
        <X className="size-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- external image, not optimisable by next/image */}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className="max-h-[calc(100dvh-8rem)] max-w-full rounded-[2px] object-contain shadow-[0_12px_40px_-12px_rgb(0_0_0/0.7)]"
      />
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-[#f6f1e7]/80 underline-offset-4 transition hover:text-[#f6f1e7] hover:underline"
      >
        Open on {host} <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </dialog>,
    document.body,
  );
}
