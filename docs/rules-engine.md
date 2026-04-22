# ComplyAI — AI Architecture
## Universal EU AI Act compliance checker — all 8 High Risk categories

---

## Overview

ComplyAI is AI-first. Claude ingests raw legal documents, extracts structured rules, reasons across them with tool use, and streams the gap analysis to the dashboard in real time. The system covers all 8 High Risk categories defined in Annex III of the EU AI Act — approximately 543 rules across the full regulation.

The architecture has four layers:

1. **Law ingestion** — Claude reads the EU AI Act PDF once per category and extracts structured rules
2. **Category classification** — Claude determines which Annex III category the user's system falls under
3. **Compliance reasoning** — Claude reasons across all relevant rules using tool use and returns structured gaps
4. **Output** — gaps stream to dashboard in real time, Claude writes the PDF narrative

---

## Part 1 — Law Ingestion (Claude reads the PDF)

### What it is

Claude ingests the full EU AI Act PDF (144 pages) and extracts all obligations for each Annex III category. This is done once per category and the results are stored in PostgreSQL and exported to the `rules/` directory. Rules are AI-extracted — not hardcoded by engineers.

### Ingestion prompt (per category)

```
You are a legal AI specialist analysing the EU AI Act.

Extract every compliance obligation that applies to HIGH RISK AI systems 
under Annex III, [SECTION] — [CATEGORY NAME].

For each obligation extract:
- id: unique identifier in format EU-AIA-[article]-[clause] 
- article: exact citation (e.g. "Article 14(4)(d)")
- title: short plain English title
- category: the Annex III category name
- annex_section: e.g. "Section 4(a)"
- severity: CRITICAL, HIGH, or MEDIUM
- applies_to: array of "provider", "deployer", or both
- requirement: the obligation in plain English (1-2 sentences)
- non_compliance_signal: what a non-compliant company would be missing
- fix: concrete actionable recommendation
- deadline: "2026-08-02" for most high-risk systems
- related_articles: array of articles that interact with this one

Only extract obligations that create specific duties for this category.
Do not include general recitals or provisions with no specific obligation.
Return as a JSON array.
```

### Rule schema

```json
{
  "id": "EU-AIA-014-4-d",
  "article": "Article 14(4)(d)",
  "title": "Human override mechanism",
  "category": "employment_hiring",
  "annex_section": "Section 4(a)",
  "severity": "CRITICAL",
  "applies_to": ["provider", "deployer"],
  "jurisdiction": "EU",
  "requirement": "A designated natural person must be able to disregard, override, or reverse the output of the AI system.",
  "non_compliance_signal": "No human override mechanism exists or is documented",
  "fix": "Assign a named role with explicit authority to override any AI recommendation. Build a UI control that logs every override decision.",
  "deadline": "2026-08-02",
  "related_articles": ["Article 9", "Article 12"]
}
```

### Rules by category (~543 total)

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

All 543 rules come from the same 144-page document. Claude ingests it once per category. Adding a new jurisdiction (NYC LL144, UK AI Framework) means feeding Claude another document — not engineering time.

---

## Part 2 — Category Classification (Claude classifies the user's system)

### What it is

The intake form starts with a free-text description of the user's AI system. Claude determines which Annex III category it falls under — the user never needs to know what Annex III is.

### Classification prompt

```
You are an EU AI Act specialist.

The user has described their AI system as follows:
"[USER'S FREE TEXT DESCRIPTION]"

Your job:
1. Determine which Annex III High Risk category this system falls under
2. Determine whether the Article 6(3) exemption might apply
3. Identify whether the user is likely a provider, deployer, or both
4. Return structured classification using the classify_system tool

Base your classification only on Annex III categories:
- Section 1: Biometric identification and categorisation
- Section 2: Critical infrastructure management
- Section 3: Education and vocational training
- Section 4: Employment, workers management, self-employment
- Section 5: Essential private and public services
- Section 6: Law enforcement
- Section 7: Migration, asylum, border control
- Section 8: Administration of justice and democratic processes

If the system does not fall under any category, return NOT_IN_SCOPE.
```

### Classification tool definition

```javascript
{
  name: "classify_system",
  input_schema: {
    type: "object",
    properties: {
      annex_section:       { type: "string" },
      category:            { type: "string" },
      risk_level:          { type: "string", enum: ["HIGH_RISK", "LIMITED_RISK", "MINIMAL_RISK", "NOT_IN_SCOPE"] },
      exemption_possible:  { type: "boolean" },
      likely_role:         { type: "string", enum: ["provider", "deployer", "both"] },
      classification_basis:{ type: "string" },
      follow_up_questions: { type: "array", items: { type: "string" } }
    }
  }
}
```

---

## Part 3 — Compliance Reasoning (Claude with Tool Use)

### What it is

Claude receives the user's intake answers and all rules for their specific category (filtered from PostgreSQL by `annex_section` and `role`). Claude reasons across all rules simultaneously and calls the `report_compliance_gaps` tool to return structured JSON — never prose.

### Rule filtering (before sending to Claude)

```sql
SELECT * FROM rules
WHERE annex_section = $1          -- e.g. 'Section 4(a)'
  AND (
    applies_to @> '["provider"]'  -- if user is provider
    OR applies_to @> '["deployer"]' -- if user is deployer
  )
ORDER BY severity DESC
```

At MVP scale (88 rules, ~15k tokens) the full filtered set fits in Claude's context window. At V3 scale (500+ rules across jurisdictions) SQL filtering keeps the context manageable.

### Reasoning prompt

```
You are a compliance analyst specialising in the EU AI Act.

SYSTEM CLASSIFICATION:
Category: [CATEGORY]
Annex III Section: [SECTION]
Risk level: HIGH_RISK
User role: [PROVIDER / DEPLOYER / BOTH]
Jurisdictions: [LIST]
Compliance deadline: [DATE]

INTAKE ANSWERS:
[Structured answers from intake form]

APPLICABLE RULES:
[Full filtered rules JSON injected here]

Your job:
1. Evaluate each rule against the intake answers
2. For "not sure" answers — treat as a gap, flag partial: true
3. Assess severity honestly — do not soften CRITICAL gaps
4. Identify interactions between rules (e.g. Art 9 and Art 10 both require risk management)
5. Call report_compliance_gaps with your complete findings

Every gap must cite a rule_id from the rules provided.
Never cite an article not in the rules list.
```

### Tool definition

```javascript
{
  name: "report_compliance_gaps",
  input_schema: {
    type: "object",
    properties: {
      risk_level:            { type: "string" },
      classification_basis:  { type: "string" },
      deadline:              { type: "string" },
      compliance_score:      { type: "integer", minimum: 0, maximum: 100 },
      gaps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            rule_id:     { type: "string" },
            severity:    { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM"] },
            title:       { type: "string" },
            article:     { type: "string" },
            explanation: { type: "string" },
            fix:         { type: "string" },
            partial:     { type: "boolean" },
            role:        { type: "string", enum: ["provider", "deployer", "both"] }
          },
          required: ["rule_id", "severity", "title", "article", "explanation", "fix"]
        }
      },
      passed: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["risk_level", "classification_basis", "deadline", "compliance_score", "gaps", "passed"]
  }
}
```

---

## Part 4 — Streaming to the Dashboard

Gap analysis is streamed to the dashboard in real time via Server-Sent Events (SSE). Gaps appear one by one as Claude identifies them. The AI is visible — users watch it work.

```
Backend: Claude streaming response parsed for tool_use events
       ↓
SSE endpoint pushes each gap as it is identified
       ↓
Frontend: GapCard components animate in one by one
       ↓
Compliance score updates in real time
       ↓
Final summary rendered when stream completes
```

---

## Part 5 — Follow-Up Q&A with RAG (V2)

After seeing their gap analysis, users ask free-text follow-up questions. Rules are embedded and stored in Pinecone per category. User question is embedded, relevant chunks retrieved, Claude answers grounded in the source.

```
User: "What exactly counts as a bias audit under Article 10 for credit scoring AI?"
       ↓
Embed question → query Pinecone (filtered by category: essential_services)
       ↓
Retrieve top 5 relevant rule chunks
       ↓
Send chunks + question to Claude
       ↓
Claude answers with exact article citations from retrieved chunks
```

---

## Part 6 — Multi-Jurisdiction Conflict Detection (V3)

When a company operates across EU + NYC + Illinois, Claude reasons across all frameworks simultaneously:

- Where requirements overlap → satisfy once, compliant everywhere
- Where requirements conflict → flags the stricter requirement
- Jurisdiction-specific deadlines → compliance timeline per law

---

## End to End Flow

```
LAW INGESTION (once per category)
EU AI Act PDF → Claude → ~543 rules → PostgreSQL + rules/*.json

                         ↓

USER DESCRIBES THEIR AI SYSTEM (free text)
              ↓
┌─────────────────────────────┐
│  CLAUDE CLASSIFICATION       │  classify_system tool
│                             │  → Annex III category
│  "resume screening tool"    │  → risk level
│  → Section 4(a), HIGH_RISK  │  → role (provider/deployer)
└──────────┬──────────────────┘
           ↓
INTAKE FORM (category-specific questions)
           ↓
┌─────────────────────────────┐
│  SQL RULE FILTER             │  WHERE annex_section = '4(a)'
│                             │  AND applies_to includes role
│  ~543 rules → ~88 rules     │  ORDER BY severity DESC
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  CLAUDE REASONING            │  intake answers + filtered rules
│  with tool use               │  → report_compliance_gaps()
│                             │  → structured gap list JSON
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  STREAMING SSE               │  gaps stream to dashboard
│                             │  one by one in real time
│                             │  compliance score updates live
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  DASHBOARD + PDF             │  React renders gap cards
│                             │  PDFKit assembles report
│                             │  Claude writes narrative
└──────────┬──────────────────┘
           ↓ (V2)
┌─────────────────────────────┐
│  FOLLOW-UP Q&A (RAG)         │  Pinecone retrieves chunks
│                             │  Claude answers with citations
└─────────────────────────────┘
```

---

## Codebase map

```
complyai/
├── rules/
│   ├── eu_ai_act_employment.json       ← Category 1 (MVP)
│   ├── eu_ai_act_education.json        ← Category 2
│   ├── eu_ai_act_essential_services.json
│   ├── eu_ai_act_biometric.json
│   ├── eu_ai_act_infrastructure.json
│   ├── eu_ai_act_law_enforcement.json
│   ├── eu_ai_act_migration.json
│   └── eu_ai_act_justice.json
│
├── backend/
│   ├── engine/
│   │   ├── ingestor.js         ← Sends PDF to Claude, stores extracted rules
│   │   └── classifier.js       ← Claude classifies user's system into Annex III category
│   │
│   ├── ai/
│   │   ├── claudeClient.js     ← Anthropic SDK — streaming + tool use
│   │   ├── tools.js            ← Tool definitions: classify_system, report_compliance_gaps
│   │   └── prompts.js          ← All prompt templates per category
│   │
│   ├── pdf/
│   │   └── reportGenerator.js  ← PDFKit — gap list + Claude narrative
│   │
│   └── api/
│       ├── intake.js           ← POST /api/intake
│       ├── classify.js         ← POST /api/classify
│       ├── report.js           ← GET /api/report/:id
│       ├── stream.js           ← GET /api/stream/:id (SSE)
│       ├── chat.js             ← POST /api/chat (V2 RAG Q&A)
│       └── pdf.js              ← GET /api/pdf/:id
│
└── frontend/
    ├── pages/
    │   ├── index.js            ← Landing — describe your AI
    │   ├── intake.js           ← Category-specific intake form
    │   ├── dashboard.js        ← Streaming gap analysis
    │   └── report/[id].js      ← Shareable report
    │
    └── components/
        ├── CategorySelector.js     ← AI classifies system from free text
        ├── StreamingDashboard.js   ← Renders gaps as SSE stream arrives
        ├── GapCard.js              ← Individual gap with role badge
        ├── RiskBadge.js            ← HIGH-RISK badge + Annex III section
        ├── ComplianceScore.js      ← Live score updating during stream
        └── DownloadButton.js       ← PDF generation trigger
```

---

## Legal defensibility

**Claude never invents citations** — every gap must reference a `rule_id` from the JSON passed in the prompt. Tool use enforces typed output.

**Rules are version-controlled** — `rules/*.json` files are in git. Every AI-extracted update is tracked and reviewable.

**Human review gate** — law ingestion logs every Claude response. A human reviews extracted rules before publishing to production.

**Structured output only** — tool use forces typed, machine-readable JSON. No ambiguous prose in the gap list.
