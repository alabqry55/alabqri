-- منصة العبقري — مخطط قاعدة بيانات نظام الآراء والإعجاب
-- ملاحظة: لست مضطراً لتنفيذ هذا يدوياً — الدالة functions/api/feedback.js
-- تُنشئ هذين الجدولين تلقائياً بنفسها عند أول طلب إن لم يكونا موجودين.
-- هذا الملف موجود فقط كمرجع لفهم البنية، أو لتنفيذه يدوياً إن فضّلت ذلك.

CREATE TABLE IF NOT EXISTS abq_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    text TEXT NOT NULL,
    rating TEXT,
    created_at TEXT NOT NULL,
    ip_hash TEXT
);

CREATE TABLE IF NOT EXISTS abq_likes (
    ip_hash TEXT PRIMARY KEY,
    created_at TEXT NOT NULL
);
