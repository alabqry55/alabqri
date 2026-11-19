-- Roll back only on alabqri-db-preview-test.
-- First verify library_article_classification contains no assignments to preserve.
-- This does not modify the existing articles table.

DROP TABLE IF EXISTS library_article_classification;
DROP TABLE IF EXISTS library_content_types;
DROP TABLE IF EXISTS library_specialties;
DROP TABLE IF EXISTS library_sections;
