import { renderMarkdown } from "../_shared/markdown.js";
const SITE_ORIGIN = "https://alabqri.pages.dev";
const SITE_NAME = "منصة العبقري للتدريب والإستشارات";
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[char]));
const jsonForHtml = value => JSON.stringify(value).replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/&/g,"\\u0026");
const html = (title, description, body, status=200) => new Response(body, {
  status,
  headers: {
    "content-type":"text/html; charset=utf-8",
    "cache-control":status===200?"public, max-age=60, s-maxage=300":"no-store",
    "x-content-type-options":"nosniff",
    "referrer-policy":"strict-origin-when-cross-origin",
    "x-robots-tag":status===200?"index, follow":"noindex, nofollow"
  }
});
const page = (status, heading, message) => html(heading,message,`<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(heading)} | ${SITE_NAME}</title>
<style>body{font-family:Tahoma,Arial,sans-serif;line-height:2;margin:0;padding:2rem;background:#f7faf8;color:#173b2d}main{max-width:900px;margin:auto;padding:2rem;background:white;border:2px solid #2563eb;border-radius:18px}a{color:#075985;font-weight:700}</style></head>
<body><main><h1>${esc(heading)}</h1><p>${esc(message)}</p><a href="/#articles">العودة إلى مكتبة وأبحاث العبقري</a></main></body></html>`,status);

export async function onRequest({request, env, params}) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed.", {status:405,headers:{"allow":"GET, HEAD","cache-control":"no-store"}});
  }
  const id = String(params?.id || "");
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) return page(404,"المقال غير موجود","الرابط المطلوب غير صالح.");
  if (!env.DB) return page(503,"تعذر تحميل المقال","خدمة المقالات غير متاحة مؤقتًا. حاول لاحقًا.");
  let article;
  try {
    article = await env.DB.prepare(
      "SELECT id,title,category,date,excerpt,content,scheduled_at,tags_json,seo_title,seo_description,seo_keywords,canonical_url,og_image FROM articles WHERE id=?1 LIMIT 1"
    ).bind(id).first();
  } catch (error) {
    if (!/no such column:/i.test(String(error?.message || error))) {
      return page(503,"تعذر تحميل المقال","تعذر الوصول إلى بيانات المقال حاليًا.");
    }
    try {
      article = await env.DB.prepare(
        "SELECT id,title,category,date,excerpt,content,scheduled_at FROM articles WHERE id=?1 LIMIT 1"
      ).bind(id).first();
    } catch (_) {
      return page(503,"تعذر تحميل المقال","تعذر الوصول إلى بيانات المقال حاليًا.");
    }
  }
  // The public API normalizes the legacy Azkar article to this stable ID,
  // even when its original D1 row was saved under a different ID.
  if (!article && id === "azkar-balance") {
    try {
      article = await env.DB.prepare(
        "SELECT id,title,category,date,excerpt,content,scheduled_at,tags_json,seo_title,seo_description,seo_keywords,canonical_url,og_image FROM articles WHERE title LIKE ?1 ORDER BY updated_at DESC LIMIT 1"
      ).bind("%أثر الأذكار في الاتزان النفسي%").first();
    } catch (_) {
      try {
        article = await env.DB.prepare(
          "SELECT id,title,category,date,excerpt,content,scheduled_at FROM articles WHERE title LIKE ?1 ORDER BY updated_at DESC LIMIT 1"
        ).bind("%أثر الأذكار في الاتزان النفسي%").first();
      } catch (_) { /* keep the not-found response below */ }
    }
  }
  if (!article || !article.title || !article.content) return page(404,"المقال غير موجود","لم نعثر على مقال بهذا الرابط.");
  if (article.scheduled_at) {
    const scheduled = Date.parse(article.scheduled_at);
    if (!Number.isFinite(scheduled) || scheduled > Date.now()) {
      return page(404,"المقال غير متاح حاليًا","هذا المقال غير منشور للعامة حتى الآن.");
    }
  }
  let tags=[];
  try { tags=Array.isArray(article.tags_json)?article.tags_json:JSON.parse(article.tags_json || "[]"); } catch (_) {}
  if (!Array.isArray(tags)) tags=[];
  // Public presentation corrections for the three reviewed Quran-section articles.
  // These are render-time overrides only: the stored D1 article rows remain untouched.
  const publicPresentation = {
    "article-mwwwneov-5167dz": {
      hideEditorialTail: true
    },
    "article-mwlxs57o-6mvjtf": {
      title: "الفرق بين الخوف والخشية في القرآن الكريم: دراسة موجزة",
      seoTitle: "الفرق بين الخوف والخشية في القرآن الكريم | دراسة موجزة",
      description: "دراسة موجزة تشرح دلالات الخوف والخشية في القرآن الكريم، وصلتهما بالعلم والتعظيم، وآثارهما الإيمانية والنفسية والتربوية.",
      excerpt: "دراسة قرآنية موجزة تتناول دلالات الخوف والخشية، والفروق بينهما في الاستعمال القرآني، وعلاقة الخشية بالعلم والتعظيم وأثرهما في سلوك المؤمن."
    },
    "article_1794992060280": {
      title: "الفرق بين الخوف والخشية في القرآن الكريم: دراسة موسعة",
      seoTitle: "الفرق بين الخوف والخشية في القرآن الكريم | دراسة موسعة",
      description: "بحث قرآني لغوي ونفسي موسع يوضح مفهوم الخوف والخشية والفروق الدلالية بينهما، وشواهدهما القرآنية وآثارهما التربوية وتطبيقاتهما العملية.",
      excerpt: "دراسة موسعة تجمع بين التفسير القرآني والتحليل اللغوي والتأمل النفسي والتوجيه التربوي لفهم الخوف والخشية وآثارهما في حياة الإنسان."
    }
  }[id] || {};
  const publicTitle = String(publicPresentation.title || article.title);
  const publicExcerpt = String(publicPresentation.excerpt || article.excerpt || "");
  const publicDescription = String(publicPresentation.description || article.seo_description || article.excerpt || "").replace(/\s+/g," ").trim().slice(0,500);
  let publicContent = String(article.content || "");
  if (publicPresentation.hideEditorialTail) {
    // Hide the internal SEO/publication handoff block from the public page only.
    // Keep the original content unchanged in D1 and retain the separately rendered tags.
    publicContent = publicContent.replace(/^\s*#{1,6}\s*بيانات النشر المقترحة\s*$[\s\S]*$/m, "").trim();
  }
  const canonical = SITE_ORIGIN + "/articles/" + encodeURIComponent(id);
  const title = String(publicPresentation.seoTitle || article.seo_title || publicTitle).slice(0,240);
  const description = publicDescription;
  const image = /^https:\/\//i.test(String(article.og_image || "")) ? String(article.og_image) : SITE_ORIGIN + "/assets/images/1784959287743-580091929.png";
  const structured = {
    "@context":"https://schema.org",
    "@type":"Article",
    "headline":publicTitle,
    "description":description,
    "author":{"@type":"Organization","name":"مركز العبقري للتدريب والإستشارات"},
    "publisher":{"@type":"Organization","name":"مركز العبقري للتدريب والإستشارات"},
    "mainEntityOfPage":{"@type":"WebPage","@id":canonical},
    "image":[image]
  };
  if (/^\\d{4}-\\d{2}-\\d{2}(?:T.*)?$/.test(String(article.date || ""))) structured.datePublished = String(article.date);
  const body = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}"><meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="article"><meta property="og:locale" content="ar_AR"><meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(image)}">
<script type="application/ld+json">${jsonForHtml(structured)}</script>
<style>
*{box-sizing:border-box}body{margin:0;background:#f7faf8;color:#172b22;font-family:Cairo,Tahoma,Arial,sans-serif;direction:rtl}
.site-head{padding:1.2rem max(1rem,calc((100% - 1100px)/2));background:#173b2d;color:#fff}
.site-head a{color:#fff;text-decoration:none;font-weight:700}.wrap{width:min(1100px,calc(100% - 2rem));margin:1.5rem auto}
article{padding:clamp(1rem,3vw,2rem);border:2px solid #2563eb;border-radius:18px;background:#fff;line-height:2.05;overflow-wrap:anywhere}
h1{font-size:clamp(1.45rem,3vw,2.2rem);line-height:1.65;margin:.2rem 0 .6rem;color:#173b2d}
.meta{color:#64748b;font-size:.92rem;margin:.3rem 0 1.2rem}.excerpt{font-weight:700;margin:1rem 0;padding:1rem;background:#f7faf8;border-right:4px solid #b88a2b;border-radius:10px;white-space:pre-wrap}
.content{overflow-wrap:anywhere}
.content h2,.content h3,.content h4{color:#173b2d;line-height:1.7;margin:1.5rem 0 .65rem}
.content h2{font-size:1.45rem;border-right:4px solid #b88a2b;padding-right:.7rem}
.content h3{font-size:1.2rem}
.content p{margin:.8rem 0;white-space:normal}
.content ul,.content ol{padding-right:1.6rem;margin:.6rem 0 1rem}
.content li{margin:.35rem 0}
.content blockquote{margin:1rem 0;padding:.7rem 1rem;border-right:4px solid #b88a2b;background:#f7faf8;border-radius:8px;color:#40564a}
.content hr{border:0;border-top:1px solid #dbe5df;margin:1.4rem 0}
.content pre{direction:ltr;text-align:left;white-space:pre-wrap;overflow:auto;padding:1rem;background:#f1f5f9;border-radius:8px}
.content code{font-family:Consolas,monospace;background:#eef2f7;padding:.1rem .3rem;border-radius:4px}.tags{margin-top:1.5rem;color:#475569;font-size:.9rem}
.back{display:inline-block;margin-top:1.3rem;padding:.65rem 1rem;border:2px solid #2563eb;border-radius:10px;color:#173b2d;text-decoration:none;font-weight:700}
footer{text-align:center;color:#64748b;font-size:.9rem;padding:1rem}
</style></head><body>
<header class="site-head"><a href="/">🎓 منصة العبقري للتدريب والإستشارات</a><div>🌿 الطب التكميلي والتنمية البشرية</div></header>
<main class="wrap"><article><h1>${esc(publicTitle)}</h1>
<p class="meta">${esc(article.category || "مكتبة وأبحاث العبقري")}${article.date?" • "+esc(article.date):""}</p>
${publicExcerpt?`<div class="excerpt">${esc(publicExcerpt)}</div>`:""}
<div class="content">${renderMarkdown(publicContent)}</div>
${tags.length?`<p class="tags">${tags.map(tag=>"#"+esc(String(tag).replace(/^#/,"").replace(/\*/g,"_"))).join(" • ")}</p>`:""}
<a class="back" href="/#articles">العودة إلى مكتبة وأبحاث العبقري</a></article></main>
<footer>مركز العبقري للتدريب والإستشارات • تحت إشراف د. أحمد السيد رَسَّه</footer></body></html>`;
  const response = html(title,description,body,200);
  if (request.method === "HEAD") return new Response(null,{status:200,headers:response.headers});
  return response;
}
