/**
 * Cloudflare Pages Function — /api/visitors
 * GET: increments and returns the public visitor counter.
 * No IP address is stored.
 */
export async function onRequestGet({ env }) {
  if (!env.DB) {
    return json({ error: "D1 binding DB is not configured." }, 500);
  }

  try {
    await env.DB
      .prepare(
        `INSERT INTO visitors (id, total, updated_at)
         VALUES (1, 1, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           total = total + 1,
           updated_at = CURRENT_TIMESTAMP`
      )
      .run();

    const row = await env.DB
      .prepare(`SELECT total, updated_at FROM visitors WHERE id = 1`)
      .first();

    return json({
      total: Number(row?.total || 0),
      updated_at: row?.updated_at || null
    });
  } catch (error) {
    return json({ error: "Visitor counter database error." }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}
