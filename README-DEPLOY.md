# منصة العبقري — حزمة Cloudflare

## الملفات
- `index.html` — الواجهة الحالية.
- `package.json` — إعداد المشروع وWrangler.
- `wrangler.toml` — ملف إعداد اختياري عند إدارة إعدادات Pages وD1 عبر Wrangler؛ **هذا الملف غير موجود حاليًا في المستودع**، لذلك لا تفترض وجوده أو تعدّل معرّف قاعدة بيانات داخله قبل إنشائه والتحقق من الإعدادات الفعلية.
- `functions/api/visitors.js` — عداد الزوار.
- `functions/api/feedback.js` — الإعجاب والتعليقات والتقييمات.
- `schema.sql` — جداول D1.

## قبل النشر
1. أنشئ D1 باسم `alabqri-db`.
2. نفّذ `schema.sql`.
3. تحقّق أولًا من إعدادات مشروع Pages في Cloudflare ومن قاعدة D1 الفعلية. يجب أن يكون اسم الربط الذي تستخدمه وظائف API هو `DB`. إذا كان الربط مضبوطًا من لوحة Cloudflare، فلا تُنشئ `wrangler.toml` لمجرد أنه مذكور هنا. أمّا إذا اخترت إدارة الربط عبر Wrangler، فأنشئ ملف إعداد صحيحًا باستخدام Database ID الحقيقي بعد التحقق منه، ولا تستخدم قيمة `REPLACE_WITH_REAL_D1_DATABASE_ID` في النشر.
4. اضبط سر Cloudflare `FEEDBACK_ADMIN_KEY` لقيمة إدارية قوية من إعدادات المشروع، ولا تضعه في `index.html` أو أي ملف عام بالمستودع.
5. تأكد أن مشروع Pages اسمه `alabqri`.

## النشر عبر Wrangler (اختياري)

استخدم هذا المسار فقط إذا كان النشر اليدوي عبر Wrangler هو المسار المعتمد للمشروع. إذا كان المشروع ينشر تلقائيًا من GitHub عبر Pages، فاستمر في مسار النشر المعتاد ولا تغيّر طريقة النشر أثناء فحص الإعدادات.
```bash
npm install
npx wrangler d1 execute alabqri-db --remote --file=./schema.sql
npx wrangler pages deploy . --project-name alabqri
```

> إذا كان المشروع مرتبطًا مسبقًا بـ GitHub/Pages، يمكن استخدام مسار النشر المعتاد للمشروع بدل الأمر الأخير.
