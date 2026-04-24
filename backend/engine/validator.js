const Ajv = require('ajv')

const ajv = new Ajv({ allErrors: true })

const ruleSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
    article: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1 },
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
    },
    annex_section: { type: 'string', minLength: 1 },
    severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM'] },
    applies_to: {
      type: 'array',
      items: { type: 'string', enum: ['provider', 'deployer'] },
      minItems: 1,
    },
    jurisdiction: { type: 'string', minLength: 1 },
    requirement: { type: 'string', minLength: 10 },
    non_compliance_signal: { type: 'string', minLength: 10 },
    fix: { type: 'string', minLength: 10 },
    deadline: { type: 'string' },
    related_articles: { type: 'array', items: { type: 'string' } },
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
  additionalProperties: false,
}

const validate = ajv.compile(ruleSchema)

function validateRules(rules) {
  const passed = []
  const failed = []
  const seenIds = new Set()

  for (const rule of rules) {
    const errors = []

    if (!validate(rule)) {
      errors.push(...validate.errors.map((e) => `${e.instancePath} ${e.message}`.trim()))
    }

    if (rule.id && seenIds.has(rule.id)) {
      errors.push(`Duplicate rule ID: ${rule.id}`)
    } else if (rule.id) {
      seenIds.add(rule.id)
    }

    if (errors.length > 0) {
      failed.push({ rule, errors })
    } else {
      passed.push(rule)
    }
  }

  return { passed, failed }
}

module.exports = { validateRules }
