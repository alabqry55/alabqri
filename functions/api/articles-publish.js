import { readOwnerSession } from "../_lib/admin-auth.js";

const CATEGORIES = new Set([
  "القرآن الكريم وعلومه",
  "الحديث الشريف وعلومه",
  "التنمية البشرية",
  "الطب التكميلي",
  "الأذكار والاتزان",
  "البحث العلمي",
  "موضوعات معرفية"
]);
const ENERGY_TAGS = [
  "الطاقة_الحيوية", "العلم_والشريعة", "الطب_التكميلي", "العقيدة_والفكر",
  "الصحة_النفسية", "التداوي_الشرعي", "العلوم_الزائفة", "الفلسفات_الشرقية"
];
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  }
});
const normalizeTitle = value => String(value || "").toLocaleLowerCase("ar")
  .replace(/\p{Extended_Pictographic}/gu, "").replace(/[#*_~]/g, "")
  .replace(/[إأآ]/g, "ا").replace(/ى/g, "ي")
  .replace(/[\u064B-\u065F\u0670ـ]/g, "")
  .replace(/[\s:：،؛,.!?؟]+/g, " ").trim();
const normalizeTags = value => {
  const source = Array.isArray(value) ? value : String(value || "").split(/[،,\n]+|(?=#)/);
  return [...new Set(source.map(tag => String(tag || "").trim().replace(/^#+/, "").replace(/\s+/g, "_"))
    .filter(tag => tag && tag.length <= 80))].slice(0, 20);
};
const isEnergyRelatedArticle = article => {
  const text = normalizeTitle([article?.title, article?.excerpt, article?.content].filter(Boolean).join(" "));
  return ["الطاقة الحيوية", "الفلسفات الشرقية", "العلوم الزائفة", "الطاقة الكونية", "الريكي", "الشاكرات", "البرانا"]
    .some(term => text.includes(normalizeTitle(term)));
};
const metadataForSave = article => {
  const tags = normalizeTags(article?.tags);
  const finalTags = isEnergyRelatedArticle(article)
    ? [...new Set([...ENERGY_TAGS, ...tags])]
    : tags;
  const seoTitle = String(article?.seoTitle || article?.seo_title || article?.title || "").trim().slice(0, 240);
  const seoDescription = String(article?.seoDescription || article?.seo_description || article?.excerpt || "").trim().slice(0, 500);
  const seoKeywords = String(article?.seoKeywords || article?.seo_keywords || finalTags.join(", ")).trim().slice(0, 1000);
  const canonicalUrl = String(article?.canonicalUrl || article?.canonical_url || "").trim().slice(0, 500);
  const ogImage = String(article?.ogImage || article?.og_image || "").trim().slice(0, 1000);
  if (canonicalUrl && !/^https:\/\//i.test(canonicalUrl)) throw new Error("رابط canonical يجب أن يبدأ بـ https://");
  if (ogImage && !/^https:\/\//i.test(ogImage)) throw new Error("رابط صورة المشاركة يجب أن يبدأ بـ https://");
  return { tags: finalTags, seoTitle, seoDescription, seoKeywords, canonicalUrl, ogImage };
};
const validSchedule = value => {
  const schedule = String(value || "");
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})$/.test(schedule) &&
    Number.isFinite(Date.parse(schedule)) && Date.parse(schedule) > Date.now();
};

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const ownerSession = await readOwnerSession(request, env);
  if (!ownerSession) return json({ error: "Unauthorized." }, 401);
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) return json({ error: "Cross-origin request rejected." }, 403);
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
    return json({ error: "Content-Type must be application/json." }, 415);
  }
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 503);

  try {
    // Read-only schema preflight: this endpoint never creates or alters tables/columns.
    await env.DB.prepare("SELECT id,title,category,date,excerpt,content,scheduled_at,tags_json,seo_title,seo_description,seo_keywords,canonical_url,og_image FROM articles LIMIT 0").all();
    await env.DB.prepare("SELECT actor,action,article_id,details FROM article_admin_audit LIMIT 0").all();

    const body = await request.json().catch(() => null);
    if (!body || body.action !== "saveMany" || !Array.isArray(body.articles) ||
        body.articles.length < 1 || body.articles.length > 30) {
      return json({ error: "هذه القناة تقبل saveMany فقط، من مقال واحد إلى 30 مقالًا." }, 400);
    }

    const incoming = body.articles;
    const ids = new Set();
    const titles = new Set();
    for (let index = 0; index < incoming.length; index++) {
      const article = incoming[index];
      if (!article || !/^[A-Za-z0-9_-]{1,80}$/.test(String(article.id || "")) ||
          typeof article.title !== "string" || !article.title.trim() || article.title.length > 240 ||
          typeof article.content !== "string" || !article.content.trim() || article.content.length > 200000 ||
          !CATEGORIES.has(article.category) ||
          typeof article.excerpt !== "string" || article.excerpt.length > 2000 ||
          typeof article.date !== "string" || article.date.length > 80) {
        return json({ error: "توجد بيانات غير صالحة في دفعة المقالات؛ لم يُحفظ أي مقال." }, 400);
      }
      const immediate = article.publishImmediately === true;
      if (immediate && (index !== 0 || article.scheduledAt)) {
        return json({ error: "يسمح بالنشر الفوري للمقال الأول فقط ومن دون موعد مجدول." }, 400);
      }
      if (!immediate && !validSchedule(article.scheduledAt)) {
        return json({ error: "كل مقال غير فوري يحتاج موعد نشر مستقبليًا صالحًا؛ لم يُحفظ أي مقال." }, 400);
      }
      const id = String(article.id);
      const title = normalizeTitle(article.title);
      if (ids.has(id) || titles.has(title) || id === "azkar-balance" ||
          title === normalizeTitle("🌿 أثر الأذكار في الاتزان النفسي")) {
        return json({ error: "توجد هوية أو عناوين مكررة داخل الدفعة أو بين المقالات المرجعية." }, 409);
      }
      try { metadataForSave(article); }
      catch (error) { return json({ error: error.message }, 400); }
      ids.add(id);
      titles.add(title);
    }

    const { results: existingRows = [] } = await env.DB.prepare("SELECT id,title FROM articles").all();
    for (const article of incoming) {
      const conflict = existingRows.find(row =>
        String(row.id) === String(article.id) ||
        normalizeTitle(row.title) === normalizeTitle(article.title)
      );
      if (conflict) {
        return json({
          error: "يوجد مقال محفوظ مسبقًا يتعارض مع «" + article.title + "». لم يُحفظ أي مقال من الدفعة.",
          duplicateId: conflict.id
        }, 409);
      }
    }

    const insertStatements = incoming.map(article => {
      const metadata = metadataForSave(article);
      return env.DB.prepare(
        "INSERT INTO articles(id,title,category,date,excerpt,content,scheduled_at,tags_json,seo_title,seo_description,seo_keywords,canonical_url,og_image,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,CURRENT_TIMESTAMP)"
      ).bind(
        String(article.id), article.title.trim(), article.category, article.date, article.excerpt,
        article.content, article.publishImmediately === true ? null : String(article.scheduledAt),
        JSON.stringify(metadata.tags), metadata.seoTitle, metadata.seoDescription, metadata.seoKeywords,
        metadata.canonicalUrl, metadata.ogImage
      );
    });
    const auditStatements = incoming.map(article => env.DB.prepare(
      "INSERT INTO article_admin_audit(actor,action,article_id,details) VALUES(?1,?2,?3,?4)"
    ).bind(
      ownerSession.login,
      article.publishImmediately === true ? "publish" : "schedule",
      String(article.id),
      String(article.scheduledAt || "immediate").slice(0, 500)
    ));

    await env.DB.batch([...insertStatements, ...auditStatements]);
    const verification = await Promise.all(incoming.map(article =>
      env.DB.prepare("SELECT id,title,scheduled_at,content,tags_json,seo_title,seo_description,seo_keywords,canonical_url,og_image FROM articles WHERE id=?1")
        .bind(String(article.id)).first()
    ));
    if (verification.some((row, index) => {
      const article = incoming[index];
      const metadata = metadataForSave(article);
      return !row || row.title !== article.title.trim() || row.content !== article.content ||
        (row.scheduled_at || null) !== (article.publishImmediately === true ? null : article.scheduledAt) ||
        row.tags_json !== JSON.stringify(metadata.tags) || row.seo_title !== metadata.seoTitle ||
        row.seo_description !== metadata.seoDescription || row.seo_keywords !== metadata.seoKeywords ||
        (row.canonical_url || "") !== metadata.canonicalUrl || (row.og_image || "") !== metadata.ogImage;
    })) {
      return json({ error: "لم يتم تأكيد حفظ جميع المقالات في قاعدة البيانات." }, 503);
    }

    return json({
      ok: true,
      saved: incoming.length,
      ids: incoming.map(article => article.id),
      immediatePublished: incoming[0]?.publishImmediately === true ? incoming[0].id : null,
      verified: true
    });
  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error("[articles-publish-api] request failed", requestId, error);
    return json({
      error: "تعذر تنفيذ الحفظ الآمن. راجع سجل Cloudflare باستخدام رقم التتبع.",
      requestId
    }, 500);
  }
}
