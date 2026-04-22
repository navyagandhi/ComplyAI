# ComplyAI — AI Architecture
## How the compliance checker works end to end

---

## Overview

ComplyAI is AI-first. Claude does not just explain results — Claude is the compliance engine. There is no hardcoded rules logic. The system ingests raw legal documents, reasons across them, and returns structured output that drives the dashboard and PDF.

Three things happen when Sarah submits her intake form:

1. **Law ingestion** — Claude has already read the EU AI Act PDF and extracted structured rules (done once, stored in PostgreSQL)
2. **Compliance reasoning** — Claude receives Sarah's intake answers + all relevant rules and reasons across them using tool use to return a structured gap list
3. **AI output layer** — Claude streams the gap analysis to the dashboard in real time and generates the PDF narrative sections

---

## Part 1 — Law Ingestion (Claude reads the PDF)

### What it is

Instead of engineers manually reading the EU AI Act and writing rules into a JSON file, Claude reads the raw legal document and extracts the rules itself. This is done once per law and the output is stored in PostgreSQL.

### How it works

```
EU AI Act PDF (144 pages)
        ↓
Claude API — document ingestion prompt
        ↓
Structured rules JSON — stored in PostgreSQL and rules/eu_ai_act.json
```

### The ingestion prompt

```
You are a legal AI specialist. I am going to give you the full text 
of the EU AI Act. 

Your job:
1. Extract every obligation that applies to hiring AI systems 
   (resume screening, candidate ranking, automated assessment)
2. For each obligation extract:
   - article and sub-clause citation
   - whether it applies to providers, deployers, or both
   - the specific requirement in plain English
   - severity: CRITICAL, HIGH, or MEDIUM
   - what a non-compliant company would be missing
   - what they need to do to fix it
3. Return as structured JSON using the schema provided

Only extract obligations that directly apply to hiring AI under 
Annex III Section 4(a). Do not include general provisions that 
do not create specific obligations for this use case.
```

### What comes out — the rule schema

```json
{
  "id": "EU-AIA-014-4-d",
  "article": "Article 14(4)(d)",
  "title": "Human override mechanism",
  "category": "Human Oversight",
  "severity": "CRITICAL",
  "applies_to": ["provider", "deployer"],
  "jurisdiction": "EU",
  "use_case": ["resume_screening", "candidate_ranking"],
  "requirement": "A designated natural person must be able to disregard, override, or reverse the output of the AI system.",
  "non_compliance_signal": "No human override mechanism exists or is documented",
  "fix": "Assign a named role with explicit authority to override any AI recommendation. Build a UI control that logs every override or non-override decision.",
  "deadline": "2026-08-02"
}
```

### Why this matters

When the EU AI Act is amended, or when you add NYC Local Law 144, you feed Claude the new document and get a new rules file in minutes — not weeks of engineering time. The system scales to any jurisdiction without manual rule authoring.

---

## Part 2 — Compliance Reasoning (Claude with Tool Use)

### What it is

Claude receives Sarah's intake answers and all relevant rules, then reasons across them to identify gaps. Claude uses tool use (function calling) to return a structured gap list — not prose, not free text — machine-readable JSON that drives the dashboard and PDF.

### Why tool use matters

Without tool use, Claude returns prose. You cannot reliably parse prose into a dashboard. With tool use, Claude calls a defined function with typed parameters. The output is guaranteed structured JSON every time.

### The tool definition

```javascript
const tools = [
  {
    name: "report_compliance_gaps",
    description: "Report the compliance gaps identified for this AI system",
    input_schema: {
      type: "object",
      properties: {
        risk_level: {
          type: "string",
          enum: ["HIGH_RISK", "LIMITED_RISK", "MINIMAL_RISK", "EXEMPT"]
        },
        classification_basis: {
          type: "string",
          description: "The legal basis for the risk classification"
        },
        deadline: {
          type: "string",
          description: "Compliance deadline in ISO 8601 format"
        },
        gaps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              rule_id:     { type: "string" },
              severity:    { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM"] },
              title:       { type: "string" },
              article:     { type: "string" },
              explanation: { type: "string" },
              fix:         { type: "string" },
              partial:     { type: "boolean" }
            },
            required: ["rule_id", "severity", "title", "article", "explanation", "fix"]
          }
        },
        passed: {
          type: "array",
          items: { type: "string" },
          description: "Rule IDs that the system is compliant with"
        }
      },
      required: ["risk_level", "classification_basis", "deadline", "gaps", "passed"]
    }
  }
]
```

### The reasoning prompt

```
You are a compliance analyst specialising in the EU AI Act.

COMPANY INTAKE:
- System: Resume screening and candidate ranking tool
- Built or bought: Built in-house (Provider)
- Operates in: EU, United Kingdom
- Automatically scores candidates: Yes
- Role: Provider and Deployer

COMPLIANCE CHECKLIST RESPONSES:
- Bias audit conducted: No
- Technical documentation written: No
- Human override mechanism: Not sure
- Candidates informed AI is used: No
- Staff AI literacy training: No
- Risk management system: No
- Logging infrastructure: No

EU AI ACT RULES (all rules applicable to hiring AI):
[full rules JSON injected here]

Your job:
1. Classify the risk level of this system with legal basis
2. Identify every compliance gap based on the checklist responses
3. For partial answers (not sure) — treat as a gap but flag as needing verification
4. Assess severity honestly — do not soften CRITICAL gaps
5. Call the report_compliance_gaps tool with your findings

Be direct. Do not hedge. Every gap must have a specific article citation 
from the rules provided — never cite an article not in the rules list.
```

### What comes out

```json
{
  "risk_level": "HIGH_RISK",
  "classification_basis": "Annex III, Section 4(a) — Employment, workers management and access to self-employment. System automatically scores and ranks candidates. Article 6(3) exemption does not apply.",
  "deadline": "2026-08-02",
  "gaps": [
    {
      "rule_id": "EU-AIA-010-2-f",
      "severity": "CRITICAL",
      "title": "No bias audit conducted",
      "article": "Article 10(2)(f)",
      "explanation": "Training data has not been examined for potential biases across protected characteristics including race, sex, age, and ethnicity. This is a direct requirement for high-risk AI systems used in employment.",
      "fix": "Conduct an independent bias audit examining model outcomes across race, sex, age, and ethnicity before EU market placement.",
      "partial": false
    }
  ],
  "passed": ["EU-AIA-006-1"]
}
```

This JSON is the single source of truth for the dashboard and the PDF.

---

## Part 3 — Streaming to the Dashboard

### What it is

Instead of a loading spinner while Claude processes, the gap analysis streams to the dashboard in real time. Gaps appear one by one as Claude identifies them. The AI is visible — users see it working.

### How it works

```
Backend streams Claude response via Server-Sent Events (SSE)
        ↓
Frontend receives stream, renders gaps as they arrive
        ↓
Each gap card animates in as Claude identifies it
        ↓
Compliance score updates in real time as gaps accumulate
```

### Why this matters for the demo

Streaming makes the AI visible. Instead of "we ran some logic," the user watches Claude read their answers and surface gaps in real time. It demonstrates genuine intelligence, not a lookup table.

---

## Part 4 — Follow-Up Q&A with RAG (V2)

### What it is

After seeing their gaps, users ask free-text follow-up questions. This is the only place RAG is used — and it is used correctly here because the user is asking an open-ended question Claude cannot answer reliably from context alone.

### How it works

```
User types: "What exactly counts as a bias audit under Article 10?"
        ↓
Question is embedded (text-embedding-3-small or Claude embeddings)
        ↓
Pinecone retrieves the 3–5 most relevant rule chunks
        ↓
Retrieved chunks + question sent to Claude
        ↓
Claude answers grounded in the retrieved source text
        ↓
Answer displayed with citations
```

### Why RAG here and not earlier

For the gap analysis, all 88 rules (~15,000 tokens) fit in Claude's context window. No retrieval needed — Claude sees everything. For follow-up Q&A, the user is asking an open-ended question. You cannot predict which rules are relevant in advance. Embeddings + retrieval is the right tool for this job.

---

## Part 5 — Multi-Jurisdiction Conflict Detection (V3)

### What it is

When a company operates in multiple jurisdictions (EU + NYC + Illinois), Claude reasons across all applicable frameworks simultaneously and identifies:
- Where requirements overlap (satisfy once, compliant everywhere)
- Where requirements conflict (EU says 6 months retention, California says 4 years — California wins)
- What the strictest single requirement is across all jurisdictions

### Why only AI can do this

No deterministic rules engine can reason about conflicts between laws. It requires understanding the intent of each requirement, comparing them semantically, and making a judgement about which is stricter. This is exactly what Claude is good at.

---

## End to End Flow

```
LAW INGESTION (done once per law)
EU AI Act PDF → Claude → structured rules JSON → PostgreSQL

                    ↓

USER SUBMITS INTAKE FORM
        ↓
┌─────────────────────────┐
│  JURISDICTION FILTER     │  SQL query: rules where
│                         │  jurisdiction IN user.jurisdictions
│  88 rules → filtered    │  AND use_case = resume_screening
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  CLAUDE REASONING        │  intake answers + filtered rules
│  with tool use           │  → report_compliance_gaps()
│                         │  → structured gap list JSON
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  STREAMING SSE           │  gaps stream to dashboard
│                         │  one by one in real time
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  DASHBOARD               │  React renders gap cards
│  + PDF GENERATOR         │  PDFKit assembles report
│                         │  Claude writes narrative
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  FOLLOW-UP Q&A           │  User asks free-text question
│  (V2, RAG)               │  Pinecone retrieves chunks
│                         │  Claude answers with citations
└─────────────────────────┘
```

---

## What Lives Where in the Codebase

```
complyai/
├── rules/
│   └── eu_ai_act.json          ← AI-extracted rules (Claude output, not human-authored)
│
├── backend/
│   ├── engine/
│   │   ├── ingestor.js         ← Sends legal PDF to Claude, stores extracted rules
│   │   └── classifier.js       ← Determines jurisdiction filter from intake answers
│   │
│   ├── ai/
│   │   ├── claudeClient.js     ← Anthropic SDK — reasoning + streaming + tool use
│   │   ├── tools.js            ← Tool definitions (report_compliance_gaps)
│   │   └── prompts.js          ← All prompt templates
│   │
│   ├── pdf/
│   │   └── reportGenerator.js  ← PDFKit — assembles gap list + Claude narrative
│   │
│   └── api/
│       ├── intake.js           ← POST /api/intake
│       ├── report.js           ← GET /api/report/:id
│       ├── stream.js           ← GET /api/stream/:id (SSE streaming endpoint)
│       ├── chat.js             ← POST /api/chat (follow-up Q&A, V2)
│       └── pdf.js              ← GET /api/pdf/:id
│
└── frontend/
    ├── pages/
    │   ├── index.js            ← Landing page
    │   ├── intake.js           ← Intake form
    │   ├── dashboard.js        ← Streaming gap analysis
    │   └── report/[id].js      ← Shareable report link
    │
    └── components/
        ├── GapCard.js          ← Gap with expand/collapse + streaming animation
        ├── RiskBadge.js        ← HIGH-RISK badge + classification text
        ├── StreamingDashboard.js ← Renders gaps as SSE stream arrives
        └── DownloadButton.js   ← Triggers PDF generation
```

---

## What Keeps This Legally Defensible

**1. Claude never invents citations**
Every gap must cite a rule ID from the rules JSON passed in the prompt. The prompt explicitly instructs Claude not to cite articles not in the provided list. Tool use enforces this — the `rule_id` field must match a known rule.

**2. Rules are version-controlled**
`eu_ai_act.json` is in git. Every change — including AI-extracted updates — is tracked and reviewable. If a regulation is amended, the change is visible in the diff.

**3. The AI extraction is auditable**
The ingestor logs every Claude response during law ingestion. A human can review the extracted rules before they are published to production. The AI does the work, a human approves it.

**4. Structured output via tool use**
Claude cannot return a vague or hedged response. Tool use forces a typed, structured output. Either a gap is reported with a rule ID and severity, or it is not reported. No ambiguity.
