---
description: "Scaffold a new bilingual page pair (FR + EN) with correct meta tags, hreflang links, and design-system classes."
agent: "agent"
argument-hint: "Page slug and topic, e.g. 'faq-recuperation-donnees-montreal — FAQ page'"
---
Create a new bilingual page pair for the NEXURA site.

Ask for anything not provided: slug, French title, English title, FR/EN meta descriptions, page type (content or legal/shell).

## Steps

1. Create `{{slug}}.html` (FR, `lang="fr-CA"`) and `en/{{slug}}.html` (EN, `lang="en-CA"`).
2. Copy the full `<head>` structure from `mentions-legales.html` as a reference — include all OG, Twitter, canonical, and hreflang tags. EN pages use `../` relative paths for assets.
3. Apply the master visual style system from `docs/VISUAL-STYLE-SYSTEM.md` and the tokens in `assets/css/tokens.css`.
4. For legal/shell pages use `.page-shell` / `.page-hero` / `.page-grid` / `.page-card` / `.page-content`.
5. Include skip-link, `<header class="site-header">`, `<main>`, and `<footer>` matching existing pages.
6. Add both URLs to `sitemap.xml`.
7. No build-script changes needed — `npm run build` copies all root HTML and `en/` automatically.
