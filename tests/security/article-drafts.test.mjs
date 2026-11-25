import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";

globalThis.crypto ||= webcrypto;

import { onRequest } from "../../functions/api/admin/article-drafts.js";

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

function memoryKV() {
  const values = new Map();
  return {
    values,
    async get(key, type) {
      const value = values.get(key);
      if (value == null) return null;
      return type === "json" ? JSON.parse(value) : value;
    },
    async put(key, value) { values.set(key, value); },
    async delete(key) { values.delete(key); },
    async list({ prefix = "", limit = 100 } = {}) {
      return { keys: [...values.keys()].filter(key => key.startsWith(prefix)).slice(0, limit).map(name => ({ name })) };
    }
  };
}

async function request(method, path = "/api/admin/article-drafts", body, extraHeaders = {}) {
  const headers = {
    Cookie: await ownerCookie(),
    ...(method === "POST" ? { Origin: SITE, "Content-Type": "application/json" } : {}),
    ...extraHeaders
  };
  return new Request(SITE + path, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
}

const sampleDraft = {
  id: "draft-safe-test-001",
  title: "مسودة اختبار آمنة",
  category: "موضوعات معرفية",
  date: "25 نوفمبر 2026",
  excerpt: "وصف تجريبي لا ينشر.",
  content: "هذا محتوى اختبار محفوظ في KV فقط.",
  tags: ["اختبار"],
  seoTitle: "مسودة اختبار آمنة",
  seoDescription: "وصف SEO",
  seoKeywords: "اختبار، مسودة",
  canonicalUrl: "",
  ogImage: "",
  scheduledAt: null
};

test("draft API rejects unauthenticated requests", async () => {
  const response = await onRequest({
    request: new Request(SITE + "/api/admin/article-drafts"),
    env: { ADMIN_SESSION_SECRET: SECRET, ARTICLE_DRAFTS: memoryKV() }
  });
  assert.equal(response.status, 401);
});

test("draft API fails closed when the preview KV binding is missing", async () => {
  const response = await onRequest({
    request: await request("GET"),
    env: { ADMIN_SESSION_SECRET: SECRET }
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /ARTICLE_DRAFTS/);
});

test("draft save, list, and delete use KV only and never require D1", async () => {
  const kv = memoryKV();
  const env = { ADMIN_SESSION_SECRET: SECRET, ARTICLE_DRAFTS: kv };
  const save = await onRequest({
    request: await request("POST", "/api/admin/article-drafts", { action: "save", id: sampleDraft.id, draft: sampleDraft }),
    env
  });
  assert.equal(save.status, 200);
  assert.equal((await save.json()).verified, true);
  assert.equal(kv.values.size, 1);
  const stored = [...kv.values.values()][0];
  assert.match(stored, /مسودة اختبار آمنة/);
  assert.doesNotMatch(stored, /published|publishImmediately/i);

  const list = await onRequest({ request: await request("GET"), env });
  assert.equal(list.status, 200);
  const listed = await list.json();
  assert.equal(listed.drafts.length, 1);
  assert.equal(listed.drafts[0].article.content, sampleDraft.content);

  const remove = await onRequest({
    request: await request("POST", "/api/admin/article-drafts", { action: "delete", id: sampleDraft.id }),
    env
  });
  assert.equal(remove.status, 200);
  assert.equal((await remove.json()).deleted, true);
  assert.equal(kv.values.size, 0);
});

test("draft API rejects cross-origin writes", async () => {
  const response = await onRequest({
    request: await request("POST", "/api/admin/article-drafts", { action: "save", id: sampleDraft.id, draft: sampleDraft }, { Origin: "https://attacker.example" }),
    env: { ADMIN_SESSION_SECRET: SECRET, ARTICLE_DRAFTS: memoryKV() }
  });
  assert.equal(response.status, 403);
});

test("draft API rejects invalid category and malformed draft payloads", async () => {
  const invalid = { ...sampleDraft, category: "قسم غير معتمد" };
  const response = await onRequest({
    request: await request("POST", "/api/admin/article-drafts", { action: "save", id: invalid.id, draft: invalid }),
    env: { ADMIN_SESSION_SECRET: SECRET, ARTICLE_DRAFTS: memoryKV() }
  });
  assert.equal(response.status, 400);
});
