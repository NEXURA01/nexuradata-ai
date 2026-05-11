# NEXURADATA

Site marketing et plateforme de lancement pour un laboratoire de recuperation de donnees et forensique numerique.

Le depot couvre:

- le site public bilingue (FR + EN)
- le formulaire d'ouverture de dossier
- le portail client de suivi
- la console interne `/operations/`
- les Pages Functions Cloudflare pour l'intake, le suivi et les actions operateur
- la base Neon Postgres et la configuration `wrangler.jsonc`

## Structure utile

- `index.html` / `en/index.html` : pages d'accueil publiques (FR / EN)
- `suivi-dossier-client-montreal.html` : portail client `noindex`
- `operations/index.html` : console interne a proteger via Cloudflare Access
- `assets/css/site.css` : styles partages
- `assets/js/site.js` : interactions publiques et console operateur
- `functions/api/intake.js` : ouverture de dossier
- `functions/api/status.js` : suivi client par numero + code
- `functions/api/ops/cases.js` : recherche et actions operateur
- `functions/_lib/` : logique partagee (DB, auth, emails, Stripe, rate-limit)
- `supabase/migrations/` : migrations Supabase cible
- `migrations/neon/0001_full_schema.sql` : schema Postgres historique conserve temporairement
- `migrations/d1-archive/` : ancienne base D1 (archive historique uniquement)
- `wrangler.jsonc` : configuration Pages/Functions, source de verite
- `.dev.vars.example` : variables locales a copier vers `.dev.vars`

## Note de transition stack

Supabase est la pile cible pour les nouveaux developpements. Le depot conserve temporairement des chemins Neon existants, notamment `functions/_lib/db.js`, `migrations/neon/0001_full_schema.sql` et la dependance `@neondatabase/serverless`. La migration doit rester progressive, non destructive, et preserver le comportement actuel jusqu'a ce que les equivalents Supabase soient prets, testes et valides.

## Prerequis de lancement

1. Provisionner un projet Supabase et recuperer l'URL Postgres pooled compatible Cloudflare.
2. Appliquer les migrations `supabase/migrations/` avec Supabase CLI ou SQL Editor.
3. Declarer l'URL Postgres Supabase comme secret Cloudflare Pages sous le nom `DATABASE_URL` tant que l'adaptateur legacy reste actif.
4. Creer un secret fort `ACCESS_CODE_SECRET`.
5. Configurer les alias `contact@`, `urgence@`, `dossiers@` dans Cloudflare Email Routing.
6. Verifier le domaine d'envoi dans Resend et fournir `RESEND_API_KEY`.
7. Proteger `/operations/*` et `/api/ops/*` avec Cloudflare Access.

Le runbook detaille est dans [`docs/LAUNCH-RUNBOOK.md`](docs/LAUNCH-RUNBOOK.md). Voir aussi [`docs/`](docs/) pour la checklist de lancement, le guide de deploiement rapide et les notes de recherche concurrentielle / tarifaire.

## Commandes

- `npm install`
- `npm run build`
- `npm run cf:whoami`
- `npm run cf:dev`
- `npm run cf:check`
- `npm run cf:deploy`
- `npm run cf:deploy:staging`
- `npm test`

`release-cloudflare/` est regenere a chaque build pour les assets statiques. Les `functions/` restent a la racine du projet pour Cloudflare Pages Functions.

## Cloudflare Pages

1. Connecter le repo GitHub a Cloudflare Pages.
2. Utiliser `.` comme root directory.
3. Utiliser `npm run build` comme build command.
4. Utiliser `release-cloudflare` comme build output directory.
5. Laisser `main` comme branche de production.
6. Utiliser la branche de lancement ou `staging` pour les previews.
7. Une fois `wrangler.jsonc` rempli avec les vrais bindings, traiter ce fichier comme source de verite pour la configuration.
