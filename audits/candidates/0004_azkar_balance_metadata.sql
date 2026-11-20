-- Candidate only: Preview. Preserve the existing scheduled_at exactly.
SELECT id,title,tags_json,seo_title,seo_description,seo_keywords,scheduled_at FROM articles WHERE id='azkar-balance';
UPDATE articles SET tags_json='["الأذكار","الذكر","السكينة","الاتزان_الإيماني","الطمأنينة","الصحة_النفسية","الدعم_الروحي"]',seo_title='أثر الأذكار في السكينة والاتزان الإيماني',seo_description='يتناول المقال الذكر بوصفه عبادة وموردًا معنويًا للسكينة، ويناقش بحذر احتمالات دعم الانتباه والتعامل مع الضغوط دون اعتباره علاجًا نفسيًا أو آلية عصبية مثبتة.',seo_keywords='الأذكار، الذكر، السكينة، الاتزان الإيماني، الطمأنينة، الاجترار الفكري، الصحة النفسية، الدعم الروحي'
WHERE id='azkar-balance' AND tags_json='[]' AND seo_title IS NULL AND seo_description IS NULL AND seo_keywords IS NULL AND scheduled_at='2026-11-01T06:20:00.000Z';
SELECT id,title,tags_json,seo_title,seo_description,seo_keywords,scheduled_at FROM articles WHERE id='azkar-balance';
-- Rollback: restore only metadata; scheduled_at and content remain untouched.
-- UPDATE articles SET tags_json='[]',seo_title=NULL,seo_description=NULL,seo_keywords=NULL WHERE id='azkar-balance' AND seo_title='أثر الأذكار في السكينة والاتزان الإيماني' AND scheduled_at='2026-11-01T06:20:00.000Z';
