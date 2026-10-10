export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  // Keep every route untouched except the main HTML document.
  if (request.method !== "GET" || (url.pathname !== "/" && url.pathname !== "/index.html")) {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.toLowerCase().includes("text/html")) return response;

  const html = await response.text();
  const scriptTag = '<script src="/assets/alabqri-bilingual.js?v=20261010-3" defer></script>';
  if (html.includes("/assets/alabqri-bilingual.js")) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }

  const updatedHtml = /<\/body\s*>/i.test(html)
    ? html.replace(/<\/body\s*>/i, scriptTag + "</body>")
    : html + scriptTag;

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.delete("content-md5");

  return new Response(updatedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}