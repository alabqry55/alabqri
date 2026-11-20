const SITE_NAME = "منصة العبقري للتدريب والإستشارات";
const DEFAULT_IMAGE = "/assets/images/1784959287743-580091929.png";

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

const cleanText = (value, limit = 500) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);

const jsonForHtml = value => JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

function notFound(status = 404) {
  const body = `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>المقال غير متاح | العبقري</title><body style="font-family:Arial,sans-serif;max-width:720px;margin:12vh auto;padding:24px;line-height:2;color:#173b2d"><h1>المقال غير متاح حاليًا</h1><p>قد يكون الرابط غير صحيح أو أن المقال لم يحِن موعد نشره بعد.</p><a href="/#articles">العودة إلى مكتبة العبقري</a></body></html>`;
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow"
    }
  });
}

async function findArticle(db, slug, canonicalCandidate) {
  const fullQuery = "SELECT id,title,category,date,excerpt,content,scheduled_at,seo_title,seo_description,seo_keywords,canonical_url,og_image,created_at,updated_at FROM articles WHERE id=?1 OR canonical_url=?2 LIMIT 1";
  try {
    return await db.prepare(fullQuery).bind(slug, canonicalCandidate).first();
  } catch (error) {
    if (!/no such column:/i.test(String(error?.message || error))) throw error;
    const legacyQuery = "SELECT id,title,category,date,excerpt,content,scheduled_at,created_at,updated_at FROM articles WHERE id=?1 LIMIT 1";
    try {
      return await db.prepare(legacyQuery).bind(slug).first();
    } catch (legacyError) {
      if (!/no such column: scheduled_at/i.test(String(legacyError?.message || legacyError))) throw legacyError;
      return await db.prepare("SELECT id,title,category,date,excerpt,content,created_at,updated_at FROM articles WHERE id=?1 LIMIT 1").bind(slug).first();
    }
  }
}

function renderArticle(article, requestUrl) {
  const origin = requestUrl.origin;
  const title = cleanText(article.seo_title || article.title, 240);
  const description = cleanText(article.seo_description || article.excerpt || title, 300);
  const keywords = cleanText(article.seo_keywords || "", 1000);
  const imageValue = String(article.og_image || "").trim();
  const imageUrl = /^https:\/\//i.test(imageValue)
    ? imageValue
    : new URL(DEFAULT_IMAGE, origin).href;
  const storedCanonical = String(article.canonical_url || "").trim();
  let canonicalUrl = new URL(requestUrl.pathname, origin).href;
  if (/^https:\/\//i.test(storedCanonical)) {
    try {
      const parsed = new URL(storedCanonical);
      if (parsed.protocol === "https:") canonicalUrl = parsed.href;
    } catch (_) {}
  }
  const displayTitle = escapeHtml(article.title || title);
  const body = escapeHtml(article.content || "").replace(/\r?\n/g, "<br>\n");
  const published = escapeHtml(article.date || "");
  const category = escapeHtml(article.category || "مقالات وأبحاث");
  const author = "د. أحمد السيد رَسَّهْ (أحمد الزمخشري)";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: [imageUrl],
    author: { "@type": "Person", name: author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: new URL(DEFAULT_IMAGE, origin).href }
    },
    mainEntityOfPage: canonicalUrl,
    datePublished: article.created_at || undefined,
    dateModified: article.updated_at || article.created_at || undefined,
    articleSection: article.category || undefined,
    keywords: keywords || undefined
  };
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} | العبقري</title>
<meta name="description" content="${escapeHtml(description)}">
${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}">` : ""}
<meta name="author" content="${escapeHtml(author)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
<meta property="og:type" content="article">
<meta property="og:locale" content="ar_AR">
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta property="og:image" content="${escapeHtml(imageUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(imageUrl)}">
<script type="application/ld+json">${jsonForHtml(structuredData)}</script>
<style>
:root{color-scheme:light;--green:#173b2d;--gold:#b88a2b;--ink:#26352e;--muted:#64746b;--line:#dce5df}
*{box-sizing:border-box}body{margin:0;background:#f7f9f6;color:var(--ink);font-family:"Cairo","Tahoma",Arial,sans-serif;line-height:2}
.page{width:min(920px,calc(100% - 32px));margin:32px auto 64px}
.breadcrumbs{font-size:.92rem;color:var(--muted);margin-bottom:18px}.breadcrumbs a{color:var(--green);text-decoration:none}
.article{background:#fff;border:1px solid var(--line);border-radius:18px;padding:clamp(20px,5vw,48px);box-shadow:0 8px 30px #173b2d0a}
.kicker{color:var(--gold);font-weight:700;margin:0 0 8px}.article h1{font-size:clamp(1.55rem,4vw,2.25rem);line-height:1.65;color:var(--green);margin:0 0 10px}
.meta{color:var(--muted);font-size:.9rem;margin:0 0 22px}.excerpt{padding:14px 18px;border-right:4px solid var(--gold);background:#fbfaf5;border-radius:10px;margin:0 0 24px}
.content{overflow-wrap:anywhere;white-space:normal}.content br{display:block;content:"";margin-top:.45rem}
.footer{margin-top:24px;padding-top:18px;border-top:1px solid var(--line);font-size:.92rem;color:var(--muted)}
.back{display:inline-block;margin-top:20px;color:var(--green);font-weight:700;text-decoration:none}
@media(max-width:560px){.page{width:calc(100% - 20px);margin:14px auto 36px}.article{border-radius:14px;padding:20px 16px}}
</style>
</head>
<body>
<main class="page">
<nav class="breadcrumbs" aria-label="مسار التنقل"><a href="/">الرئيسية</a> / <a href="/#articles">مكتبة المقالات والأبحاث</a> / <span>${displayTitle}</span></nav>
<article class="article">
<header>
<p class="kicker">${category}</p>
<h1>${displayTitle}</h1>
<p class="meta">${published ? "تاريخ النشر: " + published + " · " : ""}${escapeHtml(author)}</p>
${article.excerpt ? `<p class="excerpt">${escapeHtml(article.excerpt)}</p>` : ""}
</header>
<div class="content">${body}</div>
<footer class="footer">إشراف ومراجعة: ${escapeHtml(author)}<br>${escapeHtml(SITE_NAME)} · السجل التجاري 92527</footer>
<a class="back" href="/#articles">← العودة إلى مكتبة العبقري</a>
</article>
</main>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin"
    }
  });
}

export async function onRequest({ request, env, params }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed.", {
      status: 405,
      headers: { allow: "GET, HEAD", "cache-control": "no-store" }
    });
  }
  if (!env.DB) return notFound(503);

  const slug = String(params?.slug || "").trim();
  if (!/^[\p{L}\p{N}_-]{1,120}$/u.test(slug)) return notFound();

  const url = new URL(request.url);
  let article;
  try {
    article = await findArticle(env.DB, slug, url.origin + url.pathname);
  } catch (error) {
    console.error("[article-page] D1 read failed", error);
    return notFound(503);
  }
  if (!article || !article.id || !article.title || !article.content) return notFound();

  if (article.scheduled_at) {
    const scheduledTime = Date.parse(article.scheduled_at);
    if (!Number.isFinite(scheduledTime) || scheduledTime > Date.now()) return notFound();
  }

  const response = renderArticle(article, url);
  if (request.method === "HEAD") return new Response(null, { status: response.status, headers: response.headers });
  return response;
}
