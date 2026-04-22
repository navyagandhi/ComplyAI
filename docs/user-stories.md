# ComplyAI — User Stories
## Domain: Hiring AI — Resume Screening
## Framework: EU AI Act
## User type: Companies that build and/or deploy resume screening AI (Provider + Deployer)

---

## Use Cases

This product serves one type of company in two roles:

- **Provider** — a company that built a resume screening AI tool and sells it to others
- **Deployer** — a company that uses a resume screening AI tool (including their own) in their internal hiring process
- **Both** — a company that built the tool and also uses it for their own hiring (most common for HR tech startups)

---

## Use Case 1 — Pre-Launch EU Compliance Check (Provider)

**Who:** Head of Product or CTO at an HR tech startup preparing to sell into the EU for the first time.

**Situation:** The company has built a resume screening tool and is close to signing their first EU enterprise customer. Someone on the sales call asked "are you EU AI Act compliant?" They do not know the answer. They need to find out before the deal closes.

**What they need:**
- Know whether their system is High Risk under the EU AI Act
- See exactly what compliance obligations apply to them as the company that built it
- Get a prioritised list of what needs to be fixed before they can legally place the product on the EU market
- Have a document they can share with the customer as evidence of their compliance status

**Jobs to be done:**
- Find out if we are in scope
- Understand what we need to build or document
- Get something we can send to the customer

**User stories:**

**US-01** As a Head of Product, I want to know immediately whether my resume screening AI is classified as High Risk under the EU AI Act, so that I understand whether full compliance obligations apply before we sign an EU contract.

**US-02** As a Head of Product, I want to see the exact legal basis for my risk classification (article, annex, section), so that I can verify it with legal counsel and share it on a sales call with confidence.

**US-03** As a Head of Product, I want to know my compliance deadline, so that I can tell my EU customer exactly when we will be fully compliant.

**US-04** As a non-lawyer, I want the risk classification explained in plain English, so that I can understand what it means for my business without reading 144 pages of regulation.

**US-05** As a Head of Product, I want to see all compliance gaps ranked by severity, so that I know which obligations to fix before we can legally sell in the EU.

**US-06** As a Head of Product, I want each gap to cite the exact EU AI Act article and sub-clause, so that my legal team can verify the requirement without doing their own research.

**US-07** As a Head of Product, I want each gap to include a concrete fix recommendation, so that I can hand it to my CTO as an actionable engineering task.

**US-08** As a Head of Product, I want to download a PDF audit report, so that I have a professional compliance document to share with our EU customer on the sales call.

---

## Use Case 2 — Customer Due Diligence Response (Provider)

**Who:** Head of Product or Sales at an HR tech company. An existing or prospective EU enterprise customer has sent a compliance questionnaire or asked for evidence of EU AI Act compliance.

**Situation:** This happens on every EU enterprise sales cycle. The customer's legal or procurement team needs a vendor compliance summary before they can approve the purchase. Without it the deal stalls.

**What they need:**
- A professional document that answers the customer's compliance questions
- Specific article citations so the customer's legal team can verify
- Evidence that the company is actively working on any outstanding gaps

**Jobs to be done:**
- Respond to the customer's compliance request quickly
- Not lose the deal because of a compliance question they cannot answer

**User stories:**

**US-09** As a Head of Sales, I want to generate a vendor compliance summary PDF in under 10 minutes, so that I can respond to a customer due diligence request the same day it arrives.

**US-10** As a Head of Sales, I want the PDF to include our company name, system description, and risk classification, so that it looks like a professional compliance document and not a generic template.

**US-11** As a Head of Sales, I want the PDF to show which obligations we have met and which are in progress, so that the customer can see we are actively managing compliance rather than ignoring it.

**US-12** As a customer's Head of Legal reviewing the document, I want to see citations for every compliance claim, so that I can independently verify each one against the source regulation.

---

## Use Case 3 — Post-Update Compliance Re-Check (Provider)

**Who:** CTO or Head of Engineering at an HR tech company.

**Situation:** The team has shipped a significant update to the resume screening algorithm — new scoring model, new training data, or new features. Any material change to a High Risk AI system may require re-assessment under Article 43. The CTO needs to know whether the update changes their compliance status.

**What they need:**
- A fast way to re-run the compliance check after a product change
- To see whether any new gaps have appeared or existing gaps have closed
- An updated report to share with their compliance team or customers

**Jobs to be done:**
- Confirm the product change does not create new legal exposure
- Update the compliance record to reflect the new system state

**User stories:**

**US-13** As a CTO, I want to update specific intake answers to reflect a product change, so that I can re-run the compliance check without filling in the entire form again.

**US-14** As a CTO, I want to see a comparison between my previous compliance status and my current status, so that I can identify whether the product change introduced new gaps or resolved existing ones.

**US-15** As a CTO, I want to regenerate the PDF audit report after a product change, so that our compliance documentation always reflects the current version of the system.

---

## Use Case 4 — Investor and Board Compliance Briefing (Provider)

**Who:** CEO or Head of Product at an HR tech startup in a fundraising process or board meeting.

**Situation:** A Series A investor or board member has asked about EU AI Act exposure ahead of a funding close or quarterly review. They are not lawyers. They need to understand the risk level and what the company is doing about it — in one page, in plain English.

**What they need:**
- A one-page executive summary of their compliance status
- The risk level clearly stated
- What is being done to close the gaps
- The deadline

**Jobs to be done:**
- Give investors confidence that the company understands its legal exposure
- Not lose the funding round over a compliance question they cannot answer clearly

**User stories:**

**US-16** As a CEO, I want a one-page executive compliance summary, so that I can share it with investors or board members who need to understand our EU AI Act exposure without reading a technical gap analysis.

**US-17** As a CEO, I want the summary to show our compliance score and trend over time, so that investors can see we are actively improving rather than ignoring the issue.

**US-18** As an investor reviewing the summary, I want to see the risk level, deadline, and number of outstanding gaps, so that I can assess the legal risk of the investment in under two minutes.

---

## Use Case 5 — Ongoing Compliance Progress Tracking (Provider + Deployer)

**Who:** Head of Product, CTO, or Head of Legal at an HR tech company actively working through their compliance gap list.

**Situation:** The team has identified their gaps and is working through the fix list sprint by sprint. They need to track progress, update their compliance status as fixes are shipped, and maintain an up-to-date report for customers and auditors.

**What they need:**
- A way to mark gaps as resolved when fixes are shipped
- A compliance score that improves over time
- An audit trail showing when each gap was resolved
- An always-current PDF they can regenerate at any time

**Jobs to be done:**
- Track compliance progress without maintaining a separate spreadsheet
- Have a credible, up-to-date compliance document at all times

**User stories:**

**US-19** As a Head of Product, I want to update my intake answers when my team ships a fix, so that my compliance dashboard reflects our current state rather than where we were when we first signed up.

**US-20** As a Head of Product, I want to see a compliance score that increases as I resolve gaps, so that I have a metric I can report in sprint reviews and board updates.

**US-21** As a Head of Product, I want to see a history of my compliance reports with dates, so that I can show an auditor or customer that we have been actively improving compliance over time.

**US-22** As a Head of Legal, I want to be notified when a gap's status changes, so that I can keep the legal team's records up to date without checking the dashboard manually.

---

## Use Case 6 — Internal HR Deployer Compliance Check (Deployer)

**Who:** Head of HR or Head of Legal at a company using a resume screening AI tool for their own internal hiring — including companies using their own tool.

**Situation:** The company uses resume screening AI to filter and rank candidates for their own open roles. As a deployer, they have a separate set of obligations under the EU AI Act — Articles 26 and 27 — that are distinct from the provider obligations. Many companies do not realise they have deployer duties even if they built the tool.

**What they need:**
- To understand their obligations specifically as a deployer
- To know whether they are informing candidates that AI is used
- To know whether they have a fundamental rights impact assessment
- To know whether a human can override AI decisions

**Jobs to be done:**
- Confirm we are meeting our obligations to the candidates we screen
- Avoid legal exposure from using our own AI in our own hiring process

**User stories:**

**US-23** As a Head of HR, I want to know what my obligations are as a company that uses AI in our own hiring process, so that I understand the deployer duties separate from the provider duties.

**US-24** As a Head of HR, I want to know whether we are legally required to inform candidates that AI is used to screen them, so that I can update our application process if needed.

**US-25** As a Head of HR, I want to know whether we need a Fundamental Rights Impact Assessment before using AI in hiring, so that I can commission one before we are in breach of Article 27.

**US-26** As a Head of HR, I want confirmation that our hiring managers have the ability to override any AI recommendation, so that we are meeting the human oversight requirement under Article 14.

---

## Use Case 7 — Candidate Transparency Compliance (Deployer)

**Who:** Head of Legal or Head of HR at a company that uses resume screening AI for internal hiring.

**Situation:** Article 26(11) of the EU AI Act requires deployers to inform candidates that an AI system is used to assess them. This must be a visible disclosure — not buried in terms of service. Most companies are not doing this. It is one of the most commonly missed requirements and one of the easiest to fix.

**What they need:**
- Confirmation of whether they are meeting the disclosure requirement
- A template disclosure they can add to their application process
- Evidence that the disclosure is in place for their compliance records

**Jobs to be done:**
- Fix the candidate disclosure gap quickly
- Have evidence of compliance if challenged by a candidate or regulator

**User stories:**

**US-27** As a Head of Legal, I want to know exactly what the candidate disclosure requirement says and what it means for our application process, so that I can instruct HR to make the necessary changes.

**US-28** As a Head of Legal, I want a template candidate disclosure statement generated by ComplyAI, so that I do not have to draft one from scratch or pay a lawyer to write it.

**US-29** As a Head of HR, I want to confirm the disclosure is in place and mark it as resolved in my compliance dashboard, so that this gap is closed in our audit report.

---

## Use Case 8 — Staff AI Literacy Training Check (Provider + Deployer)

**Who:** Head of HR or Head of People at any company whose staff operate or oversee a resume screening AI system.

**Situation:** Article 4 of the EU AI Act has been active since February 2025. It requires providers and deployers to ensure staff who operate or oversee AI systems have sufficient AI literacy training. This is already overdue for most companies and is frequently overlooked because it feels like an internal HR matter rather than a legal compliance issue.

**What they need:**
- Confirmation of whether they are meeting the AI literacy requirement
- Clarity on which staff need training
- A way to document that training has been completed

**Jobs to be done:**
- Understand what Article 4 actually requires
- Know which roles in the company need to be trained
- Have a record of training completion for compliance purposes

**User stories:**

**US-30** As a Head of HR, I want to know which staff roles are required to have AI literacy training under Article 4, so that I know who to include in our training programme.

**US-31** As a Head of HR, I want to mark AI literacy training as complete in my compliance dashboard, so that this gap is resolved in our audit report and does not show up as a critical issue.

**US-32** As a Head of Legal, I want to know that Article 4 has been active since February 2025, so that I can advise the business on whether we are already in breach and what to do about it.

---

## Intake Form — Required Questions by Role

The intake form must establish role early. One question determines the entire rule filter:

| Question | Answer options |
|---|---|
| How are you using this AI? | We built it and sell it to others (Provider) |
| | We built it and use it in our own hiring (Both) |
| | We bought or licensed it and use it in our own hiring (Deployer) |

- **Provider only** → Articles 9, 10, 11, 12, 13, 14, 15, 43, 48, 49
- **Deployer only** → Articles 4, 14, 26, 27
- **Both** → All of the above

---

## Compliance Rules Coverage

| Role | Key Articles | Obligations |
|---|---|---|
| Provider | 9, 10, 11, 12, 13, 14, 15 | Risk management, data governance, documentation, logging, transparency, human oversight, accuracy |
| Provider | 43, 48, 49 | Conformity assessment, EU declaration, registration |
| Deployer | 4 | AI literacy training for staff |
| Deployer | 14 | Human override mechanism |
| Deployer | 26 | Candidate disclosure, logging, human oversight implementation |
| Deployer | 27 | Fundamental rights impact assessment |
