/**
 * Server side only (imported by the video server action): checks a Twitch VOD / highlight and gets its title
 * and thumbnail.
 *
 * 1. Twitch's official API (Helix), when TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are set (Vercel environment
 *    variables, from an app registered at dev.twitch.tv/console). Reliable from any server.
 * 2. Otherwise, the Open Graph tags of the video page (what Discord reads for link previews). Twitch only sends
 *    them to some visitors: from Vercel's data centers the page usually comes back without them (2026-10-06,
 *    a public highlight was refused). So a page without them doesn't block the video: it's added without
 *    title or thumbnail, and the player shows Twitch's own message if the video really doesn't exist.
 */
import { safeTwitchThumbnail } from "./twitch";

export type TwitchLookup = { ok: true; title: string | null; thumbnail: string | null } | { ok: false; error: string };

const NOT_FOUND: TwitchLookup = {
  ok: false,
  error: "This Twitch video doesn't exist (anymore), or it's subscriber-only.",
};
const UNKNOWN: TwitchLookup = { ok: true, title: null, thumbnail: null };

export async function lookUpTwitch(videoId: string): Promise<TwitchLookup> {
  return (await lookUpWithApi(videoId)) ?? (await lookUpWithPage(videoId));
}

// ---------------------------------------------------------------------------
// 1. Helix API (app access token, cached until it expires).
// ---------------------------------------------------------------------------
let appToken: { value: string; expiresAt: number } | null = null;

async function getAppToken(clientId: string, secret: string, renew: boolean): Promise<string | null> {
  if (!renew && appToken && appToken.expiresAt > Date.now()) return appToken.value;
  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: clientId, client_secret: secret, grant_type: "client_credentials" }),
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: unknown; expires_in?: unknown };
  if (typeof data.access_token !== "string") return null;
  const seconds = typeof data.expires_in === "number" ? data.expires_in : 3600;
  appToken = { value: data.access_token, expiresAt: Date.now() + (seconds - 60) * 1000 };
  return appToken.value;
}

/** null = API not configured or not answering: fall back to the page. */
async function lookUpWithApi(videoId: string): Promise<TwitchLookup | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !secret) return null;

  try {
    // Second attempt only if the cached token was refused (expired or revoked).
    for (const renew of [false, true]) {
      const token = await getAppToken(clientId, secret, renew);
      if (!token) return null;
      const res = await fetch(`https://api.twitch.tv/helix/videos?id=${encodeURIComponent(videoId)}`, {
        headers: { "Client-Id": clientId, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      if (res.status === 401) continue;
      if (res.status === 404) return NOT_FOUND;
      if (!res.ok) return null;

      const body = (await res.json()) as {
        data?: { title?: unknown; user_name?: unknown; thumbnail_url?: unknown }[];
      };
      const video = body.data?.[0];
      if (!video) return NOT_FOUND; // deleted, expired or subscriber-only
      const title = [video.title, video.user_name]
        .filter((part): part is string => typeof part === "string" && part.trim() !== "")
        .map((part) => part.trim())
        .join(" - ")
        .slice(0, 200);
      // Helix thumbnails are templates: …/thumb0-%{width}x%{height}.jpg
      const thumbnail =
        typeof video.thumbnail_url === "string"
          ? video.thumbnail_url.replace("%{width}", "640").replace("%{height}", "360")
          : null;
      return { ok: true, title: title || null, thumbnail: safeTwitchThumbnail(thumbnail) };
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 2. Open Graph tags of twitch.tv/videos/ID.
// ---------------------------------------------------------------------------
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };
const decode = (s: string) =>
  s.replace(/&(amp|lt|gt|quot|apos|#39|#x([0-9a-f]+)|#(\d+));/gi, (m, name: string, hex?: string, dec?: string) =>
    hex ? String.fromCodePoint(parseInt(hex, 16)) : dec ? String.fromCodePoint(Number(dec)) : (ENTITIES[name.toLowerCase()] ?? m),
  );

/** <meta property="og:…" content="…"> tags of a page, whatever the attribute order. */
function openGraph(html: string) {
  const tags: Record<string, string> = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const m of tag.matchAll(/([a-z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) attrs[m[1].toLowerCase()] = m[2] ?? m[3];
    const key = attrs.property ?? attrs.name;
    if (key?.startsWith("og:") && attrs.content !== undefined && !(key in tags)) tags[key] = decode(attrs.content);
  }
  return tags;
}

async function lookUpWithPage(videoId: string): Promise<TwitchLookup> {
  try {
    const res = await fetch(`https://www.twitch.tv/videos/${videoId}`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
      headers: { "User-Agent": "SmashMemo/1.0 (+https://smashmemo.fr)", "Accept-Language": "en" },
    });
    if (!res.ok) return UNKNOWN;
    const og = openGraph((await res.text()).slice(0, 400_000));
    // No player tag: either the video doesn't exist, or Twitch didn't give this server the details.
    // The two look the same, so don't refuse the link.
    if (!og["og:video"] && !og["og:video:secure_url"]) return UNKNOWN;
    const title = og["og:title"]?.replace(/ on Twitch$/, "").trim().slice(0, 200) || null;
    return { ok: true, title, thumbnail: safeTwitchThumbnail(og["og:image"]) };
  } catch {
    return UNKNOWN;
  }
}
