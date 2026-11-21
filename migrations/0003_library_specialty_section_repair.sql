-- ALABQRI: repair the pre-existing library_specialties table.
-- Preview-first. Apply only to alabqri-db-preview-test after reviewing the backup.
-- This migration is additive: it does not delete or rewrite articles,
-- classifications, content types, or article_admin_audit rows.
--
-- The column is initially nullable because SQLite/D1 requires a NULL default
-- when adding a REFERENCES column to a populated table. The triggers below
-- enforce a valid, non-NULL section for all future specialty inserts/updates.
-- Existing specialties are backfilled immediately below.

PRAGMA foreign_keys = ON;

ALTER TABLE library_specialties
  ADD COLUMN primary_section_id TEXT
  REFERENCES library_sections(id) ON DELETE RESTRICT;

UPDATE library_specialties SET primary_section_id = 'quran'
WHERE id IN ('quran-sciences', 'quran-rhetoric-numerical');

UPDATE library_specialties SET primary_section_id = 'hadith'
WHERE id IN ('sunnah-sciences', 'prophetic-wisdom');

UPDATE library_specialties SET primary_section_id = 'dhikr-balance'
WHERE id IN ('names-invocations-ruqya', 'spiritual-energy');

UPDATE library_specialties SET primary_section_id = 'complementary-health'
WHERE id IN ('human-energy', 'islamic-reiki', 'healing-touch', 'remote-therapy');

UPDATE library_specialties SET primary_section_id = 'islamic-psychology-development'
WHERE id = 'life-quality-balance';

UPDATE library_specialties SET primary_section_id = 'knowledge-thought'
WHERE id IN ('solomonic-wisdom', 'cosmic-energy', 'safe-access-method');

-- Canonical official display name for section 03.
UPDATE library_sections
SET name = '03 📿 الذكر والإتزان الإيماني'
WHERE id = 'dhikr-balance';

CREATE INDEX IF NOT EXISTS idx_library_specialties_section
  ON library_specialties(primary_section_id);

-- Enforce section ownership for all future specialty writes.
-- The column remains physically nullable for SQLite compatibility, but NULL
-- or unknown section IDs are rejected by these guards.
CREATE TRIGGER IF NOT EXISTS trg_library_specialties_section_insert
BEFORE INSERT ON library_specialties
WHEN NEW.primary_section_id IS NULL
  OR NOT EXISTS (
    SELECT 1 FROM library_sections
    WHERE id = NEW.primary_section_id
  )
BEGIN
  SELECT RAISE(ABORT, 'library_specialties.primary_section_id is required and must reference library_sections');
END;

CREATE TRIGGER IF NOT EXISTS trg_library_specialties_section_update
BEFORE UPDATE OF primary_section_id ON library_specialties
WHEN NEW.primary_section_id IS NULL
  OR NOT EXISTS (
    SELECT 1 FROM library_sections
    WHERE id = NEW.primary_section_id
  )
BEGIN
  SELECT RAISE(ABORT, 'library_specialties.primary_section_id is required and must reference library_sections');
END;

-- Enforce specialty/section consistency for future classification writes.
-- Existing classification rows are intentionally preserved untouched.
CREATE TRIGGER IF NOT EXISTS trg_library_classification_specialty_section_insert
BEFORE INSERT ON library_article_classification
WHEN NEW.primary_specialty_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM library_specialties s
    WHERE s.id = NEW.primary_specialty_id
      AND s.primary_section_id = NEW.primary_section_id
  )
BEGIN
  SELECT RAISE(ABORT, 'primary specialty does not belong to the selected primary section');
END;

CREATE TRIGGER IF NOT EXISTS trg_library_classification_specialty_section_update
BEFORE UPDATE OF primary_section_id, primary_specialty_id
ON library_article_classification
WHEN NEW.primary_specialty_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM library_specialties s
    WHERE s.id = NEW.primary_specialty_id
      AND s.primary_section_id = NEW.primary_section_id
  )
BEGIN
  SELECT RAISE(ABORT, 'primary specialty does not belong to the selected primary section');
END;
