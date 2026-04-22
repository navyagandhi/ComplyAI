# ComplyAI — User Stories
## Framework: EU AI Act — All 8 High Risk Categories (Annex III)
## Approach: AI-first — Claude ingests, reasons, streams, explains

---

## Personas across all categories

| Persona | Role | Category |
|---|---|---|
| Sarah | Head of Product, HR tech startup | Employment & hiring |
| Marcus | CTO, EdTech platform | Education & training |
| Priya | Head of Compliance, fintech lender | Essential services |
| Daniel | Head of Product, identity verification startup | Biometric identification |
| Elena | Head of Engineering, energy management AI | Critical infrastructure |
| James | CTO, GovTech predictive analytics | Law enforcement |
| Fatima | Head of Legal, immigration tech company | Migration & border control |
| Tom | Head of Product, LegalTech startup | Justice & democracy |

---

## Epic 1 — System Classification (all categories)

**US-01**
As any user, I want to describe my AI system in plain English and have ComplyAI determine which Annex III High Risk category it falls under, so that I do not need to read the EU AI Act to know if it applies to me.

**US-02**
As any user, I want to see the exact Annex III category and section that my system falls under, so that I can verify the classification with my legal team.

**US-03**
As any user, I want to know my compliance deadline, so that I understand how much time I have before full compliance is required.

**US-04**
As any user, I want to know if my system qualifies for the Article 6(3) exemption (limited purpose systems), so that I do not over-invest in compliance for a system that is not in scope.

**US-05**
As any user, I want the risk classification explained in plain English, so that I can share it with stakeholders who have not read the regulation.

---

## Epic 2 — Intake Form (multi-category)

**US-06**
As any user, I want to describe what my AI does in plain English and have Claude classify it, so that I do not need to know legal terminology to get started.

**US-07**
As any user, I want the intake questions to adapt based on my AI category, so that I am only asked questions relevant to my specific system and obligations.

**US-08**
As any user, I want to indicate whether I am a provider, deployer, or both, so that the compliance check reflects the correct set of obligations for my role.

**US-09**
As any user, I want to select all jurisdictions I operate in, so that the gap analysis covers every law that applies to me.

**US-10**
As any user, I want to answer "not sure" to any question, so that uncertainty is captured as a gap rather than forcing me to guess and get a false clean result.

**US-11**
As a returning user, I want to update individual answers without restarting the form, so that I can reflect fixes without losing my history.

---

## Epic 3 — Category 1: Employment & Hiring

**Persona:** Sarah — Head of Product, HR tech startup building resume screening AI

**US-12**
As Sarah, I want to know if my resume screening tool is classified as High Risk under Annex III Section 4(a), so that I know whether full compliance obligations apply before I sign an EU contract.

**US-13**
As Sarah, I want to see whether the Article 6(3) exemption applies to my tool, so that I know if I need a conformity assessment or can self-declare.

**US-14**
As Sarah, I want to know my bias audit obligations under Article 10(2)(f), so that I can commission the right type of audit before EU market placement.

**US-15**
As Sarah, I want to know what candidate disclosure is required under Article 26(11), so that I can update the application flow before we go live in the EU.

**US-16**
As Sarah, I want a PDF I can send to my EU enterprise customer as a compliance evidence pack, so that the deal does not stall on a compliance question.

**US-17**
As Sarah's CTO, I want each gap to include a concrete technical fix, so that I can estimate effort and add it to the sprint backlog immediately.

---

## Epic 4 — Category 2: Education & Training

**Persona:** Marcus — CTO, EdTech platform that automatically scores student assignments and ranks applicants for university admissions

**US-18**
As Marcus, I want to know if my student scoring AI is classified as High Risk under Annex III Section 3, so that I understand whether EU AI Act obligations apply to our product.

**US-19**
As Marcus, I want to know what transparency obligations apply when AI is used to assess students, so that I can update our product to inform students and institutions correctly.

**US-20**
As Marcus, I want to know whether our admissions ranking AI requires a conformity assessment before deployment in EU institutions, so that we do not place the product on the EU market before we are legally allowed to.

**US-21**
As Marcus, I want to know what human oversight mechanisms are required for AI-generated student scores, so that educators can override or review AI decisions as required by Article 14.

**US-22**
As a Head of Legal at a university deploying the tool, I want to know my obligations as a deployer under Article 26, so that I understand what we need to demand from our EdTech vendor.

---

## Epic 5 — Category 3: Essential Services (Finance & Insurance)

**Persona:** Priya — Head of Compliance at a fintech company using AI to assess creditworthiness and approve loans

**US-23**
As Priya, I want to know if our credit scoring AI is classified as High Risk under Annex III Section 5(b), so that I can brief the board on our EU AI Act exposure before our next regulatory review.

**US-24**
As Priya, I want to know what documentation we need to produce for our credit scoring model under Article 11, so that we can instruct our data science team on what to capture.

**US-25**
As Priya, I want to know what the bias testing requirements are for financial AI under Article 10, so that we can determine whether our existing model validation process is sufficient.

**US-26**
As Priya, I want to know whether customers who are refused credit by our AI must be informed that AI was used, so that we can update our decision notification letters.

**US-27**
As Priya, I want to know what logging we need to retain and for how long under Article 12, so that we can scope the infrastructure requirement for our engineering team.

**US-28**
As Priya, I want a compliance report I can present to our financial regulator alongside our existing regulatory submissions, so that we have a single document covering our EU AI Act status.

---

## Epic 6 — Category 4: Biometric Identification

**Persona:** Daniel — Head of Product at an identity verification startup using facial recognition for KYC

**US-29**
As Daniel, I want to know if our facial recognition system is classified as High Risk or prohibited under the EU AI Act, so that I understand whether we can legally operate in the EU at all.

**US-30**
As Daniel, I want to know the difference between the prohibited biometric use cases (Article 5) and the permitted High Risk ones (Annex III Section 1), so that I can confirm our specific use case is on the right side of the line.

**US-31**
As Daniel, I want to know what accuracy and robustness requirements apply to biometric AI under Article 15, so that I can define the performance benchmarks our model must meet.

**US-32**
As Daniel, I want to know what registration obligations apply before we can deploy in the EU, so that we complete the EU database registration under Article 49 on time.

---

## Epic 7 — Category 5: Critical Infrastructure

**Persona:** Elena — Head of Engineering at a company whose AI manages energy grid load balancing

**US-33**
As Elena, I want to know if our energy management AI is classified as High Risk under Annex III Section 2, so that I understand our compliance obligations before we expand into EU markets.

**US-34**
As Elena, I want to know what cybersecurity and robustness requirements apply to critical infrastructure AI under Article 15, so that we can assess whether our existing security controls are sufficient.

**US-35**
As Elena, I want to know what human oversight requirements apply when our AI is making real-time decisions about infrastructure, so that we can design the correct intervention mechanisms.

---

## Epic 8 — Category 6: Law Enforcement

**Persona:** James — CTO at a GovTech company building a predictive risk scoring tool for public sector clients

**US-36**
As James, I want to know whether our predictive risk scoring tool is classified as High Risk or prohibited under the EU AI Act, so that I understand whether we can legally sell to EU law enforcement agencies.

**US-37**
As James, I want to know what fundamental rights impact assessment is required before our tool can be used by law enforcement, so that we can scope the assessment and commission it before any EU deployment.

**US-38**
As James, I want to know what logging and audit trail requirements apply to law enforcement AI under Articles 12 and 26, so that we can design the data retention infrastructure correctly.

---

## Epic 9 — Category 7: Migration & Border Control

**Persona:** Fatima — Head of Legal at a company building AI to assist with visa and asylum application assessment

**US-39**
As Fatima, I want to know if our visa assessment AI is classified as High Risk under Annex III Section 7, so that I can advise the board on our legal position before we pitch to EU government clients.

**US-40**
As Fatima, I want to know what transparency obligations apply when AI is used in asylum and immigration decisions, so that I can ensure our product meets the requirements before any government deployment.

**US-41**
As Fatima, I want to know what human oversight is required for AI-assisted immigration decisions under Article 14, so that we can design a compliant review workflow for our government clients.

---

## Epic 10 — Category 8: Justice & Democracy

**Persona:** Tom — Head of Product at a LegalTech startup building AI to assist judges with sentencing recommendations

**US-42**
As Tom, I want to know if our sentencing recommendation AI is classified as High Risk under Annex III Section 8, so that I understand the full compliance obligations before we approach any EU court system.

**US-43**
As Tom, I want to know what human oversight mechanisms are required when AI assists with judicial decisions, so that we can design a system where the judge retains full authority.

**US-44**
As Tom, I want to know what transparency obligations apply to AI used in court proceedings, so that defendants and their counsel can be informed that AI was used in any recommendation.

---

## Epic 11 — Gap Analysis (all categories)

**US-45**
As any user, I want to see my compliance gaps streamed to the dashboard in real time as Claude identifies them, so that I see the AI working rather than waiting for a result.

**US-46**
As any user, I want each gap to show severity (CRITICAL / HIGH / MEDIUM), the exact article and sub-clause, a plain English explanation, and a concrete fix, so that I can immediately understand and act on each one.

**US-47**
As any user, I want gaps grouped by severity so that I focus on CRITICAL items first.

**US-48**
As any user, I want to see which gaps relate to my provider obligations and which relate to my deployer obligations, so that I know which gaps my team owns versus which I need to demand from my vendor.

**US-49**
As any user, I want to expand a gap card to see a detailed technical fix recommendation, so that I can hand it directly to my engineering team.

**US-50**
As any user, I want gaps to disappear from my dashboard when I update my intake answers to reflect a fix, so that my dashboard always shows my current compliance status.

---

## Epic 12 — Audit Report PDF (all categories)

**US-51**
As any user, I want to download a professionally formatted PDF audit report specific to my AI category, so that I have a credible document to share with customers, regulators, or investors.

**US-52**
As any user, I want the PDF to include my company name, system description, risk classification, gap list with citations, and a prioritised fix list, so that it is a complete compliance record.

**US-53**
As any user, I want to regenerate the PDF after updating my intake, so that my report always reflects my current compliance status.

**US-54**
As a Head of Legal reviewing the PDF, I want every compliance claim to cite the exact article and sub-clause, so that I can independently verify it against the source regulation.

---

## Epic 13 — Progress Tracking & History (all categories)

**US-55**
As any user, I want a compliance score that improves as I resolve gaps, so that I have a metric to report in board updates and investor conversations.

**US-56**
As any user, I want to see a history of my compliance reports with dates, so that I can demonstrate to an auditor or regulator that I have been actively improving.

**US-57**
As any user, I want to share a dashboard link with my CTO or Head of Legal, so that they can review the gap analysis without me having to export and email a document.

---

## Epic 14 — Follow-up Q&A with RAG (V2, all categories)

**US-58**
As any user, I want to ask free-text follow-up questions after seeing my gaps, so that I can get specific answers grounded in the regulation without hiring a lawyer.

**US-59**
As any user, I want follow-up answers to cite the exact article they are based on, so that I can trust the answer and verify it if needed.

**US-60**
As any user, I want to ask cross-jurisdiction questions like "does NYC LL144 require the same bias audit as the EU AI Act?", so that I understand where obligations overlap and where they differ.

---

## Compliance coverage by category

| Category | Annex III | Key articles | Approx rules |
|---|---|---|---|
| Employment & hiring | Section 4(a) | 4, 9, 10, 11, 12, 13, 14, 26, 27, 43, 48 | ~88 |
| Education & training | Section 3 | 9, 10, 11, 12, 13, 14, 26, 43 | ~70 |
| Essential services | Section 5 | 9, 10, 11, 12, 13, 14, 26, 27, 43 | ~80 |
| Biometric identification | Section 1 | 5, 9, 10, 11, 12, 13, 14, 15, 43, 49 | ~75 |
| Critical infrastructure | Section 2 | 9, 11, 12, 14, 15, 43 | ~55 |
| Law enforcement | Section 6 | 5, 9, 10, 11, 12, 14, 27, 43 | ~65 |
| Migration & border | Section 7 | 9, 10, 11, 12, 14, 26, 27, 43 | ~60 |
| Justice & democracy | Section 8 | 9, 11, 12, 14, 26, 43 | ~50 |
| **Total** | | | **~543 rules** |
