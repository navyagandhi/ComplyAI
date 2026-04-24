const extractComplianceRules = {
  name: 'extract_compliance_rules',
  description:
    'Extract structured compliance rules from EU AI Act text. Call this once with ALL rules found.',
  input_schema: {
    type: 'object',
    properties: {
      rules: {
        type: 'array',
        description: 'Array of all compliance rules extracted from the document',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique rule ID, e.g. "EU-AIA-009-1" (article number + sequential)',
            },
            article: {
              type: 'string',
              description: 'EU AI Act article reference, e.g. "Article 9(1)"',
            },
            title: {
              type: 'string',
              description: 'Short descriptive title of the obligation',
            },
            category: {
              type: 'string',
              enum: [
                'employment_hiring',
                'education',
                'essential_services',
                'biometric',
                'infrastructure',
                'law_enforcement',
                'migration',
                'justice',
              ],
              description: 'Annex III category this rule applies to',
            },
            annex_section: {
              type: 'string',
              description: 'Annex III section reference, e.g. "Section 4(a)"',
            },
            severity: {
              type: 'string',
              enum: ['CRITICAL', 'HIGH', 'MEDIUM'],
              description:
                'CRITICAL = fines/ban if violated; HIGH = significant compliance risk; MEDIUM = operational requirement',
            },
            applies_to: {
              type: 'array',
              items: { type: 'string', enum: ['provider', 'deployer'] },
              minItems: 1,
              description: 'Whether obligation falls on provider, deployer, or both',
            },
            jurisdiction: {
              type: 'string',
              description: 'Legal jurisdiction, always "EU" for the EU AI Act',
            },
            requirement: {
              type: 'string',
              description: 'Plain English description of what must be done',
            },
            non_compliance_signal: {
              type: 'string',
              description: 'What a non-compliant company is doing or missing right now',
            },
            fix: {
              type: 'string',
              description: 'Concrete actionable fix to achieve compliance',
            },
            deadline: {
              type: 'string',
              description: 'Compliance deadline as ISO date string, e.g. "2026-08-02"',
            },
            related_articles: {
              type: 'array',
              items: { type: 'string' },
              description: 'Other articles that relate to or reinforce this rule',
            },
          },
          required: [
            'id',
            'article',
            'title',
            'category',
            'annex_section',
            'severity',
            'applies_to',
            'jurisdiction',
            'requirement',
            'non_compliance_signal',
            'fix',
            'deadline',
          ],
        },
      },
    },
    required: ['rules'],
  },
}

module.exports = { extractComplianceRules }
