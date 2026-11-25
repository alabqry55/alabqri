-- Read-only verification for 0003_library_specialty_section_repair.sql.
-- Run after the migration on alabqri-db-preview-test.

SELECT 'sections' AS check_name, COUNT(*) AS actual, 7 AS expected FROM library_sections
UNION ALL SELECT 'specialties', COUNT(*), 14 FROM library_specialties
UNION ALL SELECT 'content_types', COUNT(*), 6 FROM library_content_types
UNION ALL SELECT 'classifications', COUNT(*), 5 FROM library_article_classification
UNION ALL SELECT 'articles', COUNT(*), 6 FROM articles
UNION ALL SELECT 'audit_rows', COUNT(*), 8 FROM article_admin_audit;

SELECT COUNT(*) AS specialties_missing_section
FROM library_specialties WHERE primary_section_id IS NULL;

SELECT COUNT(*) AS specialties_with_orphan_section
FROM library_specialties s
LEFT JOIN library_sections sec ON sec.id = s.primary_section_id
WHERE sec.id IS NULL;

PRAGMA foreign_key_check;

SELECT s.id, s.name, s.primary_section_id, sec.name AS section_name
FROM library_specialties s
LEFT JOIN library_sections sec ON sec.id = s.primary_section_id
ORDER BY s.sort_order;

-- Report legacy mismatches only. Do not auto-correct these article rows.
SELECT c.article_id, c.primary_section_id, c.primary_specialty_id,
       s.primary_section_id AS specialty_section_id
FROM library_article_classification c
JOIN library_specialties s ON s.id = c.primary_specialty_id
WHERE c.primary_specialty_id IS NOT NULL
  AND c.primary_section_id <> s.primary_section_id
ORDER BY c.article_id;

SELECT id, name FROM library_sections WHERE id = 'dhikr-balance';
