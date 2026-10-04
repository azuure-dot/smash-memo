/**
 * Images embedded in notes are only links to images hosted elsewhere: nothing is uploaded to Supabase.
 * Notes are saved straight from the browser, so a stored `src` can't be trusted: always check it with
 * `safeImageUrl` before rendering, not only when it's inserted.
 */

const MAX_URL_LENGTH = 2048;

/** The URL normalised if it's an https:// link we're willing to load as an image, otherwise null. */
export function safeImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!text || text.length > MAX_URL_LENGTH || /\s/.test(text)) return null;
  try {
    const url = new URL(text);
    // https only: no data:, javascript:, blob:, and no http:// (blocked as mixed content anyway).
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|bmp)$/i;

/** Cheap check, without loading anything, used on paste: "does this link obviously point to an image?" */
export function looksLikeImageUrl(raw: string): boolean {
  const href = safeImageUrl(raw);
  if (!href) return false;
  const url = new URL(href);
  // pbs.twimg.com/media/XXX?format=jpg&name=large and similar CDNs put the type in the query.
  const format = url.searchParams.get("format") ?? url.searchParams.get("fm");
  return IMAGE_EXT.test(url.pathname) || (!!format && /^(png|jpe?g|gif|webp|avif)$/i.test(format));
}

/** Loads the URL as an image in the browser: resolves true if it really is a displayable image. */
export function probeImage(href: string, timeoutMs = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = (ok: boolean) => {
      clearTimeout(timer);
      img.onload = img.onerror = null;
      resolve(ok);
    };
    const timer = setTimeout(() => done(false), timeoutMs);
    img.referrerPolicy = "no-referrer";
    img.onload = () => done(img.naturalWidth > 0);
    img.onerror = () => done(false);
    img.src = href;
  });
}

/** "i.imgur.com" from a URL, for captions and alt text. */
export function imageHost(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
