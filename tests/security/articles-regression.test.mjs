import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";

globalThis.crypto ||= webcrypto;

import { onRequest as articlesRequest } from "../../functions/api/articles.js";

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

function readOnlyDb() {
  const statements = [];
  return {
    statements,
    prepare(sql) {
      const statement = String(sql).trim();
      statements.push(statement);
      return {
        bind() { return this; },
        async all() { return { results: [] }; },
        async first() { return null; },
        async run() { throw new Error("GET attempted a D1 write: " + statement); }
      };
    },
    async batch() { throw new Error("GET attempted a D1 batch write."); }
  };
}

for (const authenticated of [false, true]) {
  test("GET /api/articles is read-only (owner session: " + authenticated + ")", async () => {
    const db = readOnlyDb();
    const headers = authenticated ? { Cookie: await ownerCookie() } : {};
    const response = await articlesRequest({
      request: new Request(SITE + "/api/articles", { method: "GET", headers }),
      env: { DB: db, ADMIN_SESSION_SECRET: SECRET }
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.admin, authenticated);
    assert.ok(Array.isArray(payload.articles));
    assert.ok(db.statements.length > 0);
    assert.ok(db.statements.every(sql => sql.toUpperCase().startsWith("SELECT ")), db.statements.join("\n"));
  });
}

test("article UI uses GitHub OAuth and contains no shared admin-key transport", async () => {
  const source = await readFile(new URL("../../assets/articles-library.js", import.meta.url), "utf8");
  assert.equal(source.includes("ARTICLES_ADMIN_KEY"), false);
  assert.equal(source.includes("X-Admin-Key"), false);
  assert.ok(source.includes("/api/admin/github/session"));
  assert.ok(source.includes("/api/admin/github/login"));
});

test("legacy search cleanup is scoped to the articles tab", async () => {
  const source = await readFile(new URL("../../assets/articles-library.js", import.meta.url), "utf8");
  const start = source.indexOf("const cleanupLegacySearchArea");
  const end = source.indexOf("const cleanupLegacyArticleCards", start);
  assert.ok(start >= 0 && end > start);
  const cleanup = source.slice(start, end);
  assert.equal(cleanup.includes("document.querySelectorAll"), false);
  assert.ok(cleanup.includes("articleTab.querySelectorAll"));
});

test("duplicate script loading cannot initialize a second article renderer or OAuth gate", async () => {
  const source = await readFile(new URL("../../assets/articles-library.js", import.meta.url), "utf8");
  assert.ok(source.includes("window.__abqArticlesLibraryInitialized"));
  assert.ok(source.includes("window.__abqArticlesAdminGateInstalled"));
});
