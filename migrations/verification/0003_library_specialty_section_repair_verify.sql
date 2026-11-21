-- ALABQRI library specialty-section repair: read-only verification.
-- Run after 0003_library_specialty_section_repair.sql on Preview.

SELECT 'sections' AS check_name, COUNT(*) AS actual, 7 AS expected
FROM library_sections
UNION ALL
SELECT 'specialties', COUNT(*), 14 FROM library_specialties
UNION ALL
SELECT 'content_types', COUNT(*), 6 FROM library_content_types
UNION ALL
SELECT 'classifications', COUNT(*), 5 FROM library_article_classification
UNION ALL
SELECT 'articles', COUNT(*), 6 FROM articles
UNION ALL
SELECT 'audit_rows', COUNT(*), 8 FROM article_admin_audit;

-- Must return zero.
SELECT COUNT(*) AS specialties_missing_section
FROM library_specialties
WHERE primary_section_id IS NULL;

-- Must return zero.
SELECT COUNT(*) AS specialties_with_orphan_section
FROM library_specialties s
LEFT JOIN library_sections sec ON sec.id = s.primary_section_id
WHERE sec.id IS NULL;

-- Expected to return zero after specialty backfill.
PRAGMA foreign_key_check;

-- Review the complete 14-row ownership map.
SELECT s.id, s.name, s.primary_section_id, sec.name AS section_name
FROM library_specialties s
LEFT JOIN library_sections sec ON sec.id = s.primary_section_id
ORDER BY s.sort_order;

-- IMPORTANT: report only; do not auto-correct these legacy rows.
-- The known safe-access-method assignments currently span three sections.
-- Resolve them through an explicit editorial decision, not this migration.
SELECT c.article_id, c.primary_section_id,
       c.primary_specialty_id, s.primary_section_id AS specialty_section_id
FROM library_article_classification c
JOIN library_specialties s ON s.id = c.primary_specialty_id
WHERE c.primary_specialty_id IS NOT NULL
  AND c.primary_section_id <> s.primary_section_id
ORDER BY c.article_id;

-- Confirm the official section-03 name.
SELECT id, name
FROM library_sections
WHERE id = 'dhikr-balance';
