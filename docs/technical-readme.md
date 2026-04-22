# ComplyAI

> Find out exactly what your AI system needs to fix to comply with the EU AI Act — in under 5 minutes.

ComplyAI is an AI-first compliance checker for every company building or deploying a High Risk AI system. It covers all 8 High Risk categories defined in Annex III of the EU AI Act — hiring, education, finance, biometrics, infrastructure, law enforcement, migration, and justice.

Claude ingests the raw legal documents. Claude reasons across the rules. Claude streams the gap analysis to your dashboard in real time. No hardcoded logic. No generic templates. No lawyers required.

---

## The problem

Companies are deploying AI systems that make decisions affecting real people — who gets a job interview, who gets into university, who gets a loan. Most of these companies:

- Do not know if their AI is legally classified as High Risk
- Have not audited their model for bias
- Cannot trace how individual decisions were made
- Do not know who is accountable if something goes wrong

The EU AI Act changes this. Fines up to €30 million or 6% of global revenue. Mandatory bias audits. Mandatory human oversight. Mandatory audit trails. Deadline: **2 August 2026.**

Most companies building AI have no idea what they need to do. ComplyAI tells them.

---

## How it works

### 1. Describe your AI system
The user describes their AI in plain English. Claude classifies it into the correct Annex III High Risk category using the `classify_system` tool.

### 2. Answer 5 questions
A short intake form — plain language, no legal jargon, under 3 minutes.

### 3. Watch Claude identify your gaps in real time
Claude receives the intake answers and all applicable rules. It reasons across them using tool use and streams the gap analysis to the dashboard. Gaps appear one by one as Claude identifies them.

### 4. Download your audit report PDF
Every gap includes the exact article citation, a plain English explanation, and a concrete fix recommendation. Download the PDF and share it with your customer, investor, or regulator.

---

## Architecture

ComplyAI is AI-first. There is no hardcoded compliance logic. Claude does the reasoning.

```
EU AI Act PDF (144 pages)
        ↓
Claude ingests → extracts ~543 rules → PostgreSQL + rules/*.json

User describes their AI system (free text)
        ↓
Claude classifies → Annex III category + risk level (classify_system tool)

User answers intake form
        ↓
SQL filters rules by category + role (provider / deployer / both)
        ↓
Claude reasons across filtered rules + intake answers
→ report_compliance_gaps tool → structured gap list JSON
        ↓
SSE stream → gaps animate onto dashboard in real time
        ↓
PDFKit assembles audit report → Claude writes narrative sections
        ↓ (V2)
User asks follow-up questions → Pinecone retrieves relevant rules → Claude answers with citations
```

### Why tool use matters
Claude returns structured JSON via function calling — not prose. The `rule_id` in every gap must match a rule from the JSON passed in the prompt. Claude cannot hallucinate a citation that does not exist in the dataset. Guaranteed structured output. Every time.

### Why streaming matters
Users watch Claude identify gaps in real time. The AI is not a black box behind a loading spinner. It is visible, working, and fast.

---

## Tech stack

| Layer | Technology |
|---|---|
| AI reasoning | Claude API (Anthropic) with tool use + streaming |
| Law ingestion | Claude API — PDF → structured rules JSON |
| Frontend | Next.js 14 + React 18 + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL — rules, users, intakes, reports |
| Vector DB | Pinecone (V2 — follow-up Q&A) |
| PDF | PDFKit |
| Deployment | Vercel (frontend) + Railway (backend + DB) |

---

## Repository structure

```
complyai/
├── frontend/
│   ├── pages/
│   │   ├── index.js              Landing page — describe your AI
│   │   ├── intake.js             Category-specific intake form
│   │   ├── dashboard.js          Streaming gap analysis dashboard
│   │   └── report/[id].js        Shareable report link
│   └── components/
│       ├── CategorySelector.js   AI classifies system from free text
│       ├── StreamingDashboard.js Renders gaps as SSE stream arrives
│       ├── GapCard.js            Individual gap — severity, citation, fix
│       ├── RiskBadge.js          HIGH-RISK badge + Annex III section
│       ├── ComplianceScore.js    Live score updating during stream
│       └── DownloadButton.js     PDF generation trigger
│
├── backend/
│   ├── engine/
│   │   ├── ingestor.js           PDF → Claude → structured rules → PostgreSQL
│   │   └── classifier.js         Free text → Claude → Annex III category
│   ├── ai/
│   │   ├── claudeClient.js       Anthropic SDK — streaming + tool use
│   │   ├── tools.js              Tool definitions: classify_system, report_compliance_gaps
│   │   └── prompts.js            Prompt templates per category
│   ├── pdf/
│   │   └── reportGenerator.js    PDFKit — gap list + Claude narrative
│   └── api/
│       ├── intake.js             POST /api/intake
│       ├── classify.js           POST /api/classify
│       ├── report.js             GET /api/report/:id
│       ├── stream.js             GET /api/stream/:id (SSE)
│       ├── chat.js               POST /api/chat (V2 RAG Q&A)
│       └── pdf.js                GET /api/pdf/:id
│
├── rules/
│   ├── eu_ai_act_employment.json         ~88 rules — Section 4(a)
│   ├── eu_ai_act_education.json          ~70 rules — Section 3
│   ├── eu_ai_act_essential_services.json ~80 rules — Section 5
│   ├── eu_ai_act_biometric.json          ~75 rules — Section 1
│   ├── eu_ai_act_infrastructure.json     ~55 rules — Section 2
│   ├── eu_ai_act_law_enforcement.json    ~65 rules — Section 6
│   ├── eu_ai_act_migration.json          ~60 rules — Section 7
│   └── eu_ai_act_justice.json            ~50 rules — Section 8
│
├── infra/
│   └── db/schema.sql             PostgreSQL schema
├── docs/                         Full product and architecture documentation
├── .env.example                  Required environment variables
└── docker-compose.yml            Local PostgreSQL via Docker
```

---

## Getting started locally

### Prerequisites
- Node.js 20+
- Docker (for local PostgreSQL)
- Anthropic API key

### Setup

```bash
# Clone the repo
git clone https://github.com/navyagandhi/ComplyAI.git
cd ComplyAI

# Copy env vars
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Start PostgreSQL
docker-compose up -d

# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Run both frontend and backend
cd .. && npm run dev
```

Frontend runs at `http://localhost:3000`
Backend runs at `http://localhost:4000`
Health check: `http://localhost:4000/health`

---

## Environment variables

```bash
# Required
ANTHROPIC_API_KEY=          # Anthropic API key — get from console.anthropic.com
DATABASE_URL=               # PostgreSQL connection string
NEXTAUTH_SECRET=            # Random secret for auth sessions
NEXTAUTH_URL=               # e.g. http://localhost:3000

# Optional (V2)
PINECONE_API_KEY=           # Pinecone for follow-up Q&A RAG
PINECONE_INDEX=             # Pinecone index name

# App
NODE_ENV=development
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## The 8 High Risk categories

All covered by the same architecture. Claude ingestion extracts rules per category. SQL filtering routes each user to the right ruleset.

| # | Category | Annex III | Rules | Status |
|---|---|---|---|---|
| 1 | Employment & hiring | Section 4(a) | ~88 | MVP |
| 2 | Education & training | Section 3 | ~70 | V1.1 |
| 3 | Essential services (finance) | Section 5 | ~80 | V1.2 |
| 4 | Biometric identification | Section 1 | ~75 | V2 |
| 5 | Critical infrastructure | Section 2 | ~55 | V2 |
| 6 | Law enforcement | Section 6 | ~65 | V3 |
| 7 | Migration & border control | Section 7 | ~60 | V3 |
| 8 | Justice & democracy | Section 8 | ~50 | V3 |

---

## Key engineering challenges

**Legal reasoning with zero hallucination risk**
Claude tool use enforces typed structured output. Every gap cites a `rule_id` from the rules JSON passed in the prompt. Claude cannot reference an article that does not exist in the dataset.

**Law ingestion**
Claude reads raw legal PDFs and extracts structured rules. No engineer reads the document. Adding a new jurisdiction = one ingestion prompt run. Output is version-controlled in git and reviewed before production deployment.

**Streaming gap analysis**
Claude's tool use response is parsed incrementally. Each gap is pushed to the frontend via SSE as soon as it is identified. React renders gap cards with animation. Compliance score updates live.

**Legal RAG (V2)**
Standard cosine similarity RAG is not exhaustive enough for compliance. We use rule-level embeddings, metadata filtering by jurisdiction + category, multi-query decomposition, and re-ranking before Claude answers.

---

## Roadmap

| Version | Scope |
|---|---|
| MVP | EU AI Act, employment & hiring, Claude reasoning + streaming |
| V1.1 | Add education & training category |
| V1.2 | Add essential services (finance, insurance, credit) |
| V2 | Add biometrics + infrastructure, follow-up Q&A (RAG + Pinecone) |
| V3 | All 8 categories, US jurisdictions (NYC LL144, Illinois, California) |
| V3+ | Full global, multi-jurisdiction conflict detection, API access |

---

## Contributing

The most valuable areas to contribute right now:

1. **`backend/engine/ingestor.js`** — law ingestion pipeline
2. **`backend/ai/tools.js`** — tool definitions and schema
3. **`backend/api/stream.js`** — SSE streaming endpoint
4. **`frontend/components/StreamingDashboard.js`** — real-time gap rendering
5. **`rules/`** — review and validate AI-extracted rules for accuracy

Read `docs/rules-engine.md` for the full architecture before contributing.

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
