# 🌍 منظومة العبقري للاتزان الشامل - دليل المطور

## نظرة عامة

منظومة متكاملة وحديثة تجمع بين **البوصلة** و**المصفوفة** كأداتين متكاملتين لاكتشاف الذات والنمو الشخصي.

---

## 📁 هيكل الملفات

```
alabqri/
├── index.html                 # الملف الرئيسي للمنصة
├── design-system.css          # نظام التصميم الموحد (جديد) 🎨
├── ecosystem-intro.html       # شاشة اختيار الأداة (جديد) 🌍
├── ecosystem-controller.js    # نظام التحكم والتكامل (جديد) ⚙️
├── SETUP.md                   # دليل التثبيت (جديد)
├── DEVELOPER-GUIDE.md         # دليل المطور (هذا الملف)
├── package.json
└── tailwind.config.js
```

---

## 🎨 Design System

### متغيرات CSS الأساسية

```css
/* الألوان الأساسية */
--abq-brand-primary: #2563eb;
--abq-brand-secondary: #0ea5e9;
--abq-brand-dark: #0f172a;
--abq-brand-light: #f0f9ff;

/* البوصلة */
--compass-primary: #3b82f6;
--compass-secondary: #60a5fa;
--compass-light: #dbeafe;

/* المصفوفة */
--matrix-primary: #059669;
--matrix-secondary: #34d399;
--matrix-light: #d1fae5;
```

### الكومبوننتات المتاحة

#### البطاقات
```html
<!-- بطاقة موحدة -->
<div class="abq-card">المحتوى</div>

<!-- بطاقة متخصصة للبوصلة -->
<div class="abq-card compass-variant">محتوى البوصلة</div>

<!-- بطاقة متخصصة للمصفوفة -->
<div class="abq-card matrix-variant">محتوى المصفوفة</div>
```

#### الأزرار
```html
<!-- زر البوصلة -->
<button class="abq-btn compass-primary">ابدأ البوصلة</button>

<!-- زر المصفوفة -->
<button class="abq-btn matrix-primary">ابدأ المصفوفة</button>

<!-- زر ثانوي -->
<button class="abq-btn secondary">إلغاء</button>
```

#### حقول الإدخال
```html
<input class="abq-input compass-focus" type="text">
<select class="abq-select matrix-focus"></select>
<textarea class="abq-textarea"></textarea>
```

---

## ⚙️ نظام التحكم (Ecosystem Controller)

### التنقل

```javascript
// الانتقال للبوصلة
Ecosystem.goToCompass();

// الانتقال للمصفوفة
Ecosystem.goToMatrix();

// العودة للمنظومة
Ecosystem.backToEcosystem();

// تبديل مباشر
Ecosystem.switchTool('compass');
```

### إدارة البيانات

```javascript
// حفظ نتيجة البوصلة
Ecosystem.saveCompassResult({
  dimension1: 8,
  dimension2: 6,
  dimension3: 9
});

// حفظ نتيجة المصفوفة
Ecosystem.saveMatrixResult({
  cell1: 7,
  cell2: 8,
  cell3: 6,
  cell4: 9
});

// الحصول على النتائج
const results = Ecosystem.getResults();
console.log(results);
// {
//   compass: { ... },
//   matrix: { ... },
//   generatedAt: "2026-09-12T..."
// }
```

### التحريكات

```javascript
// التلاشي
Ecosystem.fadeIn(element, 400);
Ecosystem.fadeOut(element, 400);

// الانزلاق
Ecosystem.slideIn(element, 'up', 500); // up, down, left, right

// الظهور التدريجي
Ecosystem.scaleIn(element, 400);
```

### الأحداث

```javascript
// الاستماع للانتقالات
Ecosystem.on('transition', (event) => {
  console.log('انتقال:', event.detail);
});

// الاستماع لإكمال الأداوات
Ecosystem.on('completed', (event) => {
  console.log('اكتملت أداة:', event.detail.tool);
});

// الاستماع لتغيير البيانات
Ecosystem.on('dataChanged', (event) => {
  console.log('تغيرت البيانات:', event.detail);
});
```

---

## 📊 حالة التطبيق (State Management)

```javascript
// الوصول للحالة الحالية
const state = Ecosystem.getState();

// بنية الحالة:
{
  currentTool: 'compass', // 'ecosystem', 'compass', 'matrix'
  
  compassData: {
    status: 'completed',
    answers: [...],
    result: {...},
    timestamp: "2026-09-12T..."
  },
  
  matrixData: {
    status: 'completed',
    answers: [...],
    result: {...},
    timestamp: "2026-09-12T..."
  },
  
  userProfile: {
    sessionId: "session_...",
    startTime: "2026-09-12T...",
    toolsUsed: [...]
  },
  
  history: [...] // سجل جميع الإجراءات
}
```

---

## 🔄 التكامل مع index.html

### 1. إضافة المرجعيات

في قسم `<head>`:
```html
<link rel="stylesheet" href="design-system.css">
```

قبل `</body>`:
```html
<script src="ecosystem-controller.js"></script>
```

### 2. تحديث الأزرار

```html
<!-- بدلاً من الأزرار القديمة -->
<button onclick="Ecosystem.goToCompass()" class="abq-btn compass-primary">
  🧭 بوصلة العبقري
</button>

<button onclick="Ecosystem.goToMatrix()" class="abq-btn matrix-primary">
  📊 مصفوفة العبقري
</button>
```

### 3. ربط البيانات

```javascript
// عند اكتمال البوصلة
function compassComplete(result) {
  Ecosystem.saveCompassResult(result);
  // إظهار خيار الانتقال للمصفوفة
}

// عند اكتمال المصفوفة
function matrixComplete(result) {
  Ecosystem.saveMatrixResult(result);
  // عرض التقرير النهائي
}
```

---

## 🎨 مثال عملي كامل

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تطبيقي</title>
  
  <!-- Design System -->
  <link rel="stylesheet" href="design-system.css">
</head>
<body>
  <!-- محتوى التطبيق -->
  <div class="abq-card compass-variant">
    <h2 class="abq-heading-section">🧭 البوصلة</h2>
    <p class="abq-text-body">اكتشف اتجاهك...</p>
    <button class="abq-btn compass-primary" onclick="Ecosystem.goToCompass()">
      ابدأ الآن
    </button>
  </div>

  <!-- Ecosystem Controller -->
  <script src="ecosystem-controller.js"></script>
  
  <!-- تطبيقك -->
  <script>
    // الاستماع للأحداث
    Ecosystem.on('transition', (event) => {
      console.log('انتقل المستخدم إلى:', event.detail.tool);
    });
    
    // حفظ النتائج
    Ecosystem.saveCompassResult({
      dimension1: 8,
      dimension2: 7,
      dimension3: 6
    });
  </script>
</body>
</html>
```

---

## 📱 الاستجابة والجوال

جميع الكومبوننتات مصممة لتكون مستجيبة تلقائياً:

```css
/* نقاط الكسر المستخدمة */
--breakpoint-md: 768px;
--breakpoint-sm: 640px;
--breakpoint-xs: 0;
```

---

## 🔐 تخزين البيانات

البيانات تُحفظ تلقائياً في `LocalStorage`:

```javascript
// الحفظ يتم تلقائياً
// لكن يمكن إجباره يدويًا:
EcosystemState.save();

// الاسترجاع:
EcosystemState.load();

// المسح:
EcosystemState.reset();
```

---

## 📊 تصدير البيانات

```javascript
// تصدير كـ JSON
Ecosystem.exportData('my-results.json');

// تصدير مخصص
const results = Ecosystem.getResults();
console.log(JSON.stringify(results, null, 2));
```

---

## 🎯 أفضل الممارسات

1. **استخدم الفئات الموحدة دائماً**
   ```html
   ✓ <button class="abq-btn compass-primary">
   ✗ <button style="background: #3b82f6;">
   ```

2. **استخدم متغيرات CSS**
   ```css
   ✓ color: var(--compass-primary);
   ✗ color: #3b82f6;
   ```

3. **احفظ البيانات بشكل متكرر**
   ```javascript
   Ecosystem.saveCompassResult(result); // يحفظ تلقائياً
   ```

4. **استمع للأحداث**
   ```javascript
   Ecosystem.on('completed', (event) => {
     // تحديث واجهة المستخدم
   });
   ```

---

## 🚀 النسخة التالية (Roadmap)

- [ ] دعم تعدد اللغات
- [ ] تحليلات متقدمة
- [ ] نظام الشهادات
- [ ] التطبيق المحمول
- [ ] المزيد من الأدوات

---

## 📞 الدعم والمساعدة

للأسئلة والاستفسارات:
- 📧 البريد: ahmedalzmhry3@gmail.com
- 💬 واتساب: +201120909856
- 🔗 الموقع: https://alabqri.pages.dev

---

**آخر تحديث:** 12 سبتمبر 2026
**الإصدار:** 2.0.0
**الحالة:** ✅ جاهز للإنتاج
