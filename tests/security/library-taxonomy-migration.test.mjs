import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("library taxonomy migration seeds the seven approved sections and exact third-section spelling", async () => {
  const sql = await readFile(new URL("../../migrations/0002_library_taxonomy_foundation.sql", import.meta.url), "utf8");
  const sectionBlock = sql.match(/INSERT OR IGNORE INTO library_sections[\s\S]*?;/)?.[0] || "";
  const rows = [...sectionBlock.matchAll(/\('([^']+)',\s*'([^']+)',\s*(\d+)\)/g)];
  assert.equal(rows.length, 7);
  assert.deepEqual(rows.map(row => Number(row[3])), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(rows[2][2], "الذكر والإتزان الإيماني");
  assert.equal(rows[1][2], "الحديث الشريف وعلومه");
});

test("library taxonomy migration seeds exactly fourteen specialties and five approved content types", async () => {
  const sql = await readFile(new URL("../../migrations/0002_library_taxonomy_foundation.sql", import.meta.url), "utf8");
  const specialtyBlock = sql.match(/INSERT OR IGNORE INTO library_specialties[\s\S]*?;/)?.[0] || "";
  const typeBlock = sql.match(/INSERT OR IGNORE INTO library_content_types[\s\S]*?;/)?.[0] || "";
  const specialties = [...specialtyBlock.matchAll(/\('([^']+)',\s*'([^']+)',\s*(\d+)\)/g)];
  const types = [...typeBlock.matchAll(/\('([^']+)',\s*'([^']+)',\s*(\d+)\)/g)];
  assert.equal(specialties.length, 14);
  assert.deepEqual(types.map(row => row[2]), ["مقال", "بحث", "دراسة", "دورة", "مادة تدريبية"]);
});

test("foundation migration provisions the audit sink without dropping prior audit history", async () => {\n  const sql = await readFile(new URL("../../migrations/0002_library_taxonomy_foundation.sql", import.meta.url), "utf8");\n  assert.match(sql, /CREATE TABLE IF NOT EXISTS article_admin_audit/i);\n  const rollback = await readFile(new URL("../../migrations/rollback_0002_library_taxonomy_foundation.sql", import.meta.url), "utf8");\n  assert.doesNotMatch(rollback, /DROP TABLE IF EXISTS article_admin_audit/i);\n});\n\ntest("foundation migration does not mutate or insert into existing article records", async () => {
  const sql = await readFile(new URL("../../migrations/0002_library_taxonomy_foundation.sql", import.meta.url), "utf8");
  assert.doesNotMatch(sql, /\bALTER\s+TABLE\s+articles\b/i);
  assert.doesNotMatch(sql, /\bUPDATE\s+articles\b/i);
  assert.doesNotMatch(sql, /\bDELETE\s+FROM\s+articles\b/i);
  assert.doesNotMatch(sql, /\bINSERT\s+INTO\s+articles\b/i);
});
