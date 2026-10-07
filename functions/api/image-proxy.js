/**
 * ALABQRI image edge proxy
 * Purpose: cache critical remote images at the Cloudflare edge so the
 * hero and the 2018 credential image do not depend on a fresh browser
 * connection to image2url.com on every page view.
 */
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const src = url.searchParams.get("src");

  if (!src) {
    return new Response("Missing src", { status: 400 });
  }

  let upstream;
  try {
    upstream = new URL(src);
  } catch {
    return new Response("Invalid image URL", { status: 400 });
  }

  // Strict allowlist: this proxy cannot be used as an open proxy.
  if (upstream.protocol !== "https:" || upstream.hostname !== "www.image2url.com") {
    return new Response("Image host not allowed", { status: 403 });
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), context.request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const response = await fetch(upstream.toString(), {
    headers: {
      "Accept": "image/avif,image/webp,image/apng,image/jpeg,image/png,image/*,*/*;q=0.8"
    }
  });

  if (!response.ok) {
    return new Response("Upstream image unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000");
  headers.set("CDN-Cache-Control", "public, max-age=604800, stale-while-revalidate=2592000");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.delete("Set-Cookie");

  const cachedResponse = new Response(response.body, {
    status: response.status,
    headers
  });

  context.waitUntil(cache.put(cacheKey, cachedResponse.clone()));
  return cachedResponse;
}
