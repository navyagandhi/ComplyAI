# ComplyAI — Tech Stack

## Product vision
Universal EU AI Act compliance checker for all 8 High Risk AI categories defined in Annex III. ~543 rules extracted by Claude from the same 144-page document. Same architecture across every category — Claude ingests, reasons, streams, explains.

## Architecture philosophy
AI-first. Claude does the legal reasoning. Rules are not hardcoded — Claude reads raw legal documents and extracts structured obligations. Adding a new category or jurisdiction means feeding Claude a document, not engineering time.

---

## AI Layer

### Claude API (Anthropic) — the core engine
Five distinct jobs:

| Job | What Claude does |
|---|---|
| **Law ingestion** | Reads EU AI Act PDF, extracts ~543 rules across 8 categories as structured JSON |
| **System classification** | Reads user's free-text description, determines Annex III category via `classify_system` tool |
| **Compliance reasoning** | Reads intake answers + filtered rules, identifies gaps via `report_compliance_gaps` tool use |
| **Streaming output** | Streams gap analysis to dashboard in real time — AI is visible, not hidden behind a spinner |
| **Narrative generation** | Writes executive summary, gap explanations, and PDF narrative per user — no templates |

### Pinecone (vector database) — V2 only
Used exclusively for follow-up Q&A after gap analysis. ~543 rules embedded per category. User asks free-text question → Pinecone retrieves relevant chunks → Claude answers with citations. Not used for primary compliance reasoning — SQL filtering handles that.

---

## Frontend
- **Next.js 14** — routing, API layer, SSR
- **React 18** — component model
- **Tailwind CSS** — styling with custom severity colours (CRITICAL/HIGH/MEDIUM)
- **Server-Sent Events** — Claude streams gap analysis to dashboard in real time

## Backend
- **Node.js + Express** — compliance API
- **PostgreSQL** — users, intakes, reports, AI-extracted rules (all 543, tagged by category)
- **Anthropic SDK** — Claude client with streaming and tool use
- **PDFKit** — audit report generation, runs in-process

## Deployment
- **Vercel** — Next.js frontend
- **Railway or Render** — Node.js backend + PostgreSQL
- **Pinecone** — managed vector DB (V2)

---

## Scale

| Stage | Rules | Categories | RAG needed |
|---|---|---|---|
| MVP | ~88 | 1 (Employment) | No — fits in context window |
| V2 | ~238 | 3 (+ Education, Finance) | Yes — follow-up Q&A only |
| V3 | ~543 | All 8 | Yes — full retrieval pipeline |
| V3+ | 543+ | All 8 + US jurisdictions | Yes — cross-jurisdiction RAG |

---

## Phased rollout

### MVP — Employment & Hiring (ship now)
- Claude ingests EU AI Act → extracts ~88 rules for Section 4(a)
- Claude classifies user's system from free text
- Claude reasons over intake + rules via tool use → structured gaps
- Claude streams gap analysis via SSE
- Claude writes PDF narrative
- No Pinecone — 88 rules fit in context window

### V1.1 — Education & Training (sprint 2)
- Claude extracts ~70 rules for Section 3
- New intake path for education AI
- Same reasoning pipeline, new category filter

### V1.2 — Essential Services / Finance (sprint 3)
- Claude extracts ~80 rules for Section 5
- Largest commercial opportunity — fintech and insurtech
- Bias testing + financial model documentation requirements

### V2 — Categories 4–5 + RAG Q&A
- Biometric identification + Critical infrastructure
- Add Pinecone for follow-up Q&A across all categories
- ~300 rules total — SQL filtering keeps context manageable

### V3 — All 8 categories + US jurisdictions
- Law enforcement, migration, justice
- Add NYC LL144, Illinois, Colorado
- Full RAG pipeline for 500+ rules
- Multi-jurisdiction conflict detection

---

## Repository structure
```
complyai/
├── frontend/         Next.js / React / Tailwind
├── backend/
│   ├── engine/       Law ingestion + system classification
│   ├── ai/           Claude client, tool definitions, prompts, streaming
│   ├── pdf/          PDFKit report generator
│   ├── api/          Express routes (intake, classify, report, stream, pdf, chat)
│   └── db/           PostgreSQL queries
├── rules/            AI-extracted rules JSON — one file per category
├── docs/             Team documentation
├── design/           Figma links
└── infra/            Docker, DB schema, env templates
```

---

## What this demonstrates as an AI project

| Capability | Implementation |
|---|---|
| Document understanding | Claude ingests 144-page legal PDF, extracts structured rules |
| System classification | Claude classifies user's AI from free text into Annex III category |
| Legal reasoning | Claude reasons across 88–543 rules simultaneously |
| Structured output | Tool use / function calling — machine-readable JSON guaranteed |
| Real-time AI | SSE streaming — gaps appear on dashboard as Claude identifies them |
| RAG | Pinecone + Claude for follow-up Q&A (V2) |
| Multi-document reasoning | Cross-jurisdiction conflict detection (V3) |
| Scalability | Same architecture covers all 8 categories and any future jurisdiction |
