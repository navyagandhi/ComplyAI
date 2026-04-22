# ComplyAI — Rules Engine & AI Layer
## How the compliance checker works end to end

---

## Overview

When Sarah submits her 5-question intake form, three things happen in sequence:

1. **Rules engine** — deterministic logic maps her answers to specific EU AI Act obligations
2. **Gap analyser** — compares her answers against each obligation to produce a gap list
3. **AI layer** — Claude generates plain-English explanations, fix recommendations, and the narrative sections of the PDF

No single component does all three jobs. The rules engine is not AI. The AI layer is not doing legal reasoning. They are separate and each does what it is best at.

---

## Part 1 — The Rules Engine

### What it is

A structured JSON file (`rules/eu_ai_act.json`) containing all 88 rules that apply to hiring AI under the EU AI Act. Each rule is a discrete object with a fixed schema.

### What a rule looks like

```json
{
  "id": "EU-AIA-014-4-d",
  "article": "Article 14(4)(d)",
  "title": "Human override mechanism",
  "category": "Human Oversight",
  "severity": "CRITICAL",
  "applies_to": ["provider", "deployer"],
  "trigger": {
    "use_case": ["resume_screening", "candidate_ranking"],
    "risk_level": ["HIGH_RISK"]
  },
  "requirement": "A designated natural person must be able to disregard, override, or reverse the output of the AI system.",
  "check_field": "human_override_mechanism",
  "compliant_values": ["yes"],
  "non_compliant_values": ["no", "not_sure"],
  "deadline": "2026-08-02",
  "gap": {
    "title": "No human override mechanism",
    "explanation": "Your AI system makes or influences hiring decisions but no person has been designated with the ability to reverse or ignore its output.",
    "fix": "Assign a named role (e.g. Hiring Manager) with explicit authority to override any AI recommendation. Build a UI control that logs every override or non-override decision."
  }
}
```

### How rules are structured

Every rule has:

| Field | Purpose |
|---|---|
| `id` | Unique identifier — maps to a specific article and sub-clause |
| `article` | The exact EU AI Act citation |
| `severity` | CRITICAL / HIGH / MEDIUM — drives dashboard ordering |
| `applies_to` | Whether this obligation falls on the provider, deployer, or both |
| `trigger` | Conditions under which this rule activates (use case + risk level) |
| `check_field` | The intake form field this rule evaluates |
| `compliant_values` | Answers that satisfy the requirement |
| `non_compliant_values` | Answers that create a gap |
| `deadline` | When compliance is required |
| `gap` | Pre-written title, explanation, and fix — used in dashboard and PDF |

### The 88 rules — what they cover

All 88 rules fall into these categories:

| Category | Articles | # Rules | Example obligation |
|---|---|---|---|
| Risk Management System | Art. 9 | 12 | Ongoing risk identification and mitigation process |
| Data Governance | Art. 10 | 14 | Training data examined for bias across protected characteristics |
| Technical Documentation | Art. 11 + Annex IV | 10 | System purpose, architecture, and performance documented |
| Record Keeping & Logging | Art. 12 | 8 | Automatic logs retained for 6 months minimum |
| Transparency to Deployers | Art. 13 | 9 | Instructions for use provided to deploying company |
| Human Oversight | Art. 14 | 11 | Designated person can override any AI output |
| Accuracy & Robustness | Art. 15 | 6 | System performs consistently across demographic groups |
| AI Literacy | Art. 4 | 3 | Staff operating the AI trained on its capabilities and limits |
| Fundamental Rights | Art. 27 | 7 | Impact assessment conducted before deployment |
| Conformity Assessment | Art. 43 | 5 | Self-assessment or third-party audit completed |
| Registration | Art. 49 | 3 | System registered in EU AI Act database |

### How rules are filtered

Not all 88 rules apply to every user. Rules activate based on the trigger conditions:

```
IF use_case = "resume_screening"
AND risk_level = "HIGH_RISK"
AND role = "provider" (built it themselves)
THEN activate rules where trigger matches
```

A company that bought their AI tool (deployer) gets a different subset of rules than one that built it (provider). Both are high risk. The obligations are different.

---

## Part 2 — The Gap Analyser

### What it does

The gap analyser runs after the intake form is submitted. It is pure Node.js logic — no AI involved.

```
FOR each rule in eu_ai_act.json
  IF rule.trigger matches user's use_case and risk_level
    THEN evaluate rule.check_field against user's intake answer
      IF answer is in non_compliant_values
        ADD rule to gap_list with severity
      IF answer is in compliant_values
        MARK rule as passed
      IF answer is "not_sure"
        TREAT as non_compliant + flag for review
RETURN gap_list sorted by severity
```

### What comes out

A structured gap list:

```json
{
  "user_id": "sarah-hireflow-001",
  "risk_level": "HIGH_RISK",
  "classification_basis": "Annex III, Section 4(a)",
  "deadline": "2026-08-02",
  "total_rules_evaluated": 88,
  "passed": 12,
  "gaps": [
    {
      "id": "EU-AIA-014-4-d",
      "severity": "CRITICAL",
      "title": "No human override mechanism",
      "article": "Article 14(4)(d)",
      "explanation": "...",
      "fix": "..."
    }
  ]
}
```

This JSON object is the single source of truth for both the dashboard and the PDF.

---

## Part 3 — The AI Layer (Claude API)

### What Claude does — and what it does not do

Claude does **not** decide which rules apply. That is the rules engine's job.
Claude does **not** determine whether a gap exists. That is the gap analyser's job.

Claude's job is to make the output readable, specific, and useful to a non-lawyer.

### Where Claude is called

**1. Risk classification summary**
After risk level is determined, Claude generates a 2–3 sentence plain-English paragraph explaining what HIGH-RISK means for Sarah's specific product.

Prompt pattern:
```
The user's resume screening AI has been classified as HIGH-RISK under 
EU AI Act Annex III Section 4(a). Their system automatically scores 
and ranks candidates. They built the system themselves. They operate 
in the EU and UK.

Write a 2-3 sentence plain English summary explaining what this 
classification means for their business. No jargon. No hedging. 
Be direct.
```

**2. Gap card explanations**
Each gap card has a pre-written explanation and fix from the JSON rule. Claude is optionally called to contextualise it to the user's specific answers.

For example, if Sarah said "we built it" and "candidates are not informed," Claude generates:
> "Because you built this system yourself, you are the provider under the EU AI Act. Providers have a direct obligation under Article 26(11) to ensure candidates are informed before screening begins — this cannot be delegated to the company using your tool."

This is more useful than a generic explanation because it references what Sarah actually told us.

**3. PDF narrative sections**
The PDF has three sections that require natural language:
- Executive summary (1 paragraph)
- What this means for your business (2–3 paragraphs)
- Recommended next steps (prioritised list in plain English)

Claude generates all three, using the gap list JSON as context.

Prompt pattern:
```
You are writing an executive summary for a compliance audit report.

Company: HireFlow
AI system: Resume screening and candidate ranking tool
Risk level: HIGH-RISK
Total gaps: 14 (6 critical, 8 high)
Compliance deadline: 2 August 2026
Key gaps: [list of gap titles]

Write a concise executive summary (3-4 sentences) for a non-legal 
audience. Be factual. Be direct. Do not use legal jargon.
```

**4. Fix recommendations (enhanced)**
The JSON rule contains a base fix recommendation. Claude can expand this into a more detailed technical recommendation if the user clicks "How do I fix this?" on a gap card.

This is an optional deeper layer — not required for MVP but easy to add.

### Why this split matters

Using Claude for everything would be:
- Slow (LLM latency on every rule evaluation)
- Expensive (tokens for 88 rule checks per user)
- Unreliable (hallucination risk on legal citations)
- Hard to audit (you cannot trace why a gap was flagged)

Using only the rules engine would be:
- Legally accurate but robotic
- Unreadable to a non-lawyer
- Not actionable enough for a CTO or Head of Legal

The split gives you accuracy from structured logic and readability from Claude.

---

## Part 4 — End to End Flow

```
USER SUBMITS INTAKE FORM
         │
         ▼
┌─────────────────────┐
│   RISK CLASSIFIER   │  Pure logic
│                     │  use_case + auto_ranking = HIGH_RISK
│   Output:           │  Annex III Section 4(a)
│   risk_level        │  Deadline: 2026-08-02
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   RULES ENGINE      │  Load eu_ai_act.json
│                     │  Filter rules by trigger
│   88 rules →        │  Evaluate each check_field
│   filtered set      │  against intake answers
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   GAP ANALYSER      │  Pure Node.js
│                     │  Compare answers to
│   Output:           │  compliant_values
│   gap_list JSON     │  Sort by severity
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   CLAUDE API        │  Called 3 times:
│                     │  1. Classification summary
│   Output:           │  2. PDF narrative sections
│   Plain English     │  3. Contextualised gap text
│   text blocks       │     (where needed)
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   DASHBOARD         │  React component
│                     │  Renders gap_list JSON
│   + PDF GENERATOR   │  PDFKit assembles:
│                     │  - Claude narrative
│                     │  - Gap list with citations
│                     │  - Fix recommendations
│                     │  - Deadline summary
└─────────────────────┘
         │
         ▼
      USER DOWNLOADS PDF
      USER SHARES DASHBOARD LINK
      USER COMES BACK AND UPDATES ANSWERS
```

---

## Part 5 — What Lives Where in the Codebase

```
complyai/
├── rules/
│   └── eu_ai_act.json          ← All 88 rules. Single source of truth.
│
├── backend/
│   ├── engine/
│   │   ├── classifier.js       ← Determines risk level from intake answers
│   │   ├── ruleLoader.js       ← Loads and filters rules from JSON
│   │   └── gapAnalyser.js      ← Evaluates answers against rules
│   │
│   ├── ai/
│   │   ├── claudeClient.js     ← Anthropic SDK wrapper
│   │   └── prompts.js          ← All Claude prompt templates
│   │
│   ├── pdf/
│   │   └── reportGenerator.js  ← PDFKit — assembles gap list + Claude text
│   │
│   └── api/
│       ├── intake.js           ← POST /intake — receives form submission
│       ├── report.js           ← GET /report/:id — returns gap list JSON
│       └── pdf.js              ← GET /pdf/:id — returns generated PDF
│
└── frontend/
    ├── pages/
    │   ├── index.js            ← Landing page
    │   ├── intake.js           ← 5-question form
    │   ├── dashboard.js        ← Gap analysis view
    │   └── report/[id].js      ← Shareable report link
    │
    └── components/
        ├── GapCard.js          ← Individual gap with expand/collapse
        ├── RiskBadge.js        ← HIGH-RISK badge + classification text
        └── DownloadButton.js   ← Triggers PDF generation
```

---

## Part 6 — What Keeps This Legally Defensible

Three things make the output trustworthy rather than a black box:

**1. Every gap cites the exact source**
Article 14(4)(d) is a real citation that anyone can look up. The rules engine does not infer or interpret — it maps a known answer to a known requirement.

**2. The rules are version-controlled**
`eu_ai_act.json` is in git. Every change to a rule is tracked. If a regulation updates, you update the JSON and every future report reflects the change.

**3. Claude never makes the legal determination**
Claude only writes the explanation around a determination the rules engine already made. If Claude hallucinates a sentence, it does not affect whether a gap is flagged — that is already decided. The worst case is a slightly odd explanation, not a wrong legal conclusion.
