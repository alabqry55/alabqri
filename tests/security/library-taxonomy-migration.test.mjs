// Re-run the security workflow after synchronizing the stacked taxonomy branches.
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
  const specialtySchema = sql.match(/CREATE TABLE IF NOT EXISTS library_specialties\s*\([\s\S]*?\n\);/i)?.[0] || "";
  assert.ok(specialtySchema, "library_specialties schema must be present in migration 0002");
  assert.doesNotMatch(specialtySchema, /primary_section_id/i);
  assert.doesNotMatch(sql, /CREATE INDEX IF NOT EXISTS idx_library_specialties_section/i);
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

test("migration 0003 adds the specialty section column and backfills the approved mapping", async () => {
  const repair = await readFile(new URL("../../migrations/0003_library_specialty_section_repair.sql", import.meta.url), "utf8");
  assert.match(repair, /ALTER\s+TABLE\s+library_specialties[\s\S]*?ADD\s+COLUMN\s+primary_section_id\s+TEXT/i);
  assert.match(repair, /UPDATE\s+library_specialties\s+SET\s+primary_section_id\s*=\s*'quran'/i);
  assert.match(repair, /UPDATE\s+library_specialties\s+SET\s+primary_section_id\s*=\s*'hadith'/i);
  assert.match(repair, /UPDATE\s+library_specialties\s+SET\s+primary_section_id\s*=\s*'dhikr-balance'/i);
  assert.match(repair, /UPDATE\s+library_specialties\s+SET\s+primary_section_id\s*=\s*'complementary-health'/i);
  assert.match(repair, /UPDATE\s+library_specialties\s+SET\s+primary_section_id\s*=\s*'islamic-psychology-development'/i);
  assert.match(repair, /UPDATE\s+library_specialties\s+SET\s+primary_section_id\s*=\s*'knowledge-thought'/i);
  assert.match(repair, /03 📿 الذكر والإتزان الإيماني/);
});

test("migration 0003 installs all four section integrity triggers", async () => {
  const repair = await readFile(new URL("../../migrations/0003_library_specialty_section_repair.sql", import.meta.url), "utf8");
  for (const trigger of [
    "trg_library_specialties_section_insert",
    "trg_library_specialties_section_update",
    "trg_library_classification_specialty_section_insert",
    "trg_library_classification_specialty_section_update"
  ]) assert.match(repair, new RegExp("CREATE TRIGGER IF NOT EXISTS\\s+" + trigger, "i"));
});

test("migration 0003 preserves article, classification, content-type, and audit rows", async () => {
  const repair = await readFile(new URL("../../migrations/0003_library_specialty_section_repair.sql", import.meta.url), "utf8");
  assert.doesNotMatch(repair, /\b(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+)?articles\b/i);
  assert.doesNotMatch(repair, /\b(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+)?library_article_classification\b/i);
  assert.doesNotMatch(repair, /\b(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+)?library_content_types\b/i);
  assert.doesNotMatch(repair, /\b(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+)?article_admin_audit\b/i);
});
