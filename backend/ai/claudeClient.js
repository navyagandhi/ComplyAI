const Anthropic = require('@anthropic-ai/sdk')
const { extractComplianceRules } = require('./tools')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 32000

async function extractRulesFromText(pdfText, systemPrompt) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0,
    tools: [extractComplianceRules],
    tool_choice: { type: 'any' },
    messages: [
      {
        role: 'user',
        content: `${systemPrompt}\n\n## EU AI Act Full Text\n\n${pdfText}`,
      },
    ],
  })

  const toolUseBlock = response.content.find((block) => block.type === 'tool_use')
  if (!toolUseBlock) {
    throw new Error('Claude did not call extract_compliance_rules — no tool use block in response')
  }

  const rules = toolUseBlock.input.rules
  if (!Array.isArray(rules)) {
    throw new Error('extract_compliance_rules returned non-array rules')
  }

  return {
    rules,
    rawResponse: JSON.stringify(response.content),
    model: MODEL,
    stopReason: response.stop_reason,
    inputTokens: response.usage?.input_tokens,
    outputTokens: response.usage?.output_tokens,
  }
}

module.exports = { extractRulesFromText, MODEL }
