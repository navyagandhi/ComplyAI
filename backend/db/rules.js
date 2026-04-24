const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function insertRules(rules, ingestionRunId) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const rule of rules) {
      await client.query(
        `INSERT INTO rules
           (id, article, title, category, annex_section, severity, applies_to,
            jurisdiction, requirement, non_compliance_signal, fix, deadline,
            related_articles, ingestion_run_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (id) DO UPDATE SET
           article = EXCLUDED.article,
           title = EXCLUDED.title,
           severity = EXCLUDED.severity,
           applies_to = EXCLUDED.applies_to,
           requirement = EXCLUDED.requirement,
           non_compliance_signal = EXCLUDED.non_compliance_signal,
           fix = EXCLUDED.fix,
           deadline = EXCLUDED.deadline,
           related_articles = EXCLUDED.related_articles,
           ingestion_run_id = EXCLUDED.ingestion_run_id`,
        [
          rule.id,
          rule.article,
          rule.title,
          rule.category,
          rule.annex_section,
          rule.severity,
          JSON.stringify(rule.applies_to),
          rule.jurisdiction,
          rule.requirement,
          rule.non_compliance_signal,
          rule.fix,
          rule.deadline || null,
          rule.related_articles ? JSON.stringify(rule.related_articles) : null,
          ingestionRunId,
        ]
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

async function insertIngestionLog(log) {
  const result = await pool.query(
    `INSERT INTO ingestion_logs
       (pdf_path, category, model, total_extracted, passed_validation, failed_validation, output_file, raw_response)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id`,
    [
      log.pdfPath,
      log.category,
      log.model,
      log.totalExtracted,
      log.passedValidation,
      log.failedValidation,
      log.outputFile,
      log.rawResponse,
    ]
  )
  return result.rows[0].id
}

async function getRulesByCategory(category) {
  const result = await pool.query('SELECT * FROM rules WHERE category = $1 ORDER BY id', [category])
  return result.rows
}

module.exports = { insertRules, insertIngestionLog, getRulesByCategory }
