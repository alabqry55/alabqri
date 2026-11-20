import test from "node:test";
import assert from "node:assert/strict";

import { onRequest as articlePageRequest } from "../../functions/articles/[slug].js";
import { onRequest as sitemapRequest } from "../../functions/sitemap.xml.js";

const SITE = "https://alabqri.example";

const articleFixture = overrides => ({
  id: "article-test-2026",
  title: "عنوان المقال التجريبي",
  category: "موضوعات معرفية",
  date: "20 نوفمبر 2026",
  excerpt: "ملخص المقال التجريبي.",
  content: "المحتوى الكامل للمقال.\nالسطر الثاني.",
  scheduled_at: null,
  seo_title: "عنوان SEO للمقال",
  seo_description: "وصف SEO مستقل للمقال.",
  seo_keywords: "كلمة أولى, كلمة ثانية",
  canonical_url: null,
  og_image: null,
  created_at: "2026-11-20T10:00:00.000Z",
  updated_at: "2026-11-20T11:00:00.000Z",
  ...overrides
});

function articleDb(rows = []) {
  const statements = [];
  return {
    statements,
    prepare(sql) {
      statements.push(String(sql).trim());
      return {
        bind() { return this; },
        async all() { return { results: rows }; }
      };
    }
  };
}

test("public article page renders SEO metadata and crawlable article content from the public API", async () => {
  const db = articleDb([articleFixture()]);
  const response = await articlePageRequest({
    request: new Request(SITE + "/articles/article-test-2026"),
    env: { DB: db },
    params: { slug: "article-test-2026" }
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const html = await response.text();
  assert.ok(html.includes("<title>عنوان SEO للمقال | العبقري</title>"));
  assert.ok(html.includes('<meta name="description" content="وصف SEO مستقل للمقال.">'));
  assert.ok(html.includes('<meta name="keywords" content="كلمة أولى, كلمة ثانية">'));
  assert.ok(html.includes('<meta property="og:type" content="article">'));
  assert.ok(html.includes('rel="canonical" href="https://alabqri.example/articles/article-test-2026"'));
  assert.ok(html.includes('"@type":"Article"'));
  assert.ok(html.includes("المحتوى الكامل للمقال."));
  assert.ok(db.statements.every(sql => sql.toUpperCase().startsWith("SELECT ")));
});

test("article page escapes stored content and metadata instead of rendering injected markup", async () => {
  const db = articleDb([articleFixture({
    title: 'عنوان <img src=x onerror="alert(1)">',
    seo_title: 'SEO <script>alert(1)</script>',
    seo_description: 'وصف "مقتبس" <script>alert(1)</script>',
    content: '<script>alert("x")</script>'
  })]);
  const response = await articlePageRequest({
    request: new Request(SITE + "/articles/article-test-2026"),
    env: { DB: db },
    params: { slug: "article-test-2026" }
  });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.equal(html.includes('<script>alert("x")</script>'), false);
  assert.equal(html.includes('<img src=x onerror="alert(1)">'), false);
});

test("canonical article slugs resolve through the public library on preview hosts", async () => {
  const db = articleDb([articleFixture({
    id: "article-fear-2026",
    canonical_url: "https://alabqri.pages.dev/articles/fear-in-holy-quran"
  })]);
  const response = await articlePageRequest({
    request: new Request("https://preview.alabqri.pages.dev/articles/fear-in-holy-quran"),
    env: { DB: db },
    params: { slug: "fear-in-holy-quran" }
  });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /عنوان SEO للمقال/);
  assert.ok(db.statements.every(sql => sql.toUpperCase().startsWith("SELECT ")));
});

test("future-scheduled articles remain unavailable because the public API excludes them", async () => {
  const db = articleDb([articleFixture({ scheduled_at: "2099-01-01T00:00:00.000Z" })]);
  const response = await articlePageRequest({
    request: new Request(SITE + "/articles/article-test-2026"),
    env: { DB: db },
    params: { slug: "article-test-2026" }
  });
  assert.equal(response.status, 404);
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
});

test("article route supports HEAD and rejects write methods", async () => {
  const db = articleDb([articleFixture()]);
  const head = await articlePageRequest({
    request: new Request(SITE + "/articles/article-test-2026", { method: "HEAD" }),
    env: { DB: db },
    params: { slug: "article-test-2026" }
  });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  const post = await articlePageRequest({
    request: new Request(SITE + "/articles/article-test-2026", { method: "POST" }),
    env: { DB: db },
    params: { slug: "article-test-2026" }
  });
  assert.equal(post.status, 405);
});

test("dynamic sitemap uses public articles and preserves existing static URLs", async () => {
  const db = articleDb([
    articleFixture({ id: "article-one", canonical_url: null, updated_at: "2026-11-20T10:00:00.000Z" }),
    articleFixture({ id: "article-two", title: "عنوان المقال الثاني", seo_title: "SEO للمقال الثاني", canonical_url: "https://alabqri.example/articles/custom-slug", updated_at: null })
  ]);
  const response = await sitemapRequest({
    request: new Request(SITE + "/sitemap.xml"),
    env: { DB: db }
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/xml/);
  const xml = await response.text();
  assert.ok(xml.includes(SITE + "/verification.html"));
  assert.ok(xml.includes(SITE + "/articles/article-one"));
  assert.ok(xml.includes(SITE + "/articles/custom-slug"));
  assert.ok(db.statements.every(sql => sql.toUpperCase().startsWith("SELECT ")));
});
