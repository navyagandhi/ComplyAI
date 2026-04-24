-- ComplyAI Database Schema

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  company VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
  risk_level VARCHAR(50) NOT NULL,
  classification_basis TEXT,
  gap_list JSONB NOT NULL,
  compliance_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdf_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  file_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rules (
  id VARCHAR(50) PRIMARY KEY,
  article VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  annex_section VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
  applies_to JSONB NOT NULL,
  jurisdiction VARCHAR(20) DEFAULT 'EU',
  requirement TEXT NOT NULL,
  non_compliance_signal TEXT NOT NULL,
  fix TEXT NOT NULL,
  deadline DATE,
  related_articles JSONB,
  ingestion_run_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_path TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  total_extracted INTEGER,
  passed_validation INTEGER,
  failed_validation INTEGER,
  output_file TEXT,
  raw_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
