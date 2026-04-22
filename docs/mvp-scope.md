# ComplyAI — MVP Scope

## Product vision
ComplyAI is the EU AI Act compliance checker for every company building or deploying a High Risk AI system. The EU AI Act defines 8 categories of High Risk AI under Annex III. ComplyAI covers all 8 — starting with hiring AI in MVP and adding one category per sprint until all are covered.

This is not a tool for lawyers. It is a tool for the product teams, CTOs, and founders who built the AI and need to know what to fix before they can legally operate in the EU.

---

## The 8 High Risk categories (Annex III)

| # | Category | Who uses ComplyAI |
|---|---|---|
| 1 | **Employment & hiring** | HR tech startups, enterprise HR teams — **MVP** |
| 2 | **Education & training** | EdTech companies, universities, exam proctoring tools |
| 3 | **Essential services** | Fintech, lenders, insurers, credit scoring providers |
| 4 | **Biometric identification** | Security companies, identity verification providers |
| 5 | **Critical infrastructure** | Energy, water, transport AI operators |
| 6 | **Law enforcement** | GovTech, predictive policing tool providers |
| 7 | **Migration & border control** | Immigration tech, visa assessment tools |
| 8 | **Justice & democracy** | LegalTech, court AI, electoral system providers |

---

## MVP — Category 1: Employment & Hiring

### In scope
- Framework: EU AI Act only
- Annex III category: Section 4(a) — Employment, workers management, self-employment
- Use case: Resume screening and candidate ranking AI
- User roles: Provider (built it), Deployer (uses it), or Both

### Happy path user
Sarah — Head of Product at a 40-person HR tech startup.
Built a resume screening tool. About to close first EU customer.
Found ComplyAI through a Google search.

### What MVP delivers
1. Plain English intake form — 5 questions, 3 minutes
2. Instant risk classification — HIGH-RISK confirmed with legal basis
3. Streaming gap analysis — Claude identifies gaps in real time, streamed to dashboard
4. Each gap: severity, exact article citation, plain English explanation, concrete fix
5. Downloadable audit report PDF — professional, cited, shareable with customers

### How the AI works in MVP
- Claude ingests EU AI Act PDF once → extracts ~88 rules for hiring AI as structured JSON
- Claude receives intake answers + rules → reasons using tool use → structured gap list
- Claude streams gap analysis to dashboard in real time via SSE
- Claude writes executive summary and PDF narrative per user — no generic templates
- 88 rules fit in Claude's context window — no RAG needed at MVP scale

### What makes this demonstrably AI
- Rules are extracted by Claude from the raw legal document — not hardcoded by engineers
- Claude reasons about partial compliance — not binary yes/no
- Streaming output makes the AI visible — users watch it identify gaps
- Plain English explanations are generated per user, contextualised to their answers
- Adding a new law or category = feeding Claude a document, not months of engineering

---

## Phased category rollout

### MVP — Category 1 (Ship now)
**Employment & hiring** — resume screening, candidate ranking
~88 rules extracted from EU AI Act Annex III Section 4(a)

### V1.1 — Category 2 (Sprint 2)
**Education & training** — student scoring, admissions AI, exam proctoring
~70 rules from EU AI Act Annex III Section 3
Same architecture, new rules JSON, new intake path

### V1.2 — Category 3 (Sprint 3)
**Essential services** — credit scoring, loan decisions, insurance risk
~80 rules from EU AI Act Annex III Section 5
Largest commercial opportunity — fintech and insurtech buyers

### V2 — Categories 4–5
**Biometric identification + Critical infrastructure**
Add follow-up Q&A (RAG + Pinecone) across all categories

### V3 — Categories 6–8 + US jurisdictions
**Law enforcement + Migration + Justice**
Add NYC LL144, Illinois, Colorado for cross-jurisdiction users
Full RAG pipeline for 500+ rules across all frameworks

---

## What stays out of scope for MVP
- US laws (NYC LL144, Illinois, Colorado) — V3
- Categories 2–8 — phased rollout above
- Follow-up Q&A chat — V2
- Multi-jurisdiction conflict detection — V3
- Video interview analysis — Category 1 V1.1
- Performance monitoring AI — Category 4
- Vendor due diligence checker — future
- Slack / Jira integration — future
- Multi-user team collaboration — V2
- API access — V3
- White-label version — V3

## Deadline
[insert date]
