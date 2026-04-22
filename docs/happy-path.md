# ComplyAI — Happy Path

## The happy path user

**Who:** Sarah, Head of Product at a 40-person HR tech startup. Her company built a resume screening and candidate ranking tool. They have just started selling into EU customers and someone on a sales call asked "are you EU AI Act compliant?" She did not know the answer. She found ComplyAI through a Google search.

---

## The happy path journey — step by step

### Step 1 — Landing and sign up

Sarah lands on the ComplyAI homepage. The headline reads something like: "Find out exactly what your hiring AI needs to fix to comply with the EU AI Act." She clicks Get Started. She creates an account with her work email. No credit card. No sales call required.

**What makes this work:** She can start immediately. No demo request, no "talk to sales", no waiting. The moment she signs up she is inside the product.

---

### Step 2 — Intake — 5 questions, 3 minutes

She lands on a clean intake form. It tells her it will take 3 minutes. It asks her five things:

**Question 1 — What does your AI do?**
She selects: "Screen and rank job candidates"

**Question 2 — Did you build it or buy it?**
She selects: "We built it"

**Question 3 — Where do you operate?**
She selects: EU, United Kingdom, United States — New York

**Question 4 — Does your AI score or rank candidates automatically?**
She selects: Yes

**Question 5 — Have you done any of the following?** (checklist)
- Conducted a bias audit — No
- Written technical documentation — No
- Set up human override mechanism — Not sure
- Informed candidates AI is used — No
- Trained staff on AI literacy — No

She hits Submit.

**What makes this work:** Five questions. No legal jargon. No ambiguity. She does not need to know what "Annex III" means to answer these. The questions map directly to check fields in the rules engine but she never sees that layer.

---

### Step 3 — Risk classification — instant

The screen shows her result within 2 seconds:

> **Your system is classified as HIGH-RISK under the EU AI Act.**
> Annex III, Section 4(a) — Employment, workers' management and access to self-employment.
> Because your system scores and ranks candidates, the Article 6(3) exemption does not apply.
> Full compliance required by 2 August 2026.

A single clear badge. One paragraph of plain English. One deadline.

**What makes this work:** She now knows for certain whether this applies to her. This alone is worth the 3 minutes. Most founders in her position genuinely do not know if they are in scope. The moment she sees "HIGH-RISK" confirmed with a citation she understands the stakes.

---

### Step 4 — Gap analysis dashboard

Below the classification she sees her compliance gaps ranked by severity. It looks like a list — not a legal document, not a spreadsheet.

**CRITICAL — 6 gaps**

🔴 **No bias audit conducted**
Cited: EU AI Act Article 10(2)(f) + NYC Local Law 144
Fix: Conduct an independent bias audit examining outcomes across race, sex, age, and ethnicity.

🔴 **Candidates not informed AI is used**
Cited: EU AI Act Article 26(11) + Illinois AI Video Act
Fix: Add a clear disclosure before the screening process begins. Must be visible — not buried in terms of service.

🔴 **No human override mechanism**
Cited: EU AI Act Article 14(4)(d)
Fix: A designated person must be able to disregard or reverse any AI output for any candidate.

🔴 **No technical documentation**
Cited: EU AI Act Article 11(1) + Annex IV
Fix: Document your system's intended purpose, training data, design choices, and performance metrics before market placement.

🔴 **No AI literacy training for staff**
Cited: EU AI Act Article 4 — Active since February 2025
Fix: Staff who operate or oversee the AI must receive training on its capabilities and limitations. This is already overdue.

🔴 **No record keeping / logging infrastructure**
Cited: EU AI Act Article 12(1) + Article 26(6)
Fix: Your system must automatically generate logs. You must retain them for at least 6 months (EU) or 4 years (California).

**HIGH — 8 gaps** (collapsed, expandable)

**What makes this work:** Every gap has three things — what is wrong, exactly which law says so, and what to do about it. Sarah does not need a lawyer to understand this list. She can share it with her CTO in a Slack message and he will know immediately what to build.

---

### Step 5 — Download the audit report

At the bottom of the dashboard there is one button:

**Download Audit Report (PDF)**

The PDF contains:
- Her company name and system description
- Risk classification with legal citation
- Full gap list with severity ratings
- Each gap cited to the specific article and sub-clause
- A prioritised fix list — what to do first
- A compliance deadline summary by jurisdiction

**What makes this work:** This is the artifact she brings to her board, her investors, her legal counsel, or her EU customer who asked the question on the sales call. It looks professional. It has citations. It was generated in under 5 minutes. Without ComplyAI this document would cost her £3,000–£8,000 from a law firm and take 3 weeks.

---

### Step 6 — She shares it and comes back

She downloads the PDF, sends it to her CTO with the message "here's what we need to fix before we can sell in the EU." She shares the dashboard link with her Head of Legal.

Two weeks later she comes back, updates two answers in the intake — "bias audit: Yes" and "candidates informed: Yes" — and regenerates the report. The two critical gaps disappear. Her compliance score goes up. She downloads the updated PDF.

**What makes this work:** The product has a reason to come back to. It is not a one-time report — it is a living compliance tracker. Each time she fixes something and updates the intake, the report reflects her progress.

---

## What is explicitly OUT of scope for MVP

To keep this clean — these are things that might come later but are not in the happy path:
- Vendor due diligence checker (needs outbound workflow)
- Slack / Jira integration
- US state law deep-dives beyond NYC and Illinois
- Multi-user team collaboration
- Continuous automated monitoring
- API access
- White-label version
