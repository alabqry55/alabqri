import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
globalThis.crypto ??= webcrypto;
import { onRequest } from "../../functions/api/admin/library-classification.js";

const SITE = "https://alabqri.example";
const SECRET = "test-secret-with-at-least-thirty-two-characters";

async function ownerCookie() {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ login: "alabqry55", id: "312770372", iat: now, exp: now + 600 })).toString("base64url");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))).toString("base64url");
  return `__Host-abq_admin=${payload}.${signature}`;
}
function request(path, { method = "GET", cookie, body } = {}) {
  const headers = new Headers();
  if (cookie) headers.set("Cookie", cookie);
  if (body !== undefined) { headers.set("Origin", SITE); headers.set("Content-Type", "application/json"); }
  return new Request(SITE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

test("rejects unauthenticated reads and writes before database access", async () => {
  let touched = false;
  const env = { ADMIN_SESSION_SECRET: SECRET, DB: { prepare() { touched = true; throw new Error("must not access DB"); } } };
  const read = await onRequest({ request: request("/api/admin/library-classification"), env });
  const write = await onRequest({ request: request("/api/admin/library-classification", { method: "POST", body: { article_id: "x" } }), env });
  assert.equal(read.status, 401); assert.equal(write.status, 401); assert.equal(touched, false);
});
test("fails closed when taxonomy tables are not installed", async () => {
  const cookie = await ownerCookie();
  const env = { ADMIN_SESSION_SECRET: SECRET, DB: { prepare() { return { async all() { throw new Error("no such table: library_sections"); } }; } } };
  const response = await onRequest({ request: request("/api/admin/library-classification", { cookie }), env });
  assert.equal(response.status, 503); assert.match((await response.json()).error, /schema is unavailable/);
});
test("rejects cross-origin writes before database access", async () => {
  const cookie = await ownerCookie(); let touched = false;
  const env = { ADMIN_SESSION_SECRET: SECRET, DB: { prepare() { touched = true; throw new Error("must not access DB"); } } };
  const req = new Request(SITE + "/api/admin/library-classification", { method: "POST",
    headers: { Cookie: cookie, Origin: "https://attacker.example", "Content-Type": "application/json" },
    body: JSON.stringify({ article_id: "safe-article", primary_section_id: "quran", content_type_id: "article" }) });
  const response = await onRequest({ request: req, env });
  assert.equal(response.status, 403); assert.equal(touched, false);
});


test("owner library read returns all article records for owner-led classification without exposing article content", async () => {
  const cookie = await ownerCookie();
  const env = {
    ADMIN_SESSION_SECRET: SECRET,
    DB: {
      prepare(sql) {
        return {
          async all() {
            if (sql.includes("FROM library_sections")) return { results: [{ id: "quran", name: "القرآن الكريم وعلومه", sort_order: 1 }] };
            if (sql.includes("FROM library_specialties")) return { results: [] };
            if (sql.includes("FROM library_content_types")) return { results: [{ id: "article", name: "مقال", sort_order: 1 }] };
            if (sql.includes("FROM articles a LEFT JOIN")) return { results: [
              { id: "safe-article", title: "مقال معرفي", content: "نص عادي", category: "موضوعات معرفية", primary_section_id: null },
              { id: "article_1793869948469", title: "مقال مستثنى", content: "محتوى", category: "موضوعات معرفية" },
              { id: "nlp-article", title: "موضوع آخر", content: "يتناول NLP", category: "موضوعات معرفية" }
            ] };
            throw new Error("Unexpected SQL: " + sql);
          }
        };
      }
    }
  };
  const response = await onRequest({ request: request("/api/admin/library-classification", { cookie }), env });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.sections.length, 1);
  assert.equal(data.content_types.length, 1);
  assert.deepEqual(data.articles.map(article => article.id), ["safe-article", "article_1793869948469", "nlp-article"]);
  assert.ok(data.articles.every(article => !("content" in article)));
});
