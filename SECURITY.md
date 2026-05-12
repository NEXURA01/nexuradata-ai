# Security Policy

## Scope

This policy applies to the NEXURA website and operational platform hosted at `nexuradata.ca`.

In scope:

- Public intake form (`/api/intake`)
- Case status lookup (`/api/status`)
- Stripe webhook handler (`/api/stripe-webhook`)
- Operator console (`/operations/`, `/api/ops/*`)
- Cloudflare Pages configuration (`_headers`, `_redirects`)

Out of scope:

- Third-party services (Stripe, Resend, Supabase, Neon, Cloudflare)
- Social engineering or phishing
- Physical infrastructure

## Reporting a Vulnerability

Please report security vulnerabilities **privately** by email:

**<privacy@nexuradata.ca>**

Include:

1. A clear description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Your contact information (optional)

Do **not** open a public GitHub issue for security vulnerabilities.

## Response Commitment

| Timeline | Action |
| --- | --- |
| Within 48 h | Acknowledgment of your report |
| Within 7 days | Initial assessment and severity classification |
| Within 30 days | Resolution or documented remediation plan |

We will not pursue legal action against researchers who report vulnerabilities in good faith and follow responsible disclosure.
