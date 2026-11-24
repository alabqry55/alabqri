import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ui = await readFile(new URL("../../assets/articles-library.js", import.meta.url), "utf8");

test("library UI reads taxonomy independently and keeps legacy rendering as fallback", () => {
  assert.ok(ui.includes('fetch("/api/library/taxonomy"'));
  assert.ok(ui.includes('candidate?.available === true'));
  assert.ok(ui.includes("legacySectionDefinitions"));
  assert.ok(ui.includes("retain the legacy-compatible renderer"));
  assert.ok(ui.includes("const librarySections = taxonomy"));
  assert.ok(ui.includes(": legacySectionDefinitions;"));
});

test("library UI exposes section, specialty, and content-type filters", () => {
  assert.ok(ui.includes('setAttribute("aria-label","تصفية حسب التخصص")'));
  assert.ok(ui.includes('setAttribute("aria-label","تصفية حسب نوع المادة")'));
  assert.ok(ui.includes("selectedSectionId"));
  assert.ok(ui.includes("selectedSpecialtyId"));
  assert.ok(ui.includes("selectedContentTypeId"));
  assert.ok(ui.includes("String(item.primary_section_id) === selectedSectionId"));
});

test("library UI uses classification metadata without exposing editorial workflow fields", () => {
  assert.ok(ui.includes("primary_section_id"));
  assert.ok(ui.includes("primary_specialty_id"));
  assert.ok(ui.includes("content_type_id"));
  assert.equal(ui.includes("editorial_status"), false);
});

test("section display normalization does not mutate the stored taxonomy value", () => {
  assert.ok(ui.includes('.replace(/^\\s*03\\s+/, "")'));
  assert.ok(ui.includes("String(section.name || legacy.title || section.id)"));
  assert.ok(ui.includes("section.name"));
});

test("unclassified legacy articles remain mapped through their original category", () => {
  assert.ok(ui.includes("legacySectionByCategory"));
  assert.ok(ui.includes('String(article.category || "")'));
  assert.ok(ui.includes("return legacySectionByCategory.get"));
});
