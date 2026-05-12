# Mise en ligne rapide

## Production actuelle: Cloudflare Pages Direct Upload

Le domaine `nexuradata.ca` pointe vers le projet Cloudflare Pages **`nexuradata-ai`** (`nexuradata-ai.pages.dev`). Ce projet est actuellement publie par deploiement ad hoc / Direct Upload, pas par le workflow GitHub.

Commande verifiee pour publier la production depuis ce depot:

```bash
npm run check
npm run build
npm test
npx wrangler pages deploy ./release-cloudflare --project-name nexuradata-ai --branch main
```

Apres un deploiement, verifier au minimum:

```bash
curl -I https://nexuradata.ca/
curl -I https://nexuradata.ca/merchant-feed.xml
curl -I https://nexuradata.ca/assets/icons/facebook-cover.png
```

Le workflow GitHub `deploy.yml` execute les controles, mais ne publie pas Cloudflare. Il ne remplace pas la commande Wrangler ci-dessus tant que le projet Cloudflare Pages n'est pas reconnecte a Git.

## Option future recommandee: GitHub + Cloudflare Pages

Le site est purement statique. La voie la plus stable est le repo GitHub public `NEXURA01/nexuradata-ai` connecte a Cloudflare Pages, avec `main` en production et `staging` en preview si vous voulez une branche de previsualisation.

1. Utiliser le repo GitHub `NEXURA01/nexuradata-ai`.
2. Verifier que la branche `main` est a jour.
3. Dans Cloudflare Pages, choisir `Connect to Git`.
4. Selectionner le repo.
5. Utiliser `main` comme branche de production.
6. Laisser `.` comme root directory.
7. Utiliser `npm run build` comme build command.
8. Utiliser `release-cloudflare` comme build output directory.
9. Ajouter ensuite votre domaine personnalise.

Les fichiers `_headers` et `_redirects` sont publies avec le site. Ils gerent les en-tetes de securite, le cache et les redirections simples comme `index2.html -> /`.

## Option CLI: Pages avec Wrangler

1. Installer Node.js et npm.
2. Dans `NEXURA`, lancer `npm install`.
3. Verifier l'authentification avec `npm run cf:whoami`.
4. Generer `release-cloudflare/` avec `npm run build`.
5. Creer le projet Pages avec `npm run cf:pages:project:create`.
6. Verifier la configuration avec `npm run cf:check`.
7. Deployer la production avec `npm run cf:deploy`.
8. Deployer la preview avec `npm run cf:deploy:staging`.

## Option sans Wrangler: Cloudflare Pages Direct Upload

1. Ouvrir `dash.cloudflare.com`.
2. Aller dans `Workers & Pages`.
3. Creer un projet `Pages`.
4. Choisir `Direct Upload`.
5. Generer `release-cloudflare/` avec `npm run build`.
6. Envoyer tout le contenu du dossier `release-cloudflare/`.
7. Verifier que `index.html` est bien la page d'accueil.
8. Ajouter ensuite votre domaine personnalise.

Cette option evite Wrangler, mais elle demande toujours Node.js pour generer `release-cloudflare/`.

Attention: un projet Pages cree en `Direct Upload` ne peut pas etre converti ensuite en projet avec integration Git. Si vous voulez des deploiements depuis Git, creez directement un projet relie au depot.

## Juste apres la mise en ligne

1. Tester `index.html`, `mentions-legales.html` et `politique-confidentialite.html`.
2. Verifier que le domaine final correspond aux URL canoniques et au `sitemap.xml`.
3. Mettre a jour les vraies coordonnees, chiffres et certifications si necessaire.
