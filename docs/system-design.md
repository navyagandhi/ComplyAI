# ComplyAI — System Design Document

**Version:** 1.0  
**Date:** 2 May 2026  
**Audience:** Engineering team  
**Purpose:** Definitive reference for what to build, how it connects, and why each decision was made

---

## Table of contents

1. [What we are building](#1-what-we-are-building)
2. [System overview](#2-system-overview)
3. [Component map](#3-component-map)
4. [Data flows — the three core journeys](#4-data-flows)
5. [Component deep dives](#5-component-deep-dives)
6. [Database design](#6-database-design)
7. [API contract](#7-api-contract)
8. [Frontend architecture](#8-frontend-architecture)
9. [Deployment diagram](#9-deployment-diagram)
10. [Key engineering decisions](#10-key-engineering-decisions)
11. [What exists today vs what to build](#11-what-exists-today-vs-what-to-build)

---

## 1. What we are building

ComplyAI is a compliance checking tool for small companies using AI in hiring. It tells them:
- Whether the EU AI Act and US hiring AI laws apply to them
- Exactly what documents, tests, processes, and disclosures they need
- How far they are from compliance (confidence score)
- What changed when the law updates

**The product is not a rules database with a UI on top.** The intelligence is Claude. Claude reads the law, Claude classifies the AI system, Claude identifies the gaps. The database grounds Claude's output and prevents hallucination.

**The three things a user does:**
1. Describe their AI system in plain English → get classified
2. Answer 5–10 plain English questions → get a streaming gap analysis
3. Download or share an audit report PDF

**The three things that happen in the background:**
1. Law PDFs are ingested by Claude → structured rules stored in PostgreSQL
2. When a law is updated → diff computed → affected users notified
3. When a user re-assesses → score updated → report regenerated

---

## 2. System overview

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         COMPLYAI SYSTEM                                  ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │  FRONTEND  (Next.js 14 · Vercel)                                │    ║
║  │                                                                  │    ║
║  │   Landing  →  Intake  →  Dashboard  →  Workspace  →  Report    │    ║
║  └──────────────────────────┬──────────────────────────────────────┘    ║
║                             │  REST + SSE                               ║
║  ┌──────────────────────────▼──────────────────────────────────────┐    ║
║  │  BACKEND  (Node.js + Express · Railway)                          │    ║
║  │                                                                  │    ║
║  │  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │    ║
║  │  │ CLASSIFY  │  │  INTAKE   │  │  ASSESS   │  │   REPORT    │  │    ║
║  │  │ ENGINE   │  │   API     │  │  ENGINE   │  │  GENERATOR  │  │    ║
║  │  └────┬─────┘  └─────┬─────┘  └─────┬─────┘  └──────┬──────┘  │    ║
║  │       │              │              │                │          │    ║
║  │  ┌────▼──────────────▼──────────────▼────────────────▼──────┐  │    ║
║  │  │              LLM ABSTRACTION LAYER                        │  │    ║
║  │  │   Claude (default)  ·  OpenAI (V1.1)  ·  Gemini (V2)    │  │    ║
║  │  └───────────────────────────┬───────────────────────────────┘  │    ║
║  │                              │ Anthropic API                    │    ║
║  └──────────────────────────────┼──────────────────────────────────┘    ║
║                                 │                                       ║
║  ┌──────────────────────────────▼──────────────────────────────────┐    ║
║  │  DATA LAYER  (PostgreSQL · Railway)                              │    ║
║  │                                                                  │    ║
║  │  law_versions · rules · prohibited_uses · ai_systems            │    ║
║  │  users · intakes · assessments · gaps · reports · alerts        │    ║
║  └──────────────────────────────────────────────────────────────────┘    ║
║                                                                          ║
║  ┌──────────────────────────────────────────────────────────────────┐    ║
║  │  LAW KNOWLEDGE BASE  (Git + PostgreSQL)                          │    ║
║  │                                                                  │    ║
║  │  rules/eu-ai-act/v2024.08.01/employment_hiring.json             │    ║
║  │  Claude ingests PDFs → extracts rules → human review → active   │    ║
║  └──────────────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## 3. Component map

Every box below is a file or directory in the codebase. This is the complete map of what needs to exist.

```
complyai/
│
├── BACKEND  (backend/)
│   │
│   ├── API ROUTES  (api/v1/)
│   │   ├── classify.js      POST /api/v1/classify
│   │   ├── intake.js        POST /api/v1/intake
│   │   ├── assess.js        POST /api/v1/assess
│   │   ├── stream.js        GET  /api/v1/stream/:id     ← SSE
│   │   ├── workspace.js     GET  /api/v1/workspace/:id
│   │   ├── report.js        GET  /api/v1/report/:id
│   │   └── ingest.js        POST /api/v1/ingest         ← admin only
│   │
│   ├── ENGINES  (engine/)               ← business logic, no HTTP
│   │   ├── ingestor.js      PDF → rules (exists, needs updates)
│   │   ├── classifier.js    description → classification
│   │   ├── assessor.js      intake + rules → streaming gaps
│   │   ├── scorer.js        gaps → confidence score
│   │   ├── differ.js        old rules vs new rules → diff
│   │   ├── reporter.js      gaps + score → PDF
│   │   └── validator.js     AJV rule validation (exists)
│   │
│   ├── AI LAYER  (ai/)                  ← all LLM interactions
│   │   ├── llm/
│   │   │   ├── index.js     provider router
│   │   │   ├── anthropic.js Claude provider
│   │   │   └── openai.js    OpenAI provider (V1.1)
│   │   ├── prompts/
│   │   │   ├── ingestion.js prompt for PDF → rules
│   │   │   ├── classify.js  prompt for description → classification
│   │   │   ├── assess.js    prompt for intake → gaps
│   │   │   └── narrative.js prompt for PDF narrative writing
│   │   └── tools/
│   │       ├── ingest.js    extract_compliance_rules tool
│   │       ├── classify.js  classify_system tool
│   │       └── assess.js    report_compliance_gaps tool
│   │
│   └── DATABASE  (db/)                  ← SQL queries only, no logic
│       ├── pool.js          shared pg connection pool
│       ├── rules.js         rules table CRUD (exists, needs update)
│       ├── lawVersions.js   law_versions + diffs
│       ├── systems.js       ai_systems CRUD
│       ├── assessments.js   assessments + gaps CRUD
│       └── reports.js       reports CRUD
│
├── FRONTEND  (frontend/)
│   ├── pages/
│   │   ├── index.js         Step 1: describe your AI
│   │   ├── intake.js        Step 2: answer questions
│   │   ├── dashboard.js     Step 3: streaming gaps
│   │   ├── workspace/[id]   Living compliance workspace
│   │   └── report/[id]      Shareable read-only report
│   ├── components/
│   │   ├── ClassifyForm     Free text input + result display
│   │   ├── IntakeForm       Dynamic questions per role/jurisdiction
│   │   ├── StreamingDash    SSE consumer + gap rendering
│   │   ├── GapCard          Single gap with type badge + certainty
│   │   ├── ScoreDisplay     Per-law + combined score
│   │   ├── ActionChecklist  Typed required actions sorted by deadline
│   │   └── LawVersionBanner Stale alert when law updates
│   └── hooks/
│       └── useSSE.js        SSE connection + gap state management
│
├── LAW FILES  (rules/)
│   └── eu-ai-act/
│       └── v2024.08.01/
│           ├── metadata.json
│           └── employment_hiring.json
│
└── INFRA  (infra/db/)
    ├── schema.sql           Base schema (exists)
    └── migrations/
        ├── 001_law_versions.sql
        ├── 002_rule_fields.sql
        └── 003_ai_systems.sql
```

---

## 4. Data flows

### Flow 1 — Law ingestion (runs once per law update, not per user)

```
 TRIGGER: Admin runs ingestion CLI or hits POST /api/v1/ingest
 ─────────────────────────────────────────────────────────────────
 
 laws/eu-ai-act.pdf
        │
        ▼
 ┌─────────────────┐
 │  pdf-parse      │  Extracts raw text from PDF
 │  144 pages      │  Output: ~200,000 characters of text
 └────────┬────────┘
          │
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  SHA-256 hash the PDF buffer                                │
 │                                                             │
 │  Check: does this hash exist in law_versions table?         │
 │    YES → skip, return { skipped: true }                     │
 │    NO  → continue                                           │
 └────────┬────────────────────────────────────────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  Create law_version record (status: 'draft')                │
 │  { jurisdiction: 'EU', law_name: 'EU AI Act',               │
 │    version_tag: '2024.08.01', source_hash: '...', ... }     │
 └────────┬────────────────────────────────────────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  CLAUDE (claude-opus-4-7)                                   │
 │                                                             │
 │  Input:  PDF text + ingestion prompt (per category)         │
 │  Tool:   extract_compliance_rules                           │
 │  Temp:   0  (deterministic)                                 │
 │                                                             │
 │  Output: [{                                                 │
 │    id, article, title, category, annex_section,             │
 │    severity, applies_to, requirement_type,                  │
 │    certainty, certainty_note, evidence_description,         │
 │    effective_date, frequency, action_owner,                 │
 │    requirement, fix, deadline                               │
 │  }, ...]                                                    │
 └────────┬────────────────────────────────────────────────────┘
          │  ~88 rules for employment_hiring
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  AJV VALIDATOR                                              │
 │  Checks every field. Rejects rules with missing required    │
 │  fields or invalid enum values. Deduplicates by ID.         │
 │  Output: { passed: Rule[], failed: FailedRule[] }           │
 └────────┬────────────────────────────────────────────────────┘
          │  passed rules only
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  WRITE VERSIONED JSON                                        │
 │  rules/eu-ai-act/v2024.08.01/employment_hiring.json         │
 │  { version, effectiveDate, rules: [...] }                   │
 │                                                             │
 │  INSERT INTO rules (all fields + law_version_id)            │
 │  Uses INSERT ... ON CONFLICT DO NOTHING                     │
 │  (never overwrites — old rules stay as historical record)   │
 └────────┬────────────────────────────────────────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  DIFF ENGINE (if previous active version exists)            │
 │                                                             │
 │  Compare new rules vs old rules by rule_id:                 │
 │    added_rule_ids   = in new, not in old                    │
 │    removed_rule_ids = in old, not in new                    │
 │    modified_rules   = same id, different field values       │
 │                                                             │
 │  Store diff in law_version_diffs                            │
 │  Mark affected reports as is_stale = true                   │
 │  Create stale_alerts for affected users                     │
 └────────┬────────────────────────────────────────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  HUMAN REVIEW GATE                                          │
 │  In production: law_version stays 'draft'                   │
 │  Admin manually promotes to 'active' after reviewing output │
 │  Previous version marked 'superseded'                       │
 └─────────────────────────────────────────────────────────────┘

 RESULT: ~88 validated rules in PostgreSQL + versioned JSON in git
```

---

### Flow 2 — User assessment (the core product, runs per user)

```
 USER: "We use an ML model to rank resumes for engineering roles"
 ─────────────────────────────────────────────────────────────────

 STEP 1: CLASSIFY
 ────────────────
 
 POST /api/v1/classify
 { description: "...", jurisdictions: ["EU", "US-NY"] }
        │
        ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  PROHIBITED AI CHECK (runs first, always)                   │
 │                                                             │
 │  CLAUDE checks description against Article 5 signals:      │
 │    - Emotion recognition in employment context?             │
 │    - Real-time biometric ID in public spaces?               │
 │    - Social scoring?                                        │
 │                                                             │
 │  If prohibited_flagged: true                                │
 │    → Return stop signal, NO gap list, NO score              │
 │    → Show: "Your system may be prohibited under Article 5"  │
 │    → Do not proceed                                         │
 └────────┬────────────────────────────────────────────────────┘
          │  not prohibited
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  CLAUDE (claude-haiku) — classify_system tool               │
 │                                                             │
 │  Determines:                                                │
 │    category:        'employment_hiring'                     │
 │    annex_section:   'Section 4(a)'                          │
 │    risk_level:      'HIGH_RISK'                             │
 │    role:            'provider'  (or edge case variants)     │
 │    laws_triggered:  [                                       │
 │      { law: 'EU AI Act', jurisdiction: 'EU',                │
 │        already_in_force: false,                             │
 │        effective_date: '2026-08-02' },                      │
 │      { law: 'NYC LL144', jurisdiction: 'US-NY',             │
 │        already_in_force: true,                              │
 │        effective_date: '2023-07-05' }                       │
 │    ]                                                        │
 └────────┬────────────────────────────────────────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  CREATE ai_system record in DB                              │
 │  Return { systemId, category, role, laws, deadlines }       │
 │  → User reviews + confirms classification                   │
 └────────┬────────────────────────────────────────────────────┘


 STEP 2: INTAKE
 ──────────────
 
 POST /api/v1/intake
 { systemId: "...", answers: { q1: "no", q2: "not_sure", ... } }
        │
        ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  Store answers in intakes table                             │
 │  Version previous answers (increment version number)        │
 │  Return { intakeId }                                        │
 └────────┬────────────────────────────────────────────────────┘


 STEP 3: ASSESS + STREAM
 ───────────────────────
 
 POST /api/v1/assess
 { systemId: "...", intakeId: "..." }
        │
        ├─→ Create assessment record { status: 'pending' }
        └─→ Return { assessmentId }  ← IMMEDIATELY (no waiting)

 GET /api/v1/stream/:assessmentId  (SSE connection opens)
        │
        ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  SQL RULE FILTER  (deterministic, exhaustive — NOT RAG)     │
 │                                                             │
 │  SELECT * FROM rules                                        │
 │  WHERE category = 'employment_hiring'                       │
 │    AND jurisdiction IN ('EU', 'US-NY')                      │
 │    AND applies_to includes 'provider'                       │
 │    AND valid_until IS NULL                                  │
 │  ORDER BY severity ASC, effective_date ASC                  │
 │                                                             │
 │  Result: ~88 rules, ~15,000 tokens                         │
 │                                                             │
 │  WHY NOT RAG: compliance check must be exhaustive.          │
 │  A missed rule = a hidden gap. SQL guarantees every         │
 │  applicable rule is checked, nothing falls below a          │
 │  similarity threshold.                                      │
 └────────┬────────────────────────────────────────────────────┘
          │  88 rules
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  CLAUDE (claude-sonnet-4-6) — report_compliance_gaps tool  │
 │                                                             │
 │  Input:                                                     │
 │    System prompt: who they are, what role, jurisdictions    │
 │    User message part 1: intake answers                      │
 │    User message part 2: filtered rules JSON ← CACHED        │
 │                                                             │
 │  Streaming enabled. Tool use input arrives incrementally.   │
 │                                                             │
 │  For each complete gap object parsed from stream:           │
 │    → persist to gaps table                                  │
 │    → push as SSE event to client                            │
 │    → recalculate score                                      │
 │    → push score update as SSE event                         │
 └────────┬────────────────────────────────────────────────────┘
          │  gaps stream one by one
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  SSE EVENTS TO CLIENT                                       │
 │                                                             │
 │  data: {"type":"gap","data":{...}}    ← one per gap         │
 │  data: {"type":"score","data":{...}}  ← after each gap      │
 │  data: {"type":"complete","data":{}}  ← stream closes       │
 │                                                             │
 │  Current violations stream first (already_in_force: true)  │
 │  Then remaining gaps by severity DESC                       │
 └────────┬────────────────────────────────────────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  CLIENT RENDERS                                             │
 │                                                             │
 │  ⚠ CURRENT VIOLATIONS (2)                                  │
 │  [TEST] Annual bias audit · NYC LL144 · Since July 2023    │
 │  [DISCLOSURE] Notify candidates · NYC LL144 · Since 2023   │
 │                                                             │
 │  BY 2 AUGUST 2026 (13 gaps)                                │
 │  [DOCUMENT] Technical docs · Art 11 · CRITICAL             │
 │  [PROCESS] Human override · Art 14 · CRITICAL              │
 │  ...gaps animate in one by one...                           │
 │                                                             │
 │  Score: EU AI Act 34/100 · NYC LL144 12/100 · Overall 27   │
 └─────────────────────────────────────────────────────────────┘
```

---

### Flow 3 — Law update (runs when a new version of a law is published)

```
 EVENT: EU publishes amended EU AI Act (e.g. updated delegated act)
 ─────────────────────────────────────────────────────────────────

 Admin downloads new PDF
        │
        ▼
 node backend/engine/ingestor.js
   --pdf laws/eu-ai-act-2025-amendment.pdf
   --category employment_hiring
   --version-tag 2025.03.15
   --effective-date 2025-03-15
        │
        ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  Hash PDF → different from v2024.08.01 hash                 │
 │  Create new law_version record (status: 'draft')            │
 │  Run Claude ingestion → extract rules under new version_id  │
 └────────┬────────────────────────────────────────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  DIFF ENGINE                                                │
 │                                                             │
 │  Compare v2025.03.15 rules vs v2024.08.01 rules:           │
 │                                                             │
 │  added_rule_ids:   ["EU-AIA-006-3"]          (new rule)    │
 │  removed_rule_ids: []                         (none removed)│
 │  modified_rules:   [                                        │
 │    { rule_id: "EU-AIA-010-2",                               │
 │      field: "requirement",                                  │
 │      old: "Examine training data for bias...",              │
 │      new: "Examine training data for bias using the         │
 │           harmonised standard ISO/IEC 42001..." }           │
 │  ]                                                          │
 │                                                             │
 │  Claude writes plain English diff_summary:                  │
 │  "Article 10 bias examination requirement now references    │
 │   ISO/IEC 42001. 1 new rule added under Article 6."        │
 └────────┬────────────────────────────────────────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  STALE ALERT GENERATION                                     │
 │                                                             │
 │  Find all reports WHERE law_version_id = old version        │
 │  AND modified/added/removed rules affect their gap list     │
 │                                                             │
 │  INSERT INTO stale_alerts (user_id, report_id,              │
 │    new_version_id, changed_rule_ids, diff_summary)          │
 │                                                             │
 │  UPDATE reports SET is_stale = true                         │
 └────────┬────────────────────────────────────────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  USER EXPERIENCE                                            │
 │                                                             │
 │  Next time user opens workspace:                            │
 │  ┌──────────────────────────────────────────────────────┐  │
 │  │ ⚠ EU AI Act was updated on 15 March 2025.           │  │
 │  │   1 rule changed that affects your assessment.       │  │
 │  │   [Re-run assessment]                                │  │
 │  └──────────────────────────────────────────────────────┘  │
 └─────────────────────────────────────────────────────────────┘
```

---

## 5. Component deep dives

### 5.1 LLM Abstraction Layer

**Why it exists:** All LLM calls route through this layer. Business logic never imports Claude or OpenAI directly. This means you can swap providers by changing an env var, not by touching engine code.

```
                    ┌─────────────────────────────────────┐
 assessor.js ──────▶│    ai/llm/index.js  (router)        │
 classifier.js ────▶│                                     │
 ingestor.js ──────▶│  getProvider(task) {                │
 reporter.js ──────▶│    return providers[                │
                    │      process.env.LLM_{TASK}_PROVIDER │
                    │      || 'anthropic'                  │
                    │    ]                                 │
                    │  }                                   │
                    └──────────┬──────────────────────────┘
                               │
              ┌────────────────┴──────────────────┐
              │                                   │
   ┌──────────▼──────────┐           ┌────────────▼───────────┐
   │  ai/llm/anthropic.js │           │  ai/llm/openai.js      │
   │                      │           │  (V1.1 — not built yet)│
   │  extractRules()      │           │                        │
   │  classifySystem()    │           │  Same interface,       │
   │  assessCompliance()* │           │  different SDK calls   │
   │  writeNarrative()    │           └────────────────────────┘
   └──────────────────────┘
   * returns async generator

Model routing per task (all via env vars, all have defaults):

  LLM_INGEST_MODEL    = claude-opus-4-7          (quality matters, runs rarely)
  LLM_CLASSIFY_MODEL  = claude-haiku-4-5-20251001 (fast, cheap, simple task)
  LLM_ASSESS_MODEL    = claude-sonnet-4-6         (quality matters, runs per user)
  LLM_NARRATIVE_MODEL = claude-sonnet-4-6         (quality matters, runs per report)
```

### 5.2 The three Claude tool definitions

Each tool forces structured output. Claude cannot return prose for these calls — it must call the tool with valid typed JSON. This is the hallucination prevention mechanism.

```
TOOL 1: extract_compliance_rules  (ingestion)
─────────────────────────────────────────────
  Purpose: Force Claude to return rules as structured JSON array
  Called: Once per ingestion run with ALL rules in one call
  Key constraint: rule.id must match format EU-AIA-[article]-[seq]
  New fields vs current: requirement_type, certainty, certainty_note,
                         evidence_description, effective_date,
                         frequency, action_owner

TOOL 2: classify_system  (classification)
──────────────────────────────────────────
  Purpose: Force structured classification output
  Called: Once per user session
  Key fields: prohibited_flagged (bool — checked FIRST),
              category, role (5 options incl. edge cases),
              laws_triggered (array with effective dates),
              classification_basis (plain English reason)

TOOL 3: report_compliance_gaps  (assessment)
─────────────────────────────────────────────
  Purpose: Force structured gap list output
  Called: Once per assessment, BUT streamed incrementally
  Key constraint: every gap.rule_id MUST be in the rules
                  array passed to Claude. Cannot invent citations.
  Key fields per gap: rule_id, severity, requirement_type,
                      evidence_required, already_in_force,
                      partial, certainty, certainty_note
  Also returns: passed[] (rule_ids that are satisfied)
```

### 5.3 The streaming architecture

This is the most complex part of the system. Understanding why it works this way matters.

```
WHY TWO REQUESTS (POST + SSE)?
───────────────────────────────
A single POST that streams a response would:
  - Timeout on Vercel/Railway after 30-60 seconds
  - Not be resumable if the client disconnects
  - Block the HTTP request for the full assessment duration

Instead:
  POST /assess → creates assessment record (status: pending)
               → returns { assessmentId } in < 100ms
  
  GET /stream/:assessmentId → opens SSE connection
                            → assessment runs inside this long-lived connection
                            → each gap persisted to DB immediately
                            → if client disconnects + reconnects, gaps replayed from DB

HOW CLAUDE STREAMING WORKS WITH TOOL USE
─────────────────────────────────────────
Claude streams the tool input JSON incrementally:

  {"type":"input_json_delta","partial_json":"{\"gaps\":[{\"rule_id\":\"EU"}
  {"type":"input_json_delta","partial_json":"-AIA-009-1\",\"severity\":\"C"}
  {"type":"input_json_delta","partial_json":"RITICAL\",...}"}
  ...

The assessor buffers this stream and tries to extract complete gap
objects as they arrive (by watching for closing braces). Each complete
gap is immediately:
  1. Persisted to the gaps table
  2. Pushed as SSE event to the client
  3. Used to recalculate the running score

SSE EVENT SEQUENCE
──────────────────
  data: {"type":"gap","data":{...gap1...}}
  data: {"type":"score","data":{"EU":85,"US-NY":12,"overall":54}}
  data: {"type":"gap","data":{...gap2...}}
  data: {"type":"score","data":{"EU":72,"US-NY":12,"overall":44}}
  ...
  data: {"type":"complete","data":{"totalGaps":15,"passed":["EU-AIA-013-1"]}}

CLIENT RECONNECTION (cursor-based)
────────────────────────────────────
  GET /stream/:assessmentId?after=5
  → Server replays gaps[5..N] from DB, then continues streaming live
```

### 5.4 Confidence Score Calculation

```
INPUT:  array of gap objects from assessment
OUTPUT: { EU: 34, "US-NY": 12, overall: 27 }

ALGORITHM:
──────────
For each jurisdiction J:
  score[J] = 100

For each gap G:
  base_deduction = { CRITICAL: 15, HIGH: 8, MEDIUM: 3 }[G.severity]
  certainty_weight = {
    established:      1.0,
    interpretive:     0.7,
    pending_guidance: 0.4,
    delegated_act:    0.3,
    contested:        0.5,
  }[G.certainty]
  partial_multiplier = G.partial ? 0.5 : 1.0

  deduction = base_deduction × certainty_weight × partial_multiplier
  score[G.jurisdiction] = max(0, score[G.jurisdiction] - deduction)

overall = average of all jurisdiction scores (rounded)

THRESHOLDS (ComplyAI benchmarks, not legal certification):
  0-40:   Significant gaps. Not recommended for market entry.
  41-69:  Address CRITICAL gaps before market entry.
  70-89:  Core obligations addressed. Suitable for EU market entry.
  90-100: All identified gaps resolved (self-declared).

WHY CERTAINTY DISCOUNTING:
  A CRITICAL gap under "pending_guidance" means the obligation
  exists but the regulatory interpretation isn't finalised.
  Full penalty would overstate the compliance risk.
  Reduced weight reflects genuine legal uncertainty while
  still surfacing the gap as something to track.
```

### 5.5 Law versioning model

```
CORE PRINCIPLE: Rules are never deleted or overwritten.
               New law version = new rows with new law_version_id.
               Old rows stay with valid_until set.

law_versions table:
  id          ← UUID, FK from rules
  version_tag ← '2024.08.01', '2025.03.15'
  source_hash ← SHA-256 of PDF — deduplication key
  status      ← 'draft' | 'active' | 'superseded'

State machine:
  draft ──── human review ────▶ active
  active ─── new version ─────▶ superseded
  
  Only ONE active version per (jurisdiction, law_name) at a time.

RULE LIFECYCLE:
  Rule inserted under law_version_id = v1
  v2 ingested → same rule_id, different requirement text
  → New row inserted with law_version_id = v2, valid_from = today
  → Old row updated: valid_until = today
  
  Current rules query:  WHERE valid_until IS NULL
  Historical query:     WHERE valid_from <= :date AND (valid_until IS NULL OR valid_until > :date)

WHY GIT + DATABASE:
  Database:  runtime query performance
  Git:       human-readable diff history, code review before activation
  Both updated on every ingestion run.
  Git is the audit trail. DB is the query surface.
```

---

## 6. Database design

### Entity relationship overview

```
users
  │
  └──▶ ai_systems (one user, many AI systems)
            │
            ├──▶ intakes (one system, many intake versions)
            │
            └──▶ assessments (one intake → one assessment)
                      │
                      ├──▶ gaps (one assessment, many gaps)
                      │         each gap references rules.id
                      │
                      └──▶ reports (one assessment → one PDF report)

law_versions
  │
  └──▶ rules (one version, many rules)
  │
  └──▶ law_version_diffs (between two versions)
  │
  └──▶ stale_alerts (notifies users when their version is superseded)
  │
  └──▶ prohibited_uses (Article 5 — separate from rules)
```

### Core tables — column reference

```
TABLE: law_versions
  id               UUID PK
  jurisdiction     VARCHAR(20)     'EU', 'US-NY', 'US-IL'
  law_name         VARCHAR(100)    'EU AI Act', 'NYC Local Law 144'
  version_tag      VARCHAR(50)     '2024.08.01'
  official_ref     VARCHAR(100)    'OJ L 2024/1689'
  effective_date   DATE
  source_url       TEXT
  source_hash      VARCHAR(64)     SHA-256 — deduplication key
  status           VARCHAR(20)     'draft' | 'active' | 'superseded'
  notes            TEXT
  ingested_at      TIMESTAMP
  UNIQUE(jurisdiction, law_name, version_tag)
  UNIQUE(jurisdiction, law_name, source_hash)

TABLE: rules
  id               VARCHAR(50) PK  'EU-AIA-009-1'
  law_version_id   UUID FK → law_versions
  valid_from       DATE
  valid_until      DATE            NULL = currently active
  effective_date   DATE            when obligation becomes enforceable
  deadline_note    TEXT            plain English deadline context
  law              VARCHAR(50)
  jurisdiction     VARCHAR(20)
  article          VARCHAR(100)    'Article 9(1)'
  title            VARCHAR(255)
  category         VARCHAR(50)     'employment_hiring'
  annex_section    VARCHAR(20)     'Section 4(a)'
  severity         VARCHAR(20)     'CRITICAL' | 'HIGH' | 'MEDIUM'
  applies_to       JSONB           '["provider"]' | '["deployer"]' | '["provider","deployer"]'
  requirement_type VARCHAR(20)     'document' | 'test' | 'process' | 'disclosure' | 'registration' | 'contract'
  action_owner     VARCHAR(20)     'provider' | 'deployer' | 'both'
  frequency        VARCHAR(20)     'one_time' | 'annual' | 'ongoing' | 'per_deployment'
  certainty        VARCHAR(30)     'established' | 'interpretive' | 'pending_guidance' | 'delegated_act' | 'contested'
  certainty_note   TEXT
  evidence_description TEXT        what to produce to satisfy this requirement
  requirement      TEXT            plain English obligation
  non_compliance_signal TEXT       what a non-compliant company is missing
  fix              TEXT            concrete actionable recommendation
  deadline         DATE
  related_articles JSONB
  gdpr_interaction_note TEXT
  ingestion_run_id UUID FK → ingestion_logs

INDEX: idx_rules_active ON rules(category, jurisdiction) WHERE valid_until IS NULL
INDEX: idx_rules_version ON rules(law_version_id)

TABLE: prohibited_uses
  id               VARCHAR(50) PK  'ART5-1-F'
  article          VARCHAR(50)     'Article 5(1)(f)'
  title            VARCHAR(255)    'Emotion recognition in employment'
  description      TEXT
  signals          JSONB           keywords Claude looks for in system description
  effective_date   DATE            '2025-02-02' — already in force
  law_version_id   UUID FK → law_versions

TABLE: ai_systems
  id               UUID PK
  user_id          UUID FK → users
  name             TEXT
  description      TEXT
  role             VARCHAR(30)     'provider' | 'deployer' | 'both' | 'substantially_modified' | 'white_labelled'
  category         VARCHAR(50)
  annex_section    VARCHAR(20)
  jurisdictions    JSONB           '["EU","US-NY"]'
  laws_triggered   JSONB           [{law, jurisdiction, already_in_force, effective_date}]
  created_at       TIMESTAMP
  updated_at       TIMESTAMP

TABLE: intakes
  id               UUID PK
  user_id          UUID FK → users
  ai_system_id     UUID FK → ai_systems
  answers          JSONB           {q1: "yes", q2: "not_sure", ...}
  version          INTEGER         increments on each update
  previous_intake_id UUID FK → intakes
  created_at       TIMESTAMP
  updated_at       TIMESTAMP

TABLE: assessments
  id               UUID PK
  ai_system_id     UUID FK → ai_systems
  intake_id        UUID FK → intakes
  status           VARCHAR(20)     'pending' | 'running' | 'complete' | 'failed'
  law_versions_used JSONB          [{id, law_name, version_tag, jurisdiction}]
  score_by_law     JSONB           {EU: 34, "US-NY": 12, overall: 27}
  contains_current_violations BOOLEAN
  prompt_version   VARCHAR(20)     'v1.0.0' — which prompt generated this
  created_at       TIMESTAMP
  completed_at     TIMESTAMP

TABLE: gaps
  id               UUID PK
  assessment_id    UUID FK → assessments
  rule_id          VARCHAR(50)     must match rules.id
  severity         VARCHAR(20)
  requirement_type VARCHAR(20)
  title            TEXT
  article          TEXT
  explanation      TEXT            contextual to user's intake answers
  fix              TEXT
  evidence_required TEXT
  effective_date   DATE
  already_in_force BOOLEAN         effective_date < NOW()
  jurisdiction     VARCHAR(20)
  partial          BOOLEAN         true = "not sure" answer
  certainty        VARCHAR(30)
  certainty_note   TEXT
  resolved         BOOLEAN DEFAULT false
  resolved_at      TIMESTAMP
  resolved_note    TEXT            'Self-declared by user on date'
  created_at       TIMESTAMP

INDEX: idx_gaps_assessment ON gaps(assessment_id)
INDEX: idx_gaps_active ON gaps(assessment_id) WHERE NOT resolved

TABLE: reports
  id               UUID PK
  user_id          UUID FK → users
  ai_system_id     UUID FK → ai_systems
  assessment_id    UUID FK → assessments
  intake_id        UUID FK → intakes
  risk_level       VARCHAR(50)
  classification_basis TEXT
  gap_list         JSONB
  compliance_score INTEGER          overall score
  score_by_law     JSONB
  law_versions_used JSONB
  is_stale         BOOLEAN DEFAULT false
  stale_reason     TEXT
  contains_current_violations BOOLEAN
  file_path        TEXT             path to generated PDF
  created_at       TIMESTAMP

TABLE: stale_alerts
  id               UUID PK
  user_id          UUID FK → users
  ai_system_id     UUID FK → ai_systems
  assessment_id    UUID FK → assessments
  new_version_id   UUID FK → law_versions
  changed_rule_ids JSONB
  diff_summary     TEXT
  seen             BOOLEAN DEFAULT false
  created_at       TIMESTAMP

TABLE: law_version_diffs
  id               UUID PK
  from_version_id  UUID FK → law_versions
  to_version_id    UUID FK → law_versions
  added_rule_ids   JSONB
  removed_rule_ids JSONB
  modified_rules   JSONB   [{rule_id, field, old_value, new_value}]
  diff_summary     TEXT    Claude-generated plain English
  computed_at      TIMESTAMP

TABLE: ingestion_logs  (exists — no changes needed)
  id, pdf_path, category, model, total_extracted,
  passed_validation, failed_validation, output_file,
  raw_response, created_at
```

---

## 7. API contract

All endpoints under `/api/v1/`. All requests/responses are `application/json` except the SSE stream.

```
POST /api/v1/classify
─────────────────────
Request:
  {
    "description":   string  (10–2000 chars)
    "jurisdictions": string[] (["EU", "US-NY", "US-IL"])
  }

Response 200 — not prohibited:
  {
    "prohibited":          false,
    "systemId":            "uuid",
    "category":            "employment_hiring",
    "annexSection":        "Section 4(a)",
    "riskLevel":           "HIGH_RISK",
    "role":                "provider",
    "roleReasoning":       "You described building the model...",
    "lawsTriggered":       [
      { "law": "EU AI Act", "jurisdiction": "EU",
        "alreadyInForce": false, "effectiveDate": "2026-08-02" },
      { "law": "NYC Local Law 144", "jurisdiction": "US-NY",
        "alreadyInForce": true, "effectiveDate": "2023-07-05" }
    ],
    "classificationBasis": "Your system...",
    "exemptionPossible":   false,
    "followUpQuestions":   []
  }

Response 200 — prohibited AI flagged:
  {
    "prohibited":    true,
    "article":       "Article 5(1)(f)",
    "reason":        "Your system appears to use emotion recognition in employment...",
    "systemId":      null
  }


POST /api/v1/intake
───────────────────
Request:
  {
    "systemId": "uuid",
    "answers": {
      "q_risk_mgmt":      "no",
      "q_tech_docs":      "not_sure",
      "q_human_override": "yes",
      "q_bias_test":      "no",
      ...
    }
  }

Response 200:
  { "intakeId": "uuid" }


POST /api/v1/assess
───────────────────
Request:
  { "systemId": "uuid", "intakeId": "uuid" }

Response 200 — returns immediately:
  { "assessmentId": "uuid" }


GET /api/v1/stream/:assessmentId
─────────────────────────────────
Headers: Accept: text/event-stream
Query:   ?after=N  (optional — resume from gap N, 0-indexed)

Response: text/event-stream

Events:
  data: {"type":"gap","data":{
    "ruleId":"EU-AIA-009-1",
    "severity":"CRITICAL",
    "requirementType":"document",
    "title":"Risk management system",
    "article":"Article 9(1)",
    "explanation":"You indicated no risk management system exists...",
    "fix":"Create a risk register...",
    "evidenceRequired":"Documented risk management system covering...",
    "effectiveDate":"2026-08-02",
    "alreadyInForce":false,
    "jurisdiction":"EU",
    "partial":false,
    "certainty":"established",
    "certaintyNote":null
  }}

  data: {"type":"score","data":{"EU":85,"US-NY":12,"overall":51}}

  data: {"type":"complete","data":{
    "assessmentId":"uuid",
    "totalGaps":15,
    "passed":["EU-AIA-013-1","EU-AIA-013-2"],
    "score":{"EU":34,"US-NY":12,"overall":27},
    "lawVersionsUsed":[
      {"id":"uuid","lawName":"EU AI Act","versionTag":"2024.08.01","jurisdiction":"EU"},
      {"id":"uuid","lawName":"NYC Local Law 144","versionTag":"2023.07.01","jurisdiction":"US-NY"}
    ]
  }}

  data: {"type":"error","data":{"message":"...","retryable":true}}


GET /api/v1/workspace/:systemId
────────────────────────────────
Response 200:
  {
    "system": { id, name, description, role, category, jurisdictions },
    "currentScore": { "EU": 34, "US-NY": 12, "overall": 27 },
    "gaps": [ ...gap objects... ],
    "passed": [ ...rule_ids... ],
    "lawVersionStatus": [
      { "lawName": "EU AI Act", "jurisdiction": "EU",
        "usedVersion": "2024.08.01", "currentVersion": "2024.08.01",
        "isStale": false }
    ],
    "staleAlerts": [ ...unseeen alerts... ],
    "history": [
      { "assessmentId": "uuid", "date": "2026-05-02",
        "score": 27, "gapCount": 15, "lawVersions": [...] }
    ]
  }


GET /api/v1/report/:reportId
──────────────────────────────
Response 200:
  {
    "reportId":   "uuid",
    "systemName": "...",
    "score":      { "EU": 34, "US-NY": 12, "overall": 27 },
    "lawVersionsUsed": [...],
    "generatedAt": "2026-05-02T10:00:00Z",
    "isStale":    false,
    "pdfUrl":     "/api/v1/report/:id/pdf",
    "gaps":       [...],
    "passed":     [...]
  }

GET /api/v1/report/:reportId/pdf
──────────────────────────────────
Response: application/pdf

POST /api/v1/ingest  (admin — requires X-Admin-Key header)
──────────────────────────────────────────────────────────
Request:
  {
    "pdfPath":       "laws/eu-ai-act.pdf",
    "category":      "employment_hiring",
    "versionTag":    "2024.08.01",
    "effectiveDate": "2024-08-01",
    "jurisdiction":  "EU"
  }

Response 200:
  {
    "success":          true,
    "lawVersionId":     "uuid",
    "passedValidation": 88,
    "failedValidation": 2,
    "skipped":          false
  }
```

---

## 8. Frontend architecture

### Page flow

```
  /  (index.js)
  ├─ ClassifyForm component
  │   User types: "We use ML to rank resumes"
  │   POST /api/v1/classify
  │   If prohibited → show stop-sign page
  │   If classified → show classification result + confirm button
  │
  ▼
  /intake (intake.js)
  ├─ IntakeForm component
  │   Questions loaded based on { category, role, jurisdictions }
  │   "Not sure" available on every question
  │   Guided follow-ups for "not sure" answers
  │   POST /api/v1/intake → get intakeId
  │   POST /api/v1/assess → get assessmentId
  │
  ▼
  /dashboard (dashboard.js)
  ├─ StreamingDashboard component
  │   useSSE(assessmentId) hook opens SSE connection
  │   Gaps animate in as they stream
  │   Current violations section renders first
  │   ScoreDisplay updates after each gap
  │   "Download Report" button appears on 'complete' event
  │
  ▼
  /workspace/[systemId] (workspace/[id].js)
  ├─ Full compliance workspace
  │   ActionChecklist — typed actions by deadline
  │   LawVersionBanner — stale alert if law updated
  │   Audit history timeline
  │   Share link generator
  │
  ▼
  /report/[reportId] (report/[id].js)
  └─ Read-only shareable view
      Shows report without ability to edit
      PDF download button
```

### Component responsibility boundaries

```
ClassifyForm
  Owns: description text input, jurisdiction selector
  Calls: POST /api/v1/classify
  Renders: classification result card + prohibited AI warning
  Does NOT: know about intake or assessment

IntakeForm
  Owns: dynamic question rendering, answer state
  Receives: { category, role, jurisdictions } from classify result
  Questions are generated client-side from a questions registry
    (not fetched from API — no DB round trip for question text)
  Calls: POST /api/v1/intake → POST /api/v1/assess
  Does NOT: render gaps

StreamingDashboard
  Owns: SSE connection lifecycle, gap state, score state
  Uses: useSSE(assessmentId) hook
  Renders: GapCard for each gap as it arrives
  Sorts: already_in_force gaps first, then by severity
  Does NOT: fetch — only consumes SSE stream

GapCard
  Owns: rendering of a single gap
  Props: gap object (all fields)
  Renders:
    - Requirement type badge (DOCUMENT / TEST / PROCESS / DISCLOSURE)
    - Severity badge (CRITICAL / HIGH / MEDIUM)
    - "CURRENT VIOLATION" badge if already_in_force
    - Article citation
    - Plain English explanation
    - What to produce (evidence_required)
    - Certainty note if not 'established'
  Does NOT: make API calls

ScoreDisplay
  Props: score object { EU: 34, "US-NY": 12, overall: 27 }, loading: bool
  Renders per-law bars + overall score
  Animates score changes as gaps arrive

useSSE hook (hooks/useSSE.js)
  Manages: EventSource lifecycle, reconnection, cursor tracking
  State: gaps[], score, status, error
  Reconnects with ?after=N cursor if connection drops
  Closes connection on 'complete' or 'error' event
```

---

## 9. Deployment diagram

```
┌───────────────────────────────────────────────────────────────┐
│  INTERNET                                                     │
└───────────────┬───────────────────────────────────────────────┘
                │ HTTPS
    ┌───────────┴─────────────┐      ┌──────────────────────────┐
    │  Vercel Edge Network    │      │  Railway                  │
    │                         │      │                           │
    │  frontend/              │      │  backend/  (Node.js)      │
    │  Next.js 14             │─────▶│  port 4000                │
    │  complyai.app           │      │  api.complyai.app         │
    └─────────────────────────┘      └──────────┬────────────────┘
                                                │
                                    ┌───────────┴────────────────┐
                                    │  Railway Managed Postgres   │
                                    │  complyai DB               │
                                    │  port 5432 (private)       │
                                    └────────────────────────────┘
                                                │
                                    (V2) ───────▼────────────────┐
                                    │  Pinecone                  │
                                    │  complyai-rules index      │
                                    └────────────────────────────┘

EXTERNAL CALLS FROM BACKEND:
  api.anthropic.com   ← all LLM calls (classify, assess, ingest, narrative)

ENVIRONMENT SEPARATION:
  development:  docker-compose PostgreSQL (port 5432) + local Express (4000) + local Next.js (3000)
  staging:      Railway (separate project) + Vercel preview deploys
  production:   Railway + Vercel production

RAILWAY SERVICES:
  complyai-backend   Node.js — auto-deploy from main branch
  complyai-db        PostgreSQL 15 — managed, private networking

SECRETS (Railway env vars — never in code):
  ANTHROPIC_API_KEY
  DATABASE_URL        (Railway injects automatically for linked DB)
  ADMIN_API_KEY       (for /api/v1/ingest)
  NEXTAUTH_SECRET

VERCEL ENV VARS:
  NEXT_PUBLIC_API_URL = https://api.complyai.app
```

---

## 10. Key engineering decisions

### Decision 1 — SQL filtering, not RAG, for the compliance check

**The rule:** compliance assessment queries rules using SQL `WHERE` clauses, not vector similarity search.

**Why:** RAG retrieves the top-K most semantically similar chunks. For compliance, you need every applicable rule checked — missing one rule means a hidden gap the user never sees. SQL with indexed filters on `(category, jurisdiction, applies_to, valid_until)` is deterministic and exhaustive. At MVP scale (88 rules), the entire filtered set fits in Claude's context window with room to spare. RAG is appropriate for follow-up Q&A (V2) where exhaustiveness is less critical than relevance.

### Decision 2 — Prohibited AI check runs before everything else

**The rule:** `classify_system` tool checks for Article 5 prohibited AI before routing to any Annex III category.

**Why:** A prohibited AI system should not receive a compliance gap list — that implies there is a path to compliance. There is not. The check must be first, hardcoded, and impossible to skip in the flow.

### Decision 3 — Rules are never deleted or overwritten

**The rule:** When a new law version is ingested, new rule rows are inserted with the new `law_version_id`. Old rows get `valid_until` set. Reports permanently reference which version of the law they were assessed against.

**Why:** A company could be audited by a regulator 18 months after their report was generated. The report must accurately reflect the law as it stood at that time. If we overwrote rules, we would lose the ability to reproduce any historical assessment.

### Decision 4 — LLM abstraction layer with env var routing

**The rule:** No engine file imports Claude or OpenAI directly. All imports go through `ai/llm/index.js`.

**Why:** Provider lock-in is a business risk. OpenAI has more enterprise traction. Gemini has a 1M token context window useful for large legal documents. At scale, open-source models (Llama) could reduce ingestion costs. The abstraction costs one indirection and saves the business from a complete rewrite when provider strategy changes.

### Decision 5 — POST to create assessment, SSE to stream results

**The rule:** `POST /assess` creates an assessment record and returns `{ assessmentId }` immediately. The SSE connection at `GET /stream/:id` drives the actual Claude call and streams results.

**Why:** Vercel and Railway both have HTTP timeout limits (30–60 seconds). A Claude assessment runs for 10–45 seconds. Separating creation from streaming lets the POST return instantly and the SSE connection run as long as needed. It also makes reconnection trivial — gaps are persisted as they stream, so a reconnecting client can replay from a cursor.

### Decision 6 — Prompt versioning as code

**The rule:** Every prompt is a function in `ai/prompts/`, versioned in `ai/prompts/versions.js`. The version is stored in the `assessments` table.

**Why:** Prompts are the core product logic. Changing a prompt changes compliance reasoning output. You need to know exactly which prompt produced each assessment — for debugging, for quality review, and for reproducing historical results. Inline strings with no versioning make this impossible.

### Decision 7 — Human review gate before law version goes active

**The rule:** Law versions are created with `status: 'draft'`. In production, they do not go active until a human reviews the extracted rules and manually promotes them.

**Why:** Claude extracts rules from legal text at high accuracy but not 100% accuracy. A miscategorised rule (e.g. wrong `applies_to`, wrong `severity`) would be served to every user who falls into that category. The human review gate is the quality checkpoint before AI-extracted content reaches production users. This is also the legal defensibility argument: "AI-extracted rules reviewed by a human before deployment."

---

## 11. What exists today vs what to build

### What exists and works

| File | Status | Notes |
|---|---|---|
| `backend/engine/ingestor.js` | ✅ Works | Needs: versioning, new fields, PDF hashing |
| `backend/engine/validator.js` | ✅ Works | Needs: schema updated for new fields |
| `backend/ai/claudeClient.js` | ✅ Works | Refactor into `ai/llm/anthropic.js` |
| `backend/ai/prompts.js` | ✅ Works | Move to `ai/prompts/ingestion.js`, extend |
| `backend/ai/tools.js` | ✅ Works | Move to `ai/tools/ingest.js`, extend fields |
| `backend/api/ingest.js` | ✅ Works | Move to `api/v1/ingest.js` |
| `backend/db/rules.js` | ✅ Works | `insertRules` has ON CONFLICT DO UPDATE — must change to versioned insert |
| `infra/db/schema.sql` | ✅ Works | Apply 3 migrations on top |
| `docker-compose.yml` | ✅ Works | No changes needed |
| `backend/index.js` | ✅ Works | Add v1 router mount |
| `backend/package.json` | ✅ Works | Add express-validator, openai |

### What needs to be built — priority order

```
PHASE 1 — MVP CRITICAL PATH
────────────────────────────
1. Run migrations 001, 002, 003 against the DB
2. Extend ingestor: PDF hashing, law_version_id, new rule fields
3. Extend tools/ingest.js: add new fields to extract_compliance_rules schema
4. Extend prompts/ingestion.js: ask Claude for new fields
5. Run ingestion on eu-ai-act.pdf to populate employment_hiring rules
6. Build ai/llm/ abstraction layer (anthropic.js, index.js)
7. Build ai/tools/classify.js (classify_system tool with prohibited AI check)
8. Build ai/prompts/classify.js
9. Build engine/classifier.js
10. Build api/v1/classify.js
11. Build ai/tools/assess.js (report_compliance_gaps tool)
12. Build ai/prompts/assess.js
13. Build engine/assessor.js (streaming generator)
14. Build engine/scorer.js
15. Build api/v1/assess.js + api/v1/stream.js
16. Build db/systems.js, db/assessments.js
17. Build engine/reporter.js (PDF generation)
18. Build api/v1/report.js
19. Build frontend pages: index, intake, dashboard
20. Build frontend components: ClassifyForm, IntakeForm, StreamingDashboard, GapCard, ScoreDisplay
21. Build hooks/useSSE.js

PHASE 2 — WORKSPACE + INTEGRITY
─────────────────────────────────
22. Build api/v1/workspace.js
23. Build frontend: workspace page + ActionChecklist + LawVersionBanner
24. Build engine/differ.js (law version diffs)
25. Build stale alert generation in ingestor
26. Add prompt versioning (versions.js + store in assessments table)

PHASE 3 — MULTI-JURISDICTION
──────────────────────────────
27. Build ai/llm/openai.js (OpenAI provider)
28. Run ingestion for NYC LL144 + Illinois AIVA
29. Update scorer.js for per-jurisdiction scores
30. Update classify prompt for US law jurisdiction detection
```

### The one thing to do first

Before anything else: update `backend/db/rules.js` to remove the `ON CONFLICT DO UPDATE` behaviour. The current code silently overwrites rules. Once law versioning is added, an overwrite would corrupt the version history. Change it to `ON CONFLICT DO NOTHING` (new rules per new version) before any further development.
