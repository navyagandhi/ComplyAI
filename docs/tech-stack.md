# ComplyAI — Tech Stack

**Last updated:** 2 May 2026  
**Reference:** [PRD v2.0](prd.md) · [Technical Architecture](technical-architecture.md) · [System Design](system-design.md)

---

## Product vision

Compliance operating system for companies using AI in high-risk industries. Claude ingests raw legal documents, extracts structured versioned rules, classifies systems, checks for prohibited AI, reasons across rules, streams the gap analysis, and generates a cited audit report — with no hardcoded compliance logic.

---

## AI Layer

### LLM provider abstraction (not hardcoded to any single model)

All LLM calls route through `backend/ai/llmClient.js`. No business logic references a specific provider directly.

| Task | Default model | Alternative (V1.1+) | Rationale |
|---|---|---|---|
| **Law ingestion** | claude-opus-4-7 | Gemini 1.5 Pro (V2) | Run rarely — pay for best extraction quality |
| **Classification** | claude-haiku-4-5-20251001 | GPT-4o mini | Fast, cheap, straightforward task |
| **Compliance reasoning** | claude-sonnet-4-6 | GPT-4o | Core product — pay for reasoning quality |
| **PDF narrative** | claude-sonnet-4-6 | GPT-4o | Quality prose |
| **Follow-up Q&A** | claude-haiku-4-5-20251001 | Cohere Command R+ | High frequency — optimise for cost |

### Why Claude is the default

| Reason | Detail |
|---|---|
| **Prompt caching** | ~88 rules JSON sent with every assessment. Claude caches repeated context — 60–70% cost reduction at volume. |
| **200k context window** | Entire legal documents ingested in one call without chunking. |
| **Tool use reliability** | Hallucination prevention depends on Claude reliably calling structured tools every time. |
| **Legal reasoning quality** | Complex partial compliance states require nuanced judgment. |

### Pinecone (V2 only — follow-up Q&A)

Used exclusively for follow-up Q&A after gap analysis. ~543 rules embedded per jurisdiction + category. User asks free-text question → Pinecone retrieves relevant rule chunks → Claude answers with citations. Not used for primary compliance reasoning — SQL filtering handles that.

---

## Frontend

- **Next.js 14** — routing, API layer, SSR
- **React 18** — component model
- **Tailwind CSS** — styling with severity colours (CRITICAL/HIGH/MEDIUM), current-violation red, requirement type badges
- **Server-Sent Events** — Claude streams gap analysis to dashboard in real time
- **useSSE hook** — reconnects on drop, supports cursor-based resumption

Key pages:
- `pages/index.js` — Landing, free-text AI description
- `pages/intake.js` — Role-specific, jurisdiction-aware intake form
- `pages/dashboard.js` — Streaming gap analysis
- `pages/workspace/[id].js` — Compliance workspace (V2)
- `pages/report/[id].js` — Shareable read-only report

---

## Backend

- **Node.js + Express** — compliance API
- **PostgreSQL** — full data layer (see schema below)
- **Anthropic SDK** — Claude client with streaming and tool use
- **PDFKit** — audit report generation, runs in-process
- **AJV** — JSON schema validation for ingested rules
- **pdf-parse** — PDF text extraction before Claude ingestion

Key API routes:

| Method | Path | Purpose |
|---|---|---|
| POST | /api/v1/classify | Classify system — Annex III + role + prohibited AI check |
| POST | /api/v1/intake | Store intake answers |
| POST | /api/v1/assess | Create assessment record, trigger Claude reasoning |
| GET | /api/v1/stream/:id | SSE stream — gaps in real time |
| GET | /api/v1/report/:id | Fetch report JSON |
| GET | /api/v1/workspace/:systemId | Compliance workspace state |
| GET | /api/v1/pdf/:id | Generate/download PDF |
| POST | /api/v1/ingest | Admin — law ingestion (internal only) |

---

## Database (PostgreSQL)

### Core tables

| Table | Purpose |
|---|---|
| `users` | User accounts + company profile |
| `ai_systems` | Each AI system registered (a company can have many) |
| `law_versions` | Versioned laws — SHA-256 hash, status (draft/active/superseded) |
| `law_version_diffs` | Diff between law versions (added/removed/modified rules) |
| `prohibited_uses` | Article 5 prohibited AI use cases — separate from rules |
| `rules` | All extracted compliance rules — versioned, certainty-tagged |
| `intakes` | Intake form answers — versioned per submission |
| `reports` | Generated compliance reports — linked to law_version_ids |
| `stale_alerts` | Notifications when law update affects existing report |
| `ingestion_logs` | Full log of every ingestion run |

### Key rule fields

Beyond the basic fields (`id`, `article`, `title`, `severity`, `applies_to`):

| Field | Type | Purpose |
|---|---|---|
| `requirement_type` | enum | document / test / process / disclosure / registration / contract |
| `action_owner` | enum | provider / deployer / both |
| `frequency` | enum | one_time / annual / ongoing / per_deployment |
| `effective_date` | date | When this rule is enforceable |
| `certainty` | enum | established / interpretive / pending_guidance / delegated_act / contested |
| `certainty_note` | text | Claude's note on ambiguity |
| `evidence_description` | text | What the user must produce |
| `gdpr_interaction_note` | text | Cross-reference to GDPR (surfaced, not a gap) |
| `law_version_id` | uuid | Which law version this rule belongs to |
| `valid_until` | date | Null = active; set when rule is superseded |

---

## Deployment

| Layer | Service | Notes |
|---|---|---|
| **Frontend** | Vercel | Next.js hosting, edge CDN |
| **Backend + DB** | Railway | Node.js + PostgreSQL 15 |
| **Vector DB** | Pinecone | V2 only — follow-up Q&A |
| **Local dev** | Docker Compose | PostgreSQL via docker-compose.yml |

---

## Scale

| Stage | Rules | Categories | Laws | RAG |
|---|---|---|---|---|
| MVP | ~88 | 1 (Employment) | EU AI Act | No — fits in context window |
| V1.2 | ~100 | 1 | + NYC LL144, IL AIVA | No |
| V2 | ~238 | 3 | + Education, Finance | Yes — Q&A only |
| V3 | ~543 | All 8 | + CA, CO, EEOC | Yes — full retrieval pipeline |

At MVP scale (88 rules, ~15k tokens) the full filtered set fits in Claude's 200k context window — no chunking or RAG needed for the core check.

---

## What this demonstrates as an AI project

| Capability | Implementation |
|---|---|
| Document understanding | Claude ingests 144-page legal PDF, extracts structured versioned rules |
| Prohibited AI detection | Claude classifies Article 5 use cases before any compliance routing |
| System classification | Claude classifies user's AI from free text into Annex III + role |
| Legal reasoning | Claude reasons across 88–543 rules with partial compliance assessment |
| Structured output | Tool use enforces machine-readable JSON — no hallucinated citations |
| Real-time AI | SSE streaming — gaps appear on dashboard as Claude identifies them |
| Certainty modelling | Rules tagged with 5 certainty levels; score discounts ambiguous obligations |
| LLM abstraction | Model routing layer — no business logic hardcodes any single provider |
| RAG | Pinecone + Claude for follow-up Q&A (V2) |
| Multi-jurisdiction | Cross-jurisdiction conflict detection (V3) |
