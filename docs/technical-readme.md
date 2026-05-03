# ComplyAI

> Know your compliance gaps in under 5 minutes. Know your status at any time. Never be surprised by a regulator.

ComplyAI is the compliance operating system for companies building or deploying AI in high-risk industries. It ingests raw legal documents using AI, classifies your system, identifies whether it might be prohibited before assuming it is merely High Risk, tells you exactly what you need to fix based on your role, tracks your progress, and alerts you when the law changes.

**EU AI Act deadlines are not all in the future. Some laws are already in force today.**

---

## The problem

Companies are deploying AI systems that make decisions affecting real people — who gets a job interview, who gets into university, who gets a loan. Most of these companies:

- Do not know if their AI is legally High Risk or prohibited
- Have not audited their model for bias
- Cannot trace how individual decisions were made
- Do not know which obligations are already in force (NYC LL144 has been law since July 2023)
- Do not know if they are a provider (built it) or a deployer (use someone else's), which determines fundamentally different obligation sets

The EU AI Act changes this. Fines up to €30M or 6% of global revenue. Mandatory bias audits. Mandatory human oversight. Mandatory audit trails.

Most companies building AI have no idea what they need to do. ComplyAI tells them — in plain English, in under 5 minutes.

---

## How it works

### 1. Describe your AI system
Free text. Claude classifies it into the correct Annex III High Risk category and determines your role (provider / deployer / edge cases).

### 2. Prohibited AI check first
Before any compliance checklist, Claude checks for Article 5 prohibited uses. If your system may be banned in the EU: stop sign, warning, recommend legal counsel. No gap list generated.

### 3. Classification review
You see: Annex III category, your role, which jurisdictions apply, and which laws are already in force for you. You can challenge before proceeding.

### 4. Answer 9–14 questions
Role-specific. Jurisdiction-aware. No legal jargon. "Not sure" triggers guided follow-up — never just flags a gap.

### 5. Watch Claude identify your gaps in real time
Claude receives intake answers + all applicable rules. It reasons across them using tool use and streams the gap analysis to the dashboard. Current violations stream first with "Current violation" badge.

### 6. Compliance workspace
Live gap list · Per-law confidence scores · Required actions typed with badges (DOCUMENT / TEST / PROCESS / DISCLOSURE / REGISTRATION / CONTRACT) · Law version status · Stale alerts when law updates

### 7. Download your audit report PDF
Every gap includes the exact article citation, plain English explanation, what to produce, and the deadline. Self-declaration caveats on every resolved gap. Full disclaimer block. Share with your customer, investor, or regulator.

---

## Architecture

```
EU AI Act PDF (144 pages) + NYC LL144 PDF + ...
        ↓
Claude ingests → SHA-256 hash check → extract rules → human review gate
→ versioned law_versions table + rules/{law}/{version}/{category}.json
        ↓
User describes their AI system (free text)
        ↓
Claude: Article 5 prohibited AI check first → if flagged: STOP
        ↓
Claude: classify_system tool
  → Annex III category + role (incl. edge cases) + jurisdictions + effective dates
        ↓
User reviews and confirms classification
        ↓
Role-specific intake form (9–14 questions)
        ↓
SQL: filter rules by category × role × jurisdiction WHERE valid_until IS NULL
(deterministic, exhaustive — NOT RAG)
        ↓
Claude: report_compliance_gaps tool (streaming via SSE)
  → current violations first → then by deadline
        ↓
Compliance workspace: per-law scores · typed action checklist · law version status
        ↓
PDFKit + Claude narrative → 9-section audit report with self-declaration caveats
        ↓ (V2)
Pinecone embeddings → follow-up Q&A → Claude answers with citations
```

### Why tool use matters
Claude returns structured JSON via function calling — not prose. The `rule_id` in every gap must match a rule from the JSON passed in the prompt. Claude cannot hallucinate a citation that does not exist in the dataset. Guaranteed structured output. Every time.

### Why SQL filtering matters
RAG retrieves the most semantically similar chunks. For compliance, you need Claude to check every applicable rule exhaustively. If RAG missed 10 rules below a similarity threshold, the user gets a falsely clean score. SQL filtering is deterministic and exhaustive — the right approach for core compliance checking.

### Why streaming matters
Users watch Claude identify gaps in real time. The AI is not a black box behind a loading spinner. Current violations appear first — companies see what they're already violating today.

---

## Laws in scope

| Law | Jurisdiction | Status | In ComplyAI |
|---|---|---|---|
| EU AI Act — Art 5 prohibited uses | EU | In force Feb 2025 | MVP |
| EU AI Act — Hiring AI (Art 9–49) | EU | Deadline Aug 2026 | MVP |
| NYC Local Law 144 | US-NY | In force July 2023 | V1.2 |
| Illinois AI Video Interview Act | US-IL | In force 2020 | V1.2 |
| California AB 2930 | US-CA | **Died** — Senate Nov 2024 | N/A — monitor for successor |
| Colorado SB 205 | US-CO | In force Feb 2026 | V3.0 |
| EU AI Act — all 8 categories | EU | Deadline Aug 2026 | V3.1 |

---

## Tech stack

| Layer | Technology |
|---|---|
| AI reasoning | Claude API (Anthropic) with tool use + streaming |
| LLM abstraction | `llmClient.js` — model routing per task, provider switching |
| Law ingestion | Claude API — PDF → versioned structured rules |
| Frontend | Next.js 14 + React 18 + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL — law_versions, rules, prohibited_uses, ai_systems, reports, stale_alerts |
| Vector DB | Pinecone (V2 — follow-up Q&A only) |
| PDF | PDFKit |
| Deployment | Vercel (frontend) + Railway (backend + DB) |

---

## Repository structure

```
complyai/
├── frontend/
│   ├── pages/
│   │   ├── index.js              Landing — describe your AI
│   │   ├── intake.js             Role-specific intake form
│   │   ├── dashboard.js          Streaming gap analysis
│   │   ├── workspace/[id].js     Compliance workspace
│   │   └── report/[id].js        Shareable read-only report
│   └── components/
│       ├── StreamingDashboard.js Gap cards, SSE stream consumer
│       ├── GapCard.js            Severity · type badge · citation · current-violation flag
│       ├── ComplianceScore.js    Per-law + overall, updates live
│       ├── ProhibitedAIWarning.js Article 5 stop-sign UI
│       └── WorkspacePanel.js     Audit history, law version status
│
├── backend/
│   ├── engine/
│   │   ├── ingestor.js           PDF → Claude → validate → versioned rules → PostgreSQL
│   │   ├── classifier.js         Free text → Claude → Annex III + role + prohibited check
│   │   ├── scorer.js             Confidence score with certainty weighting
│   │   └── prohibitedCheck.js    Article 5 signal detection
│   ├── ai/
│   │   ├── llmClient.js          LLM abstraction layer — model routing
│   │   ├── claudeClient.js       Anthropic SDK — streaming + tool use
│   │   ├── tools.js              classify_system, report_compliance_gaps, extract_compliance_rules
│   │   └── prompts.js            Prompt templates per task
│   ├── pdf/
│   │   └── reportGenerator.js    9-section PDF with self-declaration caveats + disclaimer
│   └── api/v1/
│       ├── classify.js           POST /api/v1/classify
│       ├── intake.js             POST /api/v1/intake
│       ├── assess.js             POST /api/v1/assess
│       ├── stream.js             GET  /api/v1/stream/:id (SSE)
│       ├── report.js             GET  /api/v1/report/:id
│       ├── workspace.js          GET  /api/v1/workspace/:systemId
│       ├── ingest.js             POST /api/v1/ingest (admin, internal)
│       └── pdf.js                GET  /api/v1/pdf/:id
│
├── rules/
│   └── eu_ai_act/
│       └── 2024.08.01/
│           ├── employment_hiring.json   ~88 rules
│           ├── education.json           ~70 rules
│           └── ...
│
├── infra/db/schema.sql          Full PostgreSQL schema
├── docs/                        Full product and architecture documentation
├── .env.example                 Required environment variables
└── docker-compose.yml           Local PostgreSQL via Docker
```

---

## Getting started locally

### Prerequisites
- Node.js 20+
- Docker (for local PostgreSQL)
- Anthropic API key

### Setup

```bash
git clone https://github.com/navyagandhi/ComplyAI.git
cd ComplyAI

cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

docker-compose up -d

cd frontend && npm install
cd ../backend && npm install

cd .. && npm run dev
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:4000`  
Health check: `http://localhost:4000/health`

---

## Environment variables

```bash
# Required
ANTHROPIC_API_KEY=          # Anthropic API key — console.anthropic.com
DATABASE_URL=               # PostgreSQL connection string
NEXTAUTH_SECRET=            # Random secret for auth sessions
NEXTAUTH_URL=               # e.g. http://localhost:3000

# LLM model routing (all optional — defaults shown)
LLM_INGESTION=claude-opus-4-7
LLM_CLASSIFICATION=claude-haiku-4-5-20251001
LLM_ASSESSMENT=claude-sonnet-4-6
LLM_NARRATIVE=claude-sonnet-4-6

# Optional (V2)
PINECONE_API_KEY=           # Pinecone for follow-up Q&A
PINECONE_INDEX=

# App
NODE_ENV=development
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4000
ADMIN_API_KEY=              # For POST /api/v1/ingest (internal use)
```

---

## Critical product integrity constraints

| Constraint | Rule |
|---|---|
| **Self-declaration caveat** | Every resolved gap in the report is labelled "Self-declared by [company] on [date]. Evidence not verified by ComplyAI." Never omitted. |
| **Prohibited AI gate** | Article 5 check runs before every classification. If flagged: stop-sign UI, no gap list, no score. |
| **Current violations** | Gaps where effective_date is in the past render with "Current violation" badge. Never as future risks. |
| **Disclaimer gate** | No report generated without full disclaimer reviewed by legal counsel. |
| **Hallucination prevention** | Every gap cites a rule_id from the rules JSON passed to Claude. Tool use enforces this. |
| **Ingestion review gate** | No law version promoted from draft to active without human review. |
| **Versioned reports** | Every report permanently linked to the exact law version it was assessed against. |

---

## Roadmap

| Version | Scope |
|---|---|
| **MVP** | EU AI Act hiring, streaming gaps, PDF report, prohibited AI check, self-declaration caveats |
| **V1.0** | Law versioning, confidence score with certainty discounting, disclaimer gate, effective date timeline |
| **V1.1** | Provider/deployer edge cases, vendor contract gaps, OpenAI alternative provider |
| **V1.2** | NYC LL144 + Illinois AIVA, multi-jurisdiction intake, per-law scoring |
| **V2.0** | Compliance workspace, stale alerts, shareable link, audit history |
| **V2.1** | Evidence upload + Claude coverage check |
| **V2.2** | Follow-up Q&A with RAG (Pinecone) |
| **V3.0** | CO SB 205, EEOC guidance, EU AI Act categories 2–3; monitor CA for AB 2930 successor |
| **V3.1** | All 8 EU AI Act categories |
| **V4.0** | API access, team collaboration, vendor compliance directory |

---

## Why this matters

When a hiring AI rejects women at twice the rate it rejects men, nobody knows why.  
When an education AI only admits students of one background, nobody can prove it.  
When a credit scoring AI denies loans to minorities disproportionately, nobody is accountable.

ComplyAI creates accountability before the harm compounds. Not after the lawsuit. Not after the regulator. Before.

The EU AI Act gives us the legal framework.  
The August 2026 deadline gives us the urgency.  
The 543 rules give us the product.

---

## License
MIT
