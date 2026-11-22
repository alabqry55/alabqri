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

test("foundation migration seeds fourteen specialties without pre-empting migration 0003 section repair", async () => {
  const sql = await readFile(new URL("../../migrations/0002_library_taxonomy_foundation.sql", import.meta.url), "utf8");
  const specialtyBlock = sql.match(/INSERT OR IGNORE INTO library_specialties[\s\S]*?;/)?.[0] || "";
  const specialties = [...specialtyBlock.matchAll(/\('([^']+)',\s*'([^']+)',\s*(\d+)\)/g)];
  assert.equal(specialties.length, 14);
  assert.deepEqual(specialties.map(row => Number(row[3])), Array.from({ length: 14 }, (_, i) => i + 1));
  assert.doesNotMatch(sql, /primary_section_id\s+TEXT\s+NOT NULL/i);
  assert.doesNotMatch(specialtyBlock, /primary_section_id/i);

  const repair = await readFile(new URL("../../migrations/0003_library_specialty_section_repair.sql", import.meta.url), "utf8");
  assert.match(repair, /ALTER\s+TABLE\s+library_specialties[\s\S]*?ADD\s+COLUMN\s+primary_section_id/i);
  assert.match(repair, /UPDATE\s+library_specialties\s+SET\s+primary_section_id/i);
});

test("library taxonomy migration seeds the five baseline content types", async () => {
  const sql = await readFile(new URL("../../migrations/0002_library_taxonomy_foundation.sql", import.meta.url), "utf8");
  const typeBlock = sql.match(/INSERT OR IGNORE INTO library_content_types[\s\S]*?;/)?.[0] || "";
  const types = [...typeBlock.matchAll(/\('([^']+)',\s*'([^']+)',\s*(\d+)\)/g)];
  assert.deepEqual(types.map(row => row[2]), ["مقال", "بحث", "دراسة", "دورة", "مادة تدريبية"]);
});

test("foundation migration provisions the audit sink without dropping prior audit history", async () => {
  const sql = await readFile(new URL("../../migrations/0002_library_taxonomy_foundation.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS article_admin_audit/i);
  const rollback = await readFile(new URL("../../migrations/rollback_0002_library_taxonomy_foundation.sql", import.meta.url), "utf8");
  assert.doesNotMatch(rollback, /DROP TABLE IF EXISTS article_admin_audit/i);
});

test("foundation migration does not mutate or insert into existing article records", async () => {
  const sql = await readFile(new URL("../../migrations/0002_library_taxonomy_foundation.sql", import.meta.url), "utf8");
  assert.doesNotMatch(sql, /\bALTER\s+TABLE\s+articles\b/i);
  assert.doesNotMatch(sql, /\bUPDATE\s+articles\b/i);
  assert.doesNotMatch(sql, /\bDELETE\s+FROM\s+articles\b/i);
  assert.doesNotMatch(sql, /\bINSERT\s+INTO\s+articles\b/i);
});
