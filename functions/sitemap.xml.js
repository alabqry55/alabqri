const STATIC_URLS = [
  "/",
  "/verification.html",
  "/verify-certificate.html",
  "/official-accounts.html",
  "/privacy-policy.html",
  "/terms-of-use.html",
  "/certificate-policy.html",
  "/disclaimer.html",
  "/documentation.html"
];

const xmlEscape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
}[char]));

export async function onRequest({ request, env }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed.", {
      status: 405,
      headers: { allow: "GET, HEAD", "cache-control": "no-store" }
    });
  }

  const origin = new URL(request.url).origin;
  const urls = new Map(STATIC_URLS.map(path => [new URL(path, origin).href, ""]));

  if (env.DB) {
    try {
      const result = await env.DB.prepare(
        "SELECT id,canonical_url,updated_at,scheduled_at FROM articles ORDER BY updated_at DESC"
      ).all();
      const now = Date.now();
      for (const article of result.results || []) {
        if (!article?.id) continue;
        if (article.scheduled_at) {
          const scheduledTime = Date.parse(article.scheduled_at);
          if (!Number.isFinite(scheduledTime) || scheduledTime > now) continue;
        }
        let pageUrl = new URL("/articles/" + encodeURIComponent(String(article.id)), origin).href;
        const canonical = String(article.canonical_url || "").trim();
        if (/^https:\/\//i.test(canonical)) {
          try {
            const parsed = new URL(canonical);
            if (parsed.protocol === "https:" && parsed.origin === origin && parsed.pathname.startsWith("/articles/")) {
              pageUrl = parsed.href;
            }
          } catch (_) {}
        }
        const lastmod = article.updated_at && Number.isFinite(Date.parse(article.updated_at))
          ? new Date(article.updated_at).toISOString()
          : "";
        urls.set(pageUrl, lastmod);
      }
    } catch (error) {
      console.error("[sitemap] D1 read failed", error);
      // Keep the known static URLs available if the article inventory cannot be read.
    }
  }

  const entries = [...urls.entries()].map(([loc, lastmod]) =>
    "<url><loc>" + xmlEscape(loc) + "</loc>" +
    (lastmod ? "<lastmod>" + xmlEscape(lastmod) + "</lastmod>" : "") +
    "</url>"
  ).join("");

  const body = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries + "</urlset>";

  const headers = {
    "content-type": "application/xml; charset=utf-8",
    "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
    "x-content-type-options": "nosniff"
  };
  return new Response(request.method === "HEAD" ? null : body, { status: 200, headers });
}
