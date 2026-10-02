import { cn } from "@/lib/cn";

function initials(name: string | null | undefined) {
  const words = (name ?? "").trim().split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Round profile picture, falling back to initials on the brand gradient. */
export function Avatar({
  url,
  name,
  className,
}: {
  url: string | null | undefined;
  name: string | null | undefined;
  /** Size utilities, e.g. "size-8 text-xs". */
  className?: string;
}) {
  if (url) {
    return (
      // Plain <img>: avatars are tiny (256 px) files served by Supabase Storage, no need for next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={cn("shrink-0 rounded-full bg-surface-2 object-cover ring-1 ring-line", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 select-none place-items-center rounded-full bg-brand font-semibold text-white",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
