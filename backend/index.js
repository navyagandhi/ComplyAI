require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000' }))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'complyai-backend' })
})

// Routes
const { handleIngest } = require('./api/ingest')
app.post('/api/ingest', handleIngest)

// Future routes (wired up as they are built)
// app.use('/api/intake', require('./api/intake'))
// app.use('/api/report', require('./api/report'))
// app.use('/api/pdf',    require('./api/pdf'))

app.listen(PORT, () => {
  console.log(`ComplyAI backend running on port ${PORT}`)
})
