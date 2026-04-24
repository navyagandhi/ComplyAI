const { ingest } = require('../engine/ingestor')
const { CATEGORY_META } = require('../ai/prompts')

const VALID_CATEGORIES = Object.keys(CATEGORY_META)

async function handleIngest(req, res) {
  const { pdfPath, category } = req.body

  if (!pdfPath || typeof pdfPath !== 'string') {
    return res.status(400).json({ error: 'pdfPath is required and must be a string' })
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    })
  }

  // Block path traversal
  if (pdfPath.includes('..') || pdfPath.startsWith('/etc') || pdfPath.startsWith('/proc')) {
    return res.status(400).json({ error: 'Invalid pdfPath' })
  }

  try {
    const result = await ingest({ pdfPath, category })
    return res.json(result)
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('Invalid category')) {
      return res.status(400).json({ error: err.message })
    }
    console.error('[POST /api/ingest] error:', err.message)
    return res.status(500).json({ error: 'Ingestion failed', detail: err.message })
  }
}

module.exports = { handleIngest }
