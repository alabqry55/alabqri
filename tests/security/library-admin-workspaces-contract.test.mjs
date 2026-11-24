import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ui = await readFile(new URL("../../assets/articles-library.js", import.meta.url), "utf8");

test("owner workspace provides review and publication schedule views", () => {
  assert.ok(ui.includes('["review","مراجعة المقالات والأبحاث"]'));
  assert.ok(ui.includes('["schedule","إدارة النشر والجدولة"]'));
  assert.ok(ui.includes("adminAuthenticated"));
  assert.ok(ui.includes("scheduled_at"));
  assert.ok(ui.includes("تحرير المادة"));
  assert.ok(ui.includes("تعديل موعد النشر"));
});

test("taxonomy workspace is explicitly read-only when the save API lacks classification writes", () => {
  assert.ok(ui.includes('["taxonomy","التصنيفات والتخصصات"]'));
  assert.ok(ui.includes("مصدر التصنيفات غير متاح"));
  assert.ok(ui.includes("لا يتم تعديل التخصص أو نوع المادة من هذه الشاشة"));
  assert.ok(ui.includes("لا يستقبل معرفاتهما"));
  assert.ok(ui.includes("primary_section_id"));
});

test("SEO workspace and preview are functional views over the existing article data", () => {
  assert.ok(ui.includes('["seo","بيانات SEO والفهرسة"]'));
  assert.ok(ui.includes('["preview","المعاينة والتحقق"]'));
  assert.ok(ui.includes("تحرير بيانات SEO"));
  assert.ok(ui.includes("اختر مادة للمعاينة"));
  assert.ok(ui.includes("المعاينة داخل لوحة الإدارة ولا تنشر المادة"));
});

test("workspace tabs are owner-only and expose their selected state accessibly", () => {
  assert.ok(ui.includes('adminWorkspace.hidden = !adminMode'));
  assert.ok(ui.includes('tab.setAttribute("aria-pressed", String(key === activeWorkspace))'));
  assert.ok(ui.includes('adminWorkspace.hidden = true'));
});
