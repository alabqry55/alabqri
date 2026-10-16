(() => {
  "use strict";
  const headingText = "أحدث المقالات والأبحاث";
  const styleText = `
    .abq-articles-library{direction:rtl;text-align:right;margin:1rem auto;max-width:1100px;font-family:inherit}
    .abq-articles-tools{display:grid;grid-template-columns:minmax(0,1fr) minmax(160px,.42fr);gap:.65rem;margin:1rem 0}
    .abq-articles-tools input,.abq-articles-tools select{box-sizing:border-box;width:100%;min-width:0;padding:.75rem .85rem;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#172033;font:inherit}
    .abq-articles-status{padding:1rem;border:1px solid #dbe3ee;border-radius:14px;background:#f8fafc;color:#334155;line-height:1.8}
    .abq-articles-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));gap:1rem}
    .abq-article-card{min-width:0;padding:1rem;border:1px solid #d6e0ec;border-radius:16px;background:#fff;box-shadow:0 3px 12px #0f172a0a;color:#172033}
    .abq-article-card h3{font-size:1.08rem;line-height:1.7;margin:0 0 .5rem}
    .abq-article-meta{font-size:.82rem;color:#64748b;margin:.3rem 0 .65rem}
    .abq-article-excerpt{line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere}
    .abq-article-content{margin-top:.8rem;padding-top:.8rem;border-top:1px solid #e2e8f0;line-height:1.95;white-space:pre-wrap;overflow-wrap:anywhere}
    .abq-article-card details>summary{cursor:pointer;margin-top:.8rem;font-weight:700;color:#075985}
    @media(max-width:560px){.abq-articles-tools{grid-template-columns:1fr}}
  `;
  function init() {
    const heading = Array.from(document.querySelectorAll("h1,h2,h3,h4")).find(el =>
      (el.textContent || "").replace(/\s+/g, " ").trim().includes(headingText)
    );
    if (!heading) return;
    const section = heading.closest("section") || heading.parentElement;
    if (!section || section.querySelector(".abq-articles-library")) return;
    if (!document.getElementById("abq-articles-library-style")) {
      const style = document.createElement("style");
      style.id = "abq-articles-library-style";
      style.textContent = styleText;
      document.head.appendChild(style);
    }
    const root = document.createElement("div");
    root.className = "abq-articles-library";
    root.setAttribute("aria-live", "polite");
    section.appendChild(root);
    const status = document.createElement("div");
    status.className = "abq-articles-status";
    status.textContent = "جارٍ تحميل الأبحاث والمقالات...";
    root.appendChild(status);

    const el = (tag, cls, text) => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const showStatus = message => {
      root.replaceChildren();
      root.appendChild(el("div", "abq-articles-status", message));
    };
    fetch("/api/articles", { headers: { "Accept": "application/json" }, cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.articles)) throw new Error("Invalid articles response");
        const articles = data.articles.filter(a => a && typeof a.title === "string" && typeof a.content === "string");
        root.replaceChildren();
        if (!articles.length) {
          showStatus("لا توجد أبحاث أو مقالات محفوظة في المكتبة حاليًا. ستظهر هنا تلقائيًا عند حفظ محتوى صحيح في قاعدة البيانات.");
          return;
        }
        const tools = el("div", "abq-articles-tools");
        const search = el("input");
        search.type = "search";
        search.placeholder = "ابحث بعنوان البحث أو المؤلف أو الكلمات...";
        search.setAttribute("aria-label", "البحث في الأبحاث والمقالات");
        const category = el("select");
        category.setAttribute("aria-label", "تصفية الأبحاث حسب التصنيف");
        const allOption = el("option", "", "جميع التصنيفات");
        allOption.value = "";
        category.appendChild(allOption);
        Array.from(new Set(articles.map(a => String(a.category || "").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"ar")).forEach(value => {
          const option = el("option", "", value);
          option.value = value;
          category.appendChild(option);
        });
        tools.append(search, category);
        const grid = el("div", "abq-articles-grid");
        const count = el("p", "abq-article-meta", "");
        root.append(tools, count, grid);

        function render() {
          const term = search.value.trim().toLocaleLowerCase("ar");
          const selected = category.value;
          const visible = articles.filter(a => {
            const haystack = [a.title,a.category,a.excerpt,a.content,a.author].map(v=>String(v||"")).join(" ").toLocaleLowerCase("ar");
            return (!term || haystack.includes(term)) && (!selected || a.category === selected);
          });
          grid.replaceChildren();
          count.textContent = "عدد النتائج: " + visible.length;
          if (!visible.length) {
            grid.appendChild(el("div", "abq-articles-status", "لا توجد نتائج مطابقة. جرّب كلمات بحث أخرى أو غيّر التصنيف."));
            return;
          }
          visible.forEach(a => {
            const card = el("article", "abq-article-card");
            card.appendChild(el("h3", "", a.title));
            const meta = [a.category, a.date].filter(Boolean).join(" • ");
            if (meta) card.appendChild(el("p", "abq-article-meta", meta));
            if (a.excerpt) card.appendChild(el("p", "abq-article-excerpt", a.excerpt));
            const details = el("details");
            details.appendChild(el("summary", "", "قراءة البحث"));
            details.appendChild(el("div", "abq-article-content", a.content));
            card.appendChild(details);
            grid.appendChild(card);
          });
        }
        search.addEventListener("input", render);
        category.addEventListener("change", render);
        render();
      })
      .catch(() => showStatus("تعذر تحميل الأبحاث الآن بسبب خطأ في الاتصال بالخدمة. يرجى المحاولة لاحقًا؛ لم يتم حذف أي بيانات."));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();