import { Avatar } from "@/components/avatar";
import type { Profile } from "@/lib/types";

/** "Notes by [avatar] PlayerName", shown under the title of shared notes. */
export function AuthorBadge({ author, isYou = false }: { author: Profile | null; isYou?: boolean }) {
  const name = author?.username || "Anonymous player";
  return (
    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-sm">
      <Avatar url={author?.avatar_url} name={author?.username} className="size-7 text-[11px]" />
      <span className="text-muted">Notes by</span>
      <span className="max-w-48 truncate font-semibold">{name}</span>
      {isYou && <span className="text-xs text-muted">(you)</span>}
    </div>
  );
}
