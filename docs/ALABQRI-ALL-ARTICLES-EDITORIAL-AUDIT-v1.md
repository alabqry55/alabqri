# ALABQRI — All-Articles Editorial Audit (Preview-first)

## Purpose

Establish a complete, article-by-article editorial review for the current library before any bulk metadata or taxonomy changes. The known production baseline is 19 articles; reconcile the live count before proceeding.

## Safety boundary

- The inventory SQL is read-only and contains SELECT statements only.
- Run the inventory against `alabqri-db` only to export the source records; do not run mutation statements on production.
- Do not alter article content, title, legacy category, date, `scheduled_at`, IDs, canonical URLs, or OG images during the inventory.
- Do not delete, merge, or deduplicate records automatically.
- All proposed writes must target `alabqri-db-preview-test` first and be separately reviewed.
- Exclude technical test records from the editorial library without deleting them.
- Do not infer scientific, medical, historical, or religious conclusions from titles alone.

## Required per-article review

For every record, create one review row with:

1. Existing ID, title, legacy category, date, and schedule (preserved).
2. One primary section from the seven approved sections.
3. Optional primary specialty from the fourteen approved specialties; leave null when no fit exists.
4. Content type from the six registered content types.
5. Editorial status and concise reason.
6. Scientific / medical evidence review where relevant.
7. Qur'anic / hadith / fiqh source verification where relevant.
8. Historical and factual verification where relevant.
9. Language, structure, repetition, and typographical review.
10. Article-specific tags and SEO title, description, and keywords.
11. Internal-link opportunities and duplicate/overlap observations.
12. Whether a content correction is proposed; quote the exact affected passage and provide a rationale. No automatic content rewriting.

## Editorial safeguards

- Distinguish established evidence, plausible but uncertain findings, hypotheses, traditional claims, and unsupported claims.
- Do not present complementary practices as proven treatments without appropriate clinical evidence.
- Do not make blanket theological judgments about a practice or practitioner without examining the actual belief and practice.
- Verify Qur'anic quotations, hadith attribution and grading, and scholarly citations against reliable sources.
- Preserve the author's intended meaning; do not silently replace substantive claims.
- Keep publication and scheduling state unchanged until separately authorized.

## Execution sequence

1. Export all rows using `audits/0001_readonly_articles_inventory.sql`.
2. Reconcile count, unique IDs, duplicate titles, missing content, and missing metadata.
3. Review the full text of each article and build the article-specific review matrix.
4. Prepare idempotent SQL for Preview only, scoped by explicit article IDs.
5. Verify classification counts, metadata, unchanged content/title/category/date/schedule/IDs, and foreign-key integrity.
6. Test application rendering, filtering, search, owner-only editing, and desktop/mobile parity.
7. Only after Preview passes, present a separate production rollout plan for explicit approval.

## Current known baseline

- Production was previously inventoried at 19 articles.
- Preview currently contains 6 records, including 5 editorial articles and one technical integration test.
- Five Preview editorial articles have already received taxonomy rows and metadata updates. Those five are not a substitute for the full production audit.
- The new taxonomy tables have been created and populated in Preview; the current `main` application code still uses legacy categories and needs a separate integration change.
