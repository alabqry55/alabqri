-- ALABQRI: batch classification + metadata for the five editorial Preview articles.
-- TARGET: alabqri-db-preview-test ONLY.
-- SAFETY: does not change article content, title, category, date, scheduled_at, IDs,
-- delete records, or touch the production database.
-- Idempotent: re-running upserts the same five classification rows and metadata.

PRAGMA foreign_keys = ON;

-- 1) Register one primary section, optional specialty, content type, and editorial status.
INSERT INTO library_article_classification
  (article_id, primary_section_id, primary_specialty_id, content_type_id, editorial_status, editorial_note)
SELECT
  a.id, x.section_id, x.specialty_id, 'article', x.editorial_status, x.editorial_note
FROM (
  SELECT 'article-mw21bjes-dly783' AS article_id, 'complementary-health' AS section_id,
         'safe-access-method' AS specialty_id, 'needs_scientific_review' AS editorial_status,
         'مقال تثقيفي تحليلي؛ يلزم توثيق مصادر فوائد التنفس والاسترخاء، والفصل بين الاسترخاء وعلاج الأمراض العضوية، ومراجعة الادعاءات المتعلقة بالطاقة غير المثبتة.' AS editorial_note
  UNION ALL
  SELECT 'article_1793869474653', 'knowledge-thought', 'safe-access-method',
         'needs_scientific_review',
         'مقال نقدي تحليلي؛ يلزم تدقيق علمي وشرعي، وتوثيق مصادر الطب التجريبي والفتاوى، وعدم تعميم الأحكام العقدية أو اختزال التحسن في تأثير الدواء الوهمي وحده.'
  UNION ALL
  SELECT 'article-mw211mhx-yg6u9s', 'islamic-psychology-development', 'safe-access-method',
         'needs_editorial_review',
         'مقال تأصيلي وتوجيهي؛ يلزم مراجعة الأدلة الشرعية، وضبط الحديث عن قانون الجذب والإيجابية السامة والبرمجة اللغوية العصبية، وحدود الممارسة المهنية، وتصحيح الخطأ المطبعي تطوير الذهب إلى تطوير الذات.'
  UNION ALL
  SELECT 'azkar-balance', 'dhikr-balance', NULL,
         'pending_review',
         'مقال إيماني توعوي؛ لا يفرض له تخصص غير مناسب، وتُحافظ على حالة الجدولة الحالية دون تغيير.'
  UNION ALL
  SELECT 'article-mvqim3r7-5675m0', 'knowledge-thought', NULL,
         'needs_editorial_review',
         'مقال تثقيفي توثيقي في السيرة النبوية؛ يلزم ضبط التسلسل التاريخي وعدم الجزم بتاريخ محدد لأول الوحي دون دليل، والتمييز بين بدء الوحي وفتوره والأمر بالإنذار والجهر بالدعوة.'
) AS x
JOIN articles AS a ON a.id = x.article_id
JOIN library_sections AS s ON s.id = x.section_id
LEFT JOIN library_specialties AS sp ON sp.id = x.specialty_id
JOIN library_content_types AS ct ON ct.id = 'article'
WHERE x.specialty_id IS NULL OR sp.id IS NOT NULL
ON CONFLICT(article_id) DO UPDATE SET
  primary_section_id = excluded.primary_section_id,
  primary_specialty_id = excluded.primary_specialty_id,
  content_type_id = excluded.content_type_id,
  editorial_status = excluded.editorial_status,
  editorial_note = excluded.editorial_note,
  updated_at = CURRENT_TIMESTAMP;

-- 2) Apply corrected tags and SEO metadata to the same five Preview articles.
-- Existing content/title/category/date/scheduling fields are intentionally untouched.

UPDATE articles
SET
  tags_json = '["الطاقة_الحيوية","الطب_التكميلي","التفكير_النقدي","الممارسات_التكميلية","الاسترخاء","التنفس","سلامة_الادعاءات_العلاجية","منهج_العبقري"]',
  seo_title = 'الطاقة الحيوية بين المفهوم والممارسة | قراءة علمية مسؤولة',
  seo_description = 'تعرّف على مفهوم الطاقة الحيوية والتمييز بين الطاقة البيولوجية المعروفة والمفاهيم غير المثبتة، مع مناقشة الاسترخاء والممارسات التكميلية وضوابط تقييم الادعاءات العلاجية.',
  seo_keywords = 'الطاقة الحيوية، الطب التكميلي، التفكير النقدي، الممارسات التكميلية، الاسترخاء، التنفس، الادعاءات العلاجية'
WHERE id = 'article-mw21bjes-dly783';

UPDATE articles
SET
  tags_json = '["الطاقة_الحيوية","العلم_والشريعة","العقيدة_والفكر","التفكير_النقدي","الفلسفات_الشرقية","الادعاءات_العلاجية","منهج_العبقري","سلامة_الوصول"]',
  seo_title = 'الطاقة الحيوية بين العلم والشريعة | دراسة نقدية',
  seo_description = 'دراسة نقدية لمفهوم الطاقة الحيوية وممارساته، تميّز بين الادعاءات الفلسفية والعلمية، وتناقش الضوابط الشرعية دون تعميم الأحكام أو تجاوز الأدلة.',
  seo_keywords = 'الطاقة الحيوية، العلم والشريعة، التفكير النقدي، الفلسفات الشرقية، الادعاءات العلاجية، سلامة الوصول'
WHERE id = 'article_1793869474653';

UPDATE articles
SET
  tags_json = '["فقه_التنمية_الذاتية","التنمية_البشرية_في_الإسلام","بناء_الشخصية","تزكية_النفس","علم_النفس_الإسلامي","التفكير_النقدي","منهج_العبقري"]',
  seo_title = 'فقه التنمية الذاتية في الإسلام وبناء الشخصية المتوازنة',
  seo_description = 'دراسة تأصيلية في التنمية الذاتية من منظور إسلامي، تتناول بناء الشخصية وتزكية النفس، وتناقش قانون الجذب والإيجابية السامة والادعاءات غير المثبتة في برامج التنمية البشرية.',
  seo_keywords = 'فقه التنمية الذاتية، التنمية البشرية في الإسلام، بناء الشخصية، تزكية النفس، علم النفس الإسلامي، قانون الجذب، التفكير النقدي'
WHERE id = 'article-mw211mhx-yg6u9s';

UPDATE articles
SET
  tags_json = '["الأذكار","الذكر","الاتزان_النفسي","السكينة","الطمأنينة","الصحة_النفسية","الذكر_والاتزان_الإيماني"]',
  seo_title = 'أثر الأذكار في الاتزان النفسي والسكينة | العبقري',
  seo_description = 'تعرّف على أثر الأذكار في حياة المسلم وما تمنحه من معاني السكينة والانتباه والاتصال بالله، مع بيان أنها ممارسة إيمانية لا تغني عن الرعاية الصحية المتخصصة عند الحاجة.',
  seo_keywords = 'أثر الأذكار، الاتزان النفسي، السكينة، الطمأنينة، الذكر، الصحة النفسية'
WHERE id = 'azkar-balance';

UPDATE articles
SET
  tags_json = '["السيرة_النبوية","بدء_الوحي","غار_حراء","النبي_محمد","سورة_العلق","خديجة_رضي_الله_عنها","تاريخ_الدعوة_الإسلامية"]',
  seo_title = 'بداية نبوة النبي محمد ﷺ ونزول الوحي في غار حراء',
  seo_description = 'تعرف على بداية الوحي للنبي محمد ﷺ في غار حراء، وقصة نزول أول آيات سورة العلق، وموقف خديجة رضي الله عنها، ومراحل بدء الدعوة الإسلامية.',
  seo_keywords = 'بدء الوحي، بداية نبوة محمد، غار حراء، أول ما نزل من القرآن، سورة العلق، خديجة بنت خويلد، السيرة النبوية'
WHERE id = 'article-mvqim3r7-5675m0';

-- 3) Verification: expect 5 classification rows for the five editorial articles.
SELECT COUNT(*) AS classified_editorial_articles
FROM library_article_classification
WHERE article_id IN (
  'article-mw21bjes-dly783',
  'article_1793869474653',
  'article-mw211mhx-yg6u9s',
  'azkar-balance',
  'article-mvqim3r7-5675m0'
);

SELECT
  a.id, a.title, s.name AS primary_section, sp.name AS primary_specialty,
  ct.name AS content_type, c.editorial_status,
  length(a.tags_json) AS tags_json_length,
  a.seo_title
FROM library_article_classification AS c
JOIN articles AS a ON a.id = c.article_id
JOIN library_sections AS s ON s.id = c.primary_section_id
LEFT JOIN library_specialties AS sp ON sp.id = c.primary_specialty_id
JOIN library_content_types AS ct ON ct.id = c.content_type_id
WHERE c.article_id IN (
  'article-mw21bjes-dly783',
  'article_1793869474653',
  'article-mw211mhx-yg6u9s',
  'azkar-balance',
  'article-mvqim3r7-5675m0'
)
ORDER BY s.sort_order, a.id;

-- The technical test article chatgpt-integration-test-20261119 is deliberately excluded.
-- No production database is referenced by this script.
