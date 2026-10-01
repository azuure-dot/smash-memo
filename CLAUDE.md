# Passation — Smash Mémo

Document de reprise du projet pour Claude Code. À lire en entier avant toute modification.

> **Conseil :** copie ce fichier en `CLAUDE.md` à la racine du repo. Claude Code le charge alors automatiquement à chaque session.

---

## 1. Le projet en bref

**Smash Mémo** (anciennement « Smash Notes », renommée le 2026-10-01 car une autre app porte ce nom) est une web app (PWA installable) pour prendre des notes de matchups sur **Super Smash Bros. Ultimate** et **Melee**. Chaque utilisateur a un compte, et ses notes sont synchronisées sur tous ses appareils.

- **Repo :** GitHub `smash-memo` (compte du propriétaire, ex-`smash-notes`), branche `main`.
- **Hébergement :** Vercel (projet `smash-memo`, ex-`smash-notes`, équipe « azuure-dot », plan Hobby). Chaque push sur `main` déclenche un redéploiement.
- **URL de production :** https://smash-memo.vercel.app (l'ancienne `smash-notes-pi.vercel.app` redirige vers elle).
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
- Pas de visuels officiels Nintendo (droits d'auteur). Les stages sont des silhouettes abstraites dessinées en SVG (voir §7).

## 5. Fonctionnalités en place

1. **Auth :** inscription et connexion par email + mot de passe (`/login`), déconnexion, garde des routes privées dans `src/proxy.ts`.
2. **Mot de passe oublié :** `/forgot-password` envoie l'email ; le lien passe par `/auth/callback?next=/reset-password` puis arrive sur `/reset-password`.
3. **Dashboard** (`/`) : liste des matchups triée par date de modification, filtre All / Ultimate / Melee.
4. **Création de matchup :** choix du jeu, « My character » vs « Opponent » avec autocomplétion des rosters et bouton d'échange. Redirige directement vers la note. Si le matchup existe déjà pour ce jeu, ouvre l'existant.
5. **Page matchup** (`/matchups/[id]`), dans cet ordre :
   - **Stages :** clic = cycle Neutral → Prefer → Avoid ; ajout et suppression de stages custom.
   - **Quick Notes :** repliées par défaut ; ajout, édition inline (sauvegarde au blur), suppression.
   - **Notes :** éditeur Tiptap avec H1–H3, gras, italique, souligné, listes, tableaux (barre d'outils dédiée quand le curseur est dans un tableau), undo/redo. Autosave à 800 ms et sauvegarde quand l'app passe en arrière-plan.
   - Bouton de suppression du matchup.
6. **Compte** (`/account`) : profil, changement de mot de passe, lien Privacy, **suppression du compte** (taper `DELETE`). Vide aussi le cache du service worker.
7. **Privacy** (`/privacy`) : page publique en anglais. Les valeurs variables viennent de `src/lib/site-config.ts`.
8. **PWA :** manifest, icônes (any + maskable), page `/offline`, cache network-first des pages et cache-first des assets `/_next/static`. Les requêtes Supabase ne sont jamais mises en cache.

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

Pour toute nouvelle évolution du schéma, crée `0003_...sql`, etc., garde RLS activée sur toute nouvelle table, et donne au propriétaire le SQL à coller.

**Stagelists par défaut :**
- *Ultimate :* Battlefield, Final Destination, Small Battlefield, Pokémon Stadium 2, Hollow Bastion, Smashville, Town & City, Kalos Pokémon League, Yoshi's Story, Lylat Cruise.
- *Melee (choix de Claude, non validé) :* Battlefield, Final Destination, Yoshi's Story, Dream Land, Fountain of Dreams, Pokémon Stadium.

Changer ces listes ne touche que les nouveaux matchups. Les stages déjà créés sont des lignes en base.

## 7. Silhouettes de stages

- Les données sont dans `STAGE_LAYOUTS` (`src/lib/game-data.ts`) et le rendu dans `src/components/matchup/stage-glyph.tsx` (viewBox `0 0 100 44`, sol à `y = 30`).
- Propriétés disponibles par stage :
  - `main: [x, largeur]` : position et largeur du sol ;
  - `platforms: [x, y, largeur][]` : plateformes ;
  - `depth` : épaisseur du sol (9 par défaut) ;
  - `taper` : rétrécissement vers le bas (0.12 par défaut) ;
  - `slope` : pente en degrés près des ledges ;
  - `pillar: [largeur, hauteur]` : pilier central ;
  - `tilt` : inclinaison ;
  - `moving` : flèches (encore utilisées pour Fountain of Dreams).
- La géométrie du sol est calculée par `stageFloorPaths()`. Les stages inconnus ou custom utilisent `DEFAULT_LAYOUT`.
- Consignes validées par le propriétaire (dernière itération) :
  - **Small Battlefield** : même disposition que Pokémon Stadium 2 (2 plateformes, pas de plateforme haute), en plus petit.
  - **Pokémon Stadium 2** : pilier central sous le stage.
  - **Hollow Bastion** : plateforme centrale ≈ 45 % de la largeur du stage.
  - **Smashville** : même disposition que Hollow Bastion en plus petit, plateforme centrée ≥ 50 % du stage, pas de flèches.
  - **Town & City** : aussi long que Kalos, plateformes `-  _  -` (côtés hauts, centre bas), pas de flèches.
  - **Kalos** : stage profond et rectangulaire, deux plateformes centrées pile au-dessus de chaque ledge.
  - **Yoshi's Story** : parois plus profondes, pente d'environ 15° à côté de chaque ledge.

## 8. Arborescence

```
supabase/migrations/          0001_init.sql, 0002_delete_account.sql
public/sw.js                  service worker (incrémenter VERSION si la logique de cache change)
public/icons/                 icônes PWA
src/proxy.ts                  refresh de session + garde (sous Next 15 : middleware.ts / middleware())
src/app/
  layout.tsx, globals.css     shell racine, tokens, styles Tiptap
  manifest.ts, icon.png, apple-icon.png
  login/                      connexion / inscription (+ lien "Forgot password?")
  forgot-password/            demande de reset (contient aussi updatePassword)
  reset-password/             choix du nouveau mot de passe (formulaire réutilisé dans /account)
  privacy/                    page Privacy publique
  offline/                    page hors ligne
  auth/callback, auth/signout routes Supabase
  (app)/                      zone connectée (header commun)
    page.tsx                  dashboard
    actions.ts                createMatchup / deleteMatchup
    matchups/[id]/            page matchup
    account/                  compte + suppression
src/components/
  app-header.tsx, auth-shell.tsx, new-matchup-form.tsx, sign-out-button.tsx, sw-register.tsx
  matchup/                    stage-selector, stage-glyph, note-editor, quick-notes, delete-matchup-button
src/lib/
  supabase/{client,server,proxy}.ts
  game-data.ts                rosters, layouts de stages, stageFloorPaths()
  site-config.ts              opérateur, email de contact, région des données (page Privacy)
  types.ts, cn.ts
```

Les chemins publics (accessibles sans être connecté) sont listés dans `PUBLIC_PATHS`, dans `src/lib/supabase/proxy.ts`. Toute nouvelle page publique doit y être ajoutée.

## 9. Configuration Supabase attendue

- **Authentication → URL Configuration :**
  - Site URL = l'URL Vercel de production ;
  - Redirect URLs = `https://<url-vercel>/**` et `http://localhost:3000/**`.
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
