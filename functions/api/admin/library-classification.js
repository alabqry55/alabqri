import { readOwnerSession } from "../../_lib/admin-auth.js";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  }
});

const validId = value => typeof value === "string" && /^[a-z0-9_-]{1,80}$/i.test(value);
const PROTECTED_ARTICLE_IDS = new Set([
  "article_1793791237005",
  "article_1793804244058",
  "article_1793869948469",
  "article-mw21bjes-dly783",
  "article_1793869474653",
  "article-mw211mhx-yg6u9s"
]);
const PROTECTED_TERMS = ["الطاقة الحيوية", "الريكي", "الحجامة", "السوجوك", "سوجوك", "البرمجة اللغوية العصبية", "nlp"];
const isProtectedArticle = article => PROTECTED_ARTICLE_IDS.has(String(article?.id || "")) ||
  PROTECTED_TERMS.some(term => String(article?.title || "").concat(" ", String(article?.content || "")).toLocaleLowerCase("ar").includes(term));

const EDITORIAL_STATUSES = new Set([
  "pending_review", "approved", "needs_scientific_review",
  "needs_sharia_review", "needs_editorial_review", "duplicate_or_title_review"
]);

function validateWrite(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const articleId = String(body.article_id || "");
  const sectionId = String(body.primary_section_id || "");
  const specialtyId = body.primary_specialty_id == null || body.primary_specialty_id === "" ? null : String(body.primary_specialty_id);
  const contentTypeId = String(body.content_type_id || "");
  const status = String(body.editorial_status || "pending_review");
  const note = String(body.editorial_note || "");
  if (!validId(articleId) || !validId(sectionId) || (specialtyId !== null && !validId(specialtyId)) ||
      !validId(contentTypeId) || !EDITORIAL_STATUSES.has(status) || note.length > 2000) return null;
  return { articleId, sectionId, specialtyId, contentTypeId, status, note };
}

export async function onRequest({ request, env }) {
  const session = await readOwnerSession(request, env);
  if (!session || session.login !== "alabqry55" || session.id !== "312770372") return json({ error: "Unauthorized." }, 401);
  if (request.method !== "GET" && request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (request.method === "POST") {
    const origin = request.headers.get("Origin");
    if (!origin || origin !== new URL(request.url).origin) return json({ error: "Cross-origin request rejected." }, 403);
    if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) return json({ error: "Content-Type must be application/json." }, 415);
  }
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 503);

  try {
    if (request.method === "GET") {
      const [sections, specialties, contentTypes, articles] = await Promise.all([
        env.DB.prepare("SELECT id,name,sort_order FROM library_sections WHERE active=1 ORDER BY sort_order").all(),
        env.DB.prepare("SELECT id,name,sort_order FROM library_specialties WHERE active=1 ORDER BY sort_order").all(),
        env.DB.prepare("SELECT id,name,sort_order FROM library_content_types WHERE active=1 ORDER BY sort_order").all(),
        env.DB.prepare(`SELECT a.id,a.title,a.category,a.date,a.scheduled_at,a.content,
          c.primary_section_id,c.primary_specialty_id,c.content_type_id,
          c.editorial_status,c.editorial_note,c.updated_at AS classification_updated_at
          FROM articles a LEFT JOIN library_article_classification c ON c.article_id=a.id
          ORDER BY a.updated_at DESC,a.created_at DESC`).all()
      ]);
      return json({ sections: sections.results || [], specialties: specialties.results || [], content_types: contentTypes.results || [], articles: (articles.results || []).filter(article => !isProtectedArticle(article)).map(({ content, ...article }) => article) });
    }

    const input = validateWrite(await request.json().catch(() => null));
    if (!input) return json({ error: "Invalid classification fields." }, 400);
    if (PROTECTED_ARTICLE_IDS.has(input.articleId)) return json({ error: "This article is excluded from library classification by the owner policy." }, 403);
    const article = await env.DB.prepare("SELECT id,title,content FROM articles WHERE id=?1").bind(input.articleId).first();
    if (!article) return json({ error: "Article not found." }, 404);
    if (isProtectedArticle(article)) return json({ error: "This article is excluded from library classification by the owner policy." }, 403);
    const section = await env.DB.prepare("SELECT id FROM library_sections WHERE id=?1 AND active=1").bind(input.sectionId).first();
    const contentType = await env.DB.prepare("SELECT id FROM library_content_types WHERE id=?1 AND active=1").bind(input.contentTypeId).first();
    if (!section || !contentType) return json({ error: "Unknown or inactive section/content type." }, 400);
    if (input.specialtyId) {
      const specialty = await env.DB.prepare("SELECT id FROM library_specialties WHERE id=?1 AND active=1").bind(input.specialtyId).first();
      if (!specialty) return json({ error: "Unknown or inactive specialty." }, 400);
    }
    const before = await env.DB.prepare(`SELECT article_id,primary_section_id,primary_specialty_id,content_type_id,editorial_status,editorial_note
      FROM library_article_classification WHERE article_id=?1`).bind(input.articleId).first();
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO library_article_classification
        (article_id,primary_section_id,primary_specialty_id,content_type_id,editorial_status,editorial_note)
        VALUES(?1,?2,?3,?4,?5,?6)
        ON CONFLICT(article_id) DO UPDATE SET primary_section_id=excluded.primary_section_id,
        primary_specialty_id=excluded.primary_specialty_id,content_type_id=excluded.content_type_id,
        editorial_status=excluded.editorial_status,editorial_note=excluded.editorial_note,updated_at=CURRENT_TIMESTAMP`)
        .bind(input.articleId,input.sectionId,input.specialtyId,input.contentTypeId,input.status,input.note),
      env.DB.prepare("INSERT INTO article_admin_audit(actor,action,article_id,details) VALUES(?1,?2,?3,?4)")
        .bind(session.login,"library_classification_upsert",input.articleId,JSON.stringify({
          before: before || null,
          after: { primary_section_id: input.sectionId, primary_specialty_id: input.specialtyId,
            content_type_id: input.contentTypeId, editorial_status: input.status, editorial_note: input.note }
        }).slice(0,5000))
    ]);
    const saved = await env.DB.prepare(`SELECT article_id,primary_section_id,primary_specialty_id,content_type_id,editorial_status,editorial_note,updated_at
      FROM library_article_classification WHERE article_id=?1`).bind(input.articleId).first();
    if (!saved || saved.primary_section_id !== input.sectionId || (saved.primary_specialty_id || null) !== input.specialtyId ||
        saved.content_type_id !== input.contentTypeId || saved.editorial_status !== input.status || saved.editorial_note !== input.note) {
      return json({ error: "Classification save could not be verified." }, 503);
    }
    return json({ ok: true, verified: true, classification: saved });
  } catch (error) {
    console.error("[library-classification] request failed", error);
    return json({ error: "Library classification schema is unavailable or the request failed." }, 503);
  }
}
