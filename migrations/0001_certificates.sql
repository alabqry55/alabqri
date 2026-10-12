-- سجل شهادات ALABQRI: جدول مستقل، دون تعديل الجداول الحالية.
CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  certificate_number TEXT NOT NULL UNIQUE,
  holder_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  hours INTEGER,
  issue_date TEXT NOT NULL,
  issuer TEXT NOT NULL DEFAULT 'مركز العبقري للتدريب والإستشارات',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
