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
            if (adminMode) {
              const btn = el("button", "", "تعديل المقال");
              btn.type = "button";
              btn.dataset.abqEdit = "1";
              btn.style.cssText = "margin-top:.8rem;padding:.55rem .8rem;border:1px solid #b88a2b;border-radius:10px;background:#fff;color:#17345b;font:inherit;font-weight:700;cursor:pointer";
              btn.addEventListener("click", () => startEditing(a));
              card.appendChild(btn);
            }
            grid.appendChild(card);
          });
        }

        // Secure inline editor: the admin key is entered by the authorized editor and
        // remains only in this page's memory. It is never persisted in localStorage.
        let adminKey = "";
        let adminMode = false;
        const adminBar = el("div", "abq-articles-tools");
        const adminButton = el("button", "", "إدارة محتوى المقالات");
        adminButton.type = "button";
        adminButton.style.cssText = "padding:.7rem 1rem;border:1px solid #b88a2b;border-radius:12px;background:#fff;color:#17345b;font:inherit;font-weight:700;cursor:pointer";
        adminBar.style.gridTemplateColumns = "1fr";
        adminBar.appendChild(adminButton);
        root.insertBefore(adminBar, tools);

        const editForm = el("form", "abq-article-card");
        editForm.hidden = true;
        editForm.style.margin = "1rem 0";
        const field = (labelText, name, value, multiline=false) => {
          const wrap = el("label");
          wrap.style.cssText = "display:block;margin:.7rem 0;font-weight:700";
          wrap.appendChild(el("span", "", labelText));
          const input = multiline ? el("textarea") : el("input");
          input.name = name;
          input.value = value || "";
          input.required = ["title","date","excerpt","content"].includes(name);
          input.style.cssText = "display:block;box-sizing:border-box;width:100%;margin-top:.35rem;padding:.7rem;border:1px solid #cbd5e1;border-radius:10px;font:inherit;line-height:1.8";
          if (multiline) { input.rows = name === "content" ? 14 : 3; input.maxLength = name === "content" ? 200000 : 2000; }
          else if (name === "date") input.maxLength = 80;
          else if (name === "title") input.maxLength = 240;
          wrap.appendChild(input);
          return wrap;
        };
        const editTitle = el("h3", "", "تعديل مقال");
        const editId = el("input");
        editId.type = "hidden";
        editId.name = "id";
        const editCategoryWrap = el("label");
        editCategoryWrap.style.cssText = "display:block;margin:.7rem 0;font-weight:700";
        editCategoryWrap.appendChild(el("span", "", "التصنيف"));
        const editCategory = el("select");
        editCategory.name = "category";
        ["التنمية البشرية","الطب التكميلي","الأذكار والاتزان","البحث العلمي","موضوعات معرفية"].forEach(c => {
          const option = el("option", "", c); option.value = c; editCategory.appendChild(option);
        });
        editCategory.style.cssText = "display:block;box-sizing:border-box;width:100%;margin-top:.35rem;padding:.7rem;border:1px solid #cbd5e1;border-radius:10px;background:#fff;font:inherit";
        editCategoryWrap.appendChild(editCategory);
        editForm.append(editTitle, editId,
          field("عنوان المقال","title",""),
          editCategoryWrap,
          field("التاريخ (سيظل كما هو ما لم تغيّره)","date",""),
          field("الوصف المختصر","excerpt","",true),
          field("المحتوى الكامل","content","",true));
        const editorActions = el("div");
        editorActions.style.cssText = "display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.8rem";
        const saveButton = el("button", "", "حفظ التعديلات");
        saveButton.type = "submit";
        saveButton.style.cssText = adminButton.style.cssText;
        const cancelButton = el("button", "", "إلغاء");
        cancelButton.type = "button";
        cancelButton.style.cssText = "padding:.7rem 1rem;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#334155;font:inherit;cursor:pointer";
        editorActions.append(saveButton,cancelButton);
        const editorStatus = el("p", "abq-article-meta", "");
        editForm.append(editorActions,editorStatus);
        root.insertBefore(editForm, tools);

        function startEditing(article) {
          editForm.elements.id.value = article.id;
          editForm.elements.title.value = article.title || "";
          editCategory.value = article.category || "موضوعات معرفية";
          editForm.elements.date.value = article.date || "";
          editForm.elements.excerpt.value = article.excerpt || "";
          editForm.elements.content.value = article.content || "";
          editTitle.textContent = "تعديل: " + (article.title || "مقال");
          editorStatus.textContent = "التاريخ محفوظ كما هو؛ لا تغيّره إذا أردت الإبقاء عليه.";
          editForm.hidden = false;
          editForm.scrollIntoView({behavior:"smooth",block:"start"});
        }
        adminButton.addEventListener("click", () => {
          if (!adminKey) {
            const entered = window.prompt("أدخل مفتاح إدارة المقالات المخصص من إعدادات Cloudflare Pages. لن يُحفظ المفتاح على الجهاز.");
            if (!entered) return;
            adminKey = entered.trim();
          }
          adminMode = true;
          render();
          editorStatus.textContent = "وضع الإدارة مفعّل لهذه الجلسة. اختر «تعديل المقال» من البطاقة المطلوبة.";
          editForm.hidden = true;
          adminButton.textContent = "وضع الإدارة مفعّل";
        });
        cancelButton.addEventListener("click", () => { editForm.hidden = true; });
        editForm.addEventListener("submit", async event => {
          event.preventDefault();
          if (!adminKey) { editorStatus.textContent = "أدخل مفتاح الإدارة أولًا."; return; }
          saveButton.disabled = true;
          saveButton.textContent = "جارٍ الحفظ...";
          editorStatus.textContent = "جارٍ إرسال التعديلات إلى قاعدة البيانات...";
          const article = {
            id: editForm.elements.id.value,
            title: editForm.elements.title.value.trim(),
            category: editCategory.value,
            date: editForm.elements.date.value.trim(),
            excerpt: editForm.elements.excerpt.value.trim(),
            content: editForm.elements.content.value
          };
          try {
            const response = await fetch("/api/articles", {
              method:"POST",
              headers:{"Content-Type":"application/json","Accept":"application/json","Authorization":"Bearer "+adminKey},
              body:JSON.stringify({action:"save",article}),
              cache:"no-store"
            });
            const result = await response.json().catch(()=>({}));
            if (!response.ok || !result.ok) {
              if (response.status === 503) throw new Error("الحفظ غير مفعّل على هذه النسخة: راجع ربط D1 وسر ARTICLES_ADMIN_KEY في إعدادات Cloudflare Pages.");
              if (response.status === 401) { adminKey = ""; throw new Error("مفتاح الإدارة غير صحيح. افتح إدارة المقالات وأدخل المفتاح الصحيح."); }
              throw new Error(result.error || ("فشل الحفظ (HTTP "+response.status+")."));
            }
            editorStatus.textContent = "تم تأكيد الحفظ السحابي. جارٍ تحديث المقال...";
            const index = articles.findIndex(a => String(a.id) === String(article.id));
            if (index >= 0) articles[index] = article;
            editForm.hidden = true;
            render();
            editorStatus.textContent = "تم حفظ المقال في قاعدة البيانات بنجاح.";
          } catch (error) {
            editorStatus.textContent = error?.message || "تعذر تأكيد الحفظ السحابي.";
          } finally {
            saveButton.disabled = false;
            saveButton.textContent = "حفظ التعديلات";
          }
        });

        search.addEventListener("input", render);
        category.addEventListener("change", render);
        render();
      })
      .catch(() => showStatus("تعذر تحميل الأبحاث الآن بسبب خطأ في الاتصال بالخدمة. يرجى المحاولة لاحقًا؛ لم يتم حذف أي بيانات."));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();