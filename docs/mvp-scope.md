# ComplyAI — MVP Scope

## In scope
- Framework: EU AI Act only
- Domain: Hiring AI
- Use case: Resume screening and candidate ranking
- User role: Provider, Deployer, or both

## Happy path user
Sarah — Head of Product at a 40-person HR tech startup.
Built a resume screening tool. About to close first EU customer.
Found ComplyAI through a Google search.

## What MVP delivers
1. 5-question intake form (plain English, no legal jargon)
2. Instant risk classification with legal basis (Claude reasoning)
3. Streaming gap analysis dashboard — gaps appear in real time as Claude identifies them
4. Each gap: severity, exact article citation, plain English explanation, concrete fix
5. Downloadable audit report PDF with narrative written by Claude

## How the AI works in MVP
- Claude ingests the EU AI Act PDF once and extracts 88 rules as structured JSON
- Claude receives intake answers + 88 rules and reasons across them using tool use
- Claude streams the gap analysis to the dashboard in real time
- Claude writes the executive summary and narrative sections of the PDF
- No RAG needed at MVP scale — 88 rules fit entirely in Claude's context window

## What makes this demonstrably AI
- Claude reads the raw legal document — rules are not hardcoded by engineers
- Claude reasons about partial compliance (not just yes/no binary)
- Streaming output makes the AI visible — users watch it work
- Plain English explanations are generated per-user, not generic templates
- Adding a new law = feeding Claude a PDF, not months of engineering

## Out of scope for MVP
- US laws (NYC LL144, Illinois, Colorado) — V2
- Follow-up Q&A chat interface — V2 (needs RAG + Pinecone)
- Multi-jurisdiction conflict detection — V3
- Video interview analysis
- Performance monitoring AI
- Vendor due diligence checker
- Slack / Jira integration
- Multi-user team collaboration
- API access
- White-label version

## Phased roadmap

### MVP — Ship now
EU AI Act + hiring AI + resume screening + Claude reasoning + streaming

### V2 — After first 10 paying users
- Add NYC Local Law 144, Illinois AI Video Act
- Rules stored in PostgreSQL with jurisdiction tags
- Add follow-up Q&A (RAG + Pinecone)
- Compliance progress tracker with history

### V3 — Scale
- All global jurisdictions
- Multi-jurisdiction conflict detection
- Full RAG pipeline for 500+ rules
- API access for enterprise

## Deadline
[insert date]
