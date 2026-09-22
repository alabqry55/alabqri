-- منصة العبقري — D1 schema
-- نفّذ هذا الملف مرة واحدة على قاعدة D1: alabqari-db

CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO visitors (id, total) VALUES (1, 0);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'زائر',
  text TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('excellent','good','average','suggestion')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at
ON feedback(created_at DESC);

CREATE TABLE IF NOT EXISTS feedback_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  likes INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO feedback_meta (id, likes) VALUES (1, 0);
