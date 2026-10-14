-- ALABQRI certificate registry
-- Apply only after reviewing the target database and taking a fresh backup.
-- This migration creates an empty registry; it deliberately inserts no demo certificates.

CREATE TABLE IF NOT EXISTS certificates (
  certificate_number TEXT PRIMARY KEY,
  holder_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  hours INTEGER,
  issue_date TEXT NOT NULL,
  issuer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certificates_status
  ON certificates(status);

CREATE INDEX IF NOT EXISTS idx_certificates_issue_date
  ON certificates(issue_date);
