# Smash Notes

Matchup notes for Super Smash Bros. Ultimate and Melee — installable PWA, synced across devices.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | Server Components + Server Actions, first-class `manifest.ts`, deploys to Vercel in one click |
| Styling | Tailwind CSS v4 | Tokens in CSS (`@theme`), tiny output, fast iteration |
| Auth + DB | Supabase (Postgres + Auth + RLS) | Relational data fits matchups → stages → notes; Row Level Security gives per-user isolation with no API layer |
| Rich text | Tiptap v3 | Headless (full control over the look), JSON output stored in `jsonb`, official Table + Underline support |
| Icons | lucide-react | Clean, consistent line icons |
| PWA | `app/manifest.ts` + hand-written `public/sw.js` | No plugin to fight with Turbopack; small, auditable caching rules |

## Setup

```bash
# 1. Create the app (accept the defaults: TypeScript, ESLint, Tailwind, src/, App Router, Turbopack)
npx create-next-app@latest smash-notes --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd smash-notes

# 2. Dependencies
npm install @supabase/supabase-js @supabase/ssr @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-table lucide-react

# 3. Copy this overlay on top of the generated project (overwrite when asked), then delete
#    the generated home page — the dashboard lives in src/app/(app)/page.tsx instead.
rm src/app/page.tsx src/app/favicon.ico

# 4. Environment
cp .env.example .env.local   # then paste your Supabase URL + publishable key
```

**Supabase project**

1. Create a project at supabase.com.
2. SQL Editor → paste and run `supabase/migrations/0001_init.sql`.
3. Authentication → URL Configuration → set **Site URL** to your deployed URL and add
   `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback` to **Redirect URLs**.
4. (Optional, for local dev) Authentication → Providers → Email → turn off "Confirm email".

```bash
npm run dev          # http://localhost:3000
npm run build && npm start   # service worker only registers in production builds
```

To test installation on a phone, deploy to Vercel (HTTPS is required for PWAs), open the site, then
"Add to Home Screen" (iOS Safari) or "Install app" (Android Chrome / desktop Chrome & Edge).

## Folder structure

```
supabase/migrations/0001_init.sql   Tables, triggers, RLS policies
public/
  sw.js                             Service worker
  icons/                            PWA icons (any + maskable)
src/
  proxy.ts                          Session refresh + auth guard (Next 16 name for middleware)
  app/
    layout.tsx, globals.css         Root shell, theme tokens, editor styles
    manifest.ts                     Web app manifest
    icon.png, apple-icon.png        Favicon / iOS home-screen icon
    offline/page.tsx                Offline fallback
    login/                          Sign in / create account
    auth/callback, auth/signout     Supabase redirects
    (app)/                          Signed-in area (shared header)
      layout.tsx
      page.tsx                      Dashboard
      actions.ts                    createMatchup / deleteMatchup
      matchups/[id]/page.tsx        Matchup note page
  components/
    app-header.tsx, sign-out-button.tsx, sw-register.tsx, new-matchup-form.tsx
    matchup/
      stage-selector.tsx, stage-glyph.tsx   A. Stages
      note-editor.tsx                       B. Rich text
      quick-notes.tsx                       C. Quick notes
      delete-matchup-button.tsx
  lib/
    supabase/{client,server,proxy}.ts
    game-data.ts                    Rosters, stage layouts
    types.ts, cn.ts
```

## Data model

- `matchups` — one per user × game × my character × opponent. `content` is the Tiptap JSON document.
- `matchup_stages` — one row per stage per matchup, `status` ∈ neutral/prefer/avoid. The default
  stagelist is inserted by a trigger when a matchup is created; custom stages have `is_custom = true`.
- `quick_notes` — short sub-notes per matchup.

Every table carries `user_id` (defaults to `auth.uid()`) and RLS restricts all reads/writes to the owner.

## Notes

- On Next.js 15, rename `src/proxy.ts` → `src/middleware.ts` and its exported function to `middleware`.
- Bump `VERSION` in `public/sw.js` whenever you change its caching rules.
- Signing out clears the service-worker cache so the next person on a shared device can't see cached pages.
