---
description: "Scaffold a new Cloudflare Pages Function API endpoint with standard handler structure, _lib imports, and input normalization."
agent: "agent"
argument-hint: "Endpoint path and purpose, e.g. 'ops/notes — add internal notes to a case'"
---
Create a new API endpoint for the NEXURA platform.

Ask for anything not provided: path under `functions/api/`, HTTP methods, purpose, whether it requires Cloudflare Access.

## Steps

1. Create `functions/api/{{path}}.js`.
2. The Functions instruction file is loaded automatically — follow its handler pattern, `_lib/` imports, and input normalization rules.
3. Reference `functions/api/intake.js` (public) or `functions/api/ops/cases.js` (protected) as exemplars.
4. If protected, add `authorizeOpsRequest(request, env)` check → 403 on failure.
5. Place any reusable logic in `functions/_lib/`, not inline.
