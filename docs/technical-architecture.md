# ComplyAI — Technical Architecture Document

**Version:** 1.0  
**Date:** 2 May 2026  
**Status:** Draft  

---

## Table of contents

1. [Current state](#1-current-state)
2. [Target architecture](#2-target-architecture)
3. [Repository structure](#3-repository-structure)
4. [Backend service layer](#4-backend-service-layer)
5. [LLM abstraction layer](#5-llm-abstraction-layer)
6. [Law ingestion pipeline](#6-law-ingestion-pipeline)
7. [Classification engine](#7-classification-engine)
8. [Assessment engine and streaming](#8-assessment-engine-and-streaming)
9. [Compliance workspace API](#9-compliance-workspace-api)
10. [Database schema](#10-database-schema)
11. [Frontend architecture](#11-frontend-architecture)
12. [Prompt engineering architecture](#12-prompt-engineering-architecture)
13. [Cost architecture](#13-cost-architecture)
14. [Deployment architecture](#14-deployment-architecture)
15. [Security](#15-security)
16. [Error handling and reliability](#16-error-handling-and-reliability)
17. [Build order](#17-build-order)

---

## 1. Current state

What is actually built and working today:

```
backend/
  index.js              Express server — /health + POST /api/ingest only
  engine/
    ingestor.js         PDF → pdf-parse → Claude → validated rules → PostgreSQL + JSON
    validator.js        AJV schema validation of extracted rules
  ai/
    claudeClient.js     Anthropic SDK — extractRulesFromText()
    prompts.js          buildIngestionPrompt() + CATEGORY_META (8 categories)
    tools.js            extract_compliance_rules tool definition
  api/
    ingest.js           handleIngest() route handler
  db/
    rules.js            insertRules(), insertIngestionLog(), getRulesByCategory()

infra/db/schema.sql     PostgreSQL schema — users, intakes, reports, rules, ingestion_logs

frontend/               Next.js 14 shell — no pages, no components built yet

rules/eu_ai_act.json    Empty array — ingestion pipeline exists but has not run
```

**What the ingestion pipeline does correctly:**
- Parses PDF with pdf-parse
- Calls Claude (claude-sonnet-4-6) at temperature 0 with `tool_choice: any`
- Forces structured output via `extract_compliance_rules` tool
- Validates with AJV, deduplicates by ID
- Writes JSON to `rules/` directory and inserts to PostgreSQL
- Logs every run with token usage

**What is missing from the current codebase:**
- Classification engine (no `classify_system` tool or handler)
- Assessment engine (no compliance reasoning, no streaming)
- Intake form storage API
- Report generation
- Frontend pages and components
- LLM abstraction layer (hardcoded to Claude in `claudeClient.js`)
- Law versioning (no `law_versions` table)
- Prohibited AI detection
- `ON CONFLICT DO UPDATE` in `insertRules` — currently overwrites rules silently

---

## 2. Target architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND — Next.js 14 (Vercel)                                     │
│  pages/index.js          Landing — free text AI description         │
│  pages/intake.js         Role-aware intake form                     │
│  pages/dashboard.js      Streaming gap analysis                     │
│  pages/workspace/[id].js Compliance workspace                       │
│  pages/report/[id].js    Shareable read-only report                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ REST + SSE
┌───────────────────────────────▼─────────────────────────────────────┐
│  BACKEND — Node.js + Express (Railway)                              │
│                                                                     │
│  api/v1/                                                            │
│    classify.js     POST /api/v1/classify                            │
│    intake.js       POST /api/v1/intake                              │
│    assess.js       POST /api/v1/assess                              │
│    stream.js       GET  /api/v1/stream/:assessmentId  (SSE)         │
│    report.js       GET  /api/v1/report/:reportId                    │
│    workspace.js    GET  /api/v1/workspace/:systemId                 │
│    ingest.js       POST /api/v1/ingest  (admin, internal)           │
│                                                                     │
│  engine/                                                            │
│    ingestor.js     PDF → rules (updated: versioning + new fields)   │
│    classifier.js   NEW: free text → classification                  │
│    assessor.js     NEW: intake + rules → streaming gap analysis     │
│    differ.js       NEW: law version diff computation                │
│    scorer.js       NEW: confidence score calculation                │
│    reporter.js     NEW: PDF generation                              │
│    validator.js    AJV rule validation (existing, extended)         │
│                                                                     │
│  ai/                                                                │
│    llm/            NEW: LLM abstraction layer                       │
│      index.js      Router — picks provider per task                 │
│      anthropic.js  Claude provider (existing logic, refactored)     │
│      openai.js     NEW: OpenAI provider (V1.1)                      │
│    prompts/        NEW: versioned prompt registry                   │
│      ingestion.js  buildIngestionPrompt() (moved + extended)        │
│      classify.js   NEW: buildClassifyPrompt()                       │
│      assess.js     NEW: buildAssessPrompt()                         │
│      narrative.js  NEW: buildNarrativePrompt()                      │
│    tools/          NEW: tool definitions split by function          │
│      ingest.js     extract_compliance_rules (existing)              │
│      classify.js   NEW: classify_system                             │
│      assess.js     NEW: report_compliance_gaps                      │
│                                                                     │
│  db/                                                                │
│    pool.js         NEW: shared pg Pool (extracted from rules.js)    │
│    rules.js        updated: law_version_id, new fields              │
│    lawVersions.js  NEW: law_versions CRUD                           │
│    systems.js      NEW: ai_systems CRUD                             │
│    assessments.js  NEW: assessments + gaps CRUD                     │
│    reports.js      NEW: reports CRUD                                │
│                                                                     │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
    ┌──────────────┴───────────────┐
    │                              │
┌───▼───────────────┐    ┌─────────▼──────────┐
│  PostgreSQL        │    │  Pinecone (V2)      │
│  (Railway)         │    │  Rule embeddings    │
│                   │    │  for Q&A RAG         │
│  law_versions     │    └────────────────────┘
│  law_version_diffs│
│  prohibited_uses  │
│  rules            │
│  ai_systems       │
│  users            │
│  intakes          │
│  assessments      │
│  gaps             │
│  reports          │
│  stale_alerts     │
│  ingestion_logs   │
└───────────────────┘
```

---

## 3. Repository structure

Target directory layout. Files marked `[exists]` are already in place. Everything else needs to be built.

```
complyai/
│
├── backend/
│   ├── index.js                    [exists] — add v1 router mount
│   │
│   ├── api/
│   │   ├── ingest.js               [exists] — move to v1/, extend
│   │   ├── v1/
│   │   │   ├── classify.js         POST /api/v1/classify
│   │   │   ├── intake.js           POST /api/v1/intake
│   │   │   ├── assess.js           POST /api/v1/assess
│   │   │   ├── stream.js           GET  /api/v1/stream/:id  (SSE)
│   │   │   ├── report.js           GET  /api/v1/report/:id
│   │   │   ├── workspace.js        GET  /api/v1/workspace/:id
│   │   │   └── ingest.js           POST /api/v1/ingest  (admin)
│   │
│   ├── engine/
│   │   ├── ingestor.js             [exists] — add versioning, new fields
│   │   ├── validator.js            [exists] — extend schema for new fields
│   │   ├── classifier.js           free text → classification result
│   │   ├── assessor.js             intake + rules → gap list (streaming)
│   │   ├── differ.js               compute law version diffs
│   │   ├── scorer.js               confidence score calculation
│   │   └── reporter.js             PDF assembly
│   │
│   ├── ai/
│   │   ├── llm/
│   │   │   ├── index.js            provider router
│   │   │   ├── anthropic.js        Claude provider (refactored from claudeClient.js)
│   │   │   └── openai.js           OpenAI provider (V1.1)
│   │   │
│   │   ├── prompts/
│   │   │   ├── ingestion.js        [moved from prompts.js]
│   │   │   ├── classify.js
│   │   │   ├── assess.js
│   │   │   └── narrative.js
│   │   │
│   │   └── tools/
│   │       ├── ingest.js           [moved from tools.js]
│   │       ├── classify.js
│   │       └── assess.js
│   │
│   ├── db/
│   │   ├── pool.js                 shared pg Pool
│   │   ├── rules.js                [exists] — updated
│   │   ├── lawVersions.js
│   │   ├── systems.js
│   │   ├── assessments.js
│   │   └── reports.js
│   │
│   ├── logs/                       [exists] — ingestion run logs
│   └── package.json                [exists] — add openai, uuid deps
│
├── frontend/
│   ├── pages/
│   │   ├── index.js                Landing — describe your AI
│   │   ├── intake.js               Intake form
│   │   ├── dashboard.js            Streaming gap analysis
│   │   ├── workspace/[id].js       Compliance workspace
│   │   └── report/[id].js          Shareable read-only report
│   │
│   ├── components/
│   │   ├── ClassifyForm.js         Free text input + classification display
│   │   ├── IntakeForm.js           Role-aware question form
│   │   ├── StreamingDashboard.js   SSE consumer + gap card rendering
│   │   ├── GapCard.js              Individual gap with type badge
│   │   ├── ScoreDisplay.js         Per-law + combined score
│   │   ├── ActionChecklist.js      Typed required actions by deadline
│   │   ├── LawVersionBanner.js     Stale alert when law updates
│   │   └── DownloadButton.js       PDF trigger
│   │
│   ├── hooks/
│   │   └── useSSE.js               SSE connection management
│   │
│   └── lib/
│       └── api.js                  Typed API client
│
├── rules/
│   └── eu-ai-act/
│       └── v2024.08.01/
│           ├── metadata.json
│           └── employment_hiring.json
│
├── infra/
│   └── db/
│       ├── schema.sql              [exists] — full updated schema
│       └── migrations/
│           ├── 001_add_law_versions.sql
│           ├── 002_add_rule_fields.sql
│           └── 003_add_ai_systems.sql
│
└── docs/
    ├── prd.md                      [exists]
    └── technical-architecture.md   [this document]
```

---

## 4. Backend service layer

### index.js — mount versioned routes

```javascript
// backend/index.js
require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000' }))
app.use(express.json({ limit: '10mb' }))

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'complyai-backend' }))

// v1 API
app.use('/api/v1', require('./api/v1/router'))

// Admin (internal only — require ADMIN_KEY header)
app.use('/api/admin', require('./api/admin/router'))

app.listen(PORT, () => console.log(`ComplyAI backend running on port ${PORT}`))
```

### Request flow — classify → intake → assess → stream

```
POST /api/v1/classify
  body: { description: string, jurisdictions: string[] }
  → classifier.js → Claude classify_system tool
  → returns: { systemId, category, role, laws, effectiveDates, classificationBasis }

POST /api/v1/intake
  body: { systemId: string, answers: Record<string, string> }
  → validates answers, stores in intakes table, versions previous answers
  → returns: { intakeId }

POST /api/v1/assess
  body: { systemId: string, intakeId: string }
  → assessor.js — filters rules from DB, queues Claude reasoning
  → creates assessment record (status: 'pending')
  → returns: { assessmentId }  ← immediately

GET /api/v1/stream/:assessmentId    (SSE)
  → assessor.js streams Claude tool use response
  → each gap pushed as SSE event
  → final event: { type: 'complete', score, passed, lawVersionsUsed }
```

### db/pool.js — single shared connection pool

```javascript
// backend/db/pool.js
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('Unexpected pg pool error:', err.message)
})

module.exports = pool
```

All `db/` modules import this pool. The current `rules.js` creates its own `new Pool()` — that needs to change to `require('./pool')`.

---

## 5. LLM abstraction layer

### The problem it solves

`claudeClient.js` hardcodes Claude. The provider abstraction lets you:
- Swap the model for any step via env var
- Add OpenAI in V1.1 without touching business logic
- Run quality benchmarks across providers
- Route expensive steps (ingestion) to cheaper models at scale

### Provider interface

Every provider implements the same three functions:

```javascript
// backend/ai/llm/interface.js  (documentation only — JS duck typing)
//
// extractRules(pdfText, systemPrompt)
//   → { rules[], rawResponse, model, inputTokens, outputTokens }
//
// classifySystem(description, jurisdictions)
//   → { category, annexSection, riskLevel, role, laws[], classificationBasis,
//       followUpQuestions[], prohibitedFlagged: bool }
//
// assessCompliance(intakeAnswers, filteredRules, systemPrompt)
//   → AsyncGenerator yielding gap objects, then a final summary object
```

### anthropic.js — refactored from claudeClient.js

```javascript
// backend/ai/llm/anthropic.js
const Anthropic = require('@anthropic-ai/sdk')
const { extractComplianceRulesTool } = require('../tools/ingest')
const { classifySystemTool } = require('../tools/classify')
const { reportComplianceGapsTool } = require('../tools/assess')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Model routing per task — configurable via env
const MODELS = {
  ingest:    process.env.LLM_INGEST_MODEL    || 'claude-opus-4-7',
  classify:  process.env.LLM_CLASSIFY_MODEL  || 'claude-haiku-4-5-20251001',
  assess:    process.env.LLM_ASSESS_MODEL    || 'claude-sonnet-4-6',
  narrative: process.env.LLM_NARRATIVE_MODEL || 'claude-sonnet-4-6',
}

async function extractRules(pdfText, systemPrompt) {
  const response = await client.messages.create({
    model: MODELS.ingest,
    max_tokens: 32000,
    temperature: 0,
    tools: [extractComplianceRulesTool],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: `${systemPrompt}\n\n## EU AI Act Full Text\n\n${pdfText}` }],
  })
  const toolBlock = response.content.find(b => b.type === 'tool_use')
  if (!toolBlock) throw new Error('Claude did not call extract_compliance_rules')
  return {
    rules: toolBlock.input.rules,
    rawResponse: JSON.stringify(response.content),
    model: MODELS.ingest,
    inputTokens: response.usage?.input_tokens,
    outputTokens: response.usage?.output_tokens,
  }
}

async function classifySystem(description, jurisdictions) {
  const { buildClassifyPrompt } = require('../prompts/classify')
  const response = await client.messages.create({
    model: MODELS.classify,
    max_tokens: 2000,
    temperature: 0,
    tools: [classifySystemTool],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: buildClassifyPrompt(description, jurisdictions) }],
  })
  const toolBlock = response.content.find(b => b.type === 'tool_use')
  if (!toolBlock) throw new Error('Claude did not call classify_system')
  return toolBlock.input
}

// Returns an async generator — caller controls the stream
async function* assessCompliance(intakeAnswers, filteredRules, systemPrompt) {
  const stream = client.messages.stream({
    model: MODELS.assess,
    max_tokens: 16000,
    temperature: 0,
    system: systemPrompt,
    tools: [reportComplianceGapsTool],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: JSON.stringify({ intakeAnswers, rules: filteredRules }) }],
  })

  // Stream tool use input as it arrives — each gap is a complete object
  // claude-sdk streams tool_use input incrementally; we buffer per-gap
  let buffer = ''
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
      buffer += event.delta.partial_json
      // Try to extract complete gap objects from the buffer as they arrive
      const gaps = tryExtractGaps(buffer)
      for (const gap of gaps.complete) {
        yield { type: 'gap', data: gap }
      }
      buffer = gaps.remaining
    }
    if (event.type === 'message_stop') {
      const finalMessage = await stream.finalMessage()
      const toolBlock = finalMessage.content.find(b => b.type === 'tool_use')
      if (toolBlock) {
        yield { type: 'complete', data: toolBlock.input }
      }
    }
  }
}

module.exports = { extractRules, classifySystem, assessCompliance, MODELS }
```

### llm/index.js — provider router

```javascript
// backend/ai/llm/index.js
const providers = {
  anthropic: require('./anthropic'),
  openai:    require('./openai'),   // V1.1 — stub until built
}

function getProvider(task) {
  const env = {
    ingest:    process.env.LLM_INGEST_PROVIDER,
    classify:  process.env.LLM_CLASSIFY_PROVIDER,
    assess:    process.env.LLM_ASSESS_PROVIDER,
    narrative: process.env.LLM_NARRATIVE_PROVIDER,
  }
  const name = env[task] || 'anthropic'
  if (!providers[name]) throw new Error(`Unknown LLM provider: ${name}`)
  return providers[name]
}

module.exports = {
  extractRules:      (pdfText, prompt)             => getProvider('ingest').extractRules(pdfText, prompt),
  classifySystem:    (description, jurisdictions)  => getProvider('classify').classifySystem(description, jurisdictions),
  assessCompliance:  (answers, rules, prompt)      => getProvider('assess').assessCompliance(answers, rules, prompt),
}
```

---

## 6. Law ingestion pipeline

### What changes from the current ingestor.js

The existing ingestor is structurally correct. Four changes needed:

1. **Law versioning** — create a `law_version` record before extracting rules; link all rules to it
2. **New rule fields** — prompt and tool schema must request `requirement_type`, `certainty`, `evidence_description`, `effective_date`, `frequency`, `action_owner`
3. **No silent overwrite** — current `ON CONFLICT DO UPDATE` overwrites rules without versioning. New behaviour: new law version = new rules inserted under new `law_version_id`. Old rules get `valid_until` set.
4. **PDF hashing** — skip ingestion if SHA-256 matches an existing active `law_version`

### Updated ingestion flow

```javascript
// backend/engine/ingestor.js (key changes only)
const crypto = require('crypto')
const { createLawVersion, getActiveLawVersion, deprecateLawVersion } = require('../db/lawVersions')
const { insertRulesVersioned } = require('../db/rules')
const { computeDiff } = require('./differ')

async function ingest({ pdfPath, category, versionTag, effectiveDate, jurisdiction = 'EU' }) {
  // 1. Hash the PDF
  const pdfBuffer = fs.readFileSync(resolvedPdf)
  const sourceHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex')

  // 2. Check if this exact version already exists
  const existingVersion = await getActiveLawVersion({ jurisdiction, sourceHash })
  if (existingVersion) {
    console.log(`[ingestor] PDF hash matches existing version ${existingVersion.version_tag} — skipping`)
    return { skipped: true, existingVersionId: existingVersion.id }
  }

  // 3. Create draft law_version record
  const lawVersionId = await createLawVersion({
    jurisdiction, lawName: 'EU AI Act', versionTag, effectiveDate, sourceHash, status: 'draft',
  })

  // 4. Extract text + call Claude (existing logic)
  const pdfData = await pdfParse(pdfBuffer)
  const systemPrompt = buildIngestionPrompt(category)  // now includes new fields
  const claudeResult = await llm.extractRules(pdfData.text, systemPrompt)

  // 5. Validate (existing validator — extended for new fields)
  const { passed, failed } = validateRules(claudeResult.rules)

  // 6. Insert rules linked to law_version_id
  const previousVersion = await getPreviousActiveLawVersion({ jurisdiction, lawName: 'EU AI Act' })
  await insertRulesVersioned(passed, lawVersionId)

  // 7. Compute diff against previous version
  if (previousVersion) {
    const diff = await computeDiff(previousVersion.id, lawVersionId)
    await storeDiff(diff)
    await markStaleReports(previousVersion.id, diff.modifiedRuleIds)
  }

  // 8. Write versioned JSON
  const outputDir = path.resolve(__dirname, `../../rules/eu-ai-act/${versionTag}`)
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, `${category}.json`),
    JSON.stringify({ version: versionTag, effectiveDate, rules: passed }, null, 2))

  // 9. Promote to active (requires human review in production — flag set manually)
  // In development: auto-promote. In production: status stays 'draft' until reviewed.
  if (process.env.NODE_ENV !== 'production') {
    if (previousVersion) await deprecateLawVersion(previousVersion.id)
    await promoteLawVersion(lawVersionId)
  }

  // 10. Log run (existing logic)
  await insertIngestionLog({ ... lawVersionId ... })

  return { success: true, lawVersionId, passedValidation: passed.length }
}
```

### Ingestion CLI (unchanged interface)

```bash
# Existing interface still works
node backend/engine/ingestor.js \
  --pdf laws/eu-ai-act.pdf \
  --category employment_hiring \
  --version-tag 2024.08.01 \
  --effective-date 2024-08-01
```

---

## 7. Classification engine

### classify_system tool definition

```javascript
// backend/ai/tools/classify.js
const classifySystemTool = {
  name: 'classify_system',
  description: 'Classify an AI system under the EU AI Act and applicable US laws. Call once.',
  input_schema: {
    type: 'object',
    properties: {
      prohibited_flagged: {
        type: 'boolean',
        description: 'True if the system may fall under Article 5 prohibited AI practices.',
      },
      prohibited_article:  { type: 'string', description: 'Which Article 5 sub-clause, if flagged.' },
      prohibited_reason:   { type: 'string', description: 'Plain English reason for prohibition flag.' },
      annex_section:       { type: 'string', description: 'e.g. "Section 4(a)"' },
      category:            { type: 'string', enum: ['employment_hiring','education','essential_services',
                              'biometric','infrastructure','law_enforcement','migration','justice','NOT_IN_SCOPE'] },
      risk_level:          { type: 'string', enum: ['HIGH_RISK','LIMITED_RISK','MINIMAL_RISK','NOT_IN_SCOPE'] },
      role:                { type: 'string', enum: ['provider','deployer','both',
                              'substantially_modified','white_labelled'] },
      role_reasoning:      { type: 'string', description: 'Plain English basis for role classification.' },
      laws_triggered:      {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            law:            { type: 'string' },
            jurisdiction:   { type: 'string' },
            already_in_force: { type: 'boolean' },
            effective_date: { type: 'string' },
          },
        },
      },
      classification_basis: { type: 'string' },
      follow_up_questions:  { type: 'array', items: { type: 'string' } },
      exemption_possible:   { type: 'boolean', description: 'Whether Article 6(3) may apply.' },
    },
    required: ['prohibited_flagged', 'category', 'risk_level', 'role', 'laws_triggered', 'classification_basis'],
  },
}

module.exports = { classifySystemTool }
```

### classifier.js engine

```javascript
// backend/engine/classifier.js
const llm = require('../ai/llm')
const { createAISystem } = require('../db/systems')

async function classifySystem({ userId, description, jurisdictions }) {
  const result = await llm.classifySystem(description, jurisdictions)

  // Prohibited AI: do not create a system record, return stop signal
  if (result.prohibited_flagged) {
    return {
      prohibited: true,
      article: result.prohibited_article,
      reason: result.prohibited_reason,
      systemId: null,
    }
  }

  // Store the classified AI system
  const systemId = await createAISystem({
    userId,
    name: description.slice(0, 100),
    description,
    role: result.role,
    category: result.category,
    annexSection: result.annex_section,
    jurisdictions: result.laws_triggered.map(l => l.jurisdiction),
    lawsTriggered: result.laws_triggered,
  })

  return { prohibited: false, systemId, ...result }
}

module.exports = { classifySystem }
```

---

## 8. Assessment engine and streaming

### The streaming architecture

```
POST /api/v1/assess  → creates assessment record → returns { assessmentId } immediately
GET  /api/v1/stream/:assessmentId  → client opens SSE connection
     → assessor.js calls Claude with streaming enabled
     → each gap yielded by assessCompliance() generator → pushed as SSE event
     → 'complete' event closes the stream
```

This decoupling (assess creates, stream delivers) means:
- The POST returns instantly — no timeout risk on the HTTP request
- The SSE connection is long-lived but resumable
- If the client disconnects and reconnects, gaps already in DB can be replayed

### SSE event format

```
data: {"type":"gap","data":{"rule_id":"EU-AIA-009-1","severity":"CRITICAL","title":"Risk management system","article":"Article 9(1)","requirement_type":"document","explanation":"...","fix":"...","evidence_required":"...","effective_date":"2026-08-02","already_in_force":false,"jurisdiction":"EU","partial":false,"certainty":"established"}}

data: {"type":"gap","data":{...}}

data: {"type":"score","data":{"eu_ai_act":34,"us_ny":12,"overall":27}}

data: {"type":"complete","data":{"assessmentId":"...","totalGaps":15,"passed":["EU-AIA-013-1"],"lawVersionsUsed":[...]}}
```

### stream.js route handler

```javascript
// backend/api/v1/stream.js
const { streamAssessment } = require('../../engine/assessor')

async function handleStream(req, res) {
  const { assessmentId } = req.params

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')  // Nginx: disable buffering
  res.flushHeaders()

  const send = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  try {
    for await (const event of streamAssessment(assessmentId)) {
      send(event)
      if (event.type === 'complete') break
    }
  } catch (err) {
    send({ type: 'error', data: { message: err.message } })
  } finally {
    res.end()
  }
}
```

### assessor.js engine

```javascript
// backend/engine/assessor.js
const pool = require('../db/pool')
const llm = require('../ai/llm')
const { buildAssessPrompt } = require('../ai/prompts/assess')
const { calculateScore } = require('./scorer')
const { saveGap, saveAssessmentResult } = require('../db/assessments')

async function* streamAssessment(assessmentId) {
  // 1. Load assessment context
  const assessment = await getAssessment(assessmentId)
  const { intakeAnswers, aiSystem } = assessment

  // 2. Filter rules from DB — deterministic, exhaustive (NOT RAG)
  const { rows: rules } = await pool.query(
    `SELECT * FROM rules
     WHERE category = $1
       AND jurisdiction = ANY($2)
       AND (applies_to @> $3::jsonb OR applies_to @> '["both"]'::jsonb)
       AND valid_until IS NULL
     ORDER BY
       CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 ELSE 3 END,
       effective_date ASC`,
    [
      aiSystem.category,
      aiSystem.jurisdictions,
      JSON.stringify([aiSystem.role === 'both' ? 'provider' : aiSystem.role]),
    ]
  )

  // 3. Build system prompt
  const systemPrompt = buildAssessPrompt(aiSystem)

  // 4. Stream Claude assessment
  const gaps = []
  const passed = []
  let currentViolations = 0

  for await (const event of llm.assessCompliance(intakeAnswers, rules, systemPrompt)) {
    if (event.type === 'gap') {
      const gap = event.data
      gaps.push(gap)
      if (gap.already_in_force) currentViolations++

      // Persist gap immediately so reconnecting clients can replay
      await saveGap(assessmentId, gap)

      yield { type: 'gap', data: gap }

      // Emit running score after each gap
      const runningScore = calculateScore([...gaps])
      yield { type: 'score', data: runningScore }
    }

    if (event.type === 'complete') {
      const finalScore = calculateScore(gaps)
      const lawVersionsUsed = rules.reduce((acc, r) => {
        if (!acc.find(v => v.id === r.law_version_id)) acc.push({ id: r.law_version_id })
        return acc
      }, [])

      await saveAssessmentResult(assessmentId, {
        gaps, passed: event.data.passed, score: finalScore,
        lawVersionsUsed, containsCurrentViolations: currentViolations > 0,
      })

      yield { type: 'complete', data: { assessmentId, totalGaps: gaps.length, passed: event.data.passed, score: finalScore, lawVersionsUsed } }
    }
  }
}

module.exports = { streamAssessment }
```

### scorer.js

```javascript
// backend/engine/scorer.js
const DEDUCTIONS = { CRITICAL: 15, HIGH: 8, MEDIUM: 3 }
const CERTAINTY_WEIGHTS = {
  established: 1.0, interpretive: 0.7, pending_guidance: 0.4,
  delegated_act: 0.3, contested: 0.5,
}

function calculateScore(gaps) {
  const byJurisdiction = {}

  for (const gap of gaps) {
    const j = gap.jurisdiction
    if (!byJurisdiction[j]) byJurisdiction[j] = 100

    const deduction = DEDUCTIONS[gap.severity] || 3
    const certaintyWeight = CERTAINTY_WEIGHTS[gap.certainty] || 1.0
    const partialMultiplier = gap.partial ? 0.5 : 1.0

    byJurisdiction[j] = Math.max(0,
      byJurisdiction[j] - (deduction * certaintyWeight * partialMultiplier)
    )
  }

  const scores = Object.values(byJurisdiction)
  const overall = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 100

  return { ...byJurisdiction, overall }
}

module.exports = { calculateScore }
```

---

## 9. Compliance workspace API

```javascript
// GET /api/v1/workspace/:systemId
// Returns: current gap list, scores, law version status, audit history

async function getWorkspace(req, res) {
  const { systemId } = req.params

  const [system, latestAssessment, history, lawStatus] = await Promise.all([
    getAISystem(systemId),
    getLatestAssessment(systemId),
    getAssessmentHistory(systemId),       // all past assessments, summary only
    checkLawVersionStatus(systemId),      // are any laws used in latest assessment superseded?
  ])

  res.json({
    system,
    currentScore: latestAssessment?.score,
    gaps: latestAssessment?.gaps ?? [],
    passed: latestAssessment?.passed ?? [],
    lawVersionStatus: lawStatus,           // { current: bool, updatedLaws: [] }
    history,
  })
}
```

### Law version status check

```javascript
// backend/db/lawVersions.js
async function checkLawVersionStatus(systemId) {
  // For each law_version used in the latest assessment,
  // check if a newer active version exists
  const { rows } = await pool.query(
    `SELECT lv_used.id, lv_used.version_tag, lv_used.law_name, lv_used.jurisdiction,
            lv_current.version_tag AS current_version_tag,
            lv_current.id AS current_version_id,
            lv_current.id != lv_used.id AS is_stale
     FROM reports r
     JOIN LATERAL jsonb_array_elements(r.law_versions_used) AS lvu ON true
     JOIN law_versions lv_used ON lv_used.id = (lvu->>'id')::uuid
     JOIN law_versions lv_current ON lv_current.jurisdiction = lv_used.jurisdiction
       AND lv_current.law_name = lv_used.law_name
       AND lv_current.status = 'active'
     WHERE r.ai_system_id = $1
     ORDER BY r.created_at DESC
     LIMIT 10`,
    [systemId]
  )
  return rows
}
```

---

## 10. Database schema

Full schema including all new tables and column additions. Run as migrations against the existing schema.

### Migration 001 — law versioning

```sql
-- infra/db/migrations/001_add_law_versions.sql

CREATE TABLE law_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction     VARCHAR(20) NOT NULL,
  law_name         VARCHAR(100) NOT NULL,
  version_tag      VARCHAR(50) NOT NULL,
  official_ref     VARCHAR(100),
  effective_date   DATE NOT NULL,
  source_url       TEXT,
  source_hash      VARCHAR(64) NOT NULL,
  status           VARCHAR(20) DEFAULT 'draft'
                   CHECK (status IN ('draft', 'active', 'superseded')),
  notes            TEXT,
  ingested_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(jurisdiction, law_name, version_tag),
  UNIQUE(jurisdiction, law_name, source_hash)
);

CREATE TABLE law_version_diffs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_version_id  UUID REFERENCES law_versions(id),
  to_version_id    UUID REFERENCES law_versions(id),
  added_rule_ids   JSONB DEFAULT '[]',
  removed_rule_ids JSONB DEFAULT '[]',
  modified_rules   JSONB DEFAULT '[]',
  diff_summary     TEXT,
  computed_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prohibited_uses (
  id               VARCHAR(50) PRIMARY KEY,
  article          VARCHAR(50) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  description      TEXT NOT NULL,
  signals          JSONB DEFAULT '[]',
  effective_date   DATE NOT NULL,
  law_version_id   UUID REFERENCES law_versions(id)
);
```

### Migration 002 — rule fields

```sql
-- infra/db/migrations/002_add_rule_fields.sql

ALTER TABLE rules
  ADD COLUMN law_version_id       UUID REFERENCES law_versions(id),
  ADD COLUMN valid_from           DATE,
  ADD COLUMN valid_until          DATE,
  ADD COLUMN effective_date       DATE,
  ADD COLUMN deadline_note        TEXT,
  ADD COLUMN requirement_type     VARCHAR(20)
    CHECK (requirement_type IN ('document','test','process',
                                'disclosure','registration','contract')),
  ADD COLUMN action_owner         VARCHAR(20)
    CHECK (action_owner IN ('provider','deployer','both')),
  ADD COLUMN frequency            VARCHAR(20) DEFAULT 'one_time'
    CHECK (frequency IN ('one_time','annual','ongoing','per_deployment')),
  ADD COLUMN certainty            VARCHAR(30) DEFAULT 'established'
    CHECK (certainty IN ('established','interpretive','pending_guidance',
                         'delegated_act','contested')),
  ADD COLUMN certainty_note       TEXT,
  ADD COLUMN evidence_description TEXT,
  ADD COLUMN gdpr_interaction_note TEXT;

-- Index for rule filtering queries (hot path)
CREATE INDEX idx_rules_category_jurisdiction
  ON rules(category, jurisdiction)
  WHERE valid_until IS NULL;

CREATE INDEX idx_rules_law_version
  ON rules(law_version_id);
```

### Migration 003 — AI systems and assessments

```sql
-- infra/db/migrations/003_add_ai_systems.sql

CREATE TABLE ai_systems (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  role             VARCHAR(30)
                   CHECK (role IN ('provider','deployer','both',
                                   'substantially_modified','white_labelled')),
  category         VARCHAR(50),
  annex_section    VARCHAR(20),
  jurisdictions    JSONB DEFAULT '[]',
  laws_triggered   JSONB DEFAULT '[]',
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- Replaces the existing intakes table association
ALTER TABLE intakes ADD COLUMN ai_system_id UUID REFERENCES ai_systems(id);
ALTER TABLE intakes ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE intakes ADD COLUMN previous_intake_id UUID REFERENCES intakes(id);

-- Assessments (one per intake run)
CREATE TABLE assessments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_system_id     UUID REFERENCES ai_systems(id) ON DELETE CASCADE,
  intake_id        UUID REFERENCES intakes(id),
  status           VARCHAR(20) DEFAULT 'pending'
                   CHECK (status IN ('pending','running','complete','failed')),
  law_versions_used JSONB DEFAULT '[]',
  score_by_law     JSONB,
  contains_current_violations BOOLEAN DEFAULT false,
  created_at       TIMESTAMP DEFAULT NOW(),
  completed_at     TIMESTAMP
);

-- Individual gaps (one row per gap per assessment)
CREATE TABLE gaps (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id    UUID REFERENCES assessments(id) ON DELETE CASCADE,
  rule_id          VARCHAR(50) NOT NULL,
  severity         VARCHAR(20) NOT NULL,
  requirement_type VARCHAR(20),
  title            TEXT,
  article          TEXT,
  explanation      TEXT,
  fix              TEXT,
  evidence_required TEXT,
  effective_date   DATE,
  already_in_force BOOLEAN DEFAULT false,
  jurisdiction     VARCHAR(20),
  partial          BOOLEAN DEFAULT false,
  certainty        VARCHAR(30),
  certainty_note   TEXT,
  resolved         BOOLEAN DEFAULT false,
  resolved_at      TIMESTAMP,
  resolved_note    TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gaps_assessment ON gaps(assessment_id);
CREATE INDEX idx_gaps_unresolved ON gaps(assessment_id, resolved) WHERE NOT resolved;

-- Reports link to assessments
ALTER TABLE reports ADD COLUMN assessment_id UUID REFERENCES assessments(id);
ALTER TABLE reports ADD COLUMN ai_system_id  UUID REFERENCES ai_systems(id);
ALTER TABLE reports ADD COLUMN law_versions_used JSONB DEFAULT '[]';
ALTER TABLE reports ADD COLUMN is_stale      BOOLEAN DEFAULT false;
ALTER TABLE reports ADD COLUMN stale_reason  TEXT;
ALTER TABLE reports ADD COLUMN score_by_law  JSONB;
ALTER TABLE reports ADD COLUMN contains_current_violations BOOLEAN DEFAULT false;

-- Stale alerts
CREATE TABLE stale_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id),
  ai_system_id     UUID REFERENCES ai_systems(id),
  assessment_id    UUID REFERENCES assessments(id),
  new_version_id   UUID REFERENCES law_versions(id),
  changed_rule_ids JSONB DEFAULT '[]',
  diff_summary     TEXT,
  seen             BOOLEAN DEFAULT false,
  created_at       TIMESTAMP DEFAULT NOW()
);
```

---

## 11. Frontend architecture

### SSE hook — useSSE.js

```javascript
// frontend/hooks/useSSE.js
import { useState, useEffect, useCallback } from 'react'

export function useSSE(assessmentId) {
  const [gaps, setGaps] = useState([])
  const [score, setScore] = useState(null)
  const [status, setStatus] = useState('idle')  // idle | connecting | streaming | complete | error
  const [error, setError] = useState(null)

  const startStream = useCallback(() => {
    if (!assessmentId) return
    setStatus('connecting')

    const es = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/stream/${assessmentId}`)

    es.onmessage = (e) => {
      const event = JSON.parse(e.data)

      if (event.type === 'gap') {
        setStatus('streaming')
        setGaps(prev => {
          // Current violations always sort to top
          const next = [...prev, event.data]
          return next.sort((a, b) => {
            if (a.already_in_force !== b.already_in_force) return a.already_in_force ? -1 : 1
            const sev = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 }
            return sev[a.severity] - sev[b.severity]
          })
        })
      }
      if (event.type === 'score') setScore(event.data)
      if (event.type === 'complete') {
        setStatus('complete')
        es.close()
      }
      if (event.type === 'error') {
        setError(event.data.message)
        setStatus('error')
        es.close()
      }
    }

    es.onerror = () => {
      setError('Stream connection lost')
      setStatus('error')
      es.close()
    }

    return () => es.close()
  }, [assessmentId])

  useEffect(() => {
    const cleanup = startStream()
    return cleanup
  }, [startStream])

  return { gaps, score, status, error }
}
```

### StreamingDashboard.js — core UI component

```javascript
// frontend/components/StreamingDashboard.js
import { useSSE } from '../hooks/useSSE'
import GapCard from './GapCard'
import ScoreDisplay from './ScoreDisplay'

const TYPE_LABELS = {
  document: 'DOCUMENT', test: 'TEST', process: 'PROCESS',
  disclosure: 'DISCLOSURE', registration: 'REGISTRATION', contract: 'CONTRACT',
}

const TYPE_COLORS = {
  document: 'bg-blue-100 text-blue-800',
  test: 'bg-purple-100 text-purple-800',
  process: 'bg-yellow-100 text-yellow-800',
  disclosure: 'bg-green-100 text-green-800',
  registration: 'bg-orange-100 text-orange-800',
  contract: 'bg-red-100 text-red-800',
}

export default function StreamingDashboard({ assessmentId }) {
  const { gaps, score, status } = useSSE(assessmentId)

  const currentViolations = gaps.filter(g => g.already_in_force)
  const futureGaps = gaps.filter(g => !g.already_in_force)

  return (
    <div className="max-w-3xl mx-auto p-6">
      <ScoreDisplay score={score} loading={status === 'streaming'} />

      {currentViolations.length > 0 && (
        <section className="mb-8">
          <h2 className="text-red-600 font-bold text-lg mb-3">
            ⚠ Current violations — these laws are already in force
          </h2>
          {currentViolations.map(gap => (
            <GapCard key={gap.rule_id} gap={gap} typeColors={TYPE_COLORS} typeLabels={TYPE_LABELS} />
          ))}
        </section>
      )}

      {futureGaps.length > 0 && (
        <section>
          <h2 className="font-bold text-lg mb-3">Gaps to close before your deadline</h2>
          {futureGaps.map(gap => (
            <GapCard key={gap.rule_id} gap={gap} typeColors={TYPE_COLORS} typeLabels={TYPE_LABELS} />
          ))}
        </section>
      )}

      {status === 'complete' && gaps.length === 0 && (
        <p className="text-green-600 font-semibold">No gaps identified based on your answers.</p>
      )}

      {status === 'streaming' && (
        <p className="text-gray-500 text-sm animate-pulse mt-4">Claude is identifying gaps…</p>
      )}
    </div>
  )
}
```

---

## 12. Prompt engineering architecture

### Why prompts are code, not strings

Prompts must be versioned, tested, and swappable — not hardcoded inline. Every prompt lives in `backend/ai/prompts/` as a function that takes structured input and returns a string. This means:
- Prompts are diffable in git
- You can A/B test prompt versions
- Prompt changes are explicit code changes with a clear audit trail

### assess.js prompt — the most important prompt

```javascript
// backend/ai/prompts/assess.js
function buildAssessPrompt(aiSystem) {
  return `You are a compliance analyst specialising in EU and US AI law.

SYSTEM UNDER ASSESSMENT:
  Name: ${aiSystem.name}
  Description: ${aiSystem.description}
  Risk category: ${aiSystem.annexSection} — ${aiSystem.category}
  Role: ${aiSystem.role}
  Jurisdictions: ${aiSystem.jurisdictions.join(', ')}

YOUR TASK:
Evaluate the company's intake answers against every rule provided.
For each rule that represents a gap, call report_compliance_gaps with a gap object.
For rules the company satisfies, add the rule_id to the passed array.

RULES:
1. Every gap MUST cite a rule_id from the rules JSON provided. Never cite an article not in the dataset.
2. "Not sure" answers = partial gap. Set partial: true. State what evidence would resolve it.
3. Assess severity honestly. Do not soften CRITICAL gaps.
4. already_in_force = true if the rule's effective_date is before today (${new Date().toISOString().split('T')[0]}).
5. Surface already_in_force gaps first in your reasoning — these are current violations, not future risks.
6. certainty and certainty_note come directly from the rule — pass them through unchanged.
7. evidence_required: what the company must produce or demonstrate to close this gap.

Do not produce prose. Call the tool once with all gaps and the passed list.`
}

module.exports = { buildAssessPrompt }
```

### Prompt versioning strategy

```javascript
// backend/ai/prompts/versions.js
// When you change a prompt, increment the version.
// Old versions remain for audit purposes (reports reference which prompt version was used).

const PROMPT_VERSIONS = {
  assess:    'v1.0.0',
  classify:  'v1.0.0',
  ingest:    'v1.0.0',
  narrative: 'v1.0.0',
}

module.exports = { PROMPT_VERSIONS }
```

Store `prompt_version` in the `assessments` table so you can trace every gap to the exact prompt that generated it.

---

## 13. Cost architecture

### The two cost levers

**1. Prompt caching — the rules payload is always the same**

For every assessment, the filtered rules JSON (~88 rules, ~15k tokens) is sent to Claude. This is the same for every user who has the same category + role + jurisdiction combination. Claude's prompt caching means this repeated content is billed at ~10% of input token cost after the first call.

Enable caching by adding cache control to the rules portion of the message:

```javascript
// In assessor.js, when building the assessment message:
messages: [{
  role: 'user',
  content: [
    {
      type: 'text',
      text: JSON.stringify({ intakeAnswers }),
    },
    {
      type: 'text',
      text: JSON.stringify({ rules: filteredRules }),
      cache_control: { type: 'ephemeral' },  // Cache the rules payload
    },
  ],
}]
```

**2. Model routing — don't use Opus where Haiku works**

| Step | Model | Est. cost per call |
|---|---|---|
| Law ingestion (once per version) | claude-opus-4-7 | ~$2–5 per category | 
| Classification | claude-haiku-4-5-20251001 | ~$0.002 |
| Compliance assessment (with caching) | claude-sonnet-4-6 | ~$0.05–0.15 |
| PDF narrative | claude-sonnet-4-6 | ~$0.03 |

At 1,000 assessments/month: ~$50–150/month in Claude API costs. Caching the rules payload reduces assessment cost by ~60–70% once cache is warm.

### Token budget per assessment

```
System prompt:        ~500 tokens
Intake answers:       ~300 tokens
Filtered rules (88):  ~15,000 tokens  ← cached after first call
Output (gaps):        ~3,000–6,000 tokens

Total uncached:  ~18,000–22,000 tokens
Total cached:    ~3,800–6,500 tokens (rules portion served from cache)
```

---

## 14. Deployment architecture

### Services

| Service | Platform | Why |
|---|---|---|
| Frontend | Vercel | Next.js 14 native deployment, edge functions, free tier generous |
| Backend API | Railway | Simple Node.js deployment, managed env vars, auto-deploy from git |
| PostgreSQL | Railway (managed) | Co-located with backend, no network latency for DB queries |
| Pinecone | Pinecone cloud (V2) | Serverless tier, pay per query |

### Environment variables

```bash
# Required — backend
ANTHROPIC_API_KEY=          # Anthropic API key
DATABASE_URL=               # PostgreSQL connection string (Railway provides this)
NEXTAUTH_SECRET=            # Random 32-byte secret
ADMIN_API_KEY=              # For /api/admin routes — ingestion trigger

# LLM routing — all optional, defaults to anthropic/claude-sonnet
LLM_INGEST_PROVIDER=anthropic
LLM_CLASSIFY_PROVIDER=anthropic
LLM_ASSESS_PROVIDER=anthropic
LLM_INGEST_MODEL=claude-opus-4-7
LLM_CLASSIFY_MODEL=claude-haiku-4-5-20251001
LLM_ASSESS_MODEL=claude-sonnet-4-6

# Required — frontend
NEXT_PUBLIC_API_URL=https://api.complyai.app

# Optional — V2
PINECONE_API_KEY=
PINECONE_INDEX=complyai-rules

NODE_ENV=production
PORT=4000
```

### docker-compose.yml — development only

The existing docker-compose.yml runs PostgreSQL locally. No changes needed. The schema migrations run automatically via `docker-entrypoint-initdb.d/schema.sql`. Add migration files in numbered order — they run in sequence on first container start.

---

## 15. Security

### Input validation

Every API route validates its inputs before touching the database or calling Claude. The existing `ingest.js` route already blocks path traversal. Apply the same pattern everywhere:

```javascript
// backend/api/v1/classify.js
const { body, validationResult } = require('express-validator')

const validateClassify = [
  body('description').isString().isLength({ min: 10, max: 2000 }).trim(),
  body('jurisdictions').isArray({ min: 1, max: 20 }),
  body('jurisdictions.*').isString().isLength({ min: 2, max: 10 }),
]

async function handleClassify(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  // ...
}
```

### API key management

The `/api/v1/ingest` endpoint is for internal use only (running law ingestion). It must require an `ADMIN_API_KEY` header, not be exposed to frontend users:

```javascript
function requireAdminKey(req, res, next) {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}
```

### User data

- Intake answers may contain company-sensitive information. Store in PostgreSQL with row-level access by `user_id`. Never return another user's data.
- PDF upload (V2): virus scan before processing, store in object storage (Railway volume or S3), never execute.
- Claude receives intake answers and rules — never user PII. Intake answers should not include candidate names or personal data.

### SQL injection

All database queries use parameterised queries (`$1, $2` placeholders via `pg`). The existing `rules.js` does this correctly. Never use string concatenation for SQL.

---

## 16. Error handling and reliability

### Claude call failures

Claude API calls can fail due to rate limits, timeouts, or model errors. The assessment stream must handle these gracefully:

```javascript
// In assessor.js
const Anthropic = require('@anthropic-ai/sdk')

async function* streamAssessment(assessmentId) {
  try {
    // ... stream logic
  } catch (err) {
    await markAssessmentFailed(assessmentId, err.message)

    if (err instanceof Anthropic.RateLimitError) {
      yield { type: 'error', data: { message: 'Rate limit reached. Please try again in 60 seconds.', retryable: true } }
    } else if (err instanceof Anthropic.APITimeoutError) {
      yield { type: 'error', data: { message: 'Assessment timed out. Please try again.', retryable: true } }
    } else {
      yield { type: 'error', data: { message: 'Assessment failed. Our team has been notified.', retryable: false } }
    }
  }
}
```

### SSE reconnection

If the SSE connection drops mid-stream, the client should be able to reconnect and get gaps already identified:

```javascript
// frontend/hooks/useSSE.js — reconnection with cursor
const es = new EventSource(
  `${API_URL}/api/v1/stream/${assessmentId}?after=${gaps.length}`
)
```

The stream endpoint skips already-delivered gaps based on the `after` cursor:

```javascript
// backend/api/v1/stream.js
const after = parseInt(req.query.after || '0', 10)
// Replay persisted gaps from DB for gap index < after, then continue streaming
```

### Ingestion failures

Law ingestion is a long-running process. If it fails mid-way, the `law_version` record stays in `draft` status and can be retried. The PDF hash check prevents duplicate runs.

---

## 17. Build order

What to build and in what sequence. Each step is independently deployable.

### Phase 1 — MVP (ship this)

1. **Extend ingestor** — add law versioning (`law_version_id`), new rule fields (`requirement_type`, `certainty`, `evidence_description`), PDF hashing. Update `tools/ingest.js` schema. Update `prompts/ingestion.js`. Update `db/rules.js` to use new fields.

2. **Run ingestion** — generate the employment_hiring rules JSON with the full schema. This is the foundation all other features depend on.

3. **Classification engine** — `engine/classifier.js`, `ai/tools/classify.js`, `ai/prompts/classify.js`, `api/v1/classify.js`. Must include prohibited AI check before High Risk routing.

4. **Intake API** — `api/v1/intake.js`, `db/systems.js`. Store intake answers per AI system.

5. **Assessment engine + streaming** — `engine/assessor.js`, `engine/scorer.js`, `api/v1/assess.js`, `api/v1/stream.js`. This is the core product.

6. **LLM abstraction layer** — `ai/llm/index.js`, `ai/llm/anthropic.js`. Refactor claudeClient.js out of engine code.

7. **PDF generation** — `engine/reporter.js`. PDFKit assembly of gap list + narrative.

8. **Frontend** — `pages/index.js` (describe AI), `pages/intake.js`, `pages/dashboard.js` (SSE streaming), `hooks/useSSE.js`, core components.

9. **Migrations** — apply all three migration files to production DB.

### Phase 2 — V1.0 (workspace + integrity)

10. **Compliance workspace** — `api/v1/workspace.js`, `pages/workspace/[id].js`, `components/ActionChecklist.js`.

11. **Law version diff engine** — `engine/differ.js`, stale_alerts table, in-app notifications.

12. **Prompt versioning** — `ai/prompts/versions.js`, add `prompt_version` to assessments table.

### Phase 3 — V1.1 (multi-jurisdiction)

13. **OpenAI provider** — `ai/llm/openai.js`. Implement same interface as `anthropic.js`.

14. **NYC LL144 + Illinois AIVA ingestion** — run ingestion pipeline against US law documents, add to `law_versions`.

15. **Per-law scoring** — extend `scorer.js` to return scores by jurisdiction.

---

## Appendix — current package dependencies

```json
// backend/package.json — additions needed
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",   // bump to latest for streaming improvements
    "openai": "^4.x.x",               // V1.1 — OpenAI provider
    "express-validator": "^7.x.x",    // Input validation
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "pg": "^8.11.5",
    "ajv": "^8.17.1",
    "pdf-parse": "^1.1.1",
    "pdfkit": "^0.15.0",
    "uuid": "^9.0.1"
  }
}
```

```json
// frontend/package.json — additions needed
{
  "dependencies": {
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18",
    "swr": "^2.x.x"    // Data fetching for workspace + report pages
  }
}
```
