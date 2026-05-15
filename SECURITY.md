# Security Policy

## Scope

This policy applies to the NEXURA website and operational platform hosted at `nexuradata.ca`.

In scope:

- Public intake form (`/api/intake`)
- Case status lookup (`/api/status`)
- Stripe webhook handler (`/api/stripe-webhook`)
- Operator console (`/operations/`, `/api/ops/*`)
- Security headers and redirects configuration (`next.config.ts`, `vercel.json`, redirect smoke-test workflow)

Out of scope:

- Third-party services (Stripe, Resend, Supabase, Neon, Cloudflare)
- Social engineering or phishing
- Physical infrastructure

## Security Controls

- Least privilege: access to production systems and secrets is limited by role.
- Secrets handling: no plaintext secrets in source control; secrets are stored in platform-managed secret stores.
- Transport and storage: encryption in transit and at rest is required for customer and operational data.
- Change control: critical changes are validated by CI checks before merge and deployment.
- Monitoring: operational and deployment workflows are monitored, with security findings tracked to remediation.

## GitHub Marketplace Application Security

For marketplace-facing integrations and automations, we apply the following baseline:

- Permission minimization: only required GitHub App permissions are requested.
- Webhook verification: webhook signatures are validated before processing.
- Tenant isolation: customer data is logically separated by organization/repository boundary.
- Retention and deletion: data retention is limited to operational needs; uninstall/offboarding triggers token revocation and scheduled data cleanup.
- Auditability: security-relevant administrative and integration events are logged.
- Vulnerability management: dependency and code scanning are run continuously; critical issues are prioritized for immediate remediation.

## Reporting a Vulnerability

Please report security vulnerabilities **privately** by email:

**<security@nexuradata.ca>**

Include:

1. A clear description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Your contact information (optional)

Do **not** open a public GitHub issue for security vulnerabilities.

If encrypted disclosure is preferred, mention this in your email and we will coordinate a secure channel.

## Response Commitment

| Timeline | Action |
| --- | --- |
| Within 48 h | Acknowledgment of your report |
| Within 7 days | Initial assessment and severity classification |
| Within 30 days | Resolution or documented remediation plan |

We will not pursue legal action against researchers who report vulnerabilities in good faith and follow responsible disclosure.
