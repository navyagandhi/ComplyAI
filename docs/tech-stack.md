# ComplyAI — Tech Stack

## Architecture philosophy
AI-first. Claude does the legal reasoning. The system does not hardcode rules — it ingests raw legal documents, extracts structure, and reasons across frameworks. This makes ComplyAI demonstrably intelligent and infinitely scalable to new laws.

---

## AI Layer (core)

### Claude API (Anthropic)
The primary intelligence layer. Claude is used for five distinct jobs:

**1. Law ingestion**
Raw legal PDF (EU AI Act, NYC LL144, etc.) is fed to Claude. Claude extracts all obligations relevant to hiring AI, structures them as JSON, classifies severity, and identifies which articles interact. The rules file is an AI output, not a human output. Adding a new jurisdiction means feeding Claude a PDF — not engineering time.

**2. Compliance reasoning with tool use**
Intake answers + extracted rules are sent to Claude. Claude reasons across all rules simultaneously, identifies gaps, assesses partial compliance (not just yes/no), handles edge cases, and returns structured JSON via tool use / function calling. This is the gap analyser.

**3. Streaming output**
Gap analysis is streamed to the dashboard in real time. Gaps appear one by one as Claude identifies them. The AI is visible — users see it reasoning, not just a result appearing after a spinner.

**4. Multi-jurisdiction conflict detection**
When a company operates across EU + NYC + Illinois, Claude reasons across all frameworks simultaneously — flagging overlaps, conflicts, and the strictest requirement across jurisdictions. Not possible with deterministic logic.

**5. Plain English explanations**
Every gap card, risk classification summary, and PDF narrative section is written by Claude, grounded in the extracted rules. No generic templates.

### Pinecone (vector database)
Used exclusively for follow-up Q&A after the gap analysis is shown. Users ask free-text questions:
- "What exactly counts as a bias audit?"
- "We use a third-party model — does that change our obligations?"
- "How long do we need to keep logs under California law?"

Rules are embedded and stored in Pinecone. User question is embedded, relevant rule chunks are retrieved, Claude answers grounded in the source text. This is proper RAG — used only where retrieval is actually needed.

---

## Frontend
- **Next.js 14** — routing, API layer, server-side rendering
- **React 18** — component model
- **Tailwind CSS** — styling
- **Streaming UI** — Claude responses streamed to dashboard in real time via Server-Sent Events

## Backend
- **Node.js + Express** — compliance engine API
- **PostgreSQL** — users, intakes, reports, AI-extracted rules, report history
- **Anthropic SDK** — Claude API client with streaming and tool use support
- **PDFKit** — audit report PDF generation

## PDF generation
**PDFKit** — generates audit report programmatically from structured gap list JSON. Runs in-process, no headless browser overhead.

## Deployment
- **Vercel** — Next.js frontend + API routes
- **Railway or Render** — Node.js backend + PostgreSQL
- **Pinecone** — managed vector DB (cloud, free tier for MVP)

---

## Phased rollout

### MVP — EU AI Act, hiring AI, resume screening
- Claude ingests EU AI Act PDF → extracts 88 rules as structured JSON
- Claude reasons over rules + intake answers → structured gap output via tool use
- Claude streams gap analysis to dashboard in real time
- Claude writes PDF narrative sections
- No RAG yet — 88 rules fit entirely in Claude's context window (~15k tokens)
- Pinecone not needed at this scale

### V2 — Add 3–4 US jurisdictions (~200 rules total)
- Rules stored in PostgreSQL with jurisdiction + use case tags
- SQL filtering narrows ruleset before sending to Claude
- Add Pinecone + follow-up Q&A chat interface
- RAG retrieves relevant rule chunks for free-text questions

### V3 — All global jurisdictions (500+ rules)
- Full RAG pipeline for rule retrieval at scale
- Multi-jurisdiction conflict detection
- Rules that exceed context window chunked and retrieved via Pinecone
- Claude reasons across retrieved chunks + full conversation context

---

## Repository structure
```
complyai/
├── frontend/       Next.js / React / Tailwind
├── backend/        Node.js compliance engine
│   ├── engine/     Law ingestion + compliance reasoning
│   ├── ai/         Claude client, prompts, streaming, tool definitions
│   ├── pdf/        PDFKit report generator
│   ├── api/        Express route handlers
│   └── db/         PostgreSQL queries
├── rules/          AI-extracted rules JSON (output of law ingestion)
├── docs/           Team documentation
├── design/         Figma links and assets
└── infra/          Docker, DB schema, env templates
```

---

## What this demonstrates as an AI project

| Capability | Where |
|---|---|
| Document understanding | Claude ingests raw legal PDF, extracts structured rules |
| Legal reasoning | Claude reasons across 88+ rules simultaneously |
| Structured output | Tool use / function calling returns machine-readable JSON |
| Real-time AI | Streaming gap analysis to dashboard via SSE |
| RAG | Pinecone + Claude for follow-up Q&A (V2) |
| Multi-document reasoning | Conflict detection across jurisdictions (V3) |
