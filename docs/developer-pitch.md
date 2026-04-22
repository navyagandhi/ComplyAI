# ComplyAI — Developer Pitch

---

## Open with this question

> "Has your company ever deployed an AI feature?
> Did anyone check if it was legally compliant?
> Did anyone check if it was biased?
> Does anyone know who is accountable if something goes wrong?"

Most developers will say no.

That is the problem.

---

## The problem — in developer terms

AI systems are making decisions that affect real people's lives. Who gets a job interview. Who gets into university. Who gets a loan. And right now:

- Nobody audited the model for bias before it shipped
- Nobody documented how decisions are made
- Nobody can trace why a specific person was rejected
- Nobody knows who is legally accountable if something goes wrong

Amazon scrapped a hiring AI in 2018 because it was systematically downranking CVs that contained the word "women's." It had been running for years before anyone noticed.

The EU AI Act exists because regulators looked at this pattern across every industry and said: this has to stop. Fines up to €30 million or 6% of global revenue. Mandatory bias audits. Mandatory human oversight. Mandatory audit trails. Deadline: August 2026.

Most companies building AI have no idea what they need to do. ComplyAI tells them — in plain English, in under 5 minutes.

---

## What ComplyAI is — in one sentence for developers

> A system where Claude ingests raw legal documents, reasons across 543 rules using tool use, streams a real-time gap analysis to a React dashboard via SSE, and returns structured JSON that drives a PDF audit report — with zero hardcoded compliance logic.

---

## The hard technical problems

This is not a CRUD app. Every layer has a genuinely hard problem.

---

### Problem 1 — Legal reasoning with guaranteed structured output

**The challenge:**
Get Claude to reason across 543 legal rules, identify which apply to a specific AI system, assess partial compliance (not just yes/no), and return machine-readable JSON — every single time, with no hallucinated citations.

**Why it is hard:**
LLMs are non-deterministic. Free-text responses cannot be parsed reliably into a dashboard. And a hallucinated legal citation — "Article 14(4)(f) requires X" when Article 14(4)(f) says something completely different — is not just a bug. It is a legal liability.

**How we solve it:**
Claude tool use (function calling). We define a strict typed schema:

```javascript
{
  name: "report_compliance_gaps",
  input_schema: {
    type: "object",
    properties: {
      risk_level: {
        type: "string",
        enum: ["HIGH_RISK", "LIMITED_RISK", "MINIMAL_RISK"]
      },
      compliance_score: {
        type: "integer",
        minimum: 0,
        maximum: 100
      },
      gaps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            rule_id:     { type: "string" },
            severity:    { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM"] },
            article:     { type: "string" },
            explanation: { type: "string" },
            fix:         { type: "string" },
            partial:     { type: "boolean" }
          },
          required: ["rule_id", "severity", "article", "explanation", "fix"]
        }
      }
    },
    required: ["risk_level", "compliance_score", "gaps"]
  }
}
```

Claude must call this tool. It cannot return prose. The `rule_id` field must match a rule from the JSON we passed in the prompt — so Claude cannot invent a citation that does not exist in our dataset.

**The result:** Guaranteed structured output. Every time. Zero hallucinated citations.

---

### Problem 2 — Law ingestion at scale

**The challenge:**
Extract 543 legally accurate, structured compliance rules from a 144-page PDF — across 8 different Annex III categories — without engineers manually reading the document.

**Why it is hard:**
Legal text is dense, cross-referential, and full of exceptions. Article 14 references Article 9. Annex IV modifies Article 11. The Article 6(3) exemption carves out certain systems from High Risk entirely. A naive extraction misses these relationships.

**How we solve it:**
A structured ingestion prompt that instructs Claude to:
- Extract only obligations that create specific duties (not recitals)
- Capture cross-article relationships in a `related_articles` field
- Classify severity based on enforcement priority and deadline
- Flag which obligations apply to providers vs deployers vs both
- Return typed JSON against a defined schema

The output is stored in PostgreSQL and version-controlled in `rules/*.json`. Every AI-extracted update is a git diff a human can review before it goes to production.

**The result:** Rules are an AI output, not a human output. Adding a new jurisdiction = feeding Claude a PDF. No engineering time required.

---

### Problem 3 — Streaming architecture

**The challenge:**
Stream Claude's gap analysis from the backend to the React frontend in real time so gaps animate onto the dashboard one by one as Claude identifies them — making the AI visible rather than hidden behind a loading spinner.

**Why it is hard:**
Claude's tool use response arrives as a stream of events. You need to parse the streaming tool call incrementally, extract partial JSON as it arrives, validate it enough to render a gap card, and push it to the frontend via SSE — all without waiting for the full response to complete.

**The architecture:**

```
Claude streaming API
    ↓
Parse stream for tool_use content blocks
    ↓
Extract partial gap JSON as input_json accumulates
    ↓
Push each completed gap via SSE to frontend
    ↓
React: GapCard animates in on each SSE event
    ↓
ComplianceScore updates in real time
    ↓
Stream complete → render summary + enable PDF download
```

**The result:** Users watch Claude identify gaps in real time. The AI is not a black box. It is visible, working, and fast.

---

### Problem 4 — RAG for legal text (V2)

**The challenge:**
Build a follow-up Q&A system where users ask free-text questions after their gap analysis and get answers grounded in the exact legal text — with citations.

**Why standard RAG breaks here:**
Normal RAG retrieves the most semantically similar chunks. For compliance Q&A that is not good enough. "Does NYC LL144 require the same bias audit as the EU AI Act?" requires retrieving chunks from two different legal frameworks and reasoning about their relationship. Standard cosine similarity will retrieve one or the other, not both.

**How we solve it:**
- Embed rules at the rule level, not the chunk level — each rule is one embedding
- Tag every embedding with jurisdiction and category metadata
- Multi-query retrieval — decompose complex questions into sub-queries, retrieve for each
- Re-rank retrieved rules by relevance before sending to Claude
- Claude answers with citations drawn only from retrieved rules — never from training memory

**The result:** Exhaustive retrieval for legal text. No missed obligations.

---

### Problem 5 — Multi-jurisdiction conflict detection (V3)

**The challenge:**
When a company operates in EU + NYC + Illinois, identify where the three legal frameworks overlap, where they conflict, and what the strictest combined requirement is.

**Why it is hard:**
No deterministic logic can reason about legal conflicts. It requires understanding the intent of each requirement, comparing them semantically, and making a legal judgement. This is exactly the kind of reasoning Claude is built for — and exactly the kind of reasoning that would take a compliance lawyer weeks to produce manually.

---

## The stack

| Layer | Technology | Why interesting |
|---|---|---|
| AI reasoning | Claude API + tool use | Structured legal reasoning, guaranteed JSON output |
| Law ingestion | Claude API | PDF → structured rules, no manual authoring |
| Streaming | Anthropic SDK + SSE | Real-time gap analysis, visible AI |
| Rules storage | PostgreSQL + JSONB | 543 rules, tagged by category + jurisdiction |
| Follow-up Q&A | Pinecone + Claude | Legal RAG with citation grounding (V2) |
| Frontend | Next.js + React + Tailwind | SSE streaming UI, animated gap cards |
| PDF | PDFKit | Programmatic report generation |
| Deployment | Vercel + Railway | Simple, fast, low-ops |

---

## What you would work on

Depending on what you are interested in:

**If you like AI engineering:**
- Prompt design for legal reasoning — getting Claude to reason across 543 rules reliably
- Tool use schema design — enforcing structured output
- Law ingestion pipeline — PDF → validated structured JSON
- RAG pipeline for legal text — multi-query retrieval, re-ranking

**If you like backend:**
- SSE streaming endpoint — parse Claude stream, push gaps to frontend in real time
- PostgreSQL schema — rules, intakes, reports, history
- PDF generation — PDFKit programmatic report assembly
- API design — intake, classify, report, stream, chat endpoints

**If you like frontend:**
- Streaming dashboard — animate gap cards as SSE events arrive
- Intake form — multi-category, adaptive questions
- Real-time compliance score — updates live as gaps are identified
- Shareable report view — public link, no login required

---

## The societal case — why this matters beyond the tech

When a hiring AI systematically rejects women, nobody knows why. When an education AI only admits students of one race, nobody can prove it. When a credit scoring AI denies loans to minorities at twice the rate, nobody is accountable.

ComplyAI exists to create accountability before the harm compounds. Not after the lawsuit. Not after the regulator. Before.

The EU AI Act gives us the legal framework. The August 2026 deadline gives us the urgency. The 543 rules give us the product.

We are building the system that makes AI accountable.

---

## One more question for the room

> "If your company shipped an AI feature tomorrow and it turned out to be biased against a protected group — who in this room would know what the legal obligations were?
> Who would know what to fix?
> Who would know who was accountable?"

ComplyAI is the answer to that question.
