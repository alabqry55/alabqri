// Cloudflare Pages Function
// المسار التلقائي لهذا الملف هو: /api/visitor
// يتطلب ربط قاعدة بيانات D1 باسم المتغيّر "DB" (راجع ملف التعليمات README.md)

export async function onRequestGet(context) {
  try {
    const db = context.env.DB;

    if (!db) {
      return new Response(
        JSON.stringify({ error: 'D1 database binding "DB" غير موجود. راجع التعليمات.' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    // زيادة العداد بشكل ذري (atomic) ثم قراءته
    await db.prepare('UPDATE visitors SET count = count + 1 WHERE id = 1').run();
    const row = await db.prepare('SELECT count FROM visitors WHERE id = 1').first();

    const count = row && Number.isFinite(row.count) ? row.count : 0;

    return new Response(
      JSON.stringify({ count }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store',
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'server_error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
