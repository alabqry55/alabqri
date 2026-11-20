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


test("refuses classification writes for owner-excluded records before reading article data", async () => {
  const cookie = await ownerCookie();
  let touched = false;
  const env = {
    ADMIN_SESSION_SECRET: SECRET,
    DB: { prepare() { touched = true; throw new Error("protected records must not be queried"); } }
  };
  const response = await onRequest({
    request: request("/api/admin/library-classification", {
      method: "POST",
      cookie,
      body: {
        article_id: "article_1793869948469",
        primary_section_id: "research-studies",
        content_type_id: "research"
      }
    }),
    env
  });
  assert.equal(response.status, 403);
  assert.equal(touched, false);
});
