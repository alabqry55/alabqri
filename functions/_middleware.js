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
        // Desktop-only shortcut to the existing articles admin modal. Mobile UI is intentionally untouched.
        element.append(
          '<style id="abq-pc-articles-admin-shortcut-style">@media(min-width:768px){#abq-pc-articles-admin-shortcut{position:fixed;right:18px;bottom:18px;z-index:100001;display:inline-flex;align-items:center;gap:8px;padding:12px 16px;border:2px solid #d4af37;border-radius:14px;background:#0f3b2e;color:#fff;font:900 14px Cairo,sans-serif;box-shadow:0 8px 24px #0f172a35;cursor:pointer}#abq-pc-articles-admin-shortcut:hover{background:#14532d;transform:translateY(-1px)}}@media(max-width:767px){#abq-pc-articles-admin-shortcut{display:none!important}}</style><button id="abq-pc-articles-admin-shortcut" type="button" onclick="if(typeof window.openAbqArticleAdmin===\'function\')window.openAbqArticleAdmin();else alert(\'تعذر فتح لوحة المقالات؛ أعد تحميل الصفحة.\')" aria-label="فتح لوحة تحكم المقالات والأبحاث">⚙️ إدارة الأبحاث والمقالات</button>',
          { html: true }
        );
      }
    })
    .transform(response);
}
