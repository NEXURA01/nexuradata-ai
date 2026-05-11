---
description: "Integrate a NEXURADATA doctrine into the bilingual site as premium copy, UI behavior, legal/trust structure, and verification."
agent: "agent"
argument-hint: "Doctrine text and target area, e.g. 'Quebec compliance layer for homepage, privacy, footer, intake'"
---
Integrate the provided NEXURADATA doctrine into the site.

Use this when a doctrine, positioning note, compliance rule, design direction, or narrative layer needs to become real site behavior and copy. Treat the doctrine as product architecture, not decorative text.

## Inputs

- Doctrine or positioning text: `{{input}}`
- Target scope if specified: homepage, FR/EN legal pages, footer, intake forms, CSS/design system, tracking/consent, or all relevant public pages.
- If the target scope is not specified, infer the smallest source-file scope that makes the doctrine true across the public experience.
- If the doctrine affects tracking, consent, contact handling, privacy, or public legal trust, verify the rule across all public source pages, not only the page named in the request.

## Principles

- Keep NEXURADATA positioned as operational intelligence infrastructure, not a generic AI startup.
- Maintain a Quebec professional tone: calm authority, legal clarity, operational accountability, secure handling practices.
- Keep AI and automation behind the scenes unless transparency requires mention; prefer terms like operational evaluation, recommendation, routing, workflow, execution system, traceability, and human validation.
- Do not expose personal names, personal addresses, or private contact details in public copy or structured data. Use business contact language such as `privacy@nexuradata.ca`, `operations@nexuradata.ca`, and `contact@nexuradata.ca`.
- Avoid hype: no neon/cyberpunk language, no "unhackable", no "military-grade", no generic blue SaaS/startup framing.
- Update French and English counterparts together. French is primary; English should be equivalent, not looser.
- Edit source files only. Do not hand-edit `release-cloudflare/`. If deployable output must be refreshed, run `npm run build` so the folder is regenerated from source.

## Workflow

1. Read the relevant source files before editing. For homepage work, inspect `index.html`, `en/index.html`, and `assets/css/site.css`. For compliance work, inspect `politique-confidentialite.html`, `mentions-legales.html`, `conditions-intervention-paiement.html`, `engagements-conformite-quebec.html`, and their `en/` counterparts.
2. Extract the doctrine into concrete site requirements: public promise, required disclosures, consent behavior, footer/legal links, form wording, UI state, and verification scans.
3. Implement the smallest source-file changes that make those requirements true. Prefer existing page structures, classes, scripts, and copy patterns.
4. For intake or contact forms, make consent explicit about what is collected, why it is collected, how it is processed, and the operational follow-up purpose. Keep promotional/marketing consent separate and never prechecked.
5. For tracking, analytics, or cookies, ensure optional analytics/marketing behavior is consent-gated in code, not only described in legal copy.
6. For legal/trust layers, include data minimization, retention, security safeguards, AI-assisted processing transparency when relevant, human validation, privacy requests, and incident handling without overclaiming security.
7. Preserve the premium visual direction: graphite/obsidian surfaces, controlled copper accents, restrained shadows, minimal radius, no decorative blobs or generic AI palette.

## Verification

Run the checks appropriate to the touched files:

```powershell
npm run check
npm test
git diff --check
```

Also run scoped scans for public exposure and tracking bypasses when relevant:

```powershell
$root = "C:\Users\oblan\nexuradata-site"
Get-ChildItem -Path $root -Filter *.html -Recurse | Select-String -Pattern "Giacomo|1102|Coteau-Rouge|ch\. du|Olivier"
Get-ChildItem -Path $root -Filter *.html -Recurse | Select-String -SimpleMatch "googletagmanager.com/gtag/js","gtag("
```

If a browser server is already running, smoke test the affected page and confirm the doctrine is visible or enforceable in the DOM.

## Output

Report:

- What doctrine was integrated.
- Which source areas changed.
- What legal/compliance or design behavior is now enforced.
- Verification results and any remaining risks.