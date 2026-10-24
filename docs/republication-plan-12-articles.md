# ALABQRI — Safe re-publication plan for the 12 scheduled articles

## Safety boundary
- This preparation branch is based on the current `main` commit at the time of preparation.
- Do not merge this document-only preparation branch into `main`; it must not trigger a production change.
- No D1 database rows, production bindings, article renderer, tab logic, mobile CSS, or welcome-audio code are changed by this preparation.
- Publish only after the image-to-article mapping is verified and the candidate is tested on desktop and mobile.

## Article inventory
The source schedule is `functions/_lib/articles-schedule-2026.js` at reference commit `1d7f257`. It contains the following 12 article IDs and titles:

1. `thinking-loop-2026` — التفكير الزائد: كيف تكسر دائرة الاجترار بخطوات عملية
2. `family-dialogue-2026` — الخلافات الأسرية: مهارات الحوار التي تقلل التصعيد
3. `self-discipline-habits-2026` — الانضباط الذاتي وبناء العادات: كيف تستمر بعد تراجع الحماس؟
4. `healthy-boundaries-2026` — الحدود الصحية في العلاقات: قول لا باحترام ووضوح
5. `effective-trainer-2026` — المدرب الفعّال: من تقديم المعلومات إلى إحداث تعلّم قابل للتطبيق
6. `sleep-mental-health-2026` — النوم والصحة النفسية: عادات يومية تدعم الراحة والتركيز
7. `decisions-under-pressure-2026` — اتخاذ القرارات الصعبة: إطار عملي للموازنة بين الخيارات
8. `lifelong-learning-2026` — التعلم المستمر: خطة واقعية لتطوير المهارات في عصر التغيير
9. `thirty-day-change-2026` — التغيير يبدأ بخطوات صغيرة: برنامج عملي لمدة 30 يومًا
10. `anxiety-support-2026` — القلق النفسي: علامات تستحق الانتباه وطرق طلب المساعدة
11. `time-priorities-2026` — إدارة الوقت وترتيب الأولويات: خطة أسبوعية تقلل التشتت
12. `evidence-health-claims-2026` — كيف نقيّم الادعاءات العلاجية؟ دليل للتفكير العلمي المسؤول

## Image audit result
- The scheduled article objects in `functions/_lib/articles-schedule-2026.js` do not currently define an article image field.
- The repository includes `assets/image-recovery-manifest.json` and 17 non-logo image assets whose `platformPlacement` is marked `unverified`.
- Therefore, the available evidence does not establish which of those original images belongs to each of the 12 articles. Do not guess or assign images by filename/order.
- The public article card renderer reads the D1-backed `/api/articles` response. The existing article API's save/seed flow does not persist an image field, so adding image markup alone would not reliably preserve article images.

## Required implementation gates
1. Verify the original image for each article from the source files or the user's original image set.
2. Choose and implement an explicit image storage contract end-to-end (article schema/API/admin/card renderer), with a backward-compatible optional field and safe fallback for existing articles.
3. Add or update records only in an isolated preview/test database; do not use the production D1 database for rehearsal.
4. Verify unique IDs and normalized titles against existing records before import; skip conflicts rather than create duplicates.
5. Test article list, image load/fallback, search, category filtering, tab navigation and visibility at mobile and desktop widths.
6. Confirm mobile tab/audio behavior is unchanged; if any test fails, do not merge or publish.
7. Only after all gates pass, request approval to merge and deploy.

## Current decision
**Prepared for safe follow-up; not yet ready to re-publish.** The original 12 texts are recoverable from the schedule, but image-to-article mapping is unverified and the runtime schema/API does not yet carry article images. No production publication has been performed.
