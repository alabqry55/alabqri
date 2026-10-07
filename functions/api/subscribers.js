/**
 * Cloudflare Pages Function — /api/subscribers
 * GET  -> returns the real registered subscriber count.
 * POST {email, name?} -> registers a unique platform subscriber.
 *
 * Subscriber count is based only on records created through this endpoint;
 * it is intentionally separate from page visitors and feedback.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequest({ request, env }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);

  try {
    await ensureTable(env.DB);

    if (request.method === "GET") {
      const row = await env.DB.prepare(
        `SELECT COUNT(*) AS count FROM subscribers WHERE active = 1`
      ).first();

      return json({
        ok: true,
        subscribers: Number(row?.count || 0)
      });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405, { allow: "GET, POST" });
    }

    const limited = await enforceRateLimit(env.DB, request, "subscriber:register", 5, 10 * 60 * 1000);
    if (limited) return limited;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid JSON body." }, 400);
    }

    const email = normalizeEmail(body.email);
    const name = cleanName(body.name);

    if (!EMAIL_RE.test(email) || email.length > 254) {
      return json({ error: "يرجى إدخال بريد إلكتروني صحيح." }, 400);
    }

    const result = await env.DB.prepare(
      `INSERT INTO subscribers (email, name, active, created_at, updated_at)
       VALUES (?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(email) DO UPDATE SET
         name = CASE WHEN excluded.name <> '' THEN excluded.name ELSE subscribers.name END,
         active = 1,
         updated_at = CURRENT_TIMESTAMP`
    ).bind(email, name).run();

    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM subscribers WHERE active = 1`
    ).first();

    return json({
      ok: true,
      subscribed: true,
      subscribers: Number(row?.count || 0),
      created: Number(result?.meta?.changes || 0) > 0
    });
  } catch (error) {
    return json({ error: "Subscriber service error." }, 500);
  }
}

async function ensureTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_subscribers_active
    ON subscribers(active)`).run();
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase().slice(0, 254);
}

function cleanName(value) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, 80);
}

async function enforceRateLimit(db, request, action, max, windowMs) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS api_rate_limits (
    bucket_key TEXT PRIMARY KEY,
    window_start INTEGER NOT NULL,
    hits INTEGER NOT NULL DEFAULT 0
  )`).run();

  const ip = request.headers.get("CF-Connecting-IP") ||
             request.headers.get("X-Forwarded-For") ||
             "unknown";
  const normalizedIp = String(ip).split(",")[0].trim().slice(0, 128);
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode("alabqri-rate-limit-v1:" + normalizedIp)
  );
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  const now = Date.now();
  const key = action + ":" + hash;

  const row = await db.prepare(
    "SELECT window_start, hits FROM api_rate_limits WHERE bucket_key=?1"
  ).bind(key).first();

  if (!row || now - Number(row.window_start) >= windowMs) {
    await db.prepare(`INSERT INTO api_rate_limits (bucket_key, window_start, hits)
      VALUES (?1, ?2, 1)
      ON CONFLICT(bucket_key) DO UPDATE SET window_start=?2, hits=1`)
      .bind(key, now).run();
    return null;
  }

  const hits = Number(row.hits || 0);
  if (hits >= max) {
    const retryAfter = Math.max(
      1,
      Math.ceil((windowMs - (now - Number(row.window_start))) / 1000)
    );
    return json(
      { error: "طلبات كثيرة. حاول مرة أخرى لاحقًا." },
      429,
      { "retry-after": String(retryAfter) }
    );
  }

  await db.prepare(
    "UPDATE api_rate_limits SET hits=hits+1 WHERE bucket_key=?1"
  ).bind(key).run();
  return null;
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}
