# ComplyAI — User Stories
## Framework: EU AI Act + US Hiring AI Laws
## Approach: AI-first — Claude ingests, classifies, checks prohibited AI, reasons, streams, explains

**Last updated:** 2 May 2026  
**Reference:** [PRD v2.0](prd.md)

---

## Personas

| Persona | Role | Company | Category |
|---|---|---|---|
| **Sarah** | Head of Product, HR tech startup | Built resume screening AI | Employment & hiring — provider |
| **James** | VP Engineering, recruiting platform | Integrating HireVue into ATS | Employment & hiring — deployer |
| **Priya** | Head of Compliance, fintech lender | Credit scoring AI | Essential services — provider |
| **Marcus** | CTO, EdTech platform | Student scoring + admissions AI | Education & training — provider |
| **Daniel** | Head of Product, identity verification startup | Facial recognition for KYC | Biometric identification — provider |
| **Elena** | Head of Engineering, energy management AI | AI for grid load balancing | Critical infrastructure — provider |
| **Tom** | Head of Product, LegalTech startup | AI sentencing recommendations | Justice & democracy — provider |
| **Fatima** | Head of Legal, immigration tech | AI for visa assessment | Migration & border control — provider |

---

## Epic 1 — Scoping and prohibited AI check (all users)

**US-01**  
As any user, I want ComplyAI to check whether my AI system falls under Article 5 prohibited AI practices before showing me any compliance checklist, so that I know immediately if I may be operating an illegal system.

**US-02**  
As any user, if my system is flagged as potentially prohibited, I want to see a clear stop signal with the specific Article 5 provision involved and a recommendation to consult legal counsel — not a compliance gap list — so that I do not spend time on compliance work for a system that may be banned.

**US-03**  
As any user, I want ComplyAI to determine whether any law applies to my AI system at all, so that I do not complete an assessment for a system that is out of scope.

**US-04**  
As any user whose system is out of scope for the EU AI Act but who hires in NYC or Illinois, I want ComplyAI to still check US hiring AI law applicability independently, so that I am not falsely told I have no compliance obligations.

---

## Epic 2 — System classification (all users)

**US-05**  
As any user, I want to describe my AI system in plain English and have ComplyAI determine which Annex III High Risk category it falls under, so that I do not need to read the EU AI Act to know if it applies to me.

**US-06**  
As any user, I want to see the exact Annex III category, my role (provider / deployer / both / substantially-modified / white-labelled), and which laws apply to me — before the intake form begins.

**US-07**  
As any user, I want to know which laws are already in force for me today (vs. future deadlines), so that I understand if I am already non-compliant before I even complete the assessment.

**US-08**  
As any user, I want to challenge and edit the classification result before proceeding, so that I can correct it if the AI misclassified my system.

**US-09**  
As James (deployer), I want ComplyAI to ask clarifying questions when my role is ambiguous — specifically whether I fine-tuned the model or market it under my own brand — so that I am correctly classified as a provider or deployer and given the right obligation set.

**US-10**  
As any user, I want the Article 6(3) exemption to be assessed automatically, so that I know if I qualify for a reduced compliance burden.

---

## Epic 3 — Intake form (all users)

**US-11**  
As any user, I want intake questions generated specifically for my category × role × jurisdiction, so that I am not asked about obligations that do not apply to me.

**US-12**  
As any user, I want to answer "not sure" to any question and receive 1–2 guided follow-up questions rather than an automatic gap flag, so that I get credit for partial compliance rather than being penalised for uncertainty.

**US-13**  
As James (deployer), I want to be asked specifically about my vendor contract — whether it specifies the AI provider's compliance obligations — so that deployer-specific gaps are surfaced that a provider intake would never catch.

**US-14**  
As a returning user, I want to update individual intake answers without restarting the form, so that I can reflect fixes I have made without losing my assessment history.

**US-15**  
As any user, I want intake answers versioned — old answers retained when updated — so that historical reports accurately reflect the answers given at the time of each assessment.

---

## Epic 4 — Gap analysis (all users)

**US-16**  
As any user, I want my compliance gaps streamed to the dashboard in real time as Claude identifies them, so that I see the AI working rather than waiting for a result.

**US-17**  
As any user, I want current violations — gaps where the law is already in force — to stream first and render with a "Current violation" badge, so that I know immediately what I am already liable for today.

**US-18**  
As any user, I want each gap to show: severity (CRITICAL / HIGH / MEDIUM), requirement type badge (DOCUMENT / TEST / PROCESS / DISCLOSURE / REGISTRATION / CONTRACT), the exact article and sub-clause, a plain English explanation, what evidence I need to produce, and a concrete fix.

**US-19**  
As any user, I want to see which gaps are provider obligations and which are deployer obligations, so that I know which gaps my team owns versus which I need to demand from my AI vendor.

**US-20**  
As any user, I want "not sure" answers to generate partial gaps with specific guidance on what evidence would resolve the partial state, rather than treating them as full gaps.

**US-21**  
As a deployer (James), I want a vendor contract gap section that checks Article 25 required contract terms, even when I said I have a vendor contract, so that I know whether the contract actually covers what it needs to.

**US-22**  
As an EU company, I want a GDPR interaction note in my assessment telling me that AI hiring systems also trigger GDPR Article 22, so that I know to consult my DPO separately — this is a cross-reference, not a compliance gap.

**US-23**  
As an SME (under 250 employees), I want a note about eligibility for EU regulatory sandboxes under Articles 57–63, so that I know about a potential compliance pathway.

---

## Epic 5 — Confidence score (all users)

**US-24**  
As any user, I want a compliance score shown per law and as a combined score — never as a single number without the per-law breakdown — so that a strong EU AI Act score does not hide a critical NYC LL144 current violation.

**US-25**  
As any user, I want the score to apply certainty discounting — gaps awaiting regulatory guidance carry reduced weight — so that I am not unfairly penalised for ambiguities in the law itself.

**US-26**  
As any user, I want the score to update in real time as gaps stream to the dashboard, so that I see my compliance position improving as each gap is identified and I understand the order of priority.

**US-27**  
As any user, I want score thresholds clearly labelled as "ComplyAI benchmarks, not legal certification," so that I know what the score means and what it does not.

---

## Epic 6 — Category 1: Employment & Hiring (Sarah — provider, James — deployer)

**US-28**  
As Sarah, I want to know if my resume screening tool is classified as High Risk under Annex III Section 4(a), so that I know whether full compliance obligations apply before I sign an EU contract.

**US-29**  
As Sarah, I want to know my bias audit obligations under Article 10(2)(f) and NYC LL144, so that I can commission the right type of audit before EU market placement.

**US-30**  
As Sarah, I want to know that NYC LL144 has been in force since July 2023 and that I may already be non-compliant, so that I treat this as a current violation, not a future task.

**US-31**  
As Sarah, I want to know what candidate disclosure is required under Article 26(11), so that I can update the application flow before we go live in the EU.

**US-32**  
As Sarah, I want a PDF I can send to my EU enterprise customer as a compliance evidence pack, so that the deal does not stall on a compliance question.

**US-33**  
As Sarah's CTO, I want each gap to include a concrete technical fix and the requirement type (document vs test vs process), so that I can estimate effort and add it to the sprint backlog immediately.

**US-34**  
As James (deployer, using HireVue), I want to know which compliance obligations fall on me as a deployer versus on HireVue as the provider, so that I know what I need to demand from my vendor versus what I need to do myself.

**US-35**  
As James, I want the vendor contract gap section to tell me which Article 25 provisions my HireVue contract must include, so that I can review the contract and request amendments.

---

## Epic 7 — Category 2: Education & Training (Marcus — provider)

**US-36**  
As Marcus, I want to know if my student scoring AI is classified as High Risk under Annex III Section 3, so that I understand whether EU AI Act obligations apply.

**US-37**  
As Marcus, I want to know what transparency obligations apply when AI is used to assess students, so that I can update our product to inform students and institutions correctly before EU deployment.

**US-38**  
As a university Head of Legal deploying Marcus's tool, I want to know my obligations as a deployer under Article 26, so that I understand what I need to demand from the EdTech vendor.

---

## Epic 8 — Category 3: Essential Services (Priya — provider)

**US-39**  
As Priya, I want to know if our credit scoring AI is classified as High Risk under Annex III Section 5(b), so that I can brief the board on our EU AI Act exposure before our next regulatory review.

**US-40**  
As Priya, I want to know what documentation we need under Article 11 and Annex IV for our credit scoring model, so that I can instruct our data science team on what to capture.

**US-41**  
As Priya, I want to know whether customers refused credit by our AI must be informed that AI was used, so that I can update our decision notification letters.

**US-42**  
As Priya, I want a compliance report I can present to our financial regulator alongside existing submissions, covering our EU AI Act status with exact article citations.

---

## Epic 9 — Law versioning and stale alerts (all users)

**US-43**  
As any user, I want to see the exact law version my assessment was conducted against (e.g. "EU AI Act v2024.08.01"), so that I and my legal team can verify the assessment is current.

**US-44**  
As any user, I want to receive a stale alert when a law I was assessed against has been updated, with a plain English summary of what changed, so that I know to re-run my assessment.

**US-45**  
As any user, I want historical reports to remain accessible and permanently reference the law version they were assessed against, so that I can show an auditor my compliance history over time.

**US-46**  
As any user, I want a law version status panel in the workspace showing whether each law I was assessed against is current or has been superseded, so that I always know the freshness of my compliance status.

---

## Epic 10 — Compliance workspace (V2.0)

**US-47**  
As any user, I want a compliance workspace showing: per-law confidence scores, required actions checklist (typed and sorted by deadline), law version status, and current violation badges — all in one view.

**US-48**  
As any user, I want to mark a required action as "in progress" or "completed (self-declared)" in the workspace, with the date and user displayed, so that I can track my remediation progress.

**US-49**  
As any user, I want completed actions to display "Self-declared by [company] on [date]. Evidence not verified by ComplyAI." so that I and my legal team have no false impression that ComplyAI has verified the evidence.

**US-50**  
As any user, I want to share a read-only workspace link with my CTO or Head of Legal, so that they can review the compliance status without me having to export and email a document.

**US-51**  
As any user, I want a full audit history — every past assessment with date, scores, law versions, and gap count — so that I can demonstrate to a regulator that I have been actively improving.

---

## Epic 11 — Audit report PDF (all users)

**US-52**  
As any user, I want to download a professionally formatted 9-section PDF audit report, so that I have a credible document to share with customers, regulators, or investors.

**US-53**  
As any user, I want the PDF to open with a current violations section (laws already in force) before future deadlines, so that recipients immediately see what is already a live legal issue.

**US-54**  
As any user, I want every resolved gap in the PDF to carry "Self-declared by [company] on [date]. Evidence not verified by ComplyAI." so that the report is honest about what it does and does not confirm.

**US-55**  
As any user, I want the PDF to show the exact law versions used on the cover page, so that I know what version my compliance was assessed against.

**US-56**  
As a Head of Legal reviewing the PDF, I want every compliance claim to cite the exact article and sub-clause, so that I can independently verify it against the source regulation.

**US-57**  
As any user, I want the PDF disclaimer to be prominent — not buried in a footer — covering: not legal advice, AI-extracted rules, self-declaration only, consult counsel.

**US-58**  
As an EU company, I want the PDF to include a GDPR interaction note covering AI hiring system obligations under GDPR Article 22, so that my DPO knows what to review separately.

**US-59**  
As any deployer, I want a vendor contract gap section in the PDF, so that I can immediately see which Article 25 provisions my vendor contract needs to include.

---

## Epic 12 — Evidence upload (V2.1)

**US-60**  
As any user, I want to attach a file to a gap in the workspace and have Claude assess whether it satisfies the specific requirements for that gap, so that my report can reflect "Evidence submitted" rather than just "Self-declared."

**US-61**  
As any user, I want Claude's evidence assessment to return a structured result: which Annex IV sub-items are covered, which are not, and what specific gaps remain in the evidence — not just "pass" or "fail."

---

## Epic 13 — Follow-up Q&A with RAG (V2.2)

**US-62**  
As any user, I want to ask free-text follow-up questions after seeing my gaps, so that I can get specific answers grounded in the regulation without hiring a lawyer.

**US-63**  
As any user, I want follow-up answers to cite the exact article they are based on, so that I can trust the answer and verify it independently.

**US-64**  
As any user, I want to ask cross-jurisdiction questions like "does NYC LL144 require the same bias audit as the EU AI Act Article 10?", so that I understand where obligations overlap and where they differ.

---

## Compliance coverage by category

| Category | Annex III | Key articles | Approx rules | Status |
|---|---|---|---|---|
| Employment & hiring | Section 4(a) | 4, 9, 10, 11, 12, 13, 14, 26, 27, 43, 48 | ~88 | MVP |
| Education & training | Section 3 | 9, 10, 11, 12, 13, 14, 26, 43 | ~70 | V1.1 |
| Essential services | Section 5 | 9, 10, 11, 12, 13, 14, 26, 27, 43 | ~80 | V1.2 |
| Biometric identification | Section 1 | 5, 9, 10, 11, 12, 13, 14, 15, 43, 49 | ~75 | V2 |
| Critical infrastructure | Section 2 | 9, 11, 12, 14, 15, 43 | ~55 | V2 |
| Law enforcement | Section 6 | 5, 9, 10, 11, 12, 14, 27, 43 | ~65 | V3.1 |
| Migration & border | Section 7 | 9, 10, 11, 12, 14, 26, 27, 43 | ~60 | V3.1 |
| Justice & democracy | Section 8 | 9, 11, 12, 14, 26, 43 | ~50 | V3.1 |
| **Total EU AI Act** | | | **~543** | |
| NYC Local Law 144 | N/A | Bias audit + disclosure | ~15 | V1.2 |
| Illinois AI Video Act | N/A | Disclosure + consent | ~8 | V1.2 |
| California AB 2930 | N/A | **Died in Senate Nov 2024 — not in force. Monitor for successor bill.** | — | N/A |
| Colorado SB 205 | N/A | Consequential decisions | ~18 | V3.0 |
