import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { onRequest as publishRequest } from "../../functions/api/articles-publish.js";

globalThis.crypto ||= webcrypto;

const SECRET = "local-test-secret-with-at-least-32-characters";
const SITE = "https://alabqri.example";

function base64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

async function ownerCookie() {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(Buffer.from(JSON.stringify({
    id: "312770372", login: "alabqry55", iat: now, exp: now + 3600
  }), "utf8"));
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return "__Host-abq_admin=" + payload + "." + base64url(signature);
}

function mockDb() {
  const statements = [];
  const articles = new Map();
  return {
    statements,
    prepare(sql) {
      const statement = {
        sql: String(sql).trim(),
        values: [],
        bind(...values) { this.values = values; return this; },
        async all() {
          statements.push(this.sql);
          if (this.sql === "SELECT id,title FROM articles") {
            return { results: [...articles.values()].map(row => ({ id: row.id, title: row.title })) };
          }
          return { results: [] };
        },
        async first() {
          statements.push(this.sql);
          const id = this.values[0];
          return articles.get(String(id)) || null;
        }
      };
      return statement;
    },
    async batch(batch) {
      for (const item of batch) {
        statements.push(item.sql);
        if (item.sql.startsWith("INSERT INTO articles(")) {
          const v = item.values;
          articles.set(String(v[0]), {
            id: v[0], title: v[1], category: v[2], date: v[3], excerpt: v[4], content: v[5],
            scheduled_at: v[6], tags_json: v[7], seo_title: v[8], seo_description: v[9],
            seo_keywords: v[10], canonical_url: v[11], og_image: v[12]
          });
        }
      }
      return { results: [] };
    }
  };
}

const article = {
  id: "article-test-001",
  title: "مقال اختباري جديد",
  category: "التنمية البشرية",
  date: "26 نوفمبر 2026",
  excerpt: "ملخص اختباري.",
  content: "محتوى المقال الاختباري.",
  publishImmediately: true,
  tags: ["اختبار"]
};

test("publishing endpoint rejects unauthenticated writes", async () => {
  const db = mockDb();
  const response = await publishRequest({
    request: new Request(SITE + "/api/articles-publish", {
      method: "POST",
      headers: { Origin: SITE, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveMany", articles: [article] })
    }),
    env: { DB: db, ADMIN_SESSION_SECRET: SECRET }
  });
  assert.equal(response.status, 401);
  assert.equal(db.statements.length, 0);
});

test("publishing endpoint rejects cross-origin requests before database access", async () => {
  const db = mockDb();
  const response = await publishRequest({
    request: new Request(SITE + "/api/articles-publish", {
      method: "POST",
      headers: { Origin: "https://attacker.example", Cookie: await ownerCookie(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveMany", articles: [article] })
    }),
    env: { DB: db, ADMIN_SESSION_SECRET: SECRET }
  });
  assert.equal(response.status, 403);
  assert.equal(db.statements.length, 0);
});

test("owner publishing inserts and verifies new articles without DDL or delete statements", async () => {
  const db = mockDb();
  const response = await publishRequest({
    request: new Request(SITE + "/api/articles-publish", {
      method: "POST",
      headers: { Origin: SITE, Cookie: await ownerCookie(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveMany", articles: [article] })
    }),
    env: { DB: db, ADMIN_SESSION_SECRET: SECRET }
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.ok, true);
  assert.equal(result.verified, true);
  assert.equal(result.saved, 1);
  assert.ok(db.statements.some(sql => sql.startsWith("INSERT INTO articles(")));
  assert.ok(db.statements.some(sql => sql.startsWith("INSERT INTO article_admin_audit(")));
  assert.ok(db.statements.every(sql => !/^\s*(CREATE|ALTER|DROP|DELETE)\b/i.test(sql)), db.statements.join("\n"));
});

test("publishing endpoint accepts only saveMany and cannot expose delete", async () => {
  const db = mockDb();
  const response = await publishRequest({
    request: new Request(SITE + "/api/articles-publish", {
      method: "POST",
      headers: { Origin: SITE, Cookie: await ownerCookie(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: "article-test-001" })
    }),
    env: { DB: db, ADMIN_SESSION_SECRET: SECRET }
  });
  assert.equal(response.status, 400);
  assert.equal(db.statements.some(sql => /^\s*DELETE\b/i.test(sql)), false);
});
