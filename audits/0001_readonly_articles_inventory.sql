-- ALABQRI: read-only inventory for the complete editorial audit.
-- Run against alabqri-db (production) ONLY as a SELECT-only export.
-- This script does not write, update, delete, or alter any database object.
-- Export the result as CSV/JSON and use it to prepare article-specific reviews.
SELECT
  id,
  title,
  category,
  date,
  excerpt,
  content,
  scheduled_at,
  tags_json,
  seo_title,
  seo_description,
  seo_keywords,
  canonical_url,
  og_image,
  created_at,
  updated_at
FROM articles
ORDER BY created_at ASC, id ASC;

-- Inventory control: expected current production baseline is 19 rows.
-- A different count must be reconciled before preparing bulk updates.
SELECT
  COUNT(*) AS total_articles,
  COUNT(DISTINCT id) AS unique_ids,
  COUNT(DISTINCT title) AS unique_titles,
  SUM(CASE WHEN content IS NULL OR TRIM(content) = '' THEN 1 ELSE 0 END) AS empty_content,
  SUM(CASE WHEN tags_json IS NULL OR TRIM(tags_json) = '' OR tags_json = '[]' THEN 1 ELSE 0 END) AS missing_tags,
  SUM(CASE WHEN seo_title IS NULL OR TRIM(seo_title) = '' THEN 1 ELSE 0 END) AS missing_seo_title,
  SUM(CASE WHEN seo_description IS NULL OR TRIM(seo_description) = '' THEN 1 ELSE 0 END) AS missing_seo_description,
  SUM(CASE WHEN seo_keywords IS NULL OR TRIM(seo_keywords) = '' THEN 1 ELSE 0 END) AS missing_seo_keywords
FROM articles;
