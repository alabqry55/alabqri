-- ALABQRI: conservative correction of two legacy classifications.
-- Preserve the existing primary sections and all article records.
-- Clear only the unsupported specialty assignments.

UPDATE library_article_classification
SET primary_specialty_id = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE article_id = 'article-mw21bjes-dly783'
  AND primary_section_id = 'complementary-health'
  AND primary_specialty_id = 'safe-access-method';

UPDATE library_article_classification
SET primary_specialty_id = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE article_id = 'article-mw211mhx-yg6u9s'
  AND primary_section_id = 'islamic-psychology-development'
  AND primary_specialty_id = 'safe-access-method';
