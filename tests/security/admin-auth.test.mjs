import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";

globalThis.crypto ||= webcrypto;

import { readOwnerSession } from "../../functions/_lib/admin-auth.js";
import { onRequest as articlesRequest } from "../../functions/api/articles.js";
import { onRequest as githubAdminRequest } from "../../functions/api/admin/github/[action].js";

const SECRET = "local-test-secret-with-at-least-32-characters";
const SITE = "https://alabqri.example";

function base64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

async function ownerCookie(overrides = {}, secret = SECRET) {
  const now = Math.floor(Date.now() / 1000);
  const session = {
    id: "312770372",
    login: "alabqry55",
    iat: now,
    exp: now + 3600,
    ...overrides
  };
  const payload = base64url(Buffer.from(JSON.stringify(session), "utf8"));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return `__Host-abq_admin=${payload}.${base64url(signature)}`;
}

function dbMustNotBeTouched() {
  return {
    prepare() {
      throw new Error("D1 must not be touched by a rejected request");
    }
  };
}

test("accepts a correctly signed, unexpired owner session", async () => {
  const cookie = await ownerCookie();
  const request = new Request(SITE + "/api/articles", {
    headers: { Cookie: cookie }
  });
  const session = await readOwnerSession(request, { ADMIN_SESSION_SECRET: SECRET });
  assert.equal(session?.login, "alabqry55");
  assert.equal(session?.id, "312770372");
  assert.ok(session.expiresAt > Math.floor(Date.now() / 1000));
});

test("rejects a session with a modified signature", async () => {
  const cookie = await ownerCookie();
  const separator = cookie.lastIndexOf(".");
  const signature = cookie.slice(separator + 1);
  const tampered = cookie.slice(0, separator + 1) + (signature[0] === "A" ? "B" : "A") + signature.slice(1);
  const request = new Request(SITE, { headers: { Cookie: tampered } });
  assert.equal(await readOwnerSession(request, { ADMIN_SESSION_SECRET: SECRET }), null);
});

test("rejects a correctly signed session for a different GitHub login", async () => {
  const cookie = await ownerCookie({ login: "not-the-owner" });
  const request = new Request(SITE, { headers: { Cookie: cookie } });
  assert.equal(await readOwnerSession(request, { ADMIN_SESSION_SECRET: SECRET }), null);
});

test("rejects a correctly signed session for a different GitHub numeric ID", async () => {
  const cookie = await ownerCookie({ id: "123456" });
  const request = new Request(SITE, { headers: { Cookie: cookie } });
  assert.equal(await readOwnerSession(request, { ADMIN_SESSION_SECRET: SECRET }), null);
});

test("rejects expired, overlong, and malformed session time claims", async (t) => {
  const now = Math.floor(Date.now() / 1000);
  const cases = [
    ["expired", { iat: now - 3601, exp: now - 1 }],
    ["overlong", { iat: now - 3601, exp: now + 1 }],
    ["future issued-at", { iat: now + 61, exp: now + 3600 }],
    ["non-integer issued-at", { iat: String(now), exp: now + 3600 }]
  ];
  for (const [label, claims] of cases) {
    await t.test(label, async () => {
      const cookie = await ownerCookie(claims);
      const request = new Request(SITE, { headers: { Cookie: cookie } });
      assert.equal(await readOwnerSession(request, { ADMIN_SESSION_SECRET: SECRET }), null);
    });
  }
});

test("rejects article writes without an owner session before touching D1", async () => {
  const request = new Request(SITE + "/api/articles", {
    method: "POST",
    headers: {
      Origin: SITE,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action: "delete", id: "sample" })
  });
  const response = await articlesRequest({
    request,
    env: { DB: dbMustNotBeTouched() }
  });
  assert.equal(response.status, 401);
});

test("rejects cross-origin article writes from a valid owner session before touching D1", async () => {
  const cookie = await ownerCookie();
  const request = new Request(SITE + "/api/articles", {
    method: "POST",
    headers: {
      Cookie: cookie,
      Origin: "https://attacker.example",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action: "delete", id: "sample" })
  });
  const response = await articlesRequest({
    request,
    env: { ADMIN_SESSION_SECRET: SECRET, DB: dbMustNotBeTouched() }
  });
  assert.equal(response.status, 403);
});

test("rejects article writes with a non-JSON content type from a valid owner session", async () => {
  const cookie = await ownerCookie();
  const request = new Request(SITE + "/api/articles", {
    method: "POST",
    headers: {
      Cookie: cookie,
      Origin: SITE,
      "Content-Type": "text/plain"
    },
    body: "not-json"
  });
  const response = await articlesRequest({
    request,
    env: { ADMIN_SESSION_SECRET: SECRET, DB: dbMustNotBeTouched() }
  });
  assert.equal(response.status, 415);
});

test("logout rejects GET requests", async () => {
  const request = new Request(SITE + "/api/admin/github/logout", { method: "GET" });
  const response = await githubAdminRequest({ request, env: {} });
  assert.equal(response.status, 405);
});

test("logout rejects POST requests without a matching same-origin Origin", async () => {
  const request = new Request(SITE + "/api/admin/github/logout", {
    method: "POST",
    headers: { Origin: "https://attacker.example" }
  });
  const response = await githubAdminRequest({ request, env: {} });
  assert.equal(response.status, 403);
});

test("logout clears both owner and OAuth state cookies only on a same-origin POST", async () => {
  const request = new Request(SITE + "/api/admin/github/logout", {
    method: "POST",
    headers: { Origin: SITE }
  });
  const response = await githubAdminRequest({ request, env: {} });
  assert.equal(response.status, 204);
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.ok(cookies.some(value => value.startsWith("__Host-abq_admin=") && value.includes("Max-Age=0")));
  assert.ok(cookies.some(value => value.startsWith("__Host-abq_github_state=") && value.includes("Max-Age=0")));
});
