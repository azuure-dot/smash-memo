import { Avatar } from "@/components/avatar";
import type { Profile } from "@/lib/types";

/** "Notes by [avatar] PlayerName", signed by hand under the title of shared notes. */
export function AuthorBadge({ author, isYou = false }: { author: Profile | null; isYou?: boolean }) {
  const name = author?.username || "Anonymous player";
  return (
    <div className="mt-3 flex min-w-0 items-center gap-2 text-sm">
      <Avatar url={author?.avatar_url} name={author?.username} className="size-7 text-[11px]" />
      <span className="shrink-0 text-muted">Notes by</span>
      <span className="min-w-0 truncate font-hand text-[22px] font-bold leading-none text-fg" translate="no">
        {name}
      </span>
      {isYou && <span className="shrink-0 text-xs text-muted">(you)</span>}
    </div>
  );
}
