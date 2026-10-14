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

async function makeSignedToken(email = "admin@example.com") {
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
    exp: Math.floor(Date.now() / 1000) + 300
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

function postRequest(token, body) {
  return new Request("https://alabqri.pages.dev/api/admin/certificates", {
    method: "POST",
    headers: {
      "content-type": "application/json",
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
