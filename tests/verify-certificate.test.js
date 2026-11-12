import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost } from "../functions/api/verify-certificate.js";

const activeCertificate = {
  certificate_number: "ALB-2026-0001",
  holder_name: "متدرب تجريبي",
  program_name: "برنامج اختبار",
  hours: 40,
  issue_date: "2026-10-01",
  issuer: "مركز العبقري",
  status: "active"
};

function mockDb(result, error) {
  return {
    prepare(sql) {
      return {
        bind(number) {
          assert.equal(number, "ALB-2026-0001");
          return {
            async first() {
              if (error) throw error;
              return result;
            }
          };
        }
      };
    }
  };
}

function request(body) {
  return new Request("https://alabqri.pages.dev/api/verify-certificate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body
  });
}

test("rejects malformed JSON", async () => {
  const response = await onRequestPost({ request: request("{"), env: { DB: mockDb(null) } });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).valid, false);
});

test("requires a D1 binding", async () => {
  const response = await onRequestPost({ request: request(JSON.stringify({ certificateNumber: "ALB-2026-0001" })), env: {} });
  assert.equal(response.status, 503);
});

test("rejects malformed certificate numbers before querying D1", async () => {
  const response = await onRequestPost({ request: request(JSON.stringify({ certificateNumber: "x" })), env: { DB: { prepare() { throw new Error("must not query"); } } } });
  assert.equal(response.status, 400);
});

test("returns official fields for an active registry record", async () => {
  const response = await onRequestPost({
    request: request(JSON.stringify({ certificateNumber: " alb-2026-0001 " })),
    env: { DB: mockDb(activeCertificate) }
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    valid: true,
    certificateNumber: "ALB-2026-0001",
    traineeName: "متدرب تجريبي",
    programName: "برنامج اختبار",
    hours: "40",
    issueDate: "2026-10-01",
    issuer: "مركز العبقري",
    status: "active"
  });
  assert.match(response.headers.get("cache-control"), /no-store/);
});

test("does not validate a certificate absent from the registry", async () => {
  const response = await onRequestPost({
    request: request(JSON.stringify({ certificateNumber: "ALB-2026-0001" })),
    env: { DB: mockDb(null) }
  });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).valid, false);
});

test("returns revoked status without exposing certificate details", async () => {
  const response = await onRequestPost({
    request: request(JSON.stringify({ certificateNumber: "ALB-2026-0001" })),
    env: { DB: mockDb({ ...activeCertificate, status: "revoked" }) }
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    valid: false,
    status: "revoked",
    message: "هذه الشهادة ملغاة وغير سارية."
  });
});

test("reports a missing certificates table as not configured", async () => {
  const response = await onRequestPost({
    request: request(JSON.stringify({ certificateNumber: "ALB-2026-0001" })),
    env: { DB: mockDb(null, new Error("no such table: certificates")) }
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).valid, false);
});

test("does not leak database error details", async () => {
  const response = await onRequestPost({
    request: request(JSON.stringify({ certificateNumber: "ALB-2026-0001" })),
    env: { DB: mockDb(null, new Error("secret database connection detail")) }
  });
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /secret database connection detail/);
});
