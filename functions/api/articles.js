/** Cloudflare Pages Function: D1-backed articles library. */
const CATEGORIES = new Set(["التنمية البشرية","الطب التكميلي","الأذكار والاتزان","البحث العلمي","موضوعات معرفية"]);
const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const validId = id => typeof id === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(id);
async function ensureTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL,
    date TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '', content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
}
export async function onRequest({request, env}) {
  if (!env.DB) return json({error:"D1 binding DB is not configured."},500);
  try {
    await ensureTable(env.DB);
    if (request.method === "GET") {
      const {results=[]} = await env.DB.prepare("SELECT id,title,category,date,excerpt,content FROM articles ORDER BY updated_at DESC, created_at DESC").all();
      return json({articles:results});
    }
    if (request.method !== "POST") return json({error:"Method not allowed."},405);
    if (!env.ARTICLES_ADMIN_KEY) return json({error:"Articles admin secret is not configured."},503);
    if ((request.headers.get("Authorization")||"") !== `Bearer ${env.ARTICLES_ADMIN_KEY}`) return json({error:"Unauthorized."},401);
    const body = await request.json().catch(()=>null);
    if (!body || typeof body !== "object") return json({error:"Invalid JSON body."},400);
    if (body.action === "save") {
      const a = body.article;
      if (!a || !validId(String(a.id||"")) || typeof a.title !== "string" || !a.title.trim() || a.title.length>240 || typeof a.content !== "string" || !a.content.trim() || a.content.length>200000 || !CATEGORIES.has(a.category) || typeof a.excerpt !== "string" || a.excerpt.length>2000 || typeof a.date !== "string" || a.date.length>80) return json({error:"Invalid article fields."},400);
      await env.DB.prepare(`INSERT INTO articles(id,title,category,date,excerpt,content,updated_at)
        VALUES(?1,?2,?3,?4,?5,?6,CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET title=excluded.title,category=excluded.category,date=excluded.date,excerpt=excluded.excerpt,content=excluded.content,updated_at=CURRENT_TIMESTAMP`)
        .bind(String(a.id),a.title.trim(),a.category,a.date,a.excerpt,a.content).run();
      return json({ok:true,id:a.id});
    }
    if (body.action === "delete") {
      if (!validId(String(body.id||""))) return json({error:"Invalid article id."},400);
      await env.DB.prepare("DELETE FROM articles WHERE id=?1").bind(String(body.id)).run();
      return json({ok:true,id:body.id});
    }
    return json({error:"Unsupported action."},400);
  } catch (error) {
    return json({error:"Articles API failed."},500);
  }
}
