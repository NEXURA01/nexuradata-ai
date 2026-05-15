# Mailgun templates ready (FR + EN)

This file gives copy/paste templates for Mailgun and the exact env vars used by this project.

## 1) Required env vars

Set these in your deployment environment:

```env
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.nexuradata.ca
MAILGUN_FROM_EMAIL=NEXURA <noreply@nexuradata.ca>
MAILGUN_API_REGION=us
MAILGUN_TRACKING=yes

# Optional default template (used if no industry-specific template exists)
MAILGUN_TEMPLATE_NAME_DEFAULT=nexura-outreach-en

# Optional per-industry overrides
MAILGUN_TEMPLATE_LANDSCAPING=nexura-landscaping-en
MAILGUN_TEMPLATE_WINDOW_WASHING=nexura-window-washing-en
MAILGUN_TEMPLATE_MOVING=nexura-moving-en
MAILGUN_TEMPLATE_JUNK_REMOVAL=nexura-junk-removal-en
MAILGUN_TEMPLATE_PRESSURE_WASHING=nexura-pressure-washing-en
MAILGUN_TEMPLATE_CLEANING=nexura-cleaning-en
MAILGUN_TEMPLATE_PROPERTY_MAINTENANCE=nexura-property-maintenance-en
MAILGUN_TEMPLATE_HANDYMAN=nexura-handyman-en
MAILGUN_TEMPLATE_PAINTING=nexura-painting-en
MAILGUN_TEMPLATE_ROOFING=nexura-roofing-en
```

Notes:
- Use `MAILGUN_API_REGION=eu` only if your Mailgun account is in EU region.
- If no template var is set, the app falls back to inline HTML/text email.

## 2) Variables available inside Mailgun templates

The app sends these variables in `X-Mailgun-Variables`:

- `firstName`
- `businessName`
- `region`
- `industryLabel`
- `industryPain`
- `industryValueProp`
- `bookingUrl`

Use them in templates like `%recipient.firstName%` is NOT used here.
Use Handlebars style with Mailgun variables JSON:

```html
{{firstName}}
{{businessName}}
{{region}}
{{industryLabel}}
{{industryPain}}
{{industryValueProp}}
{{bookingUrl}}
```

## 3) Example template: EN outreach (copy/paste)

Template name suggestion: `nexura-outreach-en`

Subject:

```text
More {{industryLabel}} requests in {{region}}?
```

Body (HTML):

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#11110f;font-family:Arial,Helvetica,sans-serif;color:#e8e4dc;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#11110f;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#0d0d0b;border:1px solid rgba(232,228,220,0.16);">
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 6px;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#bd7630;">NEXURA outreach</p>
                <p style="margin:0 0 18px;font-size:24px;line-height:1.2;color:#f4efe4;">Book more work, not more noise</p>

                <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi {{firstName}},</p>
                <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">
                  We are reaching out because businesses like <strong>{{businessName}}</strong> in <strong>{{region}}</strong>
                  often lose opportunities when crews are busy on-site.
                </p>
                <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">
                  For {{industryLabel}} teams, the common friction is simple: {{industryPain}}
                </p>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.7;">
                  Goal: {{industryValueProp}}
                </p>

                <p style="margin:0 0 20px;">
                  <a href="{{bookingUrl}}" style="display:inline-block;background:#e8e4dc;color:#0d0d0b;text-decoration:none;padding:11px 20px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-family:'Courier New',Courier,monospace;">Book a quick call</a>
                </p>

                <p style="margin:0;font-size:12px;line-height:1.6;color:#9e988f;">If not relevant, reply once and we stop outreach.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## 4) Example template: FR outreach (copy/paste)

Template name suggestion: `nexura-outreach-fr`

Subject:

```text
Plus de demandes {{industryLabel}} a {{region}}?
```

Body (HTML):

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#11110f;font-family:Arial,Helvetica,sans-serif;color:#e8e4dc;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#11110f;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#0d0d0b;border:1px solid rgba(232,228,220,0.16);">
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 6px;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#bd7630;">NEXURA outreach</p>
                <p style="margin:0 0 18px;font-size:24px;line-height:1.2;color:#f4efe4;">Plus de mandats, moins de bruit</p>

                <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Bonjour {{firstName}},</p>
                <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">
                  Nous vous contactons car des entreprises comme <strong>{{businessName}}</strong> a <strong>{{region}}</strong>
                  perdent souvent des opportunites quand les equipes sont sur le terrain.
                </p>
                <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">
                  Pour les equipes {{industryLabel}}, le point de friction principal est simple: {{industryPain}}
                </p>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.7;">
                  Objectif: {{industryValueProp}}
                </p>

                <p style="margin:0 0 20px;">
                  <a href="{{bookingUrl}}" style="display:inline-block;background:#e8e4dc;color:#0d0d0b;text-decoration:none;padding:11px 20px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-family:'Courier New',Courier,monospace;">Planifier un appel</a>
                </p>

                <p style="margin:0;font-size:12px;line-height:1.6;color:#9e988f;">Si ce n'est pas pertinent, repondez une fois et nous arretons.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## 5) Quick test flow (after deploy)

1. Set `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM_EMAIL`, `MAILGUN_API_REGION`.
2. Set one template var: `MAILGUN_TEMPLATE_NAME_DEFAULT=nexura-outreach-en`.
3. Trigger `POST /api/leads/run-daily` with header `x-api-key` matching `LEADS_API_KEY`.
4. Verify Mailgun logs: accepted/sent and rendered variables.

If template is missing or wrong, remove template env vars to use inline fallback immediately.
