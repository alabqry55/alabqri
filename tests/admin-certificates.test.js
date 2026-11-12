import test from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/api/admin/certificates.js";

const teamDomain = "alabqri-test.cloudflareaccess.com";
const envConfig = {
  CF_ACCESS_TEAM_DOMAIN: teamDomain,
  CF_ACCESS_AUD: "alabqri-admin-audience",
  CERTIFICATE_ADMIN_EMAILS: "admin@example.com"
};
const encoder = new TextEncoder();

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

async function makeSignedToken(email = "admin@example.com", overrides = {}) {
  const pair = await crypto.subtle.generateKey({
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
  }, true, ["sign", "verify"]);
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  publicJwk.kid = "test-key";
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test-key" }));
  const payload = base64url(JSON.stringify({
    iss: `https://${teamDomain}`,
    aud: ["alabqri-admin-audience"],
    email,
    exp: Math.floor(Date.now() / 1000) + 300,
    ...overrides
  }));
  const input = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" }, pair.privateKey, encoder.encode(input)
  );
  return {
    token: `${input}.${base64url(signature)}`,
    publicJwk
  };
}

function postRequest(token, body, contentType = "application/json") {
  return new Request("https://alabqri.pages.dev/api/admin/certificates", {
    method: "POST",
    headers: {
      "content-type": contentType,
      "Cf-Access-Jwt-Assertion": token
    },
    body: JSON.stringify(body)
  });
}

test("fails closed when Access configuration is missing", async () => {
  const response = await onRequest({
    request: new Request("https://alabqri.pages.dev/api/admin/certificates"),
    env: { DB: {} }
  });
  assert.equal(response.status, 503);
});

test("rejects requests without an Access token", async () => {
  const response = await onRequest({
    request: new Request("https://alabqri.pages.dev/api/admin/certificates"),
    env: { DB: {}, ...envConfig }
  });
  assert.equal(response.status, 401);
});

test("rejects a correctly signed token when email is not allowlisted", async () => {
  const { token, publicJwk } = await makeSignedToken("intruder@example.com");
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ keys: [publicJwk] });
  try {
    const response = await onRequest({
      request: postRequest(token, { action: "create", certificateNumber: "ALB-2026-0001" }),
      env: { DB: {}, ...envConfig }
    });
    assert.equal(response.status, 401);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

async function assertRejectedClaims(overrides) {
  const { token, publicJwk } = await makeSignedToken("admin@example.com", overrides);
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ keys: [publicJwk] });
  try {
    const response = await onRequest({
      request: postRequest(token, { action: "create", certificateNumber: "ALB-2026-0001" }),
      env: { DB: {}, ...envConfig }
    });
    assert.equal(response.status, 401);
  } finally {
    globalThis.fetch = previousFetch;
  }
}

test("rejects state-changing requests sent as simple form content types", async () => {
  const { token, publicJwk } = await makeSignedToken();
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ keys: [publicJwk] });
  try {
    const response = await onRequest({
      request: postRequest(token, { action: "revoke", certificateNumber: "ALB-2026-0001" }, "text/plain"),
      env: { DB: {}, ...envConfig }
    });
    assert.equal(response.status, 415);
    assert.match(await response.text(), /JSON/);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("rejects expired Access tokens", async () => {
  await assertRejectedClaims({ exp: Math.floor(Date.now() / 1000) - 60 });
});

test("rejects tokens issued for a different Access application", async () => {
  await assertRejectedClaims({ aud: ["another-application-audience"] });
});

test("rejects tokens issued by a different team", async () => {
  await assertRejectedClaims({ iss: "https://attacker.cloudflareaccess.com" });
});

test("rejects tokens that are not valid yet", async () => {
  await assertRejectedClaims({ nbf: Math.floor(Date.now() / 1000) + 300 });
});

test("creates a certificate only after signature and email authorization", async () => {
  const { token, publicJwk } = await makeSignedToken();
  const previousFetch = globalThis.fetch;
  let insertSql = "";
  let boundValues = [];
  globalThis.fetch = async (url) => {
    assert.equal(String(url), `https://${teamDomain}/cdn-cgi/access/certs`);
    return Response.json({ keys: [publicJwk] });
  };
  const db = {
    prepare(sql) {
      insertSql = sql;
      return {
        bind(...values) {
          boundValues = values;
          return { async run() { return { meta: { changes: 1 } }; } };
        }
      };
    }
  };
  try {
    const response = await onRequest({
      request: postRequest(token, {
        action: "create",
        certificateNumber: "ALB-2026-0001",
        holderName: "متدرب",
        programName: "برنامج تدريبي",
        issueDate: "2026-10-01",
        issuer: "مركز العبقري",
        hours: 40
      }),
      env: { DB: db, ...envConfig }
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).status, "active");
    assert.match(insertSql, /INSERT INTO certificates/);
    assert.equal(boundValues[0], "ALB-2026-0001");
    assert.equal(boundValues[6], "admin@example.com");
  } finally {
    globalThis.fetch = previousFetch;
  }
});
