# ComplyAI — AI Architecture
## Universal compliance checker — EU AI Act + US hiring AI laws

**Last updated:** 2 May 2026  
**Reference:** [PRD v2.0](prd.md) · [Technical Architecture](technical-architecture.md) · [System Design](system-design.md)

---

## Overview

ComplyAI is AI-first. Claude ingests raw legal documents, extracts structured rules, classifies user systems, checks for prohibited AI, reasons across applicable rules using tool use, and streams the gap analysis to the dashboard in real time.

The architecture has five layers:

1. **Law ingestion** — Claude reads raw legal PDFs once and extracts structured, versioned, certainty-tagged rules
2. **Classification** — Claude determines Annex III category, user role (including edge cases), jurisdictions, and checks for Article 5 prohibited AI before routing to compliance
3. **Compliance reasoning** — Claude reasons across all filtered rules using tool use and returns structured gaps
4. **Streaming** — gaps stream to the dashboard via SSE, current violations first
5. **Output** — compliance workspace, confidence score, audit report PDF with self-declaration caveats

---

## Part 1 — Law Ingestion

### What it does

Claude ingests the full EU AI Act PDF (144 pages) and extracts all obligations for each Annex III category. Run once per law version — the output is stored in PostgreSQL and exported to `rules/{law-slug}/{version-tag}/{category}.json`.

Change detection is SHA-256 hash-based: re-ingesting the same PDF hash is a no-op. New hash → new `law_versions` record → human review gate → promote to `active`.

**Ingestion is manual for MVP.** A team member monitors official sources (EUR-Lex for EU AI Act, NYC Council for LL144), downloads the updated PDF, and runs the CLI or admin endpoint. The hash deduplication means repeated runs are safe.

### Rule schema (full)

```json
{
  "id":                    "EU-AIA-009-1",
  "law":                   "EU AI Act",
  "jurisdiction":          "EU",
  "article":               "Article 9(1)",
  "title":                 "Risk management system",
  "category":              "employment_hiring",
  "annex_section":         "Section 4(a)",
  "severity":              "CRITICAL",
  "applies_to":            ["provider"],
  "requirement_type":      "document",
  "action_owner":          "provider",
  "frequency":             "ongoing",
  "effective_date":        "2026-08-02",
  "deadline_note":         "Must be established before market placement",
  "requirement":           "Establish, implement, document, and maintain a risk management system throughout the AI system lifecycle.",
  "evidence_description":  "A documented risk management system covering: identification and analysis of known and reasonably foreseeable risks; estimation and evaluation of risks; adoption of risk management measures.",
  "non_compliance_signal": "No risk management documentation exists or the process is undocumented.",
  "fix":                   "Create a risk register. Document known risks and mitigation measures. Assign an owner. Schedule periodic reviews.",
  "certainty":             "established",
  "certainty_note":        null,
  "gdpr_interaction_note": null,
  "related_articles":      ["Article 10", "Article 72"]
}
```

### Requirement types

| Type | Meaning | Example |
|---|---|---|
| `document` | Must produce a written artifact | Technical documentation per Annex IV |
| `test` | Must commission or run a test | Annual bias audit (NYC LL144) |
| `process` | Must implement an operational procedure | Human override mechanism |
| `disclosure` | Must inform a person or publish information | Notify candidates AI is used |
| `registration` | Must register in an official database | EU AI Act Article 49 database |
| `contract` | Must include specific terms in a vendor agreement | Article 25 provider-deployer terms |

### Certainty levels

| Level | Meaning | Report treatment |
|---|---|---|
| `established` | Clear legal obligation, no ambiguity | Full penalty weight in confidence score |
| `interpretive` | Obligation exists but scope is contested | "Interpretation may vary — recommend legal review" |
| `pending_guidance` | Explicitly awaiting regulatory guidance | "Regulatory guidance pending — monitor for updates" |
| `delegated_act` | Subject to Commission delegated act not yet published | "Subject to Commission delegated act not yet finalised" |
| `contested` | Legal community actively disagrees on applicability | "Legal community is divided — consult counsel" |

### Law versioning

```
PDF in → SHA-256 hash → check law_versions table
  → hash match: SKIP (safe no-op)
  → new hash: insert law_version (status='draft')
              → extract rules → human reviews → promote to 'active'
              → compute diff (added/removed/modified rules)
              → send stale alerts to affected reports
```

Rules are never deleted — only versioned. `valid_until` is set when a rule is superseded. SQL filter for active rules: `WHERE valid_until IS NULL`.

### Rules by category (~543 total, EU AI Act)

| Category | Annex III Section | Approx rules |
|---|---|---|
| Employment & hiring | 4(a) | ~88 |
| Education & training | 3 | ~70 |
| Essential services | 5 | ~80 |
| Biometric identification | 1 | ~75 |
| Critical infrastructure | 2 | ~55 |
| Law enforcement | 6 | ~65 |
| Migration & border control | 7 | ~60 |
| Justice & democracy | 8 | ~50 |
| **Total** | | **~543** |

Plus: Article 5 prohibited uses stored separately in `prohibited_uses` table (not in `rules`).

---

## Part 2 — Classification Engine

### What it does

The intake starts with a free-text description. Classification runs in 7 steps before the intake form is shown:

```
Step 1: Scope check — does any law apply? If not: explain why and exit.
Step 2: Prohibited AI check (Article 5) — if flagged: STOP.
        Show stop-sign UI. No gap list. No score. Recommend legal counsel.
Step 3: Annex III classification — which category?
Step 4: Role classification — handle all 5 edge cases.
Step 5: Jurisdiction determination — which US states trigger obligations?
Step 6: Per-law effective dates — some already in force today.
Step 7: User review — user sees and can challenge before proceeding.
```

### Article 5 prohibited uses (stop-signal before any gap list)

These are not High Risk — they are banned:

| Article | Use case |
|---|---|
| 5(1)(a),(b) | Subliminal or manipulative techniques that influence behaviour |
| 5(1)(c) | Social scoring by public or private actors |
| 5(1)(f) | Emotion recognition in workplace or hiring contexts |
| 5(1)(h) | Real-time remote biometric identification in publicly accessible spaces |

If flagged: stop-sign UI, warning text, no gap list, no compliance score.

### Role classification (5 cases)

| Role | Definition | Obligation set |
|---|---|---|
| `provider` | Built and trained the AI | Full Articles 9–49 |
| `deployer` | Uses someone else's AI | Articles 26–29 + vendor contract gaps |
| `both` | Built it and uses it internally | Full provider + deployer monitoring obligations |
| `substantially_modified` | Fine-tuned or retrained an open-source model on own data (e.g. Llama) | Deemed provider under Article 25(2) — full provider obligations |
| `white_labelled` | Uses third-party AI but markets it under own brand | Deemed provider under Article 25(2) — full provider obligations |

Clarifying questions asked when role is ambiguous: "Did you train or fine-tune the model yourself?" / "Does your company's name appear on the product?"

### Classification tool definition

```javascript
{
  name: "classify_system",
  input_schema: {
    type: "object",
    properties: {
      in_scope:               { type: "boolean" },
      prohibited_ai_risk:     { type: "boolean" },
      prohibited_ai_articles: { type: "array", items: { type: "string" } },
      annex_section:          { type: "string" },
      category:               { type: "string" },
      risk_level:             { type: "string", enum: ["HIGH_RISK","LIMITED_RISK","MINIMAL_RISK","NOT_IN_SCOPE"] },
      role:                   { type: "string", enum: ["provider","deployer","both","substantially_modified","white_labelled"] },
      role_clarification_needed: { type: "boolean" },
      jurisdictions:          { type: "array", items: { type: "string" } },
      laws_in_force_now:      { type: "array", items: { type: "string" } },
      classification_basis:   { type: "string" },
      follow_up_questions:    { type: "array", items: { type: "string" } }
    },
    required: ["in_scope","prohibited_ai_risk","annex_section","risk_level","role","jurisdictions","classification_basis"]
  }
}
```

---

## Part 3 — Compliance Reasoning

### What it does

Claude receives the user's intake answers and all active rules filtered for their category × role × jurisdiction. Claude reasons across all rules simultaneously and calls `report_compliance_gaps` — never prose.

### Rule filtering (deterministic, exhaustive — NOT RAG)

```sql
SELECT * FROM rules
WHERE jurisdiction = ANY($1)          -- user's jurisdictions
  AND category = $2                   -- e.g. 'employment_hiring'
  AND (
    applies_to @> '["provider"]'::jsonb
    OR applies_to @> '["deployer"]'::jsonb
  )
  AND valid_until IS NULL             -- only active rules
ORDER BY
  CASE WHEN effective_date <= NOW() THEN 0 ELSE 1 END,  -- current violations first
  severity DESC
```

RAG is not used here. SQL filtering is deterministic and exhaustive — if RAG missed 10 rules below a similarity threshold, the assessment would have silent holes.

### Gap output schema

Each gap includes:

```json
{
  "rule_id":          "EU-AIA-009-1",
  "severity":         "CRITICAL",
  "title":            "Risk management system",
  "article":          "Article 9(1)",
  "requirement_type": "document",
  "explanation":      "You indicated no risk management system exists...",
  "fix":              "Create a risk register documenting known risks...",
  "evidence_required": "A documented risk management system covering: identification of known risks...",
  "effective_date":   "2026-08-02",
  "already_in_force": false,
  "jurisdiction":     "EU",
  "partial":          false,
  "certainty":        "established",
  "certainty_note":   null
}
```

### Confidence score

```
Score = 100 − Σ(gap_deduction × certainty_weight × partial_multiplier)

Deductions:
  CRITICAL gap:  −15 points
  HIGH gap:       −8 points
  MEDIUM gap:     −3 points

Certainty weights:
  established:       1.0
  interpretive:      0.7
  pending_guidance:  0.4
  delegated_act:     0.3
  contested:         0.5

Partial gaps (partial: true): deduction × 0.5
Score floor: 0

Score shown per law and as overall. Current violations shown separately.
```

---

## Part 4 — Streaming to the Dashboard

```
POST /api/v1/assess → creates assessment record → returns assessmentId
GET  /api/v1/stream/:assessmentId → SSE stream

Claude streaming API
    ↓
Parse stream for tool_use content blocks
    ↓
Extract each completed gap object as tool_input accumulates
    ↓
SSE event: data: {"type":"gap","gap":{...}}
    ↓
Frontend: GapCard animates in
    ↓
Compliance score updates in real time
    ↓
Stream complete: data: {"type":"complete","summary":{...}}
```

Current violations (effective_date in the past) stream first with `already_in_force: true`. Frontend renders "Current violation" badge on these gaps.

---

## Part 5 — LLM Abstraction Layer

No business logic hardcodes a specific LLM provider. All calls route through `backend/ai/llmClient.js`:

```javascript
// Model routing per task — configured via env vars, overridable at call time
const MODEL_ROUTING = {
  ingestion:      process.env.LLM_INGESTION      || 'claude-opus-4-7',
  classification: process.env.LLM_CLASSIFICATION || 'claude-haiku-4-5-20251001',
  assessment:     process.env.LLM_ASSESSMENT     || 'claude-sonnet-4-6',
  narrative:      process.env.LLM_NARRATIVE      || 'claude-sonnet-4-6',
  qa:             process.env.LLM_QA             || 'claude-haiku-4-5-20251001',
}
```

| Task | Default model | Rationale |
|---|---|---|
| Law ingestion | claude-opus-4-7 | Run rarely — pay for best extraction quality |
| Classification | claude-haiku-4-5-20251001 | Fast, cheap, task is straightforward |
| Compliance reasoning | claude-sonnet-4-6 | Core product — quality reasoning |
| PDF narrative | claude-sonnet-4-6 | Quality prose |
| Follow-up Q&A (V2) | claude-haiku-4-5-20251001 | High frequency — optimise for cost |

From V1.1: OpenAI GPT-4o added as alternative for classification and assessment. From V2: Gemini 1.5 Pro evaluated for ingestion (1M context window).

---

## Part 6 — Follow-Up Q&A with RAG (V2)

After seeing their gap analysis, users ask free-text follow-up questions. Rules are embedded and stored in Pinecone per category + jurisdiction. User question is embedded → top-K rules retrieved → Claude answers grounded in the source.

RAG belongs here and not in the core compliance check because this is a retrieval task (find relevant rules for a specific question), not an exhaustive evaluation task.

```
User: "What exactly counts as a bias audit under Article 10 for hiring AI?"
    ↓
Embed question → query Pinecone (filtered by category, jurisdiction)
    ↓
Retrieve top-5 relevant rule chunks
    ↓
Claude answers with exact article citations from retrieved chunks
```

---

## Part 7 — Self-Declaration and Report Integrity

Every report carries the following on each resolved gap:

> "Self-declared by [company] on [date]. Evidence not verified by ComplyAI."

And a full disclaimer block:

> This report is not legal advice. It was produced by an AI system based on rules extracted from published legal texts. It does not constitute a conformity assessment, compliance certification, or legal opinion. Resolved gaps are based entirely on user self-declaration. ComplyAI has not verified the existence or adequacy of underlying evidence. Consult qualified legal counsel before making compliance decisions or sharing this report with regulators. This report was assessed against [law name] [version] effective [date]. Changes after this date are not reflected.

---

## Codebase map

```
complyai/
├── rules/
│   └── eu_ai_act/
│       └── 2024.08.01/
│           ├── employment_hiring.json       ~88 rules
│           ├── education.json               ~70 rules
│           ├── essential_services.json      ~80 rules
│           └── ...
│
├── backend/
│   ├── engine/
│   │   ├── ingestor.js         PDF → Claude → validate → versioned PostgreSQL + JSON
│   │   └── classifier.js       Free text → Claude → Annex III + role + jurisdiction
│   │
│   ├── ai/
│   │   ├── llmClient.js        LLM abstraction layer — model routing, provider switching
│   │   ├── claudeClient.js     Anthropic SDK — streaming + tool use
│   │   ├── tools.js            classify_system, report_compliance_gaps, extract_compliance_rules
│   │   └── prompts.js          Prompt templates per task
│   │
│   ├── engine/
│   │   ├── scorer.js           Confidence score calculation with certainty weighting
│   │   └── prohibitedCheck.js  Article 5 signal detection
│   │
│   ├── pdf/
│   │   └── reportGenerator.js  PDFKit — 9-section report with self-declaration caveats
│   │
│   └── api/v1/
│       ├── classify.js         POST /api/v1/classify
│       ├── intake.js           POST /api/v1/intake
│       ├── assess.js           POST /api/v1/assess
│       ├── stream.js           GET  /api/v1/stream/:id  (SSE)
│       ├── report.js           GET  /api/v1/report/:id
│       ├── workspace.js        GET  /api/v1/workspace/:systemId
│       ├── ingest.js           POST /api/v1/ingest  (admin, internal)
│       └── pdf.js              GET  /api/v1/pdf/:id
│
└── frontend/
    ├── pages/
    │   ├── index.js                Landing — describe your AI
    │   ├── intake.js               Role-specific intake form
    │   ├── dashboard.js            Streaming gap analysis
    │   ├── workspace/[id].js       Compliance workspace
    │   └── report/[id].js          Shareable read-only report
    │
    └── components/
        ├── StreamingDashboard.js   Renders gaps as SSE events arrive
        ├── GapCard.js              Severity, type badge, citation, fix, current-violation flag
        ├── ComplianceScore.js      Per-law + overall, certainty note
        ├── ProhibitedAIWarning.js  Article 5 stop-sign UI
        └── WorkspacePanel.js       Live gap list, audit history, law version status
```

---

## Legal defensibility

**Claude never invents citations** — every gap must reference a `rule_id` from the JSON passed in the prompt. Tool use enforces typed output.

**Rules are version-controlled** — `rules/{law-slug}/{version-tag}/{category}.json` files are in git. Every AI-extracted update is a git diff a human can review before production.

**Human review gate** — ingestion logs every Claude response. A human reviews extracted rules before any `law_version` is promoted from `draft` to `active`.

**Structured output only** — tool use forces typed, machine-readable JSON. No ambiguous prose in the gap list.

**Self-declaration transparency** — every resolved gap in every report is labelled as self-declared. Never omitted. Not buried in a footnote.

**Disclaimer gate** — no report generated without the full disclaimer block reviewed by legal counsel.
