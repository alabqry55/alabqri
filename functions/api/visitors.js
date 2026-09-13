// functions/api/visitors.js
//
// نقطة نهاية (Endpoint) لعداد الزوار: alabqri.net/api/visitors
//
// GET  -> يسجل زيارة جديدة ثم يرجع العدد الإجمالي للزوار
// (لو عايز بس تقرأ العدد من غير ما تسجل زيارة جديدة، استخدم ?count_only=1)

export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    // تأكد إن الـ binding اسمه DB في إعدادات Pages (Settings > Functions > D1 database bindings)
    const db = env.DB;

    if (!db) {
      return new Response(
        JSON.stringify({ error: "D1 binding 'DB' غير مفعّل في إعدادات Pages" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    const countOnly = url.searchParams.get("count_only");

    // تسجيل الزيارة (إلا لو طلب قراءة العدد فقط)
    if (!countOnly) {
      const ip = request.headers.get("CF-Connecting-IP") || "";
      const userAgent = request.headers.get("User-Agent") || "";

      await db
        .prepare("INSERT INTO visitors (ip, user_agent) VALUES (?, ?)")
        .bind(ip, userAgent)
        .run();
    }

    // قراءة العدد الإجمالي
    const result = await db
      .prepare("SELECT COUNT(*) AS total FROM visitors")
      .first();

    return new Response(
      JSON.stringify({ total: result.total }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "حدث خطأ أثناء تحديث عداد الزوار", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
