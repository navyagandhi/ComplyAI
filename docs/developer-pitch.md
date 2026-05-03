# ComplyAI — Developer Pitch

**Last updated:** 2 May 2026

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
- Nobody knows which laws are already in force (NYC LL144 — mandatory annual bias audit — has been law since July 2023)
- Nobody knows who is legally accountable if something goes wrong

Amazon scrapped a hiring AI in 2018 because it was systematically downranking CVs that contained the word "women's." It had been running for years before anyone noticed.

The EU AI Act exists because regulators looked at this pattern across every industry and said: this has to stop. Fines up to €30 million or 6% of global revenue. Mandatory bias audits. Mandatory human oversight. Mandatory audit trails. Deadline: August 2026.

Most companies building AI have no idea what they need to do. ComplyAI tells them — in plain English, in under 5 minutes.

---

## What ComplyAI is — in one sentence for developers

> A system where Claude ingests raw legal documents, checks for Article 5 prohibited AI before any compliance routing, reasons across 543 rules using tool use, streams a real-time gap analysis to a React dashboard via SSE, calculates a confidence score with certainty discounting, and generates a 9-section audit report with self-declaration caveats — with zero hardcoded compliance logic.

---

## The hard technical problems

This is not a CRUD app. Every layer has a genuinely hard problem.

---

### Problem 1 — Legal reasoning with guaranteed structured output

**The challenge:**
Get Claude to reason across 543 legal rules, identify which apply to a specific AI system, assess partial compliance (not just yes/no), and return machine-readable JSON — every single time, with no hallucinated citations.

**Why it is hard:**
LLMs are non-deterministic. Free-text responses cannot be parsed reliably. A hallucinated legal citation — "Article 14(4)(f) requires X" when Article 14(4)(f) says something completely different — is not just a bug. It is a legal liability.

**How we solve it:**
Claude tool use (function calling). Every gap must reference a `rule_id` from the JSON we passed in the prompt. Claude cannot invent a citation that does not exist in our dataset.

```javascript
{
  name: "report_compliance_gaps",
  input_schema: {
    type: "object",
    properties: {
      risk_level:            { type: "string" },
      compliance_score:      { type: "integer", minimum: 0, maximum: 100 },
      gaps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            rule_id:          { type: "string" },
            severity:         { type: "string", enum: ["CRITICAL","HIGH","MEDIUM"] },
            article:          { type: "string" },
            requirement_type: { type: "string", enum: ["document","test","process","disclosure","registration","contract"] },
            explanation:      { type: "string" },
            fix:              { type: "string" },
            already_in_force: { type: "boolean" },
            partial:          { type: "boolean" }
          },
          required: ["rule_id","severity","article","requirement_type","explanation","fix"]
        }
      }
    },
    required: ["risk_level","compliance_score","gaps"]
  }
}
```

**The result:** Guaranteed structured output. Every time. Zero hallucinated citations.

---

### Problem 2 — Prohibited AI detection before any compliance routing

**The challenge:**
Some AI systems are not High Risk — they are prohibited entirely under EU AI Act Article 5. A company describing an emotion recognition system for hiring should not receive a compliance checklist. They should receive a stop signal.

**Why it is hard:**
The line between "prohibited" and "High Risk" is subtle and context-dependent. A facial recognition system for KYC is High Risk. The same system used for real-time identification in a public space is prohibited. Claude must understand the intent and context of the user's description, not just pattern-match on keywords.

**How we solve it:**
A separate `prohibited_uses` table (not mixed into `rules`). Classification runs a prohibited AI check as Step 1 — before any Annex III routing. If flagged: stop-sign UI, full-screen warning, no gap list, no compliance score. Recommend legal counsel immediately.

```javascript
// Claude's classification response when prohibited AI is detected:
{
  prohibited_ai_risk: true,
  prohibited_ai_articles: ["Article 5(1)(f)"],  // emotion recognition in hiring
  stop: true,
  warning: "Based on your description, your system may fall under EU AI Act Article 5..."
}
// → No gap list generated. No score calculated.
```

---

### Problem 3 — Law versioning and change detection

**The challenge:**
The EU AI Act changes. NYC LL144 changes. When a law is updated, every existing compliance report that used the old version becomes stale. You need to detect changes, compute diffs, notify affected users, and ensure new assessments always use the current active version — without corrupting historical reports.

**How we solve it:**

SHA-256 hash of the PDF buffer as the change detection primitive:

```
PDF in → hash → check law_versions table
  → same hash: no-op (safe to re-run)
  → new hash: insert law_version (status='draft')
              → human review gate
              → promote to 'active'
              → compute diff (added/removed/modified rule_ids)
              → send stale_alerts to affected reports
```

Rules are never deleted — only versioned with `valid_until`. Historical reports permanently reference the `law_version_id` they were assessed against. SQL filter for active rules always: `WHERE valid_until IS NULL`.

```sql
CREATE TABLE law_versions (
  id            UUID PRIMARY KEY,
  law_name      VARCHAR(100) NOT NULL,
  version_tag   VARCHAR(50) NOT NULL,
  source_hash   VARCHAR(64) NOT NULL,  -- SHA-256
  status        VARCHAR(20) CHECK (status IN ('draft','active','superseded')),
  ...
);
```

---

### Problem 4 — Effective date complexity (some laws are already in force)

**The challenge:**
Not all obligations are due August 2026. NYC LL144 has been law since July 2023. Illinois AIVA since 2020. EU AI Act Article 4 (AI literacy) since February 2025. A company treating "EU AI Act compliance" as a single future deadline may be violating multiple laws today.

**Why it is hard:**
The product must sort and render gaps by their actual effective date — not by which law they belong to. A company with NYC hiring may have 2 current violations they are already liable for, and 12 future obligations due in 2026. These cannot be presented together.

**How we solve it:**
Every rule stores `effective_date`. Assessment output includes `already_in_force: boolean`. SSE stream sends current violations first. Frontend renders "Current violation" badge. Dashboard groups gaps into "Act now" and "By [date]". PDF has a dedicated current violations section before future deadlines.

```javascript
// SQL rule filter — current violations sorted to top
ORDER BY
  CASE WHEN effective_date <= NOW() THEN 0 ELSE 1 END,
  severity DESC
```

---

### Problem 5 — Self-declaration integrity

**The challenge:**
A company answers "yes" to every intake question, scores 95/100, downloads the PDF, and shares it with a regulator. The regulator asks to see the underlying technical documentation. It does not exist. ComplyAI produced a report that looked like a compliance certification based entirely on unchecked self-declaration.

**Why it is hard:**
Every gap the user claims to have resolved must be clearly labelled in the report as unverified. This is not a UX preference — it is a product integrity requirement. If this label is omitted, ComplyAI is producing misleading compliance evidence.

**How we solve it:**
Every resolved gap in every report — hardcoded into the PDF generator — carries:

> "Self-declared by [company] on [date]. Evidence not verified by ComplyAI."

In V2.1: evidence upload — user attaches a file, Claude checks it against the specific Annex IV sub-items it must satisfy, returns a structured coverage assessment. "Evidence submitted" becomes a distinct report tier above self-declared.

---

### Problem 6 — Confidence score with certainty discounting

**The challenge:**
Not all legal obligations are equally certain. Some provisions await implementing regulations. Some are contested by the legal community. A score that treats a `pending_guidance` rule identically to an `established` rule overstates the user's risk and erodes trust.

**How we solve it:**

```
Score = 100 − Σ(gap_deduction × certainty_weight × partial_multiplier)

Certainty weights:
  established:       1.0
  interpretive:      0.7
  pending_guidance:  0.4
  delegated_act:     0.3
  contested:         0.5
```

Each gap shows its certainty level in the UI and PDF. Rules marked `pending_guidance` carry a note: "Regulatory guidance pending — monitor for updates." The score is shown per law and as a combined score — never as a single number without context.

---

### Problem 7 — Streaming architecture

**The challenge:**
Stream Claude's gap analysis from the backend to the React frontend in real time so gaps animate onto the dashboard one by one — making the AI visible rather than hidden behind a loading spinner. Current violations must appear first.

**The architecture:**

```
POST /api/v1/assess → creates assessment record → returns assessmentId

GET /api/v1/stream/:assessmentId → SSE connection

Claude streaming API
    ↓
Parse stream for tool_use content blocks
    ↓
Extract each completed gap object from accumulating input_json
    ↓
Emit: data: {"type":"gap","gap":{...,"already_in_force":true}}
    ↓
React: GapCard renders with appropriate badge
    ↓
Score updates live after each gap
    ↓
Emit: data: {"type":"complete","summary":{...}}
```

POST/SSE split avoids gateway timeouts on long assessments and enables reconnection with cursor (SSE `Last-Event-ID` header).

---

### Problem 8 — LLM abstraction layer

**The challenge:**
OpenAI pricing changes. A new model outperforms Claude for a specific task. An enterprise customer has an existing OpenAI contract and demands GPT-4o. If every LLM call hardcodes Claude, you are locked in and cannot react.

**How we solve it:**
`backend/ai/llmClient.js` — all LLM calls route through this module. Model is configured per task via env vars.

```javascript
const MODEL_ROUTING = {
  ingestion:      process.env.LLM_INGESTION      || 'claude-opus-4-7',
  classification: process.env.LLM_CLASSIFICATION || 'claude-haiku-4-5-20251001',
  assessment:     process.env.LLM_ASSESSMENT     || 'claude-sonnet-4-6',
  narrative:      process.env.LLM_NARRATIVE      || 'claude-sonnet-4-6',
}
```

Different tasks suit different models: ingestion runs rarely so you pay for quality (Opus). Classification is high-frequency and straightforward (Haiku). Assessment is the core product — quality matters (Sonnet). Switching a model is one env var change.

---

### Problem 9 — RAG for legal Q&A (V2)

**The challenge:**
Build a follow-up Q&A system where users ask free-text questions and get answers grounded in exact legal text — with citations.

**Why standard RAG breaks here:**
Normal RAG retrieves the most semantically similar chunks. For compliance Q&A, "Does NYC LL144 require the same bias audit as the EU AI Act?" requires retrieving chunks from two different legal frameworks and reasoning about their relationship. Standard cosine similarity retrieves one or the other, not both.

**How we solve it:**
- Embed rules at the rule level — each rule is one embedding, tagged with jurisdiction + category metadata
- Multi-query retrieval — decompose complex questions into sub-queries, retrieve for each
- Re-rank retrieved rules by relevance before sending to Claude
- Claude answers with citations drawn only from retrieved rules — never from training memory

**Why RAG is NOT used for the core compliance check:**
RAG is not exhaustive. SQL filtering is. If RAG misses 10 rules below a similarity threshold, the user gets a falsely clean compliance score. Core check always uses SQL + full context injection.

---

## The stack

| Layer | Technology | Why interesting |
|---|---|---|
| AI reasoning | Claude API + tool use | Structured legal reasoning, guaranteed JSON output |
| Prohibited AI check | Claude API | Article 5 detection before compliance routing |
| LLM abstraction | llmClient.js | Model routing per task, provider switching |
| Law ingestion | Claude API | PDF → versioned rules, SHA-256 change detection |
| Streaming | Anthropic SDK + SSE | Real-time gap analysis, current violations first |
| Rules storage | PostgreSQL + JSONB | 543 rules, versioned, certainty-tagged, never deleted |
| Confidence scoring | Custom scoring engine | Certainty-weighted deductions, partial gap discounting |
| Follow-up Q&A | Pinecone + Claude | Legal RAG with citation grounding (V2) |
| Frontend | Next.js + React + Tailwind | SSE streaming, animated gap cards, compliance workspace |
| PDF | PDFKit | 9-section report with self-declaration caveats |
| Deployment | Vercel + Railway | Simple, fast, low-ops |

---

## What you would work on

**If you like AI engineering:**
- Prompt design for legal reasoning — getting Claude to reason across 543 rules reliably
- Tool use schema design — enforcing structured output with certainty and requirement type fields
- Law ingestion pipeline — PDF → versioned, validated, certainty-tagged JSON
- Prohibited AI detection — Article 5 classification confidence thresholds
- RAG pipeline for legal Q&A — multi-query retrieval, re-ranking

**If you like backend:**
- SSE streaming endpoint — parse Claude stream, push current-violations-first
- Law versioning system — SHA-256 hashing, diff computation, stale alerts
- Confidence scorer — certainty-weighted deductions, partial gap handling
- PostgreSQL schema — law_versions, prohibited_uses, stale_alerts, versioned rules
- PDF generation — 9-section report with self-declaration caveats

**If you like frontend:**
- Streaming dashboard — animate gap cards as SSE events arrive, current violations first
- Prohibited AI stop-sign UI — full-screen warning, no bypass
- Compliance workspace — live gap list, typed requirement badges, law version status
- Real-time score — per-law + overall, certainty discounting visible
- Shareable read-only report view

---

## The societal case

When a hiring AI systematically rejects women, nobody knows why.  
When an education AI only admits students of one race, nobody can prove it.  
When a credit scoring AI denies loans to minorities at twice the rate, nobody is accountable.

ComplyAI exists to create accountability before the harm compounds. Not after the lawsuit. Not after the regulator. Before.

The EU AI Act gives us the legal framework.  
The August 2026 deadline gives us the urgency.  
The 543 rules give us the product.

We are building the system that makes AI accountable.

---

## One more question for the room

> "If your company shipped an AI feature tomorrow and it turned out to be biased against a protected group — who in this room would know what the legal obligations were?  
> Who would know what to fix?  
> Who would know who was accountable?"

ComplyAI is the answer to that question.
