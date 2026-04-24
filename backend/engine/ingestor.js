#!/usr/bin/env node
'use strict'

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const fs = require('fs')
const path = require('path')
const pdfParse = require('pdf-parse')
const { buildIngestionPrompt, CATEGORY_META } = require('../ai/prompts')
const { extractRulesFromText } = require('../ai/claudeClient')
const { validateRules } = require('./validator')
const { insertRules, insertIngestionLog } = require('../db/rules')

const VALID_CATEGORIES = Object.keys(CATEGORY_META)

async function ingest({ pdfPath, category }) {
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(`Invalid category "${category}". Valid: ${VALID_CATEGORIES.join(', ')}`)
  }

  const resolvedPdf = path.resolve(pdfPath)
  if (!fs.existsSync(resolvedPdf)) {
    throw new Error(`PDF file not found: ${resolvedPdf}`)
  }

  console.log(`[ingestor] Starting ingestion`)
  console.log(`[ingestor] PDF: ${resolvedPdf}`)
  console.log(`[ingestor] Category: ${category}`)

  // Step 1: Extract PDF text
  console.log(`[ingestor] Extracting PDF text...`)
  const pdfBuffer = fs.readFileSync(resolvedPdf)
  const pdfData = await pdfParse(pdfBuffer)
  const pdfText = pdfData.text
  console.log(`[ingestor] Extracted ${pdfText.length.toLocaleString()} characters from PDF`)

  // Step 2: Build prompt and call Claude
  console.log(`[ingestor] Calling Claude (model: claude-sonnet-4-6)...`)
  const systemPrompt = buildIngestionPrompt(category)
  const claudeResult = await extractRulesFromText(pdfText, systemPrompt)
  console.log(
    `[ingestor] Claude returned ${claudeResult.rules.length} rules (${claudeResult.inputTokens} in / ${claudeResult.outputTokens} out tokens)`
  )

  // Step 3: Validate rules
  console.log(`[ingestor] Validating rules...`)
  const { passed, failed } = validateRules(claudeResult.rules)
  console.log(`[ingestor] Validation: ${passed.length} passed, ${failed.length} failed`)
  if (failed.length > 0) {
    failed.forEach(({ rule, errors }) => {
      console.warn(`[ingestor] FAILED rule ${rule.id || '(no id)'}: ${errors.join('; ')}`)
    })
  }

  // Step 4: Write JSON output file
  const outputFileName = `eu_ai_act_${category}.json`
  const outputDir = path.resolve(__dirname, '../../rules')
  const outputFile = path.join(outputDir, outputFileName)
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(outputFile, JSON.stringify(passed, null, 2))
  console.log(`[ingestor] Written ${passed.length} rules to ${outputFile}`)

  // Step 5: Store in PostgreSQL
  let ingestionId = null
  try {
    ingestionId = await insertIngestionLog({
      pdfPath: resolvedPdf,
      category,
      model: claudeResult.model,
      totalExtracted: claudeResult.rules.length,
      passedValidation: passed.length,
      failedValidation: failed.length,
      outputFile,
      rawResponse: claudeResult.rawResponse,
    })
    await insertRules(passed, ingestionId)
    console.log(`[ingestor] Stored ${passed.length} rules in PostgreSQL (run ID: ${ingestionId})`)
  } catch (dbErr) {
    console.warn(`[ingestor] DB storage failed (rules still written to JSON): ${dbErr.message}`)
  }

  // Step 6: Write ingestion log
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logDir = path.resolve(__dirname, '../logs')
  fs.mkdirSync(logDir, { recursive: true })
  const logFile = path.join(logDir, `ingestion-${timestamp}.json`)
  const logData = {
    ingestionId,
    pdfPath: resolvedPdf,
    category,
    model: claudeResult.model,
    timestamp: new Date().toISOString(),
    totalExtracted: claudeResult.rules.length,
    passedValidation: passed.length,
    failedValidation: failed.length,
    outputFile,
    failures: failed,
    tokenUsage: {
      input: claudeResult.inputTokens,
      output: claudeResult.outputTokens,
    },
  }
  fs.writeFileSync(logFile, JSON.stringify(logData, null, 2))
  console.log(`[ingestor] Ingestion log written to ${logFile}`)

  return {
    success: true,
    ingestionId,
    totalExtracted: claudeResult.rules.length,
    passedValidation: passed.length,
    failedValidation: failed.length,
    outputFile,
    failures: failed,
  }
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2)
  const pdfFlag = args.indexOf('--pdf')
  const catFlag = args.indexOf('--category')

  if (pdfFlag === -1 || catFlag === -1) {
    console.error('Usage: node backend/engine/ingestor.js --pdf <path> --category <category>')
    console.error(`Valid categories: ${Object.keys(CATEGORY_META).join(', ')}`)
    process.exit(1)
  }

  const pdfPath = args[pdfFlag + 1]
  const category = args[catFlag + 1]

  ingest({ pdfPath, category })
    .then((result) => {
      console.log('\n=== Ingestion Complete ===')
      console.log(JSON.stringify(result, null, 2))
      process.exit(0)
    })
    .catch((err) => {
      console.error(`[ingestor] Error: ${err.message}`)
      process.exit(1)
    })
}

module.exports = { ingest }
