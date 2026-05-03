# ComplyAI — MVP Scope

**Last updated:** 2 May 2026  
**Reference:** [PRD v2.0](prd.md) · [Technical Architecture](technical-architecture.md) · [System Design](system-design.md)

---

## Product vision

ComplyAI is the compliance operating system for companies building or deploying AI in high-risk industries. It ingests raw legal texts using AI, classifies your system, tells you exactly what you need to fix, tracks your progress over time, and alerts you when the law changes.

Starting with EU AI Act hiring AI in MVP — then expanding to all 8 Annex III categories and US hiring AI laws (several of which are already in force today).

---

## The laws ComplyAI covers

| Law | Jurisdiction | Status | In ComplyAI |
|---|---|---|---|
| EU AI Act — Art 5 prohibited uses | EU | In force Feb 2025 | MVP |
| EU AI Act — Hiring AI (Art 9–49) | EU | Deadline Aug 2026 | MVP |
| NYC Local Law 144 | US-NY | In force July 2023 | V1.2 |
| Illinois AI Video Interview Act | US-IL | In force 2020 | V1.2 |
| California AB 2930 | US-CA | In force Jan 2026 | V3.0 |
| Colorado SB 205 | US-CO | In force Feb 2026 | V3.0 |
| EU AI Act — Education, Finance | EU | Deadline Aug 2026 | V3.0 |
| EU AI Act — All 8 categories | EU | Deadline Aug 2026 | V3.1 |

**Note:** NYC LL144 and Illinois AIVA are already in force. Any company hiring in NYC or Illinois using automated hiring AI is likely already non-compliant today.

---

## The 8 High Risk categories (Annex III)

| # | Category | Who uses ComplyAI | Status |
|---|---|---|---|
| 1 | **Employment & hiring** | HR tech startups, enterprise HR teams | **MVP** |
| 2 | **Education & training** | EdTech companies, universities, exam proctoring tools | V1.1 |
| 3 | **Essential services** | Fintech, lenders, insurers, credit scoring providers | V1.2 |
| 4 | **Biometric identification** | Security companies, identity verification providers | V2 |
| 5 | **Critical infrastructure** | Energy, water, transport AI operators | V2 |
| 6 | **Law enforcement** | GovTech, predictive policing tool providers | V3.1 |
| 7 | **Migration & border control** | Immigration tech, visa assessment tools | V3.1 |
| 8 | **Justice & democracy** | LegalTech, court AI, electoral system providers | V3.1 |

---

## MVP — EU AI Act, Category 1: Employment & Hiring

### In scope

- Framework: EU AI Act + Article 5 prohibited AI check
- Annex III category: Section 4(a) — Employment, workers management, self-employment
- Use case: Resume screening and candidate ranking AI
- User roles: Provider (built it), Deployer (uses it), Both, Substantially modified, White-labelled
- Jurisdictions: EU in MVP; US states added in V1.2

### Happy path user

Sarah — Head of Product at a 40-person HR tech startup.  
Built a resume screening tool. About to close first EU customer.  
Found ComplyAI through a Google search.

### What MVP delivers

1. **Scoping check** — does any law apply? If Article 5 prohibited AI is detected: STOP. No gap list, no score. Warning to consult counsel immediately.
2. **Classification** — Claude determines Annex III category, role (including edge cases), jurisdictions, and per-law effective dates. User reviews before proceeding.
3. **Intake form** — 9–14 questions depending on role. Role-specific. "Not sure" triggers guided follow-up, never just flags a gap.
4. **Streaming gap analysis** — gaps stream to dashboard in real time via SSE. Current violations stream first with "Current violation" badge.
5. **Compliance workspace** — live gap list with typed requirement badges (DOCUMENT / TEST / PROCESS / DISCLOSURE / REGISTRATION / CONTRACT), per-law confidence scores, law version status.
6. **Downloadable audit report PDF** — cited, timestamped, with self-declaration caveats on every resolved gap, full disclaimer block.

### How the AI works in MVP

- Claude ingests EU AI Act PDF once → extracts ~88 rules for hiring AI as structured JSON with certainty, requirement type, and evidence description fields
- Claude classifies user's system from free text → Annex III category + role + jurisdiction
- Claude runs Article 5 prohibited AI check first — stop signal before gap analysis
- Claude receives intake answers + filtered rules → reasons via tool use → structured gap list
- Gaps stream to dashboard via SSE — current violations first, then sorted by deadline
- Confidence score calculated as: 100 − Σ(deduction × certainty weight), with partial gap discounting
- Claude writes executive summary and PDF narrative per user — no generic templates

### What makes this demonstrably AI

- Rules extracted by Claude from raw legal document — not hardcoded
- Claude reasons about partial compliance states — not binary yes/no
- Streaming output makes the AI visible — users watch it identify gaps
- Plain English explanations generated per user, contextualised to their answers
- Adding a new law or category = feeding Claude a document, not months of engineering
- LLM provider abstraction layer — no business logic hardcodes Claude; supports GPT-4o as alternative from V1.1

---

## Critical product integrity constraints (non-negotiable)

These are enforced at build time, not aspirational.

| Constraint | Rule |
|---|---|
| **Self-declaration caveat** | Every resolved gap in the report is labelled "Self-declared by [company] on [date]. Evidence not verified by ComplyAI." Never omitted. |
| **Prohibited AI gate** | Article 5 check runs before every classification. If flagged: stop-sign UI, no gap list, no compliance score. |
| **Current violations** | Gaps where effective_date is in the past render with "Current violation" badge. Never as future risks. |
| **Disclaimer gate** | No report generated without visible disclaimer. Language reviewed by legal counsel before MVP ships. |
| **Hallucination prevention** | Every gap cites a rule_id from the rules JSON passed to Claude. Tool use enforces this. Claude cannot invent a citation. |
| **Ingestion review gate** | No law version promoted from draft to active without human review. |
| **Versioned reports** | Every report permanently linked to the exact law version it was assessed against. |

---

## Phased roadmap

### MVP — EU AI Act, Employment & Hiring (ship now)
- EU AI Act Art 5 prohibited uses check
- EU AI Act ~88 rules for Section 4(a)
- Claude classification + intake + reasoning + streaming
- Confidence score with certainty discounting
- Self-declaration caveats in PDF
- LLM abstraction layer (Claude default)

### V1.0 — Product integrity
- Typed requirement badges (DOCUMENT / TEST / PROCESS / etc.)
- Law versioning (SHA-256 hash, law_versions table, human review gate)
- Multi-effective-date timeline — current violations surface first
- Legal disclaimer gate reviewed by counsel

### V1.1 — Role edge cases + OpenAI alternative
- Provider/deployer edge cases (substantially_modified, white_labelled → provider obligations)
- Vendor contract gap section for deployers (Article 25)
- Multi-system company profile
- OpenAI GPT-4o as LLM alternative

### V1.2 — US laws (already in force)
- NYC Local Law 144 (in force July 2023 — companies hiring in NYC are already non-compliant)
- Illinois AI Video Interview Act (in force 2020)
- Multi-jurisdiction intake form
- Per-law scoring breakdown

### V2.0 — Compliance workspace
- Live tracking, mark gaps complete, rescore
- Stale alerts when law updates affect existing reports
- Shareable read-only workspace link
- Audit history

### V2.1 — Evidence upload
- User attaches file to gap
- Claude checks file against specific Annex IV sub-items
- "Evidence submitted" report tier (above self-declared)

### V2.2 — Follow-up Q&A (RAG)
- Pinecone for rule embeddings per category
- User asks free-text questions after gap analysis
- Claude answers with citations from retrieved rules
- GDPR interaction Q&A

### V3.0 — Full US hiring law coverage
- California AB 2930 (Jan 2026), Colorado SB 205 (Feb 2026)
- EEOC AI guidance (Title VII)
- EU AI Act categories 2–3 (Education, Essential Services)

### V3.1 — All 8 EU AI Act categories
- Law enforcement, migration, justice, biometrics, infrastructure
- Cross-jurisdiction conflict detection

### V4.0 — Platform
- Vendor compliance directory
- API access tier
- Team collaboration (CTO + Head of Legal both in workspace)

---

## What stays out of scope for MVP

- US laws (NYC LL144, Illinois) — V1.2
- US state laws beyond NY and IL — V3.0+
- Categories 2–8 of EU AI Act — phased above
- Follow-up Q&A / RAG — V2.2
- Evidence upload — V2.1
- Multi-jurisdiction conflict detection — V3.1
- Team collaboration (multi-user) — V4.0
- API access — V4.0
- White-label version — post-V4.0
- Vendor due diligence checker — post-V4.0
- GDPR coverage — out of scope (noted in every report as a cross-reference, not a gap)
