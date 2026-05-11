# NEXURA AI Automation Blueprint

This document maps what already exists in the platform, what can be automated now, and what should become AI-assisted once the operational guardrails are in place.

The goal is not to make clients diagnose their own incident. The goal is to let NEXURA qualify faster, package the right paid intervention, and send the client a controlled link that moves the case forward.

## Current Automation Base

The platform already has the core pieces needed for a practical AI layer:

- structured intake: support type, urgency, profile, business impact, sensitivity, message and source path
- client case access: case ID plus access code
- operator console: qualification summary, internal notes, handling flags, status, next step and visible timeline
- payment requests: Stripe Checkout links, payment status and payment history
- quote authorization: quote sent, approved, declined and preapproval states
- client workroom: post-payment or post-authorization guidance by case type
- follow-up views: quote, payment and authorization follow-up queues
- email delivery: client access, payment link and status updates through Resend

That means the first AI layer can be added without replacing the business workflow.

## Automation Levels

### Level 1: Rules Automation

This is deterministic and should run without AI.

- classify intake into media, RAID, forensic, mobile or guided support
- assign initial priority from urgency, impact and sensitivity
- flag dangerous symptoms such as clicking drive, RAID rebuild, ransomware, legal context or repeated passcode attempts
- pick the matching workroom type
- suggest follow-up timing from quote/payment/authorization status
- prefill standard timeline steps
- detect missing intake details and request them

Level 1 is safe to execute automatically because it only organizes known facts.

### Level 2: AI Drafts With Human Approval

This is where the highest value sits.

- draft the internal qualification summary from the intake message
- draft handling flags such as `urgent`, `physical-risk`, `forensic`, `remote-candidate`, `lab-required`
- draft the client summary in professional language
- draft the next step shown in the portal
- draft a quote rationale for the operator
- draft payment labels and descriptions
- draft follow-up emails that sound human and specific
- draft workroom instructions after the case is approved or paid
- draft remote-session preparation instructions

These outputs should appear in the operator console as proposed text. The operator reviews, edits and saves.

### Level 3: AI-Assisted Client Workroom

This runs after payment or authorization.

- generate a case-specific checklist from the support type and approved scope
- explain exactly what files, screenshots, device details or logs to send
- produce a safe “do not do this” list based on symptoms
- prepare a remote session handoff: what will happen, what the client must close, what consent means
- generate a transfer package request for drives, RAID metadata, evidence context or mobile details
- generate a concise operator briefing before the remote call

This should still avoid pretending the client can solve the whole case alone. The language should position the link as a guided NEXURA intervention.

### Level 4: External Tool Orchestration

This is where the platform can become very strong, but it needs explicit consent and vendor choice.

- create a remote-session request with a selected provider such as Microsoft Quick Assist, TeamViewer, AnyDesk, RustDesk or Chrome Remote Desktop
- collect the client session code inside the portal
- create an operator checklist before taking control
- log consent, timestamp, operator and session reference in the case history
- trigger secure upload instructions or upload links for screenshots, logs or documents
- create a post-session summary and next step

Remote control must never be hidden or automatic. The client must explicitly request or approve the session.

### Level 5: Autonomous Agent Workflows

This is future work and should be introduced carefully.

- monitor open cases and generate morning operator priorities
- detect stale paid cases and suggest action
- detect unpaid approved work and suggest payment follow-up
- generate daily executive summaries: new cases, revenue pipeline, blocked cases, urgent risk
- reconcile Stripe payment state against case status
- prepare draft client updates after operator notes are saved
- produce a post-mortem summary for closed cases

Autonomous agents can prepare work, but price changes, forensic claims, data-handling instructions and remote access should stay approval-gated.

## Best Immediate Product Shape

The strongest near-term product is an operator copilot inside `/operations/`.

For every case, show an “AI draft” panel with:

- triage category
- risk level
- missing information
- recommended paid path
- quote range suggestion
- client summary draft
- next step draft
- workroom draft
- remote-assistance readiness

The operator clicks “Apply draft” only after review. This keeps the work fast without making automation look careless.

## Suggested Data Additions

The current schema can support a first version using existing fields, but a stronger version should add a dedicated table:

```sql
CREATE TABLE case_ai_suggestions (
  id SERIAL PRIMARY KEY,
  case_id TEXT NOT NULL,
  suggestion_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  model TEXT NOT NULL DEFAULT '',
  prompt_version TEXT NOT NULL DEFAULT '',
  input_hash TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  structured_json JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at TEXT NOT NULL DEFAULT '',
  applied_by TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE
);
```

Useful `suggestion_type` values:

- `triage`
- `client_summary`
- `next_step`
- `quote_rationale`
- `payment_copy`
- `workroom`
- `remote_session`
- `follow_up`
- `executive_summary`

This gives auditability: what AI suggested, what was applied and who approved it.

## AI Safety Boundaries

Never let AI automatically:

- guarantee data recovery
- decide forensic admissibility
- change pricing without operator approval
- instruct destructive disk commands
- request passwords or secrets
- take remote control
- imply consent was given when it was not
- expose internal notes to the client
- bypass Cloudflare Access or access-code checks

AI can draft, classify, summarize and prepare. NEXURA authorizes.

## Implementation Phases

### Phase 1: No External AI Required

- add a rule-based `automation.js` helper under `functions/_lib/`
- produce triage category, risk flags, missing information and workroom type
- show these suggestions in the operator console
- store applied values in existing fields: `qualification_summary`, `handling_flags`, `client_summary`, `next_step`

### Phase 2: AI Draft Endpoint

- add protected endpoint `/api/ops/ai-draft`
- send only the minimum case context needed
- return structured JSON with draft fields
- display the draft in the operator console
- require manual apply

### Phase 3: Workroom Generator

- generate post-payment or post-authorization workroom instructions from approved scope
- save the generated instruction as a visible case event or a dedicated AI suggestion
- keep client-facing text constrained and reviewed for high-risk categories

### Phase 4: Remote Assistance Workflow

- add a client portal remote-assistance request form
- capture explicit consent, preferred time and chosen tool
- let the operator create or paste a session link/code
- log all remote-session activity in case history

### Phase 5: Executive Automation

- daily priority digest
- revenue pipeline digest
- blocked-case report
- stale follow-up report
- paid-but-not-started alert

## Highest-Value First Automations

1. Intake triage and risk flags
2. Missing information detector
3. Operator-facing client-summary draft
4. Quote/payment copy draft
5. Approved-case workroom draft
6. Follow-up draft per reason
7. Remote-session preparation draft
8. Daily CEO/operations digest

This order gives speed quickly while protecting trust, consent and professional judgment.