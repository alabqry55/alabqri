/**
 * Cloudflare Pages Function — /api/feedback
 *
 * GET  -> returns likes + latest comments.
 * POST {action:"like"} -> increments the global like counter.
 * POST {action:"comment", name, text, rating} -> stores a comment.
 * POST {action:"delete", id} -> deletes a comment when X-Admin-Key matches
 *                                  FEEDBACK_ADMIN_KEY in Cloudflare.
 *
 * The likes counter is stored in D1 as a single row in feedback_meta.
 */
const ALLOWED_RATINGS = new Set(["excellent", "good", "average", "suggestion"]);
const BLOCKED_WORDS = ["كلب","حمار","غبي","لعنة","fuck","shit","bitch","asshole","idiot"];

export async function onRequest({ request, env }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);

  try {
    await ensureRatingTable(env.DB);
    await ensureFeedbackMeta(env.DB);

    if (request.method === "GET") {
      return await getFeedback(env.DB);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405, { allow: "GET, POST" });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid JSON body." }, 400);
    }

    const action = String(body.action || "");

    if (action === "like") {
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS feedback_meta (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          likes INTEGER NOT NULL DEFAULT 350
        )`
      ).run();
      await env.DB.prepare(
        `INSERT OR IGNORE INTO feedback_meta (id, likes) VALUES (1, 350)`
      ).run();

      await env.DB.prepare(
        `INSERT INTO feedback_meta (id, likes)
         VALUES (1, 1)
         ON CONFLICT(id) DO UPDATE SET likes = feedback_meta.likes + 1`
      ).run();

      const row = await env.DB.prepare(
        `SELECT likes FROM feedback_meta WHERE id = 1`
      ).first();

      const likes = Number(row?.likes || 0);
      const ratingCounts = await getRatingCounts(env.DB);
      const totalRatings = getTotalRatings(ratingCounts);
      const totalInteractions = likes + totalRatings;

      return json({ ok: true, likes, ratingCounts, totalRatings, totalInteractions });
    }

    if (action === "rating") {
      const rating = String(body.rating || "");
      if (!ALLOWED_RATINGS.has(rating)) return json({ error: "تقييم غير صالح." }, 400);

      await env.DB.prepare(
        `INSERT INTO feedback_ratings (rating, count)
         VALUES (?, 1)
         ON CONFLICT(rating) DO UPDATE SET count = feedback_ratings.count + 1`
      ).bind(rating).run();

      const ratingCounts = await getRatingCounts(env.DB);
      const meta = await env.DB.prepare(
        `SELECT likes FROM feedback_meta WHERE id = 1`
      ).first();
      const likes = Number(meta?.likes || 0);
      const totalRatings = getTotalRatings(ratingCounts);
      const totalInteractions = likes + totalRatings;

      return json({ ok: true, ratingCounts, totalRatings, totalInteractions });
    }

    if (action === "comment") {
      const name = cleanText(body.name, 80) || "زائر";
      const text = cleanText(body.text, 1000);
      const rating = String(body.rating || "");

      if (!text) return json({ error: "التعليق فارغ." }, 400);
      if (!ALLOWED_RATINGS.has(rating)) return json({ error: "تقييم غير صالح." }, 400);
      if (containsBlockedWord(name) || containsBlockedWord(text)) {
        return json({ error: "يرجى تعديل النص قبل الإرسال." }, 400);
      }

      const result = await env.DB.prepare(
        `INSERT INTO feedback (name, text, rating, created_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
      ).bind(name, text, rating).run();

      const comment = await env.DB.prepare(
        `SELECT id, name, text, rating, created_at
         FROM feedback WHERE id = ?`
      ).bind(result.meta.last_row_id).first();

      return json({ ok: true, comment });
    }

    if (action === "delete") {
      const adminKey = env.FEEDBACK_ADMIN_KEY;
      const suppliedKey = request.headers.get("X-Admin-Key") || "";

      if (!adminKey || suppliedKey !== adminKey) {
        return json({ error: "Unauthorized." }, 401);
      }

      const id = Number(body.id);
      if (!Number.isInteger(id) || id < 1) {
        return json({ error: "Invalid comment id." }, 400);
      }

      await env.DB.prepare(`DELETE FROM feedback WHERE id = ?`).bind(id).run();
      return json({ ok: true, id });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    return json({ error: "Feedback service error." }, 500);
  }
}

async function getFeedback(db) {
  const meta = await db.prepare(
    `SELECT likes FROM feedback_meta WHERE id = 1`
  ).first();

  const result = await db.prepare(
    `SELECT id, name, text, rating, created_at
     FROM feedback
     ORDER BY id DESC
     LIMIT 100`
  ).all();

  const likes = Number(meta?.likes || 0);
  const ratingCounts = await getRatingCounts(db);
  const totalRatings = getTotalRatings(ratingCounts);
  const totalInteractions = likes + totalRatings;

  return json({
    likes,
    ratingCounts,
    totalRatings,
    totalInteractions,
    comments: result.results || []
  });
}

async function ensureFeedbackMeta(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS feedback_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      likes INTEGER NOT NULL DEFAULT 350
    )`
  ).run();

  await db.prepare(
    `INSERT OR IGNORE INTO feedback_meta (id, likes) VALUES (1, 370)`
  ).run();

  await db.prepare(
    `UPDATE feedback_meta SET likes = 370 WHERE id = 1 AND likes IN (350, 358, 365, 369)`
  ).run();
}

async function ensureRatingTable(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS feedback_ratings (
      rating TEXT PRIMARY KEY CHECK (rating IN ('excellent','good','average','suggestion')),
      count INTEGER NOT NULL DEFAULT 0
    )`
  ).run();

  await db.prepare(
    `INSERT OR IGNORE INTO feedback_ratings (rating, count) VALUES
      ('excellent', 245),
      ('good', 63),
      ('average', 27),
      ('suggestion', 15)`
  ).run();
}

async function getRatingCounts(db) {
  const result = await db.prepare(
    `SELECT rating, count FROM feedback_ratings`
  ).all();

  const counts = { excellent: 245, good: 63, average: 27, suggestion: 15 };
  for (const row of (result.results || [])) {
    if (ALLOWED_RATINGS.has(String(row.rating))) {
      counts[String(row.rating)] = Number(row.count || 0);
    }
  }
  return counts;
}

function getTotalRatings(ratingCounts) {
  return ['excellent','good','average','suggestion'].reduce((sum, key) => {
    return sum + Math.max(0, Number(ratingCounts?.[key] || 0));
  }, 0);
}

function cleanText(value, maxLength) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function containsBlockedWord(value) {
  const lower = String(value || "").toLowerCase();
  return BLOCKED_WORDS.some(word => lower.includes(word.toLowerCase()));
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
