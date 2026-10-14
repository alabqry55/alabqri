/**
 * ALABQRI certificate administration API.
 *
 * Every request must carry a valid Cloudflare Access JWT and an email listed
 * in CERTIFICATE_ADMIN_EMAILS. The endpoint fails closed when configuration
 * is missing. Also configure a Cloudflare Access application for /api/admin/*.
 *
 * Required Pages environment variables:
 *   CF_ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
 *   CF_ACCESS_AUD=<Access application AUD tag>
 *   CERTIFICATE_ADMIN_EMAILS=admin@example.com,second-admin@example.com
 */
const JSON_HEADERS = {
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "no-store, no-cache, must-revalidate"
};
const CERTIFICATE_NUMBER = /^[A-Z0-9][A-Z0-9-]{3,59}$/;

export async function onRequest({ request, env }) {
  if (!env.DB) return json({ error: "خدمة سجل الشهادات غير مهيأة." }, 503);

  let admin;
  try {
    admin = await authorizeAdmin(request, env);
  } catch {
    return json({ error: "تعذر التحقق من صلاحيات المسؤول." }, 503);
  }
  if (!admin) return json({ error: "يلزم تسجيل الدخول بصلاحية إدارية." }, 401);

  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
      const result = await env.DB.prepare(
        `SELECT certificate_number, holder_name, program_name, hours, issue_date,
                issuer, status, created_at, updated_at, created_by, updated_by
         FROM certificates ORDER BY issue_date DESC, certificate_number ASC LIMIT ?1`
      ).bind(limit).all();
      return json({ certificates: result.results || [] });
    }

    if (request.method !== "POST") {
      return json({ error: "طريقة الطلب غير مسموحة." }, 405, { allow: "GET, POST" });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "صيغة الطلب غير صحيحة." }, 400);
    }

    const action = String(body.action || "");
    const certificateNumber = String(body.certificateNumber || "").trim().toUpperCase();
    if (!CERTIFICATE_NUMBER.test(certificateNumber)) {
      return json({ error: "رقم الشهادة غير صالح." }, 400);
    }

    if (action === "revoke") {
      const result = await env.DB.prepare(
        `UPDATE certificates
         SET status = 'revoked', updated_at = CURRENT_TIMESTAMP, updated_by = ?1
         WHERE certificate_number = ?2 AND status <> 'revoked'`
      ).bind(admin.email, certificateNumber).run();
      if (Number(result.meta?.changes || 0) < 1) {
        const existing = await env.DB.prepare(
          "SELECT status FROM certificates WHERE certificate_number = ?1 LIMIT 1"
        ).bind(certificateNumber).first();
        if (!existing) return json({ error: "الشهادة غير موجودة في السجل." }, 404);
        return json({ ok: true, certificateNumber, status: "revoked", unchanged: true });
      }
      return json({ ok: true, certificateNumber, status: "revoked" });
    }

    if (action !== "create") {
      return json({ error: "الإجراء غير معروف." }, 400);
    }

    const holderName = cleanField(body.holderName, 160);
    const programName = cleanField(body.programName, 200);
    const issuer = cleanField(body.issuer, 200);
    const issueDate = String(body.issueDate || "").trim();
    const hours = body.hours == null || body.hours === "" ? null : Number(body.hours);
    if (!holderName || !programName || !issuer || !/^\d{4}-\d{2}-\d{2}$/.test(issueDate) ||
        Number.isNaN(Date.parse(issueDate + "T00:00:00Z")) ||
        (hours !== null && (!Number.isInteger(hours) || hours < 0 || hours > 100000))) {
      return json({ error: "بيانات الشهادة غير مكتملة أو غير صالحة." }, 400);
    }

    try {
      await env.DB.prepare(
        `INSERT INTO certificates
          (certificate_number, holder_name, program_name, hours, issue_date, issuer,
           status, created_by, updated_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'active', ?7, ?7)`
      ).bind(certificateNumber, holderName, programName, hours, issueDate, issuer, admin.email).run();
    } catch (error) {
      const message = String(error?.message || "").toLowerCase();
      if (message.includes("unique") || message.includes("primary key")) {
        return json({ error: "رقم الشهادة مسجل بالفعل." }, 409);
      }
      throw error;
    }
    return json({ ok: true, certificateNumber, status: "active" }, 201);
  } catch {
    return json({ error: "تعذر إتمام العملية على سجل الشهادات." }, 500);
  }
}

export async function authorizeAdmin(request, env) {
  const teamDomain = String(env.CF_ACCESS_TEAM_DOMAIN || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const audience = String(env.CF_ACCESS_AUD || "").trim();
  const allowedEmails = String(env.CERTIFICATE_ADMIN_EMAILS || "")
    .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!teamDomain || !audience || !allowedEmails.length || teamDomain.includes("/")) {
    throw new Error("Cloudflare Access admin configuration is incomplete.");
  }

  const token = readAccessToken(request);
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  let header, claims;
  try {
    header = decodeJson(parts[0]);
    claims = decodeJson(parts[1]);
  } catch {
    return null;
  }
  if (header.alg !== "RS256" || !header.kid ||
      claims.iss !== `https://${teamDomain}` ||
      !(Array.isArray(claims.aud) ? claims.aud : [claims.aud]).includes(audience) ||
      !Number.isFinite(Number(claims.exp)) || Number(claims.exp) <= Math.floor(Date.now() / 1000) ||
      (claims.nbf != null && Number(claims.nbf) > Math.floor(Date.now() / 1000)) ||
      !allowedEmails.includes(String(claims.email || "").toLowerCase())) {
    return null;
  }

  const certsResponse = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`, {
    headers: { accept: "application/json" },
    redirect: "error"
  });
  if (!certsResponse.ok) throw new Error("Unable to retrieve Access signing keys.");
  const certs = await certsResponse.json();
  const jwk = (certs.keys || []).find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) return null;

  const publicKey = await crypto.subtle.importKey(
    "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
  );
  const signature = base64UrlToBytes(parts[2]);
  const signedContent = new TextEncoder().encode(parts[0] + "." + parts[1]);
  const validSignature = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" }, publicKey, signature, signedContent
  );
  return validSignature ? { email: String(claims.email).toLowerCase() } : null;
}

function readAccessToken(request) {
  const assertion = request.headers.get("Cf-Access-Jwt-Assertion");
  if (assertion) return assertion.trim();
  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (match) return match[1].trim();
  const cookie = request.headers.get("Cookie") || "";
  const item = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("CF_Authorization="));
  return item ? decodeURIComponent(item.slice("CF_Authorization=".length)) : "";
}

function decodeJson(value) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));
}

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function cleanField(value, maxLength) {
  return String(value ?? "").replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}
