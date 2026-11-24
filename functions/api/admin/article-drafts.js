import { readOwnerSession } from "../../_lib/admin-auth.js";

const OWNER_LOGIN = "alabqry55";
const PREFIX = "owner:alabqry55:drafts:";
const CATEGORIES = new Set([
  "القرآن الكريم وعلومه",
  "الحديث الشريف وعلومه",
  "التنمية البشرية",
  "الطب التكميلي",
  "الأذكار والاتزان",
  "البحث العلمي",
  "موضوعات معرفية"
]);
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer"
  }
});
const validId = id => typeof id === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(id);
const boundedString = (value, max) => typeof value === "string" && value.length <= max;

function normalizeDraft(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const id = String(input.id || "");
  if (!validId(id)) return null;
  const limits = {
    title: 240, category: 80, date: 80, excerpt: 2000, content: 200000,
    seoTitle: 240, seoDescription: 500, seoKeywords: 1000,
    canonicalUrl: 1000, ogImage: 1000
  };
  for (const [field, max] of Object.entries(limits)) {
    const value = input[field] == null ? "" : input[field];
    if (!boundedString(value, max)) return null;
  }
  if (input.category && !CATEGORIES.has(input.category)) return null;
  if (input.tags != null && (!Array.isArray(input.tags) || input.tags.length > 20 ||
      input.tags.some(tag => typeof tag !== "string" || tag.length > 80))) return null;
  if (input.scheduledAt != null && input.scheduledAt !== "" &&
      (typeof input.scheduledAt !== "string" || input.scheduledAt.length > 40 ||
       !/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(?::\\d{2}(?:\\.\\d{1,3})?)?(?:Z|[+-]\\d{2}:?\\d{2})$/.test(input.scheduledAt) ||
       !Number.isFinite(Date.parse(input.scheduledAt)))) return null;
  return {
    id,
    title: input.title || "",
    category: input.category || "",
    date: input.date || "",
    excerpt: input.excerpt || "",
    content: input.content || "",
    tags: Array.isArray(input.tags) ? input.tags.slice(0, 20) : [],
    seoTitle: input.seoTitle || "",
    seoDescription: input.seoDescription || "",
    seoKeywords: input.seoKeywords || "",
    canonicalUrl: input.canonicalUrl || "",
    ogImage: input.ogImage || "",
    scheduledAt: input.scheduledAt || null
  };
}

export async function onRequest({ request, env }) {
  if (request.method !== "GET" && request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }
  const owner = await readOwnerSession(request, env);
  if (!owner || owner.login !== OWNER_LOGIN) return json({ error: "Unauthorized." }, 401);
  if (request.method === "POST") {
    const origin = request.headers.get("Origin");
    if (!origin || origin !== new URL(request.url).origin) {
      return json({ error: "Cross-origin request rejected." }, 403);
    }
    if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
      return json({ error: "Content-Type must be application/json." }, 415);
    }
  }
  const drafts = env.ARTICLE_DRAFTS;
  if (!drafts || typeof drafts.get !== "function" || typeof drafts.put !== "function" ||
      typeof drafts.delete !== "function" || typeof drafts.list !== "function") {
    return json({ error: "ARTICLE_DRAFTS KV binding is not configured for this environment." }, 503);
  }

  if (request.method === "GET") {
    try {
      const result = await drafts.list({ prefix: PREFIX, limit: 100 });
      const records = await Promise.all((result.keys || []).map(async key => {
        const value = await drafts.get(key.name, "json");
        return value && typeof value === "object" ? value : null;
      }));
      const items = records.filter(Boolean).sort((a, b) =>
        String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
      );
      return json({ ok: true, drafts: items });
    } catch (error) {
      console.error("[article-drafts] list failed", error);
      return json({ error: "تعذر تحميل المسودات من مخزنها المستقل." }, 500);
    }
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "Invalid JSON body." }, 400);
  }
  const id = String(body.id || body.draft?.id || "");
  if (!validId(id)) return json({ error: "Invalid draft ID." }, 400);
  const key = PREFIX + id;

  try {
    if (body.action === "save") {
      const article = normalizeDraft(body.draft);
      if (!article || article.id !== id) return json({ error: "بيانات المسودة غير صالحة أو تجاوزت الحدود المسموحة." }, 400);
      const existing = await drafts.get(key, "json");
      const now = new Date().toISOString();
      const record = {
        id,
        article,
        owner: OWNER_LOGIN,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      };
      await drafts.put(key, JSON.stringify(record), {
        metadata: { owner: OWNER_LOGIN, updatedAt: now }
      });
      const verified = await drafts.get(key, "json");
      if (!verified || verified.id !== id || verified.owner !== OWNER_LOGIN ||
          verified.article?.title !== article.title || verified.article?.content !== article.content ||
          verified.updatedAt !== now) {
        return json({ error: "تعذر التحقق من حفظ المسودة في مخزن KV." }, 503);
      }
      return json({ ok: true, id, verified: true, updatedAt: now });
    }
    if (body.action === "delete") {
      const existing = await drafts.get(key, "json");
      if (!existing) return json({ error: "المسودة غير موجودة." }, 404);
      await drafts.delete(key);
      const remaining = await drafts.get(key);
      if (remaining !== null) return json({ error: "تعذر تأكيد حذف المسودة." }, 503);
      return json({ ok: true, id, deleted: true });
    }
    return json({ error: "Unsupported action." }, 400);
  } catch (error) {
    console.error("[article-drafts] write failed", error);
    return json({ error: "تعذر تنفيذ عملية المسودة في مخزن KV المستقل." }, 500);
  }
}
