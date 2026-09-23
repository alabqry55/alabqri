# منصة العبقري — حزمة Cloudflare

## الملفات
- `index.html` — الواجهة الحالية.
- `package.json` — إعداد المشروع وWrangler.
- `wrangler.toml` — ربط Pages + D1.
- `functions/api/visitors.js` — عداد الزوار.
- `functions/api/feedback.js` — الإعجاب والتعليقات والتقييمات.
- `schema.sql` — جداول D1.

## قبل النشر
1. أنشئ D1 باسم `alabqri-db`.
2. نفّذ `schema.sql`.
3. استبدل `REPLACE_WITH_REAL_D1_DATABASE_ID` في `wrangler.toml` بالـ Database ID الحقيقي.
4. اضبط سر Cloudflare `FEEDBACK_ADMIN_KEY` لقيمة إدارية لا تُكتب داخل `index.html`.
5. تأكد أن مشروع Pages اسمه `alabqri`.

## نشر Wrangler
```bash
npm install
npx wrangler d1 execute alabqari-db --remote --file=./schema.sql
npx wrangler pages deploy . --project-name alabqri
```

> إذا كان المشروع مرتبطًا مسبقًا بـ GitHub/Pages، يمكن استخدام مسار النشر المعتاد للمشروع بدل الأمر الأخير.
