/**
 * Cloudflare Pages middleware.
 * Adds the visitor heartbeat script to the homepage without rewriting the
 * large index.html source file. All non-homepage responses pass through.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const response = await context.next();

  if (
    context.request.method !== "GET" ||
    (url.pathname !== "/" && url.pathname !== "/index.html")
  ) {
    return response;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) {
    return response;
  }

  return new HTMLRewriter()
    .on("body", {
      element(element) {
        element.append(
          '<script src="/assets/visitor-heartbeat.js?v=20261014-1" defer></script>',
          { html: true }
        );
        element.append(
          '<script src="/assets/articles-library.js?v=20261016-3" defer></script>',
          { html: true }
        );
      }
    })
    .transform(response);
}
