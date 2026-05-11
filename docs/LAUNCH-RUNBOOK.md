# Runbook Lancement NEXURADATA

## 1. Cloudflare Pages et Supabase Postgres

1. Connecter le repo a Cloudflare Pages si ce n'est pas deja fait.
2. Provisionner un projet Supabase pour NEXURADATA.
3. Recuperer l'URL Postgres pooled compatible Cloudflare depuis Supabase.
4. Declarer cette URL comme secret Cloudflare Pages sous `DATABASE_URL` pendant la transition legacy.
5. Copier `.dev.vars.example` vers `.dev.vars` pour le dev local et y placer l'URL Supabase locale ou pooled.
6. Appliquer le schema consolide via Supabase CLI ou SQL Editor:
   - `npx supabase db push`
   - ou executer les migrations `supabase/migrations/20260511191000_initial_operational_schema.sql`, `supabase/migrations/20260511205000_add_stripe_payments.sql` et `supabase/migrations/20260511213000_ai_estimate_engine.sql` dans le SQL Editor.
7. Declarer pour le moteur REST Supabase:
   - `SUPABASE_URL` comme variable, par exemple `https://project-ref.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` comme secret

Note: `functions/_lib/db.js` conserve encore l'adaptateur legacy. Ne pas reutiliser l'ancienne URL Neon. Le secret `DATABASE_URL` doit pointer vers Supabase jusqu'au remplacement complet de l'adaptateur DB.

## 2. Emails

### Cloudflare Email Routing

Creer ces adresses et les faire suivre vers une seule inbox verifiee au lancement:

- `contact@nexuradata.ca`
- `urgence@nexuradata.ca`
- `dossiers@nexuradata.ca`

### Resend

1. Verifier le domaine `nexuradata.ca` dans Resend.
2. Creer une cle API transactionnelle.
3. Declarer dans Cloudflare Pages:
   - `RESEND_API_KEY` comme secret
   - `RESEND_FROM_EMAIL` comme variable, par exemple `NEXURADATA <dossiers@nexuradata.ca>`
   - `LAB_INBOX_EMAIL` comme variable cible de l'equipe
   - `ACCESS_CODE_SECRET` comme secret

## 2.1 Paiements Stripe

### Variables et secrets Stripe

Declarer dans Cloudflare Pages:

- `STRIPE_SECRET_KEY` comme secret
- `STRIPE_PUBLISHABLE_KEY` comme variable ou secret reservee aux futurs composants publics
- `STRIPE_WEBHOOK_SECRET` comme secret

Compatibilite temporaire: si le secret webhook a deja ete cree sous `AI_AGENT_STRIPE`, le runtime l'accepte comme alias. Garder `STRIPE_WEBHOOK_SECRET` comme nom cible pour les prochaines configurations.

### Webhook Stripe

Configurer un endpoint Stripe vers:

- `https://nexuradata.ca/api/stripe-webhook`

Evenements minimum:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

### Mode operatoire v1

- les paiements sont crees depuis `/operations/`
- types prevus: acompte, solde final, paiement ponctuel
- chaque lien de paiement Stripe est rattache a un `caseId`
- le webhook met a jour le statut du paiement dans Supabase et l'historique du dossier
- `/api/create-checkout-session` cree la session Stripe de l'Operational Assessment public, ajoute une entree `stripe_payments`, puis renvoie vers `paiement-reussi.html` ou `paiement-annule.html`
- `/api/create-checkout` cree la session Stripe apres estimation AI et ajoute une entree `payments`
- l'activation publique reste positionnee comme infrastructure operationnelle securisee, pas comme bouton ecommerce

## 2.2 Moteur AI Estimate

Declarer dans Cloudflare Pages:

- `OPENAI_API_KEY` comme secret
- `OPENAI_ESTIMATE_MODEL` comme variable optionnelle, par defaut `gpt-4o-mini`

Flux:

- `/api/estimate` insere le lead dans `leads`
- le moteur OpenAI produit scores, fourchette CAD, resume et scope JSON
- l'estimation est stockee dans `ai_estimates` avec `final_status = draft`
- l'interface publique affiche l'analyse et conserve la validation humaine avant activation Stripe

## 3. Protection de la console interne

Configurer Cloudflare Access sur:

- `/operations/*`
- `/api/ops/*`

Recommandation v1:

- autoriser seulement les adresses operateur explicites
- propager l'entete `Cf-Access-Authenticated-User-Email`
- declarer `OPS_ACCESS_ALLOWED_EMAILS` ou `OPS_ACCESS_ALLOWED_DOMAIN`

## 4. Verification fonctionnelle

### Intake

1. Ouvrir `index.html`.
2. Soumettre un dossier test.
3. Verifier:
   - creation du `caseId`
   - insertion en base Neon
   - notification interne
   - email client avec numero + code

### Portail client

1. Ouvrir `suivi-dossier-client-montreal.html`.
2. Utiliser le `caseId` et le code recus.
3. Verifier l'affichage du statut, de la prochaine etape et de la timeline visible.

### Console interne

1. Ouvrir `/operations/` depuis une session Access autorisee.
2. Rechercher le dossier.
3. Modifier statut, prochaine etape et resume.
4. Tester:
   - enregistrement
   - envoi de mise a jour client
   - renvoi du code
   - regeneration du code

## 5. Release

1. Travailler sur une branche de lancement.
2. Ouvrir une PR GitHub vers `main`.
3. Valider la preview Cloudflare.
4. Fusionner sur `main`.
5. Verifier en prod:
   - `https://nexuradata.ca/`
   - `https://www.nexuradata.ca/`
   - `https://nexuradata.ca/.well-known/security.txt`
   - `https://nexuradata.ca/suivi-dossier-client-montreal.html`

## 6. Variables et secrets attendus

Variables:

- `PUBLIC_SITE_ORIGIN`
- `LAB_INBOX_EMAIL`
- `OPS_ACCESS_ALLOWED_EMAILS` ou `OPS_ACCESS_ALLOWED_DOMAIN`
- `RESEND_FROM_EMAIL`

Secrets:

- `DATABASE_URL`
- `RESEND_API_KEY`
- `ACCESS_CODE_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
