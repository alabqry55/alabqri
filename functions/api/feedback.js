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
        `INSERT INTO feedback_meta (id, likes)
         VALUES (1, 1)
         ON CONFLICT(id) DO UPDATE SET likes = feedback_meta.likes + 1`
      ).run();

      const row = await env.DB.prepare(
        `SELECT likes FROM feedback_meta WHERE id = 1`
      ).first();

      return json({ ok: true, likes: Number(row?.likes || 0) });
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

  return json({
    likes: Number(meta?.likes || 0),
    comments: result.results || []
  });
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
