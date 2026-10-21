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
    const articleTab = document.getElementById("articles");
    const headingScope = articleTab || document;
    const heading = Array.from(headingScope.querySelectorAll("h1,h2,h3,h4")).find(el =>
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

    // Remove legacy duplicate cards by title, not by relying on a particular
    // old search input/heading: the legacy renderer can mount independently.
    const normalizeDomTitle = value => String(value || "").normalize("NFKC").toLocaleLowerCase("ar")
      .replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/[\u064B-\u065F\u0670ـ]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, "");
    const retiredEnergyTitle = normalizeDomTitle("الطاقة الحيوية بين العلم والشريعة");
    const cleanupLegacyArticleCards = () => {
      const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
      const seen = new Set();
      for (const titleNode of headings) {
        const title = normalizeDomTitle(titleNode.textContent);
        const isEnergy = title.includes(retiredEnergyTitle);
        const isKnownArticle = title.includes(normalizeDomTitle("التفكير الزائد: كيف تكسر دائرة الاجترار بخطوات عملية")) ||
          title.includes(normalizeDomTitle("أثر الأذكار في الإتزان النفسي"));
        if (!isEnergy && !isKnownArticle) continue;
        const inLibrary = Boolean(titleNode.closest(".abq-articles-library"));
        if (inLibrary && !isEnergy) {
          seen.add(title);
          continue;
        }
        if (!isEnergy && seen.has(title)) {
          let node = titleNode.parentElement;
          let candidate = null;
          while (node && node !== document.body && node !== articleTab) {
            if (node.contains(root) || node.querySelector(".abq-articles-library")) break;
            const text = normalizeDomTitle(node.textContent);
            const otherKnownTitle = [
              normalizeDomTitle("التفكير الزائد: كيف تكسر دائرة الاجترار بخطوات عملية"),
              normalizeDomTitle("أثر الأذكار في الإتزان النفسي"),
              retiredEnergyTitle
            ].some(other => other !== title && text.includes(other));
            if (otherKnownTitle) break;
            candidate = node;
            node = node.parentElement;
          }
          if (candidate && !candidate.contains(root)) candidate.remove();
          continue;
        }
        if (isEnergy) {
          let node = titleNode.parentElement;
          let candidate = null;
          while (node && node !== document.body && node !== articleTab) {
            if (node.contains(root) || node.querySelector(".abq-articles-library")) break;
            const text = normalizeDomTitle(node.textContent);
            const otherKnownTitle = [
              normalizeDomTitle("التفكير الزائد: كيف تكسر دائرة الاجترار بخطوات عملية"),
              normalizeDomTitle("أثر الأذكار في الإتزان النفسي")
            ].some(other => text.includes(other));
            if (otherKnownTitle) break;
            candidate = node;
            node = node.parentElement;
          }
          if (candidate && !candidate.contains(root)) candidate.remove();
        } else {
          seen.add(title);
        }
      }
    };
    cleanupLegacyArticleCards();
    // The older renderer may appear after the library or after a tab switch.
    const legacySearchObserver = new MutationObserver(() => cleanupLegacyArticleCards());
    legacySearchObserver.observe(document.body, { childList: true, subtree: true });
    const articleHero = heading.closest(".hero-bg");
    if (articleHero) articleHero.insertAdjacentElement("afterend", root);
    else section.appendChild(root);
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
    fetch("/api/articles", { headers: { "Accept": "application/json", ...(sessionStorage.getItem("abqArticlesAdminKey") ? { "Authorization": "Bearer " + sessionStorage.getItem("abqArticlesAdminKey") } : {}) }, cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.articles)) throw new Error("Invalid articles response");
        const normalizeArticleTitle = value => String(value || "").normalize("NFKC").toLocaleLowerCase("ar")
          .replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/[\u064B-\u065F\u0670ـ]/g, "")
          .replace(/[^\p{L}\p{N}]+/gu, "");
        const isRetiredHijamaArticle = article => {
          const id = String(article?.id || "").toLocaleLowerCase("en");
          const title = String(article?.title || "").normalize("NFKC").replace(/[\u064B-\u065F\u0670ـ]/g, "").replace(/\s+/g, " ").trim();
          return id.includes("hijama") || (title.includes("الحجامة") && title.includes("الطب النبوي"));
        };
        const isRetiredEnergyArticle = article => {
          const title = normalizeArticleTitle(article?.title);
          return title.includes(normalizeArticleTitle("الطاقة الحيوية بين العلم والشريعة"));
        };
        const filterUniqueArticles = items => {
          const seenArticleTitles = new Set();
          return items.filter(article => {
            if (!article || typeof article.title !== "string" || typeof article.content !== "string" || isRetiredHijamaArticle(article) || isRetiredEnergyArticle(article)) return false;
            const title = normalizeArticleTitle(article.title);
            if (!title || seenArticleTitles.has(title)) return false;
            seenArticleTitles.add(title);
            return true;
          });
        };
        let articles = filterUniqueArticles(data.articles);
        const initiallyAdmin = Boolean(data.admin);
        root.replaceChildren();
        if (!articles.length) {
          root.appendChild(el("div", "abq-articles-status", "لا توجد أبحاث أو مقالات محفوظة في المكتبة حاليًا. يمكنك فتح الإدارة للتحقق من قاعدة البيانات أو تحميل خطة النشر."));
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
            if (adminMode && a.scheduled_at) {
              const publishDate = new Date(a.scheduled_at);
              card.appendChild(el("p", "abq-article-meta", "موعد النشر: " + (Number.isNaN(publishDate.getTime()) ? a.scheduled_at : publishDate.toLocaleString("ar-EG", {timeZone:"Africa/Cairo"}))));
            }
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
        let adminKey = sessionStorage.getItem("abqArticlesAdminKey") || "";
        let adminMode = false;
        const adminBar = el("div", "abq-articles-tools");
        const adminButton = el("button", "", "إدارة محتوى المقالات");
        adminButton.type = "button";
        const addButton = el("button", "", "إضافة مقال مجدول");
        addButton.type = "button";
        const importButton = el("button", "", "تحميل خطة النشر (12 مقالًا)");
        importButton.type = "button";
        adminButton.style.cssText = "padding:.7rem 1rem;border:1px solid #b88a2b;border-radius:12px;background:#fff;color:#17345b;font:inherit;font-weight:700;cursor:pointer";
        addButton.style.cssText = adminButton.style.cssText;
        importButton.style.cssText = adminButton.style.cssText;
        addButton.hidden = !initiallyAdmin;
        importButton.hidden = !initiallyAdmin;
        if (initiallyAdmin) { adminMode = true; adminButton.textContent = "وضع الإدارة مفعّل"; }
        adminBar.style.gridTemplateColumns = "1fr";
        adminBar.append(adminButton, addButton, importButton);
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
        const scheduleWrap = el("label");
        scheduleWrap.style.cssText = "display:block;margin:.7rem 0;font-weight:700";
        scheduleWrap.appendChild(el("span", "", "موعد النشر المجدول (بتوقيت جهازك / القاهرة)"));
        const scheduleInput = el("input");
        scheduleInput.type = "datetime-local";
        scheduleInput.name = "scheduledAt";
        scheduleInput.style.cssText = "display:block;box-sizing:border-box;width:100%;margin-top:.35rem;padding:.7rem;border:1px solid #cbd5e1;border-radius:10px;font:inherit";
        scheduleWrap.appendChild(scheduleInput);
        editForm.append(editTitle, editId,
          field("عنوان المقال","title",""),
          editCategoryWrap,
          field("التاريخ الأصلي الظاهر للمقال (لا يتغير تلقائيًا)","date",""),
          scheduleWrap,
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
        const adminStatus = el("p", "abq-article-meta", "");
        adminStatus.setAttribute("role", "status");
        adminStatus.style.cssText = "padding:.6rem .8rem;border-radius:10px;background:#f8fafc;line-height:1.8";
        function setAdminStatus(message) {
          adminStatus.textContent = message;
          editorStatus.textContent = message;
        }
        root.insertBefore(adminStatus, tools);
        root.insertBefore(editForm, tools);

        let creatingArticle = false;
        function toLocalDateTime(value) {
          if (!value) return "";
          const d = new Date(value);
          if (Number.isNaN(d.getTime())) return "";
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
          return local.toISOString().slice(0,16);
        }
        function startEditing(article) {
          creatingArticle = false;
          editForm.elements.id.value = article.id;
          editForm.elements.title.value = article.title || "";
          editCategory.value = article.category || "موضوعات معرفية";
          editForm.elements.date.value = article.date || "";
          editForm.elements.scheduledAt.value = toLocalDateTime(article.scheduled_at || article.scheduledAt || "");
          editForm.elements.excerpt.value = article.excerpt || "";
          editForm.elements.content.value = article.content || "";
          editForm.elements.title.required = true;
          editForm.elements.date.required = true;
          editForm.elements.scheduledAt.required = false;
          editTitle.textContent = "تعديل: " + (article.title || "مقال");
          editorStatus.textContent = "تاريخ المقال الأصلي محفوظ كما هو. موعد النشر المجدول حقل مستقل.";
          editForm.hidden = false;
          editForm.scrollIntoView({behavior:"smooth",block:"start"});
        }
        function startCreating() {
          creatingArticle = true;
          editForm.reset();
          editForm.elements.id.value = "article-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8);
          editCategory.value = "موضوعات معرفية";
          editTitle.textContent = "إضافة مقال جديد بموعد نشر مستقبلي";
          editForm.elements.title.required = true;
          editForm.elements.date.required = true;
          editForm.elements.scheduledAt.required = true;
          editorStatus.textContent = "اختر موعدًا مستقبليًا. لن يظهر المقال للزوار قبل الموعد، ولن يُنشأ تلقائيًا أي تكرار.";
          editForm.hidden = false;
          editForm.scrollIntoView({behavior:"smooth",block:"start"});
        }
        addButton.addEventListener("click", startCreating);
        importButton.addEventListener("click", async () => {
          if (!adminKey || !adminMode) {
            setAdminStatus("فعّل وضع الإدارة أولًا.");
            return;
          }
          if (!window.confirm("سيتم فحص خطة النشر ثم حفظ المقالات الاثني عشر بجدولة مستقبلية. إذا وُجد تعارض في عنوان أو معرّف، سترفض الخدمة الدفعة كلها دون حفظ أي جزء. هل تريد المتابعة؟")) return;
          importButton.disabled = true;
          importButton.textContent = "جارٍ فحص الخطة وحفظها...";
          setAdminStatus("جارٍ فحص خطة النشر ومقارنتها بالمقالات المحفوظة...");
          try {
            const response = await fetch("/api/articles", {
              method:"POST",
              headers:{"Content-Type":"application/json","Accept":"application/json","Authorization":"Bearer "+adminKey},
              body:JSON.stringify({action:"seedSchedule"}),
              cache:"no-store"
            });
            const result = await response.json().catch(()=>({}));
            if (!response.ok || !result.ok) {
              if (response.status === 401) { adminKey = ""; adminMode = false; }
              throw new Error(result.error || "تعذر حفظ خطة النشر.");
            }
            const refreshed = await fetch("/api/articles", {headers:{"Accept":"application/json","Authorization":"Bearer "+adminKey},cache:"no-store"});
            const refreshedData = await refreshed.json().catch(()=>({}));
            if (!refreshed.ok || !refreshedData.admin || !Array.isArray(refreshedData.articles)) {
              throw new Error("تم إرسال الخطة، لكن تعذر تأكيد القائمة المحدثة. أعد تحميل الإدارة للتحقق.");
            }
            articles = filterUniqueArticles(refreshedData.articles);
            render();
            setAdminStatus("تم حفظ "+result.saved+" مقالًا والتحقق من سجلات قاعدة البيانات. "+(result.immediatePublished ? "المقال الأول منشور فورًا، وبقية المقالات مجدولة لمواعيدها المحددة. " : "المقالات مجدولة لمواعيدها المحددة. ")+"تم تأكيد إعادة تحميل القائمة.");
            importButton.textContent = "تم تحميل خطة النشر";
          } catch (error) {
            setAdminStatus(error?.message || "تعذر حفظ خطة النشر؛ لم يتم تأكيد النتيجة.");
          } finally {
            importButton.disabled = false;
            if (importButton.textContent !== "تم تحميل خطة النشر") importButton.textContent = "تحميل خطة النشر (12 مقالًا)";
          }
        });
        adminButton.addEventListener("click", () => {
          if (!adminKey) {
            const entered = window.prompt("أدخل مفتاح إدارة المقالات المخصص من إعدادات Cloudflare Pages. لن يُحفظ المفتاح على الجهاز.");
            if (!entered) return;
            adminKey = entered.trim();
          }
          fetch("/api/articles", {headers:{"Accept":"application/json","Authorization":"Bearer "+adminKey},cache:"no-store"})
            .then(async response => {
              const data = await response.json().catch(()=>({}));
              if (!response.ok || !Array.isArray(data.articles) || !data.admin) {
                if (response.status === 401 || !data.admin) adminKey = "";
                const message = data.fallback
                  ? "نسخة المعاينة لا تتصل بقاعدة D1 عبر binding باسم DB؛ لم يتم حفظ أو تغيير أي مقال."
                  : (!data.admin
                    ? "لم يتم قبول مفتاح الإدارة أو لم يُضبط ARTICLES_ADMIN_KEY في إعدادات Cloudflare Pages."
                    : (data.error || "تعذر تحميل المقالات المجدولة."));
                throw new Error(response.status === 401 ? "مفتاح الإدارة غير صحيح." : message);
              }
              articles = filterUniqueArticles(data.articles);
              adminMode = true;
              addButton.hidden = false;
              importButton.hidden = false;
              render();
              setAdminStatus("تم تحميل المقالات المنشورة والمسودات المجدولة من قاعدة البيانات.");
              editForm.hidden = true;
              adminButton.textContent = "وضع الإدارة مفعّل";
            })
            .catch(error => { setAdminStatus(error.message || "تعذر تفعيل الإدارة."); });
        });
        cancelButton.addEventListener("click", () => { editForm.hidden = true; });
        editForm.addEventListener("submit", async event => {
          event.preventDefault();
          if (!adminKey) { editorStatus.textContent = "أدخل مفتاح الإدارة أولًا."; return; }
          if (creatingArticle && (!editForm.elements.scheduledAt.value || Number.isNaN(new Date(editForm.elements.scheduledAt.value).getTime()) || new Date(editForm.elements.scheduledAt.value).getTime() <= Date.now())) {
            editorStatus.textContent = "حدد موعد نشر في المستقبل قبل حفظ المقال الجديد.";
            return;
          }
          saveButton.disabled = true;
          saveButton.textContent = "جارٍ الحفظ...";
          editorStatus.textContent = "جارٍ إرسال التعديلات إلى قاعدة البيانات...";
          const article = {
            id: editForm.elements.id.value,
            title: editForm.elements.title.value.trim(),
            category: editCategory.value,
            date: editForm.elements.date.value.trim(),
            excerpt: editForm.elements.excerpt.value.trim(),
            content: editForm.elements.content.value,
            scheduledAt: editForm.elements.scheduledAt.value ? new Date(editForm.elements.scheduledAt.value).toISOString() : null
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
              if (response.status === 409) throw new Error(result.error || "هذا العنوان موجود بالفعل؛ لم يتم إنشاء نسخة مكررة.");
              throw new Error(result.error || ("فشل الحفظ (HTTP "+response.status+")."));
            }
            editorStatus.textContent = "تم تأكيد الحفظ السحابي. جارٍ إعادة تحميل القائمة من قاعدة البيانات...";
            const refreshed = await fetch("/api/articles", {headers:{"Accept":"application/json","Authorization":"Bearer "+adminKey},cache:"no-store"});
            const refreshedData = await refreshed.json().catch(()=>({}));
            if (!refreshed.ok || !refreshedData.admin || !Array.isArray(refreshedData.articles)) {
              throw new Error("تم إرسال الحفظ، لكن تعذر تأكيد القائمة المحدثة. أعد تحميل الإدارة للتحقق.");
            }
            articles = filterUniqueArticles(refreshedData.articles);
            editForm.hidden = true;
            render();
            editorStatus.textContent = creatingArticle ? "تم حفظ المقال الجديد وجدولته سحابيًا." : "تم حفظ المقال وتأكيد بياناته السحابية.";
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
      .catch(() => {
        showStatus("تعذر تحميل قائمة المقالات من الخدمة الآن. لم يتم حذف أي بيانات، ويمكنك فتح أداة الإدارة للتحقق من اتصال قاعدة البيانات.");
        const fallbackBar = el("div", "abq-articles-tools");
        fallbackBar.style.gridTemplateColumns = "1fr";
        const fallbackAdminButton = el("button", "", "إدارة محتوى المقالات");
        fallbackAdminButton.type = "button";
        fallbackAdminButton.style.cssText = "padding:.7rem 1rem;border:1px solid #b88a2b;border-radius:12px;background:#fff;color:#17345b;font:inherit;font-weight:700;cursor:pointer";
        const fallbackStatus = el("p", "abq-article-meta", "لم يتم تحميل المكتبة؛ لم يُجرَ أي تعديل على المقالات.");
        fallbackStatus.setAttribute("role", "status");
        fallbackBar.appendChild(fallbackAdminButton);
        root.append(fallbackBar, fallbackStatus);
        fallbackAdminButton.addEventListener("click", async () => {
          const entered = window.prompt("أدخل مفتاح إدارة المقالات المخصص من إعدادات Cloudflare Pages. لن يُحفظ المفتاح على الجهاز.");
          if (!entered || !entered.trim()) return;
          fallbackAdminButton.disabled = true;
          fallbackStatus.textContent = "جارٍ التحقق من صلاحية الإدارة واتصال قاعدة البيانات...";
          try {
            const response = await fetch("/api/articles", {
              headers: { "Accept": "application/json", "Authorization": "Bearer " + entered.trim() },
              cache: "no-store"
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.admin || !Array.isArray(data.articles)) {
              throw new Error(response.status === 401 ? "مفتاح الإدارة غير صحيح." : (data.error || "تعذر الوصول إلى إدارة المقالات (HTTP " + response.status + ")."));
            }
            sessionStorage.setItem("abqArticlesAdminKey", entered.trim());
            fallbackStatus.textContent = "تم التحقق من المفتاح. جارٍ إعادة تحميل لوحة الإدارة...";
            window.location.reload();
          } catch (error) {
            fallbackStatus.textContent = error?.message || "تعذر التحقق من الإدارة؛ لم يتم تغيير أي بيانات.";
          } finally {
            fallbackAdminButton.disabled = false;
          }
        });
      });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();