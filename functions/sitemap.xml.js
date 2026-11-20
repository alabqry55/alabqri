import { onRequest as readArticlesApi } from "./api/articles.js";

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
      // Build the sitemap from the same public article set used by the library.
      // No owner cookie is forwarded, so scheduled drafts stay private.
      const publicRequest = new Request(new URL("/api/articles", origin), {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      const apiResponse = await readArticlesApi({ request: publicRequest, env });
      if (!apiResponse.ok) throw new Error("Public articles API returned " + apiResponse.status);
      const payload = await apiResponse.json();
      for (const article of Array.isArray(payload?.articles) ? payload.articles : []) {
        if (!article?.id) continue;
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
        urls.set(pageUrl, article.updated_at && Number.isFinite(Date.parse(article.updated_at))
          ? new Date(article.updated_at).toISOString()
          : "");
      }
    } catch (error) {
      console.error("[sitemap] Public article lookup failed", error);
      // Keep known static URLs available if the public article API is unavailable.
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
