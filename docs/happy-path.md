# ComplyAI — Happy Path

**Last updated:** 2 May 2026  
**Reference:** [PRD v2.0](prd.md)

---

## The happy path user

**Who:** Sarah, Head of Product at a 40-person HR tech startup. Her company built a resume screening and candidate ranking tool. They have just started selling into EU customers and someone on a sales call asked "are you EU AI Act compliant?" She did not know the answer. She found ComplyAI through a Google search.

---

## The happy path journey — step by step

### Step 1 — Landing and sign up

Sarah lands on the ComplyAI homepage. She clicks Get Started. She creates an account with her work email. No credit card. No sales call required.

The moment she signs up she is inside the product.

---

### Step 2 — Describe your AI system (free text)

She types: "We use an ML model to screen and rank job candidates for engineering roles."

ComplyAI shows her the classification result within 2 seconds.

---

### Step 3 — Prohibited AI check (automatic, before anything else)

Before showing any compliance checklist, ComplyAI checks whether her system falls under Article 5 — EU AI Act prohibited AI practices.

Her resume screening tool is not prohibited. Classification proceeds.

*(If she had described an emotion recognition system for hiring decisions, she would see a stop-sign UI: "Your system may fall under EU AI Act Article 5 — Prohibited AI Practices. Operating this system in the EU may be unlawful. Consult qualified legal counsel before proceeding." No gap list. No score.)*

---

### Step 4 — Classification review

She sees:

> **Classification: HIGH-RISK**  
> Annex III, Section 4(a) — Employment, workers' management and access to self-employment.  
> Because your system scores and ranks candidates, the Article 6(3) exemption does not apply.  
>
> **Your role: Provider** — you built and trained this system.  
>
> **Laws that apply to you:**
> - EU AI Act (Articles 9–49) — deadline 2 August 2026
> - NYC Local Law 144 — **already in force since July 2023** (if hiring in NYC)
>
> **Important:** NYC LL144 is already in force. If you hire in New York City, this is a current violation — not a future deadline.

She confirms this is correct. (She can challenge and edit if the classification is wrong.)

---

### Step 5 — Intake form (9 questions, ~3 minutes)

Questions are role-specific (provider) and jurisdiction-aware. No legal jargon.

1. Describe what your AI does in the hiring process *(refines classification)*
2. Do you have a documented risk management system? *(yes / no / not sure)*
3. Do you have written technical documentation covering training data, design choices, and performance metrics? *(yes / no / not sure)*
4. Can you show you examined your training data for biases? *(yes / no / not sure)*
5. Is there a mechanism for a human to review, override, or reject the AI's output before a hiring decision is made? *(yes / no / not sure)*
6. Do you provide customers with documentation explaining how to use the system and its limitations? *(yes / no / not sure)*
7. Have you conducted or commissioned a conformity assessment? *(yes / no / not sure)*
8. Is this system registered in the EU AI Act public database? *(yes / no / not yet in market)*
9. In which countries and US states do you currently sell or deploy this system? *(multi-select)*

She answers "Not sure" to the human override mechanism question. A follow-up appears:
> "Has anyone on your team been assigned the authority to reject the AI's recommendation for a specific candidate?" (Yes / No)  
> "Is there a UI control for this?" (Yes / No)

Both no → CRITICAL gap flagged with partial: false.

She hits Submit.

---

### Step 6 — Gap analysis dashboard (streaming, real-time)

Gaps appear one by one as Claude identifies them. Current violations appear first.

**⚠ CURRENT VIOLATIONS — act now**

🔴 **Annual bias audit not conducted**  
`[TEST]` NYC Local Law 144 — required since July 2023  
*This is not a future deadline. You are currently non-compliant.*  
Fix: Commission an independent bias audit examining hiring outcomes across race, sex, and ethnicity. Publish the results. Must be conducted annually by an independent auditor.

🔴 **Candidates not notified that AI is used**  
`[DISCLOSURE]` NYC Local Law 144 + EU AI Act Article 26(11)  
Fix: Add a disclosure before the screening process begins. Must be visible before any assessment takes place.

**BY 2 AUGUST 2026 — EU AI Act**

🔴 **No human override mechanism**  
`[PROCESS]` Article 14(4)(d)  
Fix: Assign a named role with explicit authority to override any AI recommendation. Build a UI control that logs every override decision.

🔴 **No technical documentation**  
`[DOCUMENT]` Article 11(1) + Annex IV  
Fix: Document your system's intended purpose, training data, design choices, and performance metrics before market placement.

🔴 **No risk management system**  
`[DOCUMENT]` Article 9(1)  
Fix: Create a risk register. Document known risks and mitigation measures. Assign an owner. Schedule periodic reviews.

🔴 **No AI literacy training for staff**  
`[PROCESS]` Article 4 — in force February 2025  
*Staff who operate or oversee this AI must have received training on its capabilities and limitations. This is already overdue.*

🔴 **No logging infrastructure**  
`[PROCESS]` Article 12(1)  
Fix: Your system must automatically generate logs. Retain them for at least 6 months (EU) or 4 years (California).

**HIGH — 5 gaps** *(collapsed, expandable)*

Below the gap list:

```
┌─ COMPLIANCE STATUS ─────────────────────────────────────────────┐
│  EU AI Act:          22/100  ● 5 CRITICAL · 5 HIGH · 2 MEDIUM  │
│  NYC Local Law 144:   0/100  ● 2 CRITICAL                       │
│  Overall:            14/100                                     │
│  ⚠ 4 gaps are current violations (laws already in force)       │
└─────────────────────────────────────────────────────────────────┘
```

---

### Step 7 — Download the audit report (PDF)

The PDF is a 9-section document:

1. **Cover page** — company name, AI system, assessment date, exact law versions used
2. **Compliance status** — per-law scores + overall + role + classification basis
3. **Current violations** — NYC LL144 and Article 4 gaps at the top, clearly labelled "These apply now"
4. **Required actions by deadline** — typed badges, sorted by date
5. **Gap detail** — per gap: article citation, plain English explanation, what to produce, deadline, owner
6. **Passed requirements** — labelled "Self-declared by [company] on [date]. Evidence not verified by ComplyAI."
7. **Vendor contract gaps** — N/A (Sarah is a provider, not a deployer)
8. **GDPR interaction note** — "This assessment covers EU AI Act obligations only. AI hiring systems also trigger GDPR Article 22. Consult your DPO."
9. **Disclaimer** — Full disclaimer block. Not legal advice. AI-extracted rules. Self-declaration only. Consult counsel.

She downloads the PDF, sends it to her CTO: "here's what we need to fix before we can sell in the EU."

---

### Step 8 — She comes back

Two weeks later she comes back. She has conducted the bias audit. She updates her intake: "bias audit: Yes." She re-runs the assessment.

The NYC LL144 bias audit gap disappears. Her NYC score goes from 0/100 to 45/100. The PDF now shows the bias audit gap as: "Self-declared by [company] on [date]. Evidence not verified by ComplyAI."

She downloads the updated PDF and shares the link with her Head of Legal for sign-off.

---

### Step 9 — Stale alert (when law updates)

Six months later, the EU Commission publishes updated guidance. A new version of the EU AI Act rules is ingested. A stale alert appears in her workspace:

> "The EU AI Act rules your assessment used have been updated. 2 rules changed. Re-run your assessment to see if your compliance status is affected."

She re-runs the assessment. The updated rules flag one new HIGH gap she had not seen before.

---

## What is explicitly OUT of scope for MVP

- Evidence upload (V2.1) — she can self-declare resolution, but cannot attach a file for Claude to verify
- Shareable workspace link (V2.0) — Head of Legal gets the PDF, not a live workspace view
- Multi-user collaboration — V4.0
- US state laws beyond NY intro in V1.2
- Follow-up Q&A — V2.2
