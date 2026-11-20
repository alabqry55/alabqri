-- ALABQRI editorial audit — candidate metadata correction
-- Target record: article-mwn3j3ly-vua1ie
-- Purpose: repair SEO metadata copied from the unrelated "الخوف والخشية" article.
-- SAFETY: CANDIDATE ONLY. Do not execute against production until the owner reviews
-- and explicitly approves the proposed values and the target environment.
-- This patch changes ONLY tags_json, seo_title, and seo_keywords.
-- It does not change content, title, category, id, dates, timestamps, canonical_url,
-- og_image, or scheduled_at.

-- 1) Preflight: expected current values must match exactly.
SELECT id, title, tags_json, seo_title, seo_description, seo_keywords
FROM articles
WHERE id = 'article-mwn3j3ly-vua1ie';

-- 2) Apply only if the row still has the known incorrect metadata.
UPDATE articles
SET
  tags_json = '["الشعور_بالذنب","جلد_الذات","لوم_النفس","التوبة","محاسبة_النفس","الرحمة_بالذات","الصحة_النفسية","علم_النفس_الإسلامي","تقدير_الذات","التوازن_النفسي"]',
  seo_title = 'الشعور بالذنب وجلد الذات: كيف نراجع أنفسنا دون قسوة؟',
  seo_keywords = 'الشعور بالذنب، جلد الذات، لوم النفس، التوبة، محاسبة النفس، الرحمة بالذات، الصحة النفسية، علم النفس الإسلامي، تقدير الذات، التوازن النفسي.'
WHERE id = 'article-mwn3j3ly-vua1ie'
  AND seo_title = 'الفرق بين الخوف والخشية في القرآن الكريم: الدلالة اللغوية والإيمانية'
  AND tags_json = '["الفرق_بين_الخوف_والخشية","الخوف_في_القرآن_الكريم","الخشية_في_القرآن_الكريم","خشية_الله","دلالات_الألفاظ_القرآنية","التدبر_القرآني","علوم_القرآن","العلم_والخشية","الخوف_والرجاء","علم_النفس_الإسلامي"]';

-- 3) Verify. Expected: one row, corrected title/tags, description unchanged.
SELECT id, title, tags_json, seo_title, seo_description, seo_keywords,
       canonical_url, scheduled_at, created_at, updated_at
FROM articles
WHERE id = 'article-mwn3j3ly-vua1ie';

-- ROLLBACK (run only if the candidate UPDATE was applied and must be reverted):
-- UPDATE articles
-- SET
--   tags_json = '["الفرق_بين_الخوف_والخشية","الخوف_في_القرآن_الكريم","الخشية_في_القرآن_الكريم","خشية_الله","دلالات_الألفاظ_القرآنية","التدبر_القرآني","علوم_القرآن","العلم_والخشية","الخوف_والرجاء","علم_النفس_الإسلامي"]',
--   seo_title = 'الفرق بين الخوف والخشية في القرآن الكريم: الدلالة اللغوية والإيمانية',
--   seo_keywords = 'الخوف والخشية، الخشية في القرآن، الخوف في القرآن، علوم القرآن، الدلالة اللغوية، التدبر القرآني'
-- WHERE id = 'article-mwn3j3ly-vua1ie'
--   AND seo_title = 'الشعور بالذنب وجلد الذات: كيف نراجع أنفسنا دون قسوة؟';
