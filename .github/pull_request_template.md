# Pull Request

## Summary

Describe the change and the user-facing or operational reason for it.

## Validation

- [ ] `npm run check`
- [ ] `npm test`
- [ ] `npm run build`

## Security And Privacy

- [ ] No secrets, credentials, client data, private addresses, or local machine paths were added.
- [ ] Any new environment variable is documented in `.dev.vars.example` and `docs/LAUNCH-RUNBOOK.md`.
- [ ] Public copy uses business/team language and avoids personal identity references.
- [ ] Operator-only routes remain behind Cloudflare Access.
- [ ] Payment, email, AI, or database changes were reviewed for logging and least-privilege exposure.

## Deployment Notes

- [ ] No manual production step is required.
- [ ] Manual production step required and documented here:
