-- ALABQRI library taxonomy foundation (additive, preview-first)
-- Does not UPDATE, DELETE, or INSERT into the existing articles table.
-- Apply only to alabqri-db-preview-test after review and backup.
-- primary_section_id is intentionally added by migration 0003 so this
-- foundation also supports upgrading databases with a pre-existing specialties table.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS library_sections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Keep this initial schema compatible with legacy databases.
-- Migration 0003 adds primary_section_id and backfills the approved mapping.
CREATE TABLE IF NOT EXISTS library_specialties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS library_content_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One primary section and one content type per article.
-- Specialty is nullable by design: do not force an unsuitable specialty.
-- No article rows are populated by this foundation migration.
CREATE TABLE IF NOT EXISTS library_article_classification (
  article_id TEXT PRIMARY KEY,
  primary_section_id TEXT NOT NULL,
  primary_specialty_id TEXT,
  content_type_id TEXT NOT NULL,
  editorial_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (editorial_status IN (
      'pending_review',
      'approved',
      'needs_scientific_review',
      'needs_sharia_review',
      'needs_editorial_review',
      'duplicate_or_title_review'
    )),
  editorial_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE RESTRICT,
  FOREIGN KEY (primary_section_id) REFERENCES library_sections(id) ON DELETE RESTRICT,
  FOREIGN KEY (primary_specialty_id) REFERENCES library_specialties(id) ON DELETE RESTRICT,
  FOREIGN KEY (content_type_id) REFERENCES library_content_types(id) ON DELETE RESTRICT
);

-- Ensure the owner audit sink exists for classification writes.
-- IF NOT EXISTS preserves any existing audit history; the rollback intentionally leaves it intact.
CREATE TABLE IF NOT EXISTS article_admin_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  article_id TEXT,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_article_admin_audit_created
  ON article_admin_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_library_article_classification_section
  ON library_article_classification(primary_section_id);
CREATE INDEX IF NOT EXISTS idx_library_article_classification_specialty
  ON library_article_classification(primary_specialty_id);
CREATE INDEX IF NOT EXISTS idx_library_article_classification_type
  ON library_article_classification(content_type_id);
CREATE INDEX IF NOT EXISTS idx_library_article_classification_status
  ON library_article_classification(editorial_status);

INSERT OR IGNORE INTO library_sections (id, name, sort_order) VALUES
  ('quran', 'القرآن الكريم وعلومه', 1),
  ('hadith', 'الحديث الشريف وعلومه', 2),
  ('dhikr-balance', 'الذكر والإتزان الإيماني', 3),
  ('islamic-psychology-development', 'علم النفس الإسلامي والتنمية البشرية', 4),
  ('complementary-health', 'الطب التكميلي والتوعية الصحية', 5),
  ('research-studies', 'الأبحاث والدراسات', 6),
  ('knowledge-thought', 'المعرفة والفكر', 7);

INSERT OR IGNORE INTO library_specialties (id, name, sort_order) VALUES
  ('quran-sciences', 'علوم القرآن الكريم', 1),
  ('sunnah-sciences', 'علوم السنة النبوية', 2),
  ('quran-rhetoric-numerical', 'علوم الإعجاز العددي والبياني في القرآن الكريم', 3),
  ('prophetic-wisdom', 'علوم الحكمة المحمدية', 4),
  ('solomonic-wisdom', 'علوم الحكمة السليمانية', 5),
  ('names-invocations-ruqya', 'علوم الأسماء والدعوات والرقى', 6),
  ('human-energy', 'علوم الطاقة الإنسانية', 7),
  ('cosmic-energy', 'علوم الطاقة الكونية', 8),
  ('spiritual-energy', 'علوم الطاقة الروحية', 9),
  ('islamic-reiki', 'علوم الريكي الإسلامي', 10),
  ('healing-touch', 'علوم اللمسة الشفائية', 11),
  ('remote-therapy', 'علوم العلاج عن بعد', 12),
  ('life-quality-balance', 'علوم الحياة وهندسة الجودة والتوازن الشامل', 13),
  ('safe-access-method', 'منهج العبقري في سلامة الوصول', 14);

INSERT OR IGNORE INTO library_content_types (id, name, sort_order) VALUES
  ('article', 'مقال', 1),
  ('research', 'بحث', 2),
  ('study', 'دراسة', 3),
  ('course', 'دورة', 4),
  ('training-material', 'مادة تدريبية', 5);
