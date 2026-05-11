# NEXURADATA Deployment & Execution Plan

## Purpose

NEXURADATA has a locked doctrine: operational intelligence infrastructure, restrained identity, premium pricing, Quebec-aware trust, and a living operational environment.

The risk is overbuilding without operational coherence. This plan sequences execution so the platform becomes functional infrastructure instead of decorative positioning.

## Execution Principle

Every stage must reinforce:

- systems
- structure
- clarity
- execution
- operational maturity
- infrastructure thinking

Do not add complexity unless it strengthens the operational engine.

## Doctrine Transition Risk

The principal current risk is structural and narrative. NEXURADATA has been deeply repositioned toward operational intelligence infrastructure, but the repository still contains legacy business language, service-oriented pages, inherited visual patterns, older architecture paths, and components that may not reflect the current doctrine.

This creates risk of perception incoherence, narrative fragmentation, diluted positioning, conflict between old and new identity, and a non-unified user experience.

The transition must therefore be managed as:

```txt
stabilize -> audit -> reframe -> replace -> optimize
```

Reference documents:

- `docs/DOCTRINE.md` is the single source of truth.
- `docs/DOCTRINE-TRANSITION-AUDIT.md` is the working audit sheet for old doctrine vs new doctrine.
- `docs/ECOSYSTEM-VISION.md` defines the long-term category expansion and should guide product imagination without overriding staged execution discipline.

## Final Stack

The target stack is:

- Cloudflare Pages
- Cloudflare Functions
- Supabase
- Resend
- OpenAI

No extra framework, no heavy frontend runtime, no WebGL requirement in the first execution phase.

Current code must be migrated carefully if older Neon-specific paths remain. Preserve working behavior until Supabase equivalents are ready.

Important note: Supabase is now the target stack for new development, but the repository still contains legacy Neon paths and modules. No destructive or invasive migration should be performed until the Supabase equivalents are ready, tested, and validated. Existing behavior must be preserved during the transition to avoid regressions on routes, workflows, or functions already in place.

Short PR / README note: Supabase is the target stack, but existing Neon paths remain temporarily. Migration must be progressive, non-destructive, and preserve current behavior until Supabase equivalents are fully validated.

## Stage 1 - Lock The Foundation

Goal: stabilize identity, structure, infrastructure, and stack.

Tasks:

1. Clean repository
    - Remove old startup sections.
    - Reframe forensic and data recovery language gradually where URLs still have SEO value.
    - Remove unused Next references.
    - Remove duplicate pages and broken experiments.
    - Fix visual inconsistencies.
    - Classify every active page and major internal document as KEEP, REFRAME, LEGACY, or REMOVE LATER before deleting or rewriting.

2. Lock stack
   - Confirm Cloudflare Pages deployment.
   - Confirm Cloudflare Functions boundaries.
   - Plan Supabase schema and migration path.
   - Confirm Resend email dispatch.
   - Confirm OpenAI fallback behavior.

3. Lock design system
   - Maintain `assets/css/tokens.css` as the source of design tokens.
   - Keep colors, spacing, typography, shadows, radii, and motion timing centralized.
   - Avoid ad hoc visual additions in page-specific CSS.

Exit criteria:

- Design tokens exist and are imported.
- Old low-ticket or generic AI language is not present on core homepage/pricing surfaces.
- Build, check, tests, and diff checks pass.

## Stage 2 - Build The Operational Framework

Goal: transform the site from marketing page to living operational environment.

Tasks:

4. Build operational hero
   - Live topology.
   - Node routing.
   - Infrastructure grid.
   - Subtle motion.
   - Command atmosphere.
   - Use SVG, Canvas, and lightweight JS before considering heavier rendering.

5. Build infrastructure sections
   - Operational Problems.
   - Workflow Infrastructure.
   - Operational Dashboard.
   - AI Routing.
   - Execution Systems.

6. Build living dashboard module
   - Simulate real operations.
   - Show live states.
   - Show routing activity.
   - Show orchestration.
   - Make it believable enough to become the signature visual system.

Exit criteria:

- The homepage communicates operations through visible system behavior.
- The dashboard module feels functional rather than illustrative.
- Mobile layout remains controlled, readable, and non-overflowing.

## Stage 3 - Build The Real Operational Engine

Goal: make the platform functional, not decorative.

Tasks:

7. Build intake infrastructure
   - Request intake.
   - AI qualification.
   - Workflow classification.
   - Supabase insert.
   - Operational routing.
   - Dashboard sync.
   - Email dispatch.

8. Build workflow engine
   - `workflow_cases`.
   - `workflow_steps`.
   - `operator_tasks`.
   - `ai_audit_sessions`.
   - `workflow_events`.

9. Build operational logic
   - Urgency.
   - Routing.
   - Task generation.
   - Workflow type.
   - Escalation.
   - Operator visibility.

Exit criteria:

- Intake creates persistent operational records.
- Routing is explainable and logged.
- Email dispatch works.
- AI failure has a safe fallback.

## Stage 4 - Build The Operational Experience

Goal: make users feel infrastructure.

Tasks:

10. Build state system
    - Execution layer stable.
    - Routing synchronized.
    - Workflow queue nominal.
    - Active infrastructure indicators.

11. Build cinematic scrolling
    - Chaos to structure to execution.
    - Systems assemble.
    - Workflows connect.
    - Command layers deepen.

12. Add atmospheric layering
    - Topology backgrounds.
    - Layered grids.
    - Operational glow.
    - Subtle copper lighting.
    - Infrastructure shadows.

Exit criteria:

- Motion feels synchronized, quiet, and controlled.
- Visual depth exists without startup effects.
- The site feels like an operational environment, not a decorative brochure.

## Stage 5 - Trust & Legitimacy

Goal: make the platform feel enterprise-grade.

Tasks:

13. Build legal layer
    - Privacy Policy.
    - Terms.
    - Data Handling.
    - Cookie Policy.
    - Quebec Law 25 commitments.

14. Add operational transparency
    - AI usage.
    - Operational handling.
    - Workflow processing.
    - Infrastructure safeguards.

Exit criteria:

- Trust comes from clarity, not claims.
- Privacy and consent language is visible where data is collected.
- Tracking remains consent-gated.

## Stage 6 - Social Ecosystem

Goal: extend the infrastructure atmosphere outside the website.

Tasks:

15. Build LinkedIn system
    - Operational diagrams.
    - Workflow philosophy.
    - Orchestration breakdowns.
    - Infrastructure visuals.
    - Executive operational intelligence tone.

16. Build Instagram visual system
    - Topology visuals.
    - Dashboard cinematics.
    - Workflow structures.
    - Infrastructure reels.
    - Operational atmosphere.

Exit criteria:

- Social assets feel consistent with the site.
- No generic AI startup visual language.

## Stage 7 - SEO & Discovery

Goal: get indexed correctly.

Tasks:

17. Technical SEO
    - `sitemap.xml`.
    - `robots.txt`.
    - Canonical tags.
    - OG tags.
    - Semantic HTML.

18. Search positioning
    - Operational intelligence.
    - Workflow infrastructure.
    - Orchestration systems.
    - Execution systems.
    - Operational dashboards.
    - Avoid generic AI SEO spam.

Exit criteria:

- Core pages have accurate titles, descriptions, canonicals, and OG tags.
- Search language supports the new operational positioning.

## Stage 8 - Performance & Polish

Goal: make the site feel expensive.

Tasks:

19. Optimize motion
    - Smooth.
    - Synchronized.
    - Controlled.
    - Quiet.

20. Optimize spacing
    - Restraint.
    - Rhythm.
    - Hierarchy.
    - Silence.

21. Remove visual noise
    - Unnecessary gradients.
    - Flashy effects.
    - Random icons.
    - Inconsistent layouts.

Exit criteria:

- Visual style feels deliberate and sober.
- Mobile and desktop have no incoherent overlaps or cramped text.

## Stage 9 - Final Infrastructure Test

Goal: verify the system is coherent.

Tasks:

22. Technical verification
    - `npm run check`.
    - `npm run build`.
    - Browser smoke test.
    - Coverage test if a coverage script exists.

23. Infrastructure verification
    - Supabase works.
    - Intake works.
    - Routing works.
    - Emails work.
    - AI fallback works.
    - Dashboards update.
    - Mobile UX works.

24. Emotional verification
    - Does this feel like operational infrastructure?
    - If no: simplify, darken, tighten, reduce, restructure.

## Current Priority

Work in this order:

1. Stage 1 foundation cleanup and tokens.
2. Stage 2 living operational framework.
3. Stage 3 real intake and workflow engine.
4. Stage 5 trust and legal hardening in parallel with data handling.
5. Stage 8 polish after the functional engine exists.

The final result should feel like a living operational operating environment: systems move, workflows exist, infrastructure breathes, and execution feels structured.
