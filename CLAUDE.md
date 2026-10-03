# Passation — Smash Memo

Document de reprise du projet pour Claude Code. À lire en entier avant toute modification.

> **Conseil :** copie ce fichier en `CLAUDE.md` à la racine du repo. Claude Code le charge alors automatiquement à chaque session.

---

## 1. Le projet en bref

**Smash Memo**, sans accent (anciennement « Smash Notes », renommée le 2026-10-01 car une autre app porte ce nom, puis « Smash Mémo » → « Smash Memo » le 2026-10-02) est une web app (PWA installable) pour prendre des notes de matchups sur **Super Smash Bros. Ultimate**, **Melee** et **Rivals of Aether II** (ajouté le 2026-10-02, libellé « Rivals 2 », clé `roa2`). Chaque utilisateur a un compte, et ses notes sont synchronisées sur tous ses appareils.

- **Repo :** GitHub `smash-memo` (compte du propriétaire, ex-`smash-notes`), branche `main`.
- **Hébergement :** Vercel (projet `smash-memo`, ex-`smash-notes`, équipe « azuure-dot », plan Hobby). Chaque push sur `main` déclenche un redéploiement.
- **URL de production :** **https://smashmemo.fr** (domaine acheté chez OVH le 2026-10-02 ; `SITE.url` dans `src/lib/site-config.ts`).
  - DNS OVH : `@` A → `216.198.79.1` (Vercel), `www` CNAME → `*.vercel-dns-017.com`. Pas d'enregistrement AAAA sur `@` : celui par défaut d'OVH renvoyait vers sa page « Site en construction ».
  - Conseillé dans Vercel → Domains : `www.smashmemo.fr`, `smash-memo.vercel.app` et `smash-notes-pi.vercel.app` en redirection 308 vers `smashmemo.fr`.
- **Backend :** Supabase (Postgres + Auth + RLS), plan gratuit.

## 2. Le propriétaire et la façon de travailler avec lui

- Il **parle français** : réponds-lui en français.
- **L'interface de l'app doit rester entièrement en anglais** (exigence du cahier des charges).
- Il est **débutant** en développement web. Donne des étapes numérotées, concrètes, sans sauter d'étape.
- Il est sous **Windows, avec PowerShell**. Donne les commandes PowerShell (`del` et non `rm`, chemins avec `\`). La politique d'exécution des scripts a déjà été réglée (`RemoteSigned`).
- Piège déjà rencontré : il lance les commandes `npm` hors du dossier du projet. Rappelle-lui de faire `cd smash-notes` d'abord (le dossier local garde l'ancien nom).
- Il valide les visuels sur des aperçus. Pour un changement graphique, montre un rendu avant de livrer si possible.
- Pour mettre en ligne :
  ```powershell
  git add .
  git commit -m "message"
  git push
  ```

## 3. Stack technique

| Couche | Choix | Remarques |
|---|---|---|
| Framework | Next.js (App Router, TypeScript, `src/`) | Créé avec `create-next-app@latest`, a priori la v16 |
| Style | Tailwind CSS v4 | Tokens dans `@theme` de `src/app/globals.css` |
| Auth + BDD | Supabase via `@supabase/ssr` et `@supabase/supabase-js` | Clé **publishable** côté client, jamais la clé secret/service_role |
| Éditeur | Tiptap v3 (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-table`) | Contenu stocké en JSON dans `matchups.content` (jsonb) |
| Icônes | `lucide-react` | |
| PWA | `src/app/manifest.ts` + `public/sw.js` écrit à la main | SW enregistré uniquement en production |

**Variables d'environnement** (`.env.local` en local, à reporter dans Vercel → Settings → Environment Variables) :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## 4. Design

- **Thème :** sombre par défaut, minimaliste et épuré.
- **Accents :** dégradé violet `#8b5cf6` → magenta `#e040fb`. Utilitaires `bg-brand` et `text-brand` définis dans `globals.css`.
- **Tokens :** `bg` `#0a0910`, `surface` `#121019`, `surface-2` `#1a1723`, `line` `#262232`, `fg` `#ecebf3`, `muted` `#8a8499`.
- **Statuts de stage :** Prefer = **bleu**, Avoid = **rouge**, Neutral = gris.
- Police Geist. Coins arrondis `rounded-xl` / `rounded-2xl`. Respect des safe-area iOS.
- Visuels officiels : **seuls les logos des jeux** sont utilisés, sur demande explicite du propriétaire (2026-10-02), dans le sélecteur de jeu du dashboard, avec une mention « Trademarks / not affiliated » sur la page Privacy. Pas d'autres visuels officiels (personnages, stages…) : les stages restent des silhouettes abstraites dessinées en SVG (voir §7).
  - Logos sources dans `brand/games/{ultimate,melee,roa2}.png`, versions optimisées dans `public/games/*.webp` (générées par `scripts/make-icons.mjs`), dimensions dans `GAME_LOGOS` (`src/lib/game-data.ts`).
- **Logos** (fournis par le propriétaire le 2026-10-02, Small remplacé par une version recentrée le même jour ; originaux dans `brand/`) :
  - **Small** (`brand/logo-small-source.webp`, carré, dégradé `#a851fe` → `#ff67fe` + stylo « SM ») : icône d'onglet, icônes PWA et raccourci mobile. Coins arrondis pour `icon.png` et les icônes « any » ; carré plein pour `apple-icon.png` ; marge de sécurité de 80 % pour `maskable-512.png`.
  - **Long** (`brand/logo-long-source.png`, « SMASH MEMO » + stylo sur fond noir) : rendu transparent dans `public/brand/logo-long.png`, affiché via le composant `BrandLogo` (headers, pages de connexion / mot de passe, Privacy) et dans l'image d'aperçu des liens `src/app/opengraph-image.png`.
  - Tout se régénère avec `node scripts/make-icons.mjs` (arrêter `npm run dev` avant, sinon Windows verrouille les fichiers). Après un changement d'icônes, incrémenter `VERSION` dans `public/sw.js`, qui garde `/icons/` en cache.

## 5. Fonctionnalités en place

1. **Auth :** inscription et connexion par email + mot de passe (`/login`), déconnexion, garde des routes privées dans `src/proxy.ts`.
2. **Mot de passe oublié :** `/forgot-password` envoie l'email ; le lien passe par `/auth/callback?next=/reset-password` puis arrive sur `/reset-password`.
3. **Dashboard** (`/`) : un **sélecteur de jeu global** (`game-selector.tsx`, 3 cartes avec les logos et le nombre de notes) sous le titre définit le jeu actif pour toute la page. Pas d'option « All ». Le composant client `dashboard.tsx` lit le jeu et l'onglet dans l'URL (`?game=melee&tab=saved`, Ultimate par défaut, sans paramètre) via `useSearchParams` et les met à jour avec `history.replaceState`, sans aller-retour serveur (toutes les notes sont chargées une fois puis filtrées). Onglets **My Notes** / **Saved Notes** (`matchup-list.tsx`) filtrés sur le jeu actif. Badges Shared / Copy / Saved. Les liens retour (page note, vue partagée → `tab=saved`, suppression) ramènent au jeu de la note via `dashboardHref(game)`.
4. **Création de matchup :** le jeu est celui du sélecteur global (pas de choix dans le formulaire, titre « New <Jeu> matchup ») ; « My character » vs « Opponent » avec autocomplétion des rosters et bouton d'échange. Redirige directement vers la note. Si le matchup existe déjà pour ce jeu, ouvre le plus récent (les doublons sont autorisés depuis 0003, à cause de la duplication).
9. **Partage de notes** (depuis 0003) :
   - Bouton **Share** sur la page matchup (`share-button.tsx`) : passe `is_shared` à true et copie `https://<site>/share/<id>` ; **Stop sharing** désactive le lien.
   - **`/share/[id]`** (public, dans `PUBLIC_PATHS`) : vue en lecture seule (prop `readOnly` sur `StageSelector`, `QuickNotes`, `NoteEditor`). Le propriétaire est redirigé vers `/matchups/[id]` ; un non-propriétaire qui ouvre `/matchups/[id]` est redirigé vers `/share/[id]`. Non connecté : bandeau « Sign in / Sign up ».
   - **Save to my workspace** (table `saved_matchups`) et **Duplicate to my notes** (copie profonde en SQL, puis redirection vers la copie). Actions dans `src/app/share/actions.ts`.
   - Choix validés par le propriétaire : doublons autorisés, lecture sans compte. L'email de l'auteur n'est jamais affiché. Une note dont l'auteur arrête le partage disparaît des Saved Notes.
10. **Profils** (depuis 0004) : pseudo (2–24 caractères, unique sans distinction de casse) et photo, éditables dans la carte Profile de `/account` (`profile-form.tsx`).
   - La photo est recadrée en carré et réduite à 256 px **dans le navigateur** (canvas → WebP, PNG en repli), puis envoyée directement depuis le client vers Supabase Storage, bucket `avatars`, chemin `<user id>/<timestamp>.webp`. Nom de fichier nouveau à chaque envoi (pas de cache périmé). Les anciens fichiers sont supprimés après l'enregistrement.
   - **Badge auteur** (`author-badge.tsx`, composant `Avatar` avec initiales en repli) : sur `/share/[id]`, et sur la page du propriétaire quand la note est partagée. Sans pseudo : « Anonymous player ».
   - L'avatar du header vient de `profiles`. La suppression de compte efface d'abord les fichiers du dossier avatar (le stockage ne suit pas la cascade).
5. **Page matchup** (`/matchups/[id]`), dans cet ordre :
   - **Stages :** clic = cycle Neutral → Prefer → Avoid ; ajout et suppression de stages custom.
   - **Quick Notes :** repliées par défaut ; ajout, édition inline (sauvegarde au blur), suppression.
   - **Notes :** éditeur Tiptap avec H1–H3, gras, italique, souligné, listes, tableaux (barre d'outils dédiée quand le curseur est dans un tableau), undo/redo. Autosave à 800 ms et sauvegarde quand l'app passe en arrière-plan.
   - **Video Resources** (depuis 0008, `video-resources.tsx`) : liens YouTube collés → lecteurs 16:9. `src/lib/youtube.ts` extrait l'id (watch, youtu.be, embed, shorts, live, m./music./nocookie, avec ou sans https) et le temps de départ (`t=95`, `1m35s`…). L'action serveur `matchups/[id]/video-actions.ts` vérifie la vidéo via l'oEmbed public de YouTube (existe, intégration autorisée), récupère le titre, et limite à 20 vidéos par note. Affichage : miniature (i.ytimg.com) puis iframe `youtube-nocookie.com` seulement au clic sur lecture. En lecture seule : pas de formulaire ni de suppression, et la section est masquée s'il n'y a aucune vidéo.
   - Bouton de suppression du matchup.
6. **Compte** (`/account`) : profil, changement de mot de passe, lien Privacy, **suppression du compte** (taper `DELETE`). Vide aussi le cache du service worker.
7. **Privacy** (`/privacy`) : page publique en anglais. Les valeurs variables viennent de `src/lib/site-config.ts`.
8. **PWA :** manifest, icônes (any + maskable), page `/offline`, cache network-first des pages et cache-first des assets `/_next/static`. Les requêtes Supabase ne sont jamais mises en cache.
   - **Popup d'installation** (`src/components/install-prompt.tsx` + hook `src/lib/use-pwa-install.ts`, monté dans le layout racine) : uniquement sur écran ≤ 768 px, si l'app n'est pas déjà installée (`display-mode: standalone` / `navigator.standalone`), affiché après 3 s.
     - Android : basé sur l'événement `beforeinstallprompt` (pas de détection par user agent) ; bouton « Install App » qui ouvre la boîte native. Ne s'affiche qu'en production (le SW n'est pas enregistré en dev).
     - iOS : Safari seul (iPhone, et iPad repéré par `Macintosh` + écran tactile ; Chrome/Firefox/Edge iOS et navigateurs intégrés exclus) ; instructions « Share → Add to Home Screen ».
     - Fermeture ou refus : clé `localStorage` `sm-install-dismissed-at`, masqué 30 jours. Animations `animate-slide-up` / `animate-slide-down` définies dans `@theme`.

## 6. Base de données

Les migrations sont à exécuter **à la main dans Supabase → SQL Editor**, dans l'ordre :

- `supabase/migrations/0001_init.sql`
  - enums `game` (`ultimate` | `melee`) et `stage_status` (`neutral` | `prefer` | `avoid`) ;
  - tables `matchups`, `matchup_stages`, `quick_notes`, toutes avec `user_id default auth.uid()` et `on delete cascade` ;
  - triggers `updated_at` ;
  - trigger `seed_matchup_stages` qui insère la stagelist par défaut à la création d'un matchup (liste différente pour Melee) ;
  - **RLS** sur toutes les tables : un utilisateur ne voit et ne modifie que ses propres lignes.
- `supabase/migrations/0002_delete_account.sql`
  - fonction `delete_my_account()` en `security definer`, qui supprime uniquement `auth.uid()` ; la cascade efface ensuite toutes les données.
- `supabase/migrations/0003_note_sharing.sql`
  - colonnes `matchups.is_shared` et `matchups.copied_from` ; suppression de la contrainte d'unicité `(user_id, game, my_character, opponent_character)` ;
  - le trigger `updated_at` de `matchups` ne se déclenche plus que sur `game`, `my_character`, `opponent_character`, `content` (partager ne compte pas comme une modification) ;
  - table `saved_matchups` (RLS : lecture et suppression de ses propres lignes) ;
  - fonctions `security definer` : `get_shared_matchup(id)` (anon + authenticated), `save_shared_matchup(id)`, `list_saved_matchups()`, `duplicate_shared_matchup(id)`.
  - **Règle de sécurité :** ne jamais ajouter de policy SELECT du type « `is_shared` = true » sur les tables. Avec la clé publique, n'importe qui pourrait lister toutes les notes partagées. Les non-propriétaires passent uniquement par ces fonctions, qui exigent l'id exact.
- `supabase/migrations/0004_profiles.sql`
  - table `profiles` (`id` = `auth.users.id`, `username`, `avatar_url`) avec RLS « own profile » uniquement (pas de lecture publique, même règle que ci-dessus) ; index unique sur `lower(username)` ; contrainte qui n'autorise comme `avatar_url` qu'un fichier du dossier de l'utilisateur dans le bucket `avatars` ;
  - bucket Storage `avatars` : public, 2 Mo max, `image/jpeg|png|webp` ; policies `storage.objects` : insert / select / delete limités au dossier `<auth.uid()>/` ;
  - `get_shared_matchup()` renvoie en plus `author: { username, avatar_url }`.
- `supabase/migrations/0005_rivals_of_aether_2.sql`
  - valeur `roa2` ajoutée à l'enum `game` ; `seed_matchup_stages()` recréée avec la stagelist Rivals 2.
- `supabase/migrations/0006_roa2_air_armada.sql`
  - Rivals 2 : « Metal Refinery » → « Air Armada » dans les matchups existants (statut conservé) et dans la stagelist par défaut.
- `supabase/migrations/0007_ultimate_drop_lylat.sql`
  - Ultimate : Lylat Cruise retiré de la stagelist par défaut (`seed_matchup_stages()` recréée). Les matchups existants le gardent.
- `supabase/migrations/0008_matchup_videos.sql`
  - table `matchup_videos` (`video_id` = id YouTube de 11 caractères, contrôlé par regex, jamais d'URL brute ; `title`, `start_seconds`), unique par note, RLS « own rows » ;
  - `get_shared_matchup()` renvoie aussi `videos` ; `duplicate_shared_matchup()` copie aussi les vidéos.
- **Ajouter un jeu :** valeur d'enum + branche dans `seed_matchup_stages()` (nouvelle migration), puis dans `src/lib/game-data.ts` : `GAMES`, `GAME_LABELS`, `CHARACTER_EXAMPLES`, `CHARACTERS`, et les `STAGE_LAYOUTS` des nouveaux stages. Le type `Game` est dans `src/lib/types.ts`. Le formulaire, les filtres et la validation se basent sur `GAMES` / `isGame()`.

Pour toute nouvelle évolution du schéma, crée `0003_...sql`, etc., garde RLS activée sur toute nouvelle table, et donne au propriétaire le SQL à coller.

**Stagelists par défaut :**
- *Ultimate :* Battlefield, Final Destination, Small Battlefield, Pokémon Stadium 2, Hollow Bastion, Smashville, Town & City, Kalos Pokémon League, Yoshi's Story. Lylat Cruise retiré le 2026-10-02 (migration 0007, plus assez joué) ; sa silhouette reste dans `STAGE_LAYOUTS` pour les anciens matchups et les stages custom.
- *Melee (choix de Claude, non validé) :* Battlefield, Final Destination, Yoshi's Story, Dream Land, Fountain of Dreams, Pokémon Stadium.
- *Rivals 2 (pool compétitif de dragdown.wiki/wiki/RoA2/Stages) :* starters Aetherian Forest, Godai Delta, Hodojo, Julesvale, **Air Armada** ; counterpicks Merchant Port, Fire Capital, Hyperborean Harbor, Rock Wall, Tempest Peak. Variantes doubles exclues.
  - Le propriétaire a demandé (2026-10-02) de remplacer Metal Refinery par Air Armada, même si le wiki les présente comme deux stages distincts (Air Armada retiré du pool en Saison 1). Migration `0006_roa2_air_armada.sql` : renomme les lignes existantes et met à jour `seed_matchup_stages()`. La silhouette « Metal Refinery » reste dans `STAGE_LAYOUTS` pour les anciennes notes et les stages custom.
- *Roster Rivals 2* (rivals-of-aether.fandom.com) : 10 persos de lancement + DLC sortis jusqu'à Gouie (août 2026). Mina the Hollower (annoncée pour 2027) est à ajouter à sa sortie.

Changer ces listes ne touche que les nouveaux matchups. Les stages déjà créés sont des lignes en base.

## 7. Silhouettes de stages

- Les données sont dans `STAGE_LAYOUTS` (`src/lib/game-data.ts`) et le rendu dans `src/components/matchup/stage-glyph.tsx` (viewBox `0 0 100 44`, sol à `y = 30`).
- Propriétés disponibles par stage :
  - `main: [x, largeur]` : position et largeur du sol ;
  - `platforms: [x, y, largeur][]` : plateformes ;
  - `depth` : épaisseur du sol (9 par défaut) ;
  - `taper` : rétrécissement vers le bas (0.12 par défaut) ;
  - `slope` : pente en degrés près des ledges ; `slopeRun` : longueur de cette pente (7 par défaut) ;
  - `platformTilt` : inclinaison en degrés des plateformes de côté entières, bout extérieur plus bas (Lylat) ;
  - `roundBottom` : dessous en demi-ellipse de profondeur `depth` ; `floorY` : hauteur du sol (30 par défaut), à remonter pour laisser la place à un dessous profond (Fountain of Dreams) ;
  - `pillar: [largeur, hauteur]` : pilier central ;
  - `body: [x, largeur]` : bloc plein sous un plateau fin, jusqu'en bas (Hyperborean Harbor).
  - `depth: 14` + `taper: 0` = murs droits du ledge jusqu'en bas.
  - Plus de flèches ni d'inclinaison globale (`moving` / `tilt` retirés le 2026-10-02 à la demande du propriétaire).
- Rivals 2 : largeurs de sol proportionnelles aux longueurs en jeu (1250 → 50, 2020 → 84), hauteurs et positions de plateformes d'après les descriptions de dragdown.wiki.
- La géométrie est calculée par `stageFloorPaths()` (sol, bloc, pilier) et `platformPath()`. Les stages inconnus ou custom utilisent `DEFAULT_LAYOUT`.
- Consignes validées par le propriétaire (dernière itération) :
  - **Small Battlefield** : même disposition que Pokémon Stadium 2 (2 plateformes, pas de plateforme haute), en plus petit.
  - **Pokémon Stadium 2** : pilier central sous le stage.
  - **Hollow Bastion** : plateforme centrale ≈ 45 % de la largeur du stage.
  - **Smashville** : même disposition que Hollow Bastion en plus petit, plateforme centrée ≥ 50 % du stage, sol fin.
  - **Town & City** : aussi long que Kalos, sol fin, plateformes `-  _  -` (côtés hauts, centre bas) ; ~30 % de chaque plateforme haute dépasse du bord, au-dessus du vide.
  - **Kalos** : stage profond et rectangulaire, murs parfaitement droits, deux plateformes centrées pile au-dessus de chaque ledge.
  - **Yoshi's Story** : parois plus profondes, pente d'environ 15° à côté de chaque ledge.
  - **Lylat Cruise** : ~65 % du sol plat au centre, puis longues pentes ~30° jusqu'aux ledges ; plateformes de côté au-dessus des pentes, entièrement inclinées parallèlement à elles ; plateforme centrale juste au-dessus de leurs extrémités intérieures.
  - *Melee* — **Dream Land** : sol plus épais ; **Fountain of Dreams** : gros dessous presque hémisphérique (sol remonté) ; **Pokémon Stadium** : plateau fin + pilier central comme PS2.
  - *Rivals 2* — murs droits jusqu'en bas partout **sauf Air Armada et Hyperborean Harbor**. **Merchant Port** : aussi long que Fire Capital, plateformes de côté collées au bord du stage, plateformes hautes plus petites et plus centrées. **Hyperborean Harbor** : d'après le schéma du propriétaire, plateau fin dont les ledges dépassent d'un corps plus étroit qui descend jusqu'en bas.

## 8. Arborescence

```
supabase/migrations/          0001_init.sql … 0004_profiles.sql
public/sw.js                  service worker (incrémenter VERSION si la logique de cache change)
public/icons/                 icônes PWA (générées par scripts/make-icons.mjs)
public/brand/logo-long.png    logo Long transparent (généré)
brand/                        logos sources fournis par le propriétaire
scripts/make-icons.mjs        génère icônes, logo transparent et image d'aperçu de lien
src/proxy.ts                  refresh de session + garde (sous Next 15 : middleware.ts / middleware())
src/app/
  layout.tsx, globals.css     shell racine, tokens, styles Tiptap
  manifest.ts, icon.png, apple-icon.png, opengraph-image.png (+ .alt.txt)
  login/                      connexion / inscription (+ lien "Forgot password?")
  forgot-password/            demande de reset (contient aussi updatePassword)
  reset-password/             choix du nouveau mot de passe (formulaire réutilisé dans /account)
  privacy/                    page Privacy publique
  offline/                    page hors ligne
  share/[id]/, share/actions.ts  vue publique en lecture seule + setSharing / setSaved / duplicateSharedMatchup
  auth/callback, auth/signout routes Supabase
  (app)/                      zone connectée (header commun)
    page.tsx                  dashboard
    actions.ts                createMatchup / deleteMatchup
    matchups/[id]/            page matchup
    account/                  compte + profil (profile-form.tsx) + suppression
src/components/
  app-header.tsx, auth-shell.tsx, avatar.tsx, brand-logo.tsx, dashboard.tsx, game-selector.tsx, matchup-list.tsx, new-matchup-form.tsx, sign-out-button.tsx, sw-register.tsx
  matchup/                    stage-selector, stage-glyph, note-editor, quick-notes, delete-matchup-button,
                              share-button, shared-note-actions, author-badge
src/lib/
  supabase/{client,server,proxy}.ts
  game-data.ts                rosters, layouts de stages, stageFloorPaths()
  site-config.ts              opérateur, email de contact, région des données (page Privacy)
  types.ts, cn.ts
```

Les chemins publics (accessibles sans être connecté) sont listés dans `PUBLIC_PATHS`, dans `src/lib/supabase/proxy.ts`. Toute nouvelle page publique doit y être ajoutée.

## 9. Configuration Supabase attendue

- **Authentication → URL Configuration :**
  - Site URL = `https://smashmemo.fr` ;
  - Redirect URLs = `https://smashmemo.fr/**` et `http://localhost:3000/**` (et `https://smash-memo.vercel.app/**` tant que cette adresse sert encore).
  - Une Site URL restée sur `localhost` renvoyait les mails de confirmation vers localhost : c'est corrigé.
- **Emails :** le SMTP intégré de Supabase n'envoie **qu'aux membres de l'équipe Supabase**. Tant qu'aucun SMTP externe n'est branché :
  - « Confirm email » doit rester **désactivé**, sinon les autres utilisateurs ne peuvent pas s'inscrire ;
  - « mot de passe oublié » ne fonctionne que pour le propriétaire.
- **Pause automatique :** le projet gratuit est mis en pause après environ 7 jours d'inactivité. On le relance depuis le dashboard Supabase.

## 10. À vérifier en début de session

Ces points n'ont pas été confirmés par le propriétaire :

- [ ] Le **premier déploiement Vercel a réussi**. La dernière capture montrait « No Production Deployment » ; la solution proposée était un commit vide puis un push, ou un Redeploy.
- [ ] La migration **`0002_delete_account.sql`** a été exécutée dans Supabase.
- [ ] Les mises à jour « account » (mot de passe oublié, Privacy, suppression de compte) et « stages » (nouvelles silhouettes) ont été copiées et poussées.
- [ ] `src/lib/site-config.ts` est personnalisé (`operator`, `contactEmail`, `dataRegion`).
- [ ] `npm run build` passe en local. Le code a été écrit dans un environnement sans accès npm et n'a été vérifié que par une analyse syntaxique : **aucun build réel n'a encore été lancé par Claude**. Corrige les éventuelles erreurs de type en priorité.
- [ ] La version de Next.js : `npx next --version`. Si c'est la 15.x, renomme `src/proxy.ts` en `middleware.ts` et la fonction en `middleware`.

## 11. Décisions ouvertes (posées au propriétaire, sans réponse)

1. **Stagelist Melee** : garder la liste Melee actuelle ou utiliser la même liste que pour Ultimate ?
2. **Connexion Discord / Google** en plus de l'email ?
3. **Ordre des sections** sur la page matchup : Quick Notes est actuellement placé *au-dessus* de l'éditeur (accès rapide en plein set), alors que le cahier des charges donnait l'ordre A Stages, B Éditeur, C Quick Notes.

## 12. Pistes pour la suite (par priorité)

1. Brancher un **SMTP** (par exemple Resend) dans Supabase → Authentication → Emails, puis réactiver la confirmation d'email et rendre le reset de mot de passe fonctionnel pour tous.
2. Ajouter un **CAPTCHA** à l'inscription (Cloudflare Turnstile, supporté par Supabase).
3. Lancer **Supabase → Advisors → Security Advisor** et corriger les alertes.
4. Proposer un **export des données** (JSON) depuis `/account`, pour la portabilité RGPD.
5. Activer un **mode hors ligne réel** pour l'édition (file d'attente locale des modifications). Aujourd'hui, l'app ne fait que lire les pages en cache hors ligne.
6. Ajouter la **recherche / tri** sur le dashboard, et éventuellement des tags.
7. Permettre de **réordonner les stages** par glisser-déposer (la colonne `position` existe déjà).
