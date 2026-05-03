# ComplyAI — Product Requirements Document

**Version:** 2.0  
**Date:** 2 May 2026  
**Status:** Draft  
**Owner:** Navya Gandhi

---

## Table of contents

1. [Problem statement](#1-problem-statement)
2. [Product vision](#2-product-vision)
3. [Target users](#3-target-users)
4. [Core user journey](#4-core-user-journey)
5. [Why this is an AI product](#5-why-this-is-an-ai-product)
6. [Critical product integrity constraints](#6-critical-product-integrity-constraints)
7. [Feature requirements](#7-feature-requirements)
8. [Data model](#8-data-model)
9. [System architecture](#9-system-architecture)
10. [What ComplyAI is not](#10-what-complyai-is-not)
11. [Non-functional requirements](#11-non-functional-requirements)
12. [Phased roadmap](#12-phased-roadmap)
13. [Open questions](#13-open-questions)

---

## 1. Problem statement

Small companies building or deploying AI systems in high-risk industries — hiring, finance, education — are facing a compliance crisis they do not know how to navigate.

**The EU AI Act is already partially in force:**
- **February 2025** — Prohibited AI provisions (Article 5) apply now. Operating a banned system today is already a violation.
- **August 2025** — General Purpose AI model obligations apply.
- **August 2026** — Full High Risk AI obligations (Articles 9–49). Fines up to €30M or 6% of global revenue.
- **August 2027** — Grace period ends for High Risk AI already on market before August 2026.

**US hiring AI laws are already in effect:**
- **NYC Local Law 144** — mandatory annual bias audit for hiring AI, in effect since July 2023. Companies hiring in New York City are likely already non-compliant today.
- **Illinois AI Video Interview Act** — disclosure and consent required since 2020.
- **California AB 2930** — effective January 2026.
- **Colorado SB 205** — effective February 2026.

Most affected companies share the same problems:

1. **They do not know whether the law applies to them** — and whether they are a provider (built the AI) or a deployer (use someone else's AI), which determines fundamentally different obligation sets.
2. **They do not know what they are required to produce** — the EU AI Act's Annex IV is a numbered checklist of required documentation. Most founders have never read it.
3. **They do not know which obligations are already in force** — not everything is due August 2026. Some provisions are active now and actively being violated today.
4. **They do not know how to demonstrate compliance** — regulators, enterprise customers, and investors are asking for evidence now.

Hiring a law firm costs €50,000–€200,000 for a compliance review. No small company can afford that before they know whether they even have a problem.

ComplyAI solves this. It ingests the raw legal text using AI. It classifies your system. It identifies whether your system might be prohibited before assuming it is merely High Risk. It tells you — based on your role — exactly what documents to produce, what tests to run, what processes to implement, and what disclosures to make, for every law that applies in every jurisdiction where you operate. It tracks your progress. It generates a timestamped, cited audit report you can share with customers, regulators, and investors.

---

## 2. Product vision

**ComplyAI is the compliance operating system for companies using AI in high-risk industries.**

It ingests the raw legal text. It classifies your AI system. It tells you exactly what you need to fix. It tracks your progress over time. It alerts you when the law changes and your report becomes stale.

The core promise: **know your gaps in under 5 minutes. Know your compliance status at any time. Never be surprised by a regulator.**

This is not a one-time report. It is a living compliance workspace. The audit report PDF is the output. The workspace is the product.

---

## 3. Target users

### Primary personas

| Persona | Role | Company | Core problem |
|---|---|---|---|
| **Sarah** | Head of Product | 40-person HR tech startup | Built resume screening AI. About to close first EU enterprise customer asking for compliance documentation. |
| **James** | VP Engineering | 200-person recruiting platform | Integrating HireVue into their ATS. Unsure whether obligations fall on them as a deployer or entirely on HireVue. |
| **Priya** | Head of Compliance | Fintech lender | Credit scoring AI under regulatory review. Needs to demonstrate EU AI Act readiness to the board. |
| **Marcus** | CTO | EdTech platform | Student scoring AI expanding to EU universities. Legal team flagging exposure. |

### Secondary personas — report recipients

- **CTO / Engineering Lead** — receives gap list as a technical backlog. Needs concrete fixes, not legal language.
- **Head of Legal / Outside Counsel** — receives the PDF for sign-off. Needs article citations to verify without re-reading the regulation.
- **Enterprise Customer / Procurement** — receives the report as vendor evidence before signing a contract.
- **Board / Investors** — receives the compliance score as a risk indicator in board updates.

### Who this is not for

- Large enterprises with in-house legal and compliance teams who already have a process.
- Law firms conducting compliance reviews — ComplyAI replaces the first-pass work, not expert legal judgment.
- Companies whose AI falls entirely outside the eight Annex III High Risk categories and all applicable US laws.

---

## 4. Core user journey

```
1. DESCRIBE YOUR AI SYSTEM
   Free text. "We use an ML model to rank resumes for engineering roles."
   No dropdowns. No legal terminology. Plain English.

2. SCOPING CHECK
   Does any law apply? If not: explain why and what would change that.
   If Article 5 prohibited AI is flagged: STOP.
   Show warning. Do not generate gap list. Recommend legal counsel immediately.

3. CLASSIFICATION
   Claude determines:
   → Annex III category (e.g. Section 4(a) — Employment & Hiring)
   → Role: provider / deployer / both / substantially-modified / white-labelled
   → Jurisdictions triggered (EU + US states based on where they hire)
   → Per-law effective dates (some already in force)
   User reviews and can challenge before proceeding.

4. INTAKE FORM (5–10 questions, ~3 minutes)
   Role-specific. Jurisdiction-aware. Every question answerable without legal expertise.
   "Not sure" always available — triggers guided follow-up, never just flags a gap.

5. GAP ANALYSIS (streaming, real-time)
   Claude reasons across all applicable rules for this category + role + jurisdiction.
   Gaps stream to dashboard one by one as Claude identifies them.
   Current violations (laws already in force) stream first, flagged as active violations.
   Each gap: severity · deadline · requirement type · article citation · what to produce.

6. COMPLIANCE WORKSPACE
   Live gap list · Confidence score per law · Required actions checklist by deadline
   Law version status · Stale alerts when law updates · Full audit history.

7. AUDIT REPORT PDF
   Timestamped. Cited. Jurisdiction-specific.
   Required actions sorted by deadline — current violations first.
   Self-declaration caveat on every resolved gap.
   GDPR cross-reference note for EU companies.
   Full disclaimer block: not legal advice, AI-extracted, consult counsel.
```

---

## 5. Why this is an AI product

ComplyAI is AI-first in a specific sense: **the intelligence layer is Claude, not a rules database.** The database exists to ground Claude's output and prevent hallucination. The compliance reasoning — given what this specific company told me, which of these rules represent gaps, how severe, and what should they do — is Claude reasoning across legal text and user context simultaneously. No engineer writes that logic. No lawyer encodes that mapping.

### The four AI-powered layers

**Layer 1 — Law ingestion (Claude reads the law)**

A human does not read the 144-page EU AI Act. Claude does. One prompt per category extracts ~88 structured rules — with article citations, severity, requirement type, evidence description, certainty level. Output is reviewed by a human, then stored. Adding NYC Local Law 144 is a one-day job. A traditional legal database requires lawyers to manually encode every rule — months of work per law.

```
EU AI Act PDF (144 pages)
       ↓
Claude: extractRulesFromText(pdfText, ingestionPrompt)
       ↓
~88 structured rules JSON → human review gate → PostgreSQL + git-tracked JSON
```

**Layer 2 — System classification (Claude understands what you built)**

The user types free text. Claude determines the Annex III category, risk level, role (including edge cases like "we fine-tuned an open-source model on our own data" — which makes you a provider under Article 25(2)), and which US state laws apply. No user ever needs to know what "Annex III" is.

```
"we use an ML model to rank resumes"
       ↓
Claude: classify_system tool
       ↓
{ annex_section: "4(a)", risk_level: "HIGH_RISK", role: "provider",
  jurisdictions: ["EU", "US-NY"], classification_basis: "..." }
```

**Layer 3 — Compliance reasoning (Claude identifies your gaps)**

This is the core product. Claude receives the user's intake answers and the full filtered rules JSON (~88 rules, ~15k tokens) and reasons across all of them simultaneously. It evaluates partial compliance states, handles "not sure" answers as calibrated uncertainty, identifies interactions between articles, and produces contextual explanations specific to each user's situation.

Hallucination prevention is enforced by tool use: every gap Claude identifies must cite a `rule_id` from the JSON passed to it. Claude cannot reference an article not in the dataset.

```
intake answers + filtered rules JSON (~88 rules)
       ↓
Claude: report_compliance_gaps tool (streaming via SSE)
       ↓
gaps stream to dashboard one by one, in real time:
{ rule_id: "EU-AIA-009-1", severity: "CRITICAL", requirement_type: "document",
  explanation: "You indicated no risk management system exists...",
  fix: "Create a risk register documenting known risks..." }
```

**Layer 4 — Report narrative (Claude writes for your specific situation)**

The PDF is not a template. Claude writes the executive summary and gap explanations contextualised to the specific user's answers. Sarah's report reads differently from James's even if they share the same gap, because their answers revealed different partial compliance states.

### Why not a rules database?

A rules engine would need every possible combination of user answers pre-mapped to every applicable rule — thousands of conditional branches, manually maintained, brittle when law changes. Claude handles this combinatorial complexity natively and updates when the law updates (re-ingest → re-reason). The ingestion prompts and reasoning prompts are the product's durable value — not the rules themselves, which any competitor can extract from the same public documents.

### RAG — where it belongs and where it does not

**The core compliance check must NOT use RAG.** RAG retrieves the most semantically similar chunks to a query. For compliance, you need Claude to check every applicable rule exhaustively. If RAG misses 10 rules below a similarity threshold, your assessment has silent holes and the user gets a falsely clean score. SQL filtering (deterministic, exhaustive) followed by full context injection is the correct approach for the core check.

RAG belongs in two places:

| Use case | Why RAG | When |
|---|---|---|
| Follow-up Q&A | User asks "what exactly counts as a bias audit under Article 10?" — retrieve relevant rule chunks, Claude answers with citations | V2 |
| Cross-jurisdiction conflict detection | "How does NYC LL144 compare to EU AI Act Article 10?" — retrieve semantically related rules across jurisdictions | V3 |

### LLM provider strategy

Claude is the right default for specific technical reasons — not vendor preference:

| Reason | Detail |
|---|---|
| **Prompt caching** | The ~88 rules JSON is sent with every assessment. Claude caches repeated context, reducing cost significantly at volume. |
| **200k context window** | Entire legal documents ingested in one call without chunking. |
| **Tool use reliability** | The hallucination prevention mechanism depends on Claude reliably calling structured tools. |
| **Legal reasoning quality** | Complex partial compliance states require nuanced judgment. Claude Sonnet/Opus performs well. |

**Do not hardcode Claude.** Build a thin LLM provider abstraction layer. Different steps suit different models:

| Step | Default | Alternative | Rationale |
|---|---|---|---|
| Law ingestion | Claude Opus | Gemini 1.5 Pro (1M context) | Run rarely — pay for quality |
| Classification | Claude Haiku | GPT-4o mini | Fast, cheap, task is straightforward |
| Compliance reasoning | Claude Sonnet | GPT-4o | Core product — pay for quality |
| PDF narrative | Claude Sonnet | GPT-4o | Quality prose |
| Follow-up Q&A (V2) | Claude Haiku | Cohere Command R+ | High frequency — optimise for cost |

Add OpenAI as an alternative provider in V1.1. Many enterprises have existing OpenAI contracts and will ask for it. At V3+ scale, evaluate open-source models (Llama 3.x) for ingestion where a human review gate exists and cost matters more than raw quality. For EU enterprises sensitive about data leaving EU infrastructure, Mistral (French, EU-based) is a viable alternative worth tracking.

---

## 6. Critical product integrity constraints

These are not feature requirements. They are non-negotiable constraints that define what ComplyAI is and is not allowed to be. They must be enforced at build time, not documented and ignored.

### 6.1 The self-reporting problem

**The problem:** A company answers "yes" to every intake question, scores 95/100, downloads the PDF, and shares it with a regulator. The regulator asks to see the underlying technical documentation. It does not exist. ComplyAI produced a report that looked like a compliance certification based entirely on unchecked self-declaration.

**The constraint:** Every gap marked resolved via intake answer must be labelled in the report as self-declared and unverified. The report must not imply ComplyAI confirmed the evidence exists.

**Solution path:**
- MVP: Every resolved gap in the PDF carries: "Self-declared by [company] on [date]. Evidence not verified by ComplyAI."
- V2: Evidence upload — user attaches a file, Claude checks it against the specific Annex IV sub-items it must satisfy, returns a structured coverage assessment.
- Long term: Tiered report status — Self-declared / Evidence submitted / Reviewed.

### 6.2 The prohibited AI boundary

**The problem:** Some AI systems are not High Risk — they are prohibited entirely under Article 5. A company describing such a system should not receive a gap list to close. They should receive a stop signal.

**The constraint:** Classification must run an Article 5 prohibited use check before routing to any compliance checklist. If flagged, show a stop-sign UI. Do not generate a gap list. Do not generate a compliance score.

**Prohibited uses to detect:**
- Emotion recognition or inference in workplace or hiring contexts (Article 5(1)(f))
- Real-time remote biometric identification in publicly accessible spaces (Article 5(1)(h))
- AI that categorises individuals based on biometric data to infer sensitive characteristics (Article 5(1)(c))
- Social scoring by public or private actors (Article 5(1)(c))
- Subliminal or manipulative techniques that influence behaviour (Article 5(1)(a),(b))

**Warning text:** "Based on your description, your system may fall under EU AI Act Article 5 — Prohibited AI Practices. Operating this system in the EU may be unlawful. Do not deploy in the EU until you have reviewed this with qualified legal counsel."

### 6.3 The effective date problem

**The problem:** Not all obligations are due August 2026. A company treating this as a single future deadline may be violating laws right now.

**The constraint:** Every gap is stamped with its specific effective date. Current violations are rendered with a "Current violation" badge — not as future risks. The gap list is sorted and grouped by deadline, with already-in-force gaps first.

| Date | What is enforceable |
|---|---|
| Feb 2025 | Article 5 prohibited AI — already in force |
| July 2023 | NYC Local Law 144 — already in force |
| Aug 2025 | GPAI model obligations |
| Jan 2026 | California AB 2930 |
| Feb 2026 | Colorado SB 205 |
| Aug 2026 | Full High Risk AI obligations (Articles 9–49) |
| Aug 2027 | Grace period ends for systems already on market |

### 6.4 Legal disclaimer gate

**The constraint:** No report is generated without a visible, unambiguous disclaimer block. Disclaimer language must be reviewed by qualified legal counsel before MVP ships. No threshold language ("70 = deployable") is published without legal sign-off on whether it creates implied warranty.

**Minimum required disclaimer content:**
- This report is not legal advice.
- It was produced by an AI system based on rules extracted from published legal texts.
- It does not constitute a conformity assessment, compliance certification, or legal opinion.
- Resolved gaps are based entirely on user self-declaration. ComplyAI has not verified the existence or adequacy of underlying evidence.
- Consult qualified legal counsel before making compliance decisions or sharing this report with regulators.
- This report was assessed against [law name] [version] effective [date]. Changes after this date are not reflected.

### 6.5 Provider/deployer edge cases

**The problem:** The binary provider/deployer classification misroutes a significant portion of real-world companies.

**Edge cases to handle:**
- **Both:** Built the system and uses it internally. Full provider obligations plus deployer monitoring obligations.
- **Substantially modified deployer:** Took an open-source model (e.g. Llama), fine-tuned on own data, deployed it. Under Article 25(2): deemed a provider.
- **White-labelled deployer:** Uses a third-party AI tool but markets it under their own brand. Under Article 25(2): deemed a provider.
- **Pure deployer:** Uses HireVue, Greenhouse AI, or similar. Deployer obligations only — but vendor contract gaps apply.

Intake must ask clarifying questions to distinguish these before routing to the rule set.

---

## 7. Feature requirements

### 7.1 Law Knowledge Base

**What it is:** The structured, versioned, certainty-tagged representation of every applicable law. Claude ingests the raw legal PDF and extracts rules as structured JSON. No engineer reads the regulation.

**Rule schema — required fields:**

```json
{
  "id":                    "EU-AIA-009-1",
  "law":                   "EU AI Act",
  "jurisdiction":          "EU",
  "article":               "Article 9(1)",
  "title":                 "Risk management system",
  "category":              "employment_hiring",
  "annex_section":         "Section 4(a)",
  "severity":              "CRITICAL",
  "applies_to":            ["provider"],
  "requirement_type":      "document",
  "action_owner":          "provider",
  "frequency":             "ongoing",
  "effective_date":        "2026-08-02",
  "deadline_note":         "Must be established before market placement",
  "requirement":           "Establish, implement, document, and maintain a risk management system throughout the AI system lifecycle.",
  "evidence_description":  "A documented risk management system covering: identification and analysis of known and reasonably foreseeable risks; estimation and evaluation of risks; adoption of risk management measures.",
  "non_compliance_signal": "No risk management documentation exists or the process is undocumented.",
  "fix":                   "Create a risk register. Document known risks and mitigation measures. Assign an owner. Schedule periodic reviews.",
  "certainty":             "established",
  "certainty_note":        null,
  "gdpr_interaction_note": null,
  "related_articles":      ["Article 10", "Article 72"]
}
```

**Requirement types:**

| Type | Meaning | Example |
|---|---|---|
| `document` | Must produce a written artifact | Technical documentation per Annex IV |
| `test` | Must commission or run a test | Annual bias audit (NYC LL144) |
| `process` | Must implement an operational procedure | Human override mechanism |
| `disclosure` | Must inform a person or publish information | Notify candidates AI was used |
| `registration` | Must register in an official database | EU AI Act Article 49 database |
| `contract` | Must include specific terms in a vendor agreement | Article 25 provider-deployer terms |

**Certainty levels:**

| Level | Meaning | Report treatment |
|---|---|---|
| `established` | Clear legal obligation, no ambiguity | Full penalty weight in score |
| `interpretive` | Obligation exists but scope is contested | "Interpretation may vary — recommend legal review" |
| `pending_guidance` | Explicitly awaiting regulatory guidance | "Regulatory guidance pending — monitor for updates" |
| `delegated_act` | Subject to Commission delegated act not yet published | "Subject to Commission delegated act not yet finalised" |
| `contested` | Legal community actively disagrees on applicability | "Legal community is divided — consult counsel" |

**Requirements:**

| ID | Requirement | Priority |
|---|---|---|
| LKB-01 | Each law is versioned by jurisdiction, version tag, effective date, and SHA-256 hash of source PDF. Re-ingesting the same hash is a no-op. | Must have |
| LKB-02 | When a new law version is ingested, a diff is computed: added rules, removed rules, modified rules by field. Diff summary is Claude-generated plain English. | Must have |
| LKB-03 | No law version is promoted from `draft` to `active` without a human review step. Ingestion log records all details. | Must have |
| LKB-04 | Article 5 prohibited use cases are stored in a separate `prohibited_uses` table, not in `rules`. Checked at classification, not gap analysis. | Must have |
| LKB-05 | Every rule includes `effective_date` and `deadline_note`. Some rules are already in force. | Must have |
| LKB-06 | Every rule includes `requirement_type`, `action_owner`, `frequency`, `evidence_description`. Extracted by Claude during ingestion. | Must have |
| LKB-07 | Every rule includes `certainty` and `certainty_note`. Claude assesses this during ingestion. | Must have |
| LKB-08 | Rules stored in versioned JSON: `rules/{law-slug}/{version-tag}/{category}.json`. Git history is the full law change log. | Must have |
| LKB-09 | Rules that interact with GDPR carry a `gdpr_interaction_note`. Surfaced in report as cross-reference, not a gap. | Should have |

**Laws in scope by version:**

| Law | Jurisdiction | MVP | V1.2 | V2 | V3 |
|---|---|---|---|---|---|
| EU AI Act — Art 5 prohibited uses | EU | ✓ | | | |
| EU AI Act — hiring (Art 9–49) | EU | ✓ | | | |
| NYC Local Law 144 | US-NY | | ✓ | | |
| Illinois AI Video Interview Act | US-IL | | ✓ | | |
| Maryland HB 1056 | US-MD | | | ✓ | |
| EEOC AI guidance (Title VII) | US Federal | | | ✓ | |
| California AB 2930 | US-CA | | | | ✓ |
| Colorado SB 205 | US-CO | | | | ✓ |
| EU AI Act — education, finance | EU | | | ✓ | |
| EU AI Act — all 8 categories | EU | | | | ✓ |

---

### 7.2 Company profile

| ID | Requirement | Priority |
|---|---|---|
| CP-01 | A user account represents a company: name, size bucket (1–50, 51–250, 250+), primary industry, operating countries. | Must have |
| CP-02 | A company can register multiple AI systems. Each has its own compliance profile, classification, and gap list. | Must have |
| CP-03 | Each AI system captures: name, description, role (provider / deployer / both / substantially-modified / white-labelled), category, jurisdictions. | Must have |
| CP-04 | Jurisdiction is per AI system, not per company. | Must have |
| CP-05 | When a user describes multiple tools, classification creates a separate AI system record for each. | Should have |

---

### 7.3 Classification engine

**Classification flow:**

```
Step 1: Scope check — does any law apply? If not, explain and exit.
Step 2: Prohibited AI check (Article 5) — if flagged, stop. No gap list.
Step 3: Annex III classification — which category?
Step 4: Role classification — including edge cases.
Step 5: Jurisdiction determination — which US states trigger obligations?
Step 6: Effective dates per law — some already in force.
Step 7: User review — user sees and can correct before proceeding.
```

| ID | Requirement | Priority |
|---|---|---|
| CL-01 | Prohibited AI check runs before High Risk classification. If flagged: stop-sign UI, no gap list, no score. | Must have |
| CL-02 | Role classification handles five cases: provider, deployer, both, substantially-modified (→ provider obligations), white-labelled (→ provider obligations). | Must have |
| CL-03 | Clarifying questions asked when role is ambiguous: "Did you train or fine-tune the model yourself?" "Does your company's name appear on the product?" | Must have |
| CL-04 | Jurisdiction determined at AI system level. Hiring in NYC triggers NYC LL144 regardless of company HQ. | Must have |
| CL-05 | Output includes per-law effective dates. User sees which laws are already in force before intake begins. | Must have |
| CL-06 | NOT_IN_SCOPE for EU AI Act still checks US law applicability independently. NYC LL144 applies to employers using automated hiring tools regardless of EU Act scope. | Must have |
| CL-07 | User can challenge and edit the classification result. Edited classification re-runs before proceeding. | Must have |

---

### 7.4 Intake form

**Design principles:**
- No question requires legal expertise.
- "Not sure" is always available and triggers guided follow-up, not just a gap flag.
- Questions are role-specific — a deployer is not asked about technical documentation they are not required to produce.
- Multi-law obligations appear as a single coherent form, not per-law tabs.

**Guided discovery for "not sure" answers:**

```
Q: Do you have a documented risk management system? → Not sure

Follow-up:
  Has anyone on your team written down the known risks of your AI? (Yes / No)
  Do you have any process for reviewing those risks periodically? (Yes / No)

Both no:  CRITICAL gap — full deduction
One yes:  Partial gap — reduced deduction, specific fix guidance
```

| ID | Requirement | Priority |
|---|---|---|
| IN-01 | Intake questions generated per (category × role × jurisdiction). Provider in EU + NYC sees different questions than deployer in EU only. | Must have |
| IN-02 | Maximum 10 questions. Each answerable in under 30 seconds without legal expertise. | Must have |
| IN-03 | "Not sure" triggers 1–2 guided follow-up questions to assess partial compliance. | Must have |
| IN-04 | Deployer intake includes a vendor block: "Do you have a contract with your AI vendor that specifies their compliance obligations?" and "Has your vendor provided technical documentation?" | Must have |
| IN-05 | Returning users can update individual answers without restarting. | Must have |
| IN-06 | Intake answers are versioned. Old answers are retained when updated. Historical reports reference answers at assessment time. | Must have |

**MVP intake — hiring AI, provider:**
1. Describe what your AI does in the hiring process *(free text — refines classification)*
2. Do you have a documented risk management system identifying and mitigating risks specific to this AI? *(yes / no / not sure)*
3. Do you have written technical documentation covering: how the model was trained, what data was used, performance metrics, and known limitations? *(yes / no / not sure)*
4. Can you show you examined your training data for biases that could lead to discriminatory hiring outcomes? *(yes / no / not sure)*
5. Is there a mechanism for a human to review, override, or reject the AI's output before a hiring decision is made? *(yes / no / not sure)*
6. Do you provide customers with written documentation explaining how to use the system, its limitations, and what human oversight is required? *(yes / no / not sure)*
7. Have you conducted or commissioned a conformity assessment for this system? *(yes / no / not sure)*
8. Is this system registered in the EU AI Act public database? *(yes / no / not yet in market)*
9. In which countries and US states do you currently sell or deploy this system? *(multi-select)*

**Additional questions for deployers:**
1. Do you have a contract with your AI vendor specifying their EU AI Act compliance obligations? *(yes / no / not sure)*
2. Has your vendor provided documentation describing the AI system, its limitations, and instructions for use? *(yes / no / not sure)*
3. Have you assigned a named person with the authority to review and override the AI's hiring decisions? *(yes / no / not sure)*
4. Do you notify candidates that AI is used to evaluate them, before the evaluation takes place? *(yes / no / not sure)*
5. Do you retain logs of AI-assisted hiring decisions for at least 6 months? *(yes / no / not sure)*

---

### 7.5 Assessment engine

| ID | Requirement | Priority |
|---|---|---|
| AE-01 | Rule filtering: `WHERE jurisdiction IN ({user_jurisdictions}) AND category = {annex_section} AND applies_to includes role AND valid_until IS NULL`. Deterministic and exhaustive — no RAG in this step. | Must have |
| AE-02 | Every gap must cite a `rule_id` from the rules JSON passed to Claude. Enforced via tool use. Claude cannot invent a citation. | Must have |
| AE-03 | Each gap output includes: `rule_id`, `severity`, `title`, `article`, `requirement_type`, `explanation`, `fix`, `evidence_required`, `effective_date`, `already_in_force` (bool), `jurisdiction`, `partial` (bool), `certainty`, `certainty_note`. | Must have |
| AE-04 | "Not sure" answers produce `partial: true` gaps. Claude states what evidence would resolve the partial state. | Must have |
| AE-05 | Assessment records `law_version_id` for every law used. Permanently linked to report. | Must have |
| AE-06 | Gaps streamed via SSE. Current violations stream first. First gap appears within 5 seconds. Full assessment under 60 seconds for up to 150 rules. | Must have |
| AE-07 | Assessment returns a `passed` list — rules the company satisfies — with basis for each. | Must have |
| AE-08 | For deployer assessments, a vendor contract gap section checks Article 25 required contract terms even when the user said they have a vendor contract. | Must have |
| AE-09 | EU company assessments include a GDPR interaction note: "This assessment covers EU AI Act obligations only. AI hiring systems also trigger GDPR Article 22. Consult your DPO." Not a gap — a cross-reference. | Must have |
| AE-10 | SME companies (under 250 employees) receive a regulatory sandbox note: "As an SME you may be eligible for priority access to national AI regulatory sandboxes under Articles 57–63." | Should have |

---

### 7.6 Compliance workspace

**Workspace layout:**

```
┌─ COMPLIANCE STATUS ─────────────────────────────────────────────┐
│  EU AI Act:          34/100  ● 3 CRITICAL · 5 HIGH · 4 MEDIUM  │
│  NYC Local Law 144:  12/100  ● 2 CRITICAL · 1 HIGH             │
│  Overall:            27/100                                     │
│  ⚠ 2 gaps are current violations (laws already in force)       │
└─────────────────────────────────────────────────────────────────┘

┌─ REQUIRED ACTIONS ──────────────────────────────────────────────┐
│  CURRENT VIOLATIONS — act now                                   │
│  □ [TEST]       Annual bias audit · NYC LL144 · Independent     │
│  □ [DISCLOSURE] Notify candidates AI is used · NYC LL144        │
│                                                                 │
│  BY 2 AUGUST 2026 — EU AI Act                                   │
│  □ [DOCUMENT]     Technical documentation — Art 11 + Annex IV  │
│  □ [PROCESS]      Human override mechanism — Art 14(4)         │
│  □ [DOCUMENT]     Risk management system — Art 9               │
│  □ [TEST]         Data governance review — Art 10(2)(f)        │
│  □ [REGISTRATION] EU AI database — Art 49                      │
└─────────────────────────────────────────────────────────────────┘

┌─ LAW VERSION STATUS ────────────────────────────────────────────┐
│  EU AI Act v2024.08.01 — current ✓                             │
│  NYC LL144 v2023.07.01 — current ✓                             │
│  Last assessed: 2 May 2026                                      │
└─────────────────────────────────────────────────────────────────┘

┌─ AUDIT HISTORY ─────────────────────────────────────────────────┐
│  2 May 2026   27/100   EU AI Act v2024.08.01   15 gaps         │
│  1 Mar 2026   18/100   EU AI Act v2024.08.01   19 gaps         │
└─────────────────────────────────────────────────────────────────┘
```

| ID | Requirement | Priority |
|---|---|---|
| CW-01 | Workspace shows: current scores (per law + overall), required actions checklist, law version status, audit history. | Must have |
| CW-02 | Required actions typed with badges (DOCUMENT / TEST / PROCESS / DISCLOSURE / REGISTRATION / CONTRACT) and sorted: current violations first, then by deadline. | Must have |
| CW-03 | Each action shows: type badge, law citation, deadline, owner (provider / deployer), frequency (one-time / annual / ongoing). | Must have |
| CW-04 | "Current violation" badge on all gaps with effective_date in the past. Never framed as future risks. | Must have |
| CW-05 | Law version status panel. If any law has been superseded: "[Law] updated on [date]. [N] rules changed. Re-run recommended." | Must have |
| CW-06 | Audit history: every past assessment with date, scores, law versions, gap count. Historical reports permanently accessible. | Must have |
| CW-07 | User marks action "in progress" or "completed (self-declared)". Completed shows: "Marked by [user] on [date]. Evidence not verified by ComplyAI." | Must have |
| CW-08 | Workspace shareable via private read-only link. Recipient sees compliance status — not intake answers. | Should have |
| CW-09 | In-app notification when a law update affects rules in a company's gap list. Includes plain English summary of what changed. | Must have |
| CW-10 | Evidence upload: user attaches file to a gap. Claude checks it against the specific requirement. Returns: requirements covered, requirements not covered, specific gaps in the evidence. | V2 |

---

### 7.7 Confidence score

**Calculation:**

```
Score = 100 − Σ(gap_deduction × certainty_weight)

Deductions:
  CRITICAL gap:  −15 points
  HIGH gap:       −8 points
  MEDIUM gap:     −3 points

Certainty weights:
  established:       1.0
  interpretive:      0.7
  pending_guidance:  0.4
  delegated_act:     0.3
  contested:         0.5

Partial gaps (partial: true): deduction × 0.5
Score floor: 0
```

**Threshold guidance (ComplyAI benchmarks — not legal certification):**

| Score | Meaning |
|---|---|
| 0–40 | Significant gaps. Not recommended for EU market entry or enterprise procurement. |
| 41–69 | Active gaps remain. Address CRITICAL items before market entry. |
| 70–89 | Core obligations substantially addressed. Suitable for EU market entry with known outstanding items. |
| 90–100 | All identified gaps resolved (self-declared). Suitable for sharing with enterprise procurement and investors. |

| ID | Requirement | Priority |
|---|---|---|
| SC-01 | Score shown per law and as a combined score. Never shown as a single number without the per-law breakdown. | Must have |
| SC-02 | Certainty discounting applied and explained in UI: "Gaps awaiting regulatory guidance carry reduced weight." | Must have |
| SC-03 | Threshold guidance always labelled: "ComplyAI benchmarks, not legal certification." | Must have |
| SC-04 | Current violations shown separately in score breakdown. A company can score 90/100 on EU AI Act (future deadline) but 20/100 on NYC LL144 (current violation). | Must have |
| SC-05 | Score updates in real time as gaps stream. Recalculates when gaps are marked complete or intake is updated. | Must have |

---

### 7.8 Audit report PDF

**Report structure:**

```
COVER PAGE
  ComplyAI Compliance Assessment · [Company] · [AI System]
  Assessment date: [date] · Law versions: [list]

SECTION 1 — Compliance Status
  Scores per law + overall · Role · Classification basis

SECTION 2 — Current Violations (laws already in force)
  These are not future requirements. They apply now.
  □ [TEST] Annual bias audit (NYC LL144) — required since July 2023
  □ [DISCLOSURE] Candidate notification (NYC LL144)

SECTION 3 — Required Actions by Deadline
  BY 2 AUGUST 2026 — EU AI Act
  □ [DOCUMENT] Technical documentation — Art 11 + Annex IV
  □ [PROCESS] Human override mechanism — Art 14(4)
  ...

SECTION 4 — Gap Detail
  Per gap: Severity · Law · Article · Plain English explanation
  What to produce · Evidence required · Owner · Deadline
  [Self-declared resolved / Not yet addressed]
  Certainty notes where applicable.

SECTION 5 — Passed Requirements
  Rules your answers indicate you satisfy.
  All marked: "Self-declared — not verified by ComplyAI."

SECTION 6 — Vendor Contract Gaps (deployers only)
  Article 25 required contract provisions not confirmed in your responses.

SECTION 7 — Jurisdiction Notes
  Where EU AI Act and US laws overlap (satisfy the stricter one — compliant under both).
  Where they differ (separate action required).

SECTION 8 — GDPR Interaction Note (EU companies)
  This assessment covers EU AI Act obligations only. AI hiring systems also
  trigger GDPR Article 22 (automated decision-making) and data subject rights.
  Consult your DPO or data protection counsel separately.

SECTION 9 — About This Report
  [Full disclaimer per Section 6.4]
```

| ID | Requirement | Priority |
|---|---|---|
| PDF-01 | Every gap cites the exact article and sub-clause. | Must have |
| PDF-02 | Current violations in a dedicated section above future deadlines. | Must have |
| PDF-03 | Every resolved gap labelled: "Self-declared by [company] on [date]. Evidence not verified." | Must have |
| PDF-04 | Cover page shows exact law versions used. | Must have |
| PDF-05 | Certainty notes inline with affected gaps. | Must have |
| PDF-06 | Vendor contract gap section for all deployer assessments. | Must have |
| PDF-07 | GDPR interaction note for all EU company assessments. | Must have |
| PDF-08 | Section 9 disclaimer reviewed by legal counsel before MVP ships. Prominent — not buried in footer. | Must have |
| PDF-09 | PDF regenerated when intake answers are updated and re-assessment runs. | Must have |
| PDF-10 | Shareable via time-limited link without download required. | Should have |

---

## 8. Data model

### New tables

```sql
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
  UNIQUE(jurisdiction, version_tag)
);

CREATE TABLE law_version_diffs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_version_id  UUID REFERENCES law_versions(id),
  to_version_id    UUID REFERENCES law_versions(id),
  added_rule_ids   JSONB,
  removed_rule_ids JSONB,
  modified_rules   JSONB,
  diff_summary     TEXT,
  computed_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prohibited_uses (
  id               VARCHAR(50) PRIMARY KEY,
  article          VARCHAR(50) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  description      TEXT NOT NULL,
  signals          JSONB,
  effective_date   DATE NOT NULL,
  law_version_id   UUID REFERENCES law_versions(id)
);

CREATE TABLE ai_systems (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  role             VARCHAR(30)
                   CHECK (role IN ('provider', 'deployer', 'both',
                                   'substantially_modified', 'white_labelled')),
  category         VARCHAR(50),
  annex_section    VARCHAR(20),
  jurisdictions    JSONB,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stale_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id),
  ai_system_id     UUID REFERENCES ai_systems(id),
  report_id        UUID REFERENCES reports(id),
  new_version_id   UUID REFERENCES law_versions(id),
  changed_rule_ids JSONB,
  diff_summary     TEXT,
  seen             BOOLEAN DEFAULT false,
  created_at       TIMESTAMP DEFAULT NOW()
);
```

### Modifications to existing tables

```sql
ALTER TABLE rules
  ADD COLUMN law_version_id        UUID REFERENCES law_versions(id),
  ADD COLUMN valid_from            DATE,
  ADD COLUMN valid_until           DATE,
  ADD COLUMN effective_date        DATE,
  ADD COLUMN deadline_note         TEXT,
  ADD COLUMN requirement_type      VARCHAR(20)
    CHECK (requirement_type IN ('document','test','process',
                                'disclosure','registration','contract')),
  ADD COLUMN action_owner          VARCHAR(20)
    CHECK (action_owner IN ('provider','deployer','both')),
  ADD COLUMN frequency             VARCHAR(20) DEFAULT 'one_time'
    CHECK (frequency IN ('one_time','annual','ongoing','per_deployment')),
  ADD COLUMN certainty             VARCHAR(30) DEFAULT 'established'
    CHECK (certainty IN ('established','interpretive','pending_guidance',
                         'delegated_act','contested')),
  ADD COLUMN certainty_note        TEXT,
  ADD COLUMN evidence_description  TEXT,
  ADD COLUMN gdpr_interaction_note TEXT;

ALTER TABLE reports
  ADD COLUMN ai_system_id          UUID REFERENCES ai_systems(id),
  ADD COLUMN law_versions_used     JSONB,
  ADD COLUMN is_stale              BOOLEAN DEFAULT false,
  ADD COLUMN stale_reason          TEXT,
  ADD COLUMN score_by_law          JSONB,
  ADD COLUMN contains_current_violations BOOLEAN DEFAULT false;

ALTER TABLE intakes
  ADD COLUMN ai_system_id          UUID REFERENCES ai_systems(id),
  ADD COLUMN version               INTEGER DEFAULT 1,
  ADD COLUMN previous_intake_id    UUID REFERENCES intakes(id);
```

---

## 9. System architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  LAW KNOWLEDGE BASE                                              │
│  Claude ingests PDFs → typed, certainty-tagged, versioned rules  │
│  + prohibited_uses table (Article 5)                             │
│  SHA-256 change detection · Human review gate · Git-tracked JSON │
│  EU AI Act · NYC LL144 · IL AIVA · CA AB 2930 · CO SB 205        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│  CLASSIFICATION ENGINE                                           │
│  1. Scope check  2. Prohibited AI (Article 5)  3. Annex III      │
│  4. Role (incl. edge cases)  5. Jurisdiction  6. Effective dates │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│  INTAKE + ASSESSMENT ENGINE                                      │
│  Role × jurisdiction intake form                                 │
│  SQL filters rules — deterministic, exhaustive (NOT RAG)         │
│  Claude reasons: intake + rules → typed, dated, streamed gaps    │
│  Tool use enforces structured output — no hallucinated citations │
│  SSE: current violations first, then by deadline                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │ stored with law_version_ids
┌────────────────────────────▼─────────────────────────────────────┐
│  COMPLIANCE WORKSPACE                                            │
│  Live gap list · Typed actions · Per-law scores                  │
│  Current violation badges · Law version status                   │
│  Stale alerts · Audit history · Shareable read-only link         │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│  AUDIT REPORT PDF                                                │
│  PDFKit + Claude narrative · Versioned citations                 │
│  Self-declaration caveats · GDPR cross-reference                 │
│  Vendor contract gap section · Full disclaimer                   │
└──────────────────────────────────────────────────────────────────┘

LLM Provider Abstraction Layer:
  Default: Claude (Anthropic)  — ingestion, classification, reasoning, narrative
  V1.1+:   OpenAI GPT-4o       — alternative for classification + reasoning
  V2+:     Gemini 1.5 Pro      — evaluate for ingestion (1M context window)
  V2+:     Pinecone + Claude   — RAG layer for follow-up Q&A only

Infrastructure:
  PostgreSQL — law_versions, rules, prohibited_uses, ai_systems,
               reports, intakes, stale_alerts
  Pinecone   — rule embeddings for follow-up Q&A (V2 only)
  REST + SSE — API (not GraphQL — SSE streaming is native to REST)
  OpenAPI    — document all endpoints for V4 API access tier
```

---

## 10. What ComplyAI is not

| What it is | What it is not |
|---|---|
| A structured gap analysis based on AI-extracted rules from published legal texts | Legal advice |
| A tool that tells you what you are required to produce under specific laws | A conformity assessment or compliance certification |
| A report you can share to start a compliance conversation with counsel or a customer | A document that substitutes for a formal legal opinion |
| A tracker of your progress toward closing identified gaps | A system that has verified your evidence actually satisfies a requirement |
| A report stamped with the exact law version it was assessed against | A real-time regulatory feed |

**Specific limitations disclosed in every report and on the product:**
- ComplyAI covers only the laws it has ingested. It does not cover GDPR, sector-specific financial regulations, employment law, or contract law.
- Gaps marked resolved are based entirely on user self-declaration. ComplyAI has not reviewed underlying evidence.
- Score thresholds are ComplyAI's internal benchmarks. They are not legal certification standards and have not been validated by any regulatory authority.
- Some provisions await implementing regulations and delegated acts. Rules marked `pending_guidance` or `delegated_act` reflect current interpretation, which may change.

---

## 11. Non-functional requirements

| Category | Requirement |
|---|---|
| **Legal accuracy** | Every gap cites a rule extracted from a published legal text. Tool use enforces structured output — Claude cannot invent a citation. |
| **Disclaimer gate** | Disclaimer language reviewed by qualified legal counsel before MVP ships. No threshold language published without legal sign-off. |
| **Self-declaration transparency** | Every resolved gap in every report is labelled as self-declared. Never omitted. |
| **Prohibited AI gate** | Article 5 check is mandatory before every classification. Cannot be bypassed. |
| **Effective date accuracy** | Current violations never presented as future deadlines. Separate rendering and separate report section. |
| **Versioning immutability** | Reports permanently linked to law versions used at assessment time. Cannot be modified after generation. |
| **Ingestion review gate** | No law version promoted from draft to active without human review. |
| **Streaming latency** | First gap within 5 seconds. Full assessment under 60 seconds for up to 150 rules. |
| **LLM abstraction** | No business logic hardcodes a specific LLM provider. All LLM calls route through the provider abstraction layer. |
| **Data retention** | Assessments and reports retained indefinitely. Deleted accounts purged after 30 days. Users can export all data. |

---

## 12. Phased roadmap

| Version | Scope | Key unlock | Gaps addressed |
|---|---|---|---|
| **MVP** | EU AI Act hiring, streaming gaps, PDF report | First paying customers; closes enterprise deals | Core flow |
| **V1.0** | Typed requirements, law versioning, confidence score, self-declaration caveats, prohibited AI check, multi-effective-date timeline, disclaimer gate | Product has integrity; report is defensible | Self-reporting, prohibited AI, effective dates, disclaimer |
| **V1.1** | Provider/deployer edge cases, vendor contract gap section, multi-system company profile, OpenAI provider alternative | Correctly handles real-world company structures | Role ambiguity, deployer vendor obligations, LLM lock-in |
| **V1.2** | NYC LL144 + Illinois AIVA, multi-jurisdiction intake, per-law scoring | Unlocks US companies; current violations surface | US law coverage |
| **V2.0** | Compliance workspace (live tracking, mark complete, rescore), stale alerts, shareable link | Retention mechanic — users return | Ongoing monitoring |
| **V2.1** | Evidence upload + Claude coverage check, "Evidence submitted" report tier | Report gains credibility beyond self-declaration | Self-reporting (full solution) |
| **V2.2** | Follow-up Q&A with RAG (Pinecone), GDPR interaction Q&A | Reduces bounce to legal counsel | GDPR gap (partial) |
| **V3.0** | CA AB 2930, CO SB 205, EEOC guidance, EU AI Act categories 2–3 | Full US hiring coverage before 2026 deadlines | US law completeness |
| **V3.1** | All 8 EU AI Act categories | Full EU coverage | Category completeness |
| **V4.0** | Vendor compliance directory, evidence verification, API access, team collaboration | Platform play | Vendor due diligence at scale |

---

## 13. Open questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| 1 | Pricing model: per AI system per month, per report, or per seat? Deployers have smaller gap lists — should they pay less? | Founder | V1.0 |
| 2 | Does threshold language ("70 = suitable for EU market entry") create implied warranty? Needs legal review before publishing. | Legal | MVP |
| 3 | Prohibited AI detection: what confidence threshold does Claude need before showing the Article 5 stop-sign? False positives on this are high-impact. | Product + Legal | MVP |
| 4 | NYC LL144 requires an "independent auditor." Should ComplyAI build a directory of approved auditors or just surface the requirement? | Product | V1.2 |
| 5 | Evidence upload (V2): when Claude reviews an uploaded document, does making the call "this satisfies Article 11 Annex IV item 2(a)" create legal exposure for ComplyAI? | Legal | V2.1 |
| 6 | EU AI Act Article 43 conformity assessments require notified bodies for some categories. Is helping users prepare for this assessment in scope or a separate product? | Product | V3.1 |
| 7 | Multi-user: CTO and Head of Legal both need workspace access. When does this become table stakes — at first enterprise sale? | Sales | V2.0 |
| 8 | Post-August 2026 narrative: once the deadline passes, what is the ongoing value proposition? Needs a clear answer before the deadline creates urgency and disappears. | Founder | V2.0 |
| 9 | A company headquartered outside the EU and US deploys a hiring AI used by EU-based employees. Does the EU AI Act apply? Need legal clarity on jurisdictional trigger. | Legal | V1.0 |
| 10 | Regulatory sandboxes: should ComplyAI link to each EU member state's sandbox programme? Keeping links current is an operational burden. | Product | V1.0 |
