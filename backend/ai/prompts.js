const CATEGORY_META = {
  employment_hiring: {
    label: 'employment and worker management',
    annex_section: 'Annex III Section 4(a)',
    focus:
      'AI systems used in recruitment, CV screening, interview analysis, performance monitoring, and termination decisions',
    key_articles:
      'Articles 4, 9, 10, 11, 12, 13, 14, 15, 16, 17, 26, 27, 43, 48, 49, 50, 72, 73, 85',
    deadline: '2026-08-02',
  },
  education: {
    label: 'education and vocational training',
    annex_section: 'Annex III Section 3',
    focus:
      'AI systems used in admissions, student assessment, learning outcome prediction, and examination monitoring',
    key_articles: 'Articles 4, 9, 10, 11, 12, 13, 14, 15, 26, 27, 43, 48, 49',
    deadline: '2026-08-02',
  },
  essential_services: {
    label: 'access to essential private and public services',
    annex_section: 'Annex III Section 5',
    focus:
      'AI systems determining access to credit, insurance, social benefits, emergency services, and utilities',
    key_articles: 'Articles 4, 9, 10, 11, 12, 13, 14, 15, 26, 27, 43, 48, 49',
    deadline: '2026-08-02',
  },
  biometric: {
    label: 'biometric identification and categorisation',
    annex_section: 'Annex III Section 1',
    focus: 'AI systems for remote biometric identification, emotion recognition, and categorisation',
    key_articles: 'Articles 4, 5, 9, 10, 11, 12, 13, 14, 15, 26, 27, 43, 48, 49',
    deadline: '2026-08-02',
  },
  infrastructure: {
    label: 'critical infrastructure management',
    annex_section: 'Annex III Section 2',
    focus:
      'AI systems managing road traffic, water, gas, heating, electricity, and digital infrastructure',
    key_articles: 'Articles 4, 9, 10, 11, 12, 13, 14, 15, 26, 27, 43, 48, 49',
    deadline: '2026-08-02',
  },
  law_enforcement: {
    label: 'law enforcement',
    annex_section: 'Annex III Section 6',
    focus:
      'AI systems used by police for risk assessment, lie detection, evidence evaluation, and crime prediction',
    key_articles: 'Articles 4, 5, 9, 10, 11, 12, 13, 14, 15, 26, 27, 43, 48, 49',
    deadline: '2026-08-02',
  },
  migration: {
    label: 'migration, asylum and border control',
    annex_section: 'Annex III Section 7',
    focus:
      'AI systems for visa assessment, asylum claim evaluation, border surveillance, and irregular migration detection',
    key_articles: 'Articles 4, 9, 10, 11, 12, 13, 14, 15, 26, 27, 43, 48, 49',
    deadline: '2026-08-02',
  },
  justice: {
    label: 'administration of justice and democratic processes',
    annex_section: 'Annex III Section 8',
    focus:
      'AI systems assisting courts, arbitration, dispute resolution, and electoral/democratic processes',
    key_articles: 'Articles 4, 9, 10, 11, 12, 13, 14, 15, 26, 27, 43, 48, 49',
    deadline: '2026-08-02',
  },
}

function buildIngestionPrompt(category) {
  const meta = CATEGORY_META[category]
  if (!meta) throw new Error(`Unknown category: ${category}`)

  return `You are a legal compliance expert specialising in the EU AI Act (Regulation 2024/1689).

Your task is to extract ALL compliance obligations from the EU AI Act that apply to HIGH RISK AI systems in the category of: **${meta.label}** (${meta.annex_section}).

Focus on: ${meta.focus}

Key articles to cover: ${meta.key_articles}

## Instructions

1. Read the full EU AI Act text provided below carefully.
2. Extract EVERY obligation that applies to this category — do not skip any.
3. For each obligation, call the extract_compliance_rules tool with a structured rule object.
4. Be thorough — aim for 80-100 rules covering all applicable articles.
5. Severity guide:
   - CRITICAL: Violations can result in market ban, fines up to €35M or 7% global turnover
   - HIGH: Significant compliance risk, mandatory registration or conformity assessment requirements
   - MEDIUM: Operational requirements (logging, documentation, human oversight procedures)
6. Every rule ID must be unique and follow the format: EU-AIA-[article_number]-[sequential]
   Example: EU-AIA-009-1, EU-AIA-009-2, EU-AIA-010-1
7. Deadline for high-risk AI systems in this category: ${meta.deadline}
8. Set jurisdiction to "EU" for all rules.

## Critical rules:
- Only cite articles that actually exist in the text below — do NOT hallucinate article numbers
- The requirement field must be a plain English description of what must be done
- The non_compliance_signal field must describe what a non-compliant company is currently doing or missing
- The fix field must give a concrete, actionable recommendation

Call extract_compliance_rules once with ALL rules in the rules array.`
}

module.exports = { buildIngestionPrompt, CATEGORY_META }
