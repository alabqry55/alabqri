(() => {
  "use strict";

  // Owner authentication is handled by GitHub OAuth; no shared key is stored client-side.
  // Capture at window level so desktop/mobile wrappers and earlier document listeners
  // cannot bypass or swallow the owner-session gate.
  if (!window.__abqArticlesAdminGateInstalled) {
    window.__abqArticlesAdminGateInstalled = true;
    const replayedAdminTriggers = new WeakSet();
  const pendingAdminTriggers = new WeakSet();
  window.addEventListener("click", async event => {
    const target = event.target?.closest?.("button, a, [role='button']");
    if (!target) return;
    if (replayedAdminTriggers.has(target)) {
      replayedAdminTriggers.delete(target);
      return;
    }
    const label = [
      target.innerText,
      target.textContent,
      target.getAttribute("aria-label"),
      target.getAttribute("title")
    ].filter(Boolean).join(" ").replace(/[\\u200B-\\u200F\\uFEFF]/g, " ").replace(/\\s+/g, " ").trim();
    if (!label.includes("لوحة تحكم المقالات والأبحاث") || !label.includes("إضافة ومراجعة")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (pendingAdminTriggers.has(target)) return;
    pendingAdminTriggers.add(target);
    try {
      const response = await fetch("/api/admin/github/session", {
        credentials: "same-origin",
        cache: "no-store",
        headers: {"Accept":"application/json"}
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.authenticated === true && data.admin === true && data.owner === "alabqry55") {
        replayedAdminTriggers.add(target);
        target.click();
      } else {
        window.location.assign("/api/admin/github/login");
      }
    } catch (_) {
      window.alert("تعذر الاتصال بخدمة التحقق؛ لم يتم فتح لوحة التحكم.");
    } finally {
      pendingAdminTriggers.delete(target);
    }
    }, true);
  }
  const headingText = "أحدث المقالات والأبحاث";
  const styleText = `
    .abq-articles-library{direction:rtl;text-align:right;margin:1rem auto;max-width:1160px;font-family:inherit}
    .abq-library-intro{margin:1rem 0;padding:1.1rem 1.2rem;border:1px solid #d9e3dc;border-right:4px solid #b88a2b;border-radius:16px;background:#fbfcfa;line-height:1.9;color:#24352d}
    .abq-library-sections{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:.8rem;margin:1rem 0}
    .abq-library-section{display:flex;flex-direction:column;align-items:flex-start;gap:.35rem;min-height:112px;padding:1rem;border:1px solid #d8e2dc;border-radius:15px;background:#fff;color:#173b2d;text-align:right;font:inherit;cursor:pointer;transition:border-color .15s,background .15s}
    .abq-library-section:hover,.abq-library-section[aria-pressed="true"]{border-color:#b88a2b;background:#fbfaf5}
    .abq-library-section:disabled{cursor:default;opacity:.68}
    .abq-library-section strong{font-size:1rem;line-height:1.7}
    .abq-library-section small{color:#64748b;line-height:1.6}
    .abq-articles-tools{display:grid;grid-template-columns:minmax(0,1fr) minmax(190px,.42fr);gap:.65rem;margin:1rem 0}
    .abq-articles-tools input,.abq-articles-tools select{box-sizing:border-box;width:100%;min-width:0;padding:.75rem .85rem;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#172033;font:inherit}
    .abq-articles-status{padding:1rem;border:1px solid #dbe3ee;border-radius:14px;background:#f8fafc;color:#334155;line-height:1.8}
    .abq-articles-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));gap:1rem}
    .abq-article-card{min-width:0;padding:1rem;border:1px solid #d6e0ec;border-radius:16px;background:#fff;box-shadow:0 3px 12px #0f172a0a;color:#172033}
    .abq-article-card h3{font-size:1.08rem;line-height:1.7;margin:0 0 .5rem}
    .abq-article-meta{font-size:.82rem;color:#64748b;margin:.3rem 0 .65rem}
    .abq-article-excerpt{line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere}
    .abq-article-content{margin-top:.8rem;padding-top:.8rem;border-top:1px solid #e2e8f0;line-height:1.95;white-space:pre-wrap;overflow-wrap:anywhere}
    .abq-article-card details>summary{cursor:pointer;margin-top:.8rem;font-weight:700;color:#075985}
    @media(max-width:560px){.abq-articles-tools{grid-template-columns:1fr}.abq-library-section{min-height:92px}}
  `;
  function init() {
    if (window.__abqArticlesLibraryInitialized) return;
    const articleTab = document.getElementById("articles");
    if (!articleTab) return;
    // Reuse the existing article-list position instead of aborting initialization.
    // The legacy list stays visible until the API responds successfully; then the
    // new seven-section renderer replaces only that list container (not the admin UI).
    const legacyArticleList = articleTab.querySelector("#abq-articles-list");
    const headingScope = articleTab;
    const heading = Array.from(headingScope.querySelectorAll("h1,h2,h3,h4")).find(el =>
      (el.textContent || "").replace(/\s+/g, " ").trim().includes(headingText)
    );
    if (!heading) return;
    const section = heading.closest("section") || heading.parentElement;
    if (!section) return;
    if (section.querySelector(".abq-articles-library")) { window.__abqArticlesLibraryInitialized = true; return; }
    window.__abqArticlesLibraryInitialized = true;
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
    const cleanupLegacySearchArea = () => {
      // Remove every retired search/filter control by its legacy IDs, including
      // duplicate IDs and controls mounted outside the expected tab wrapper.
      // Keep the article library and all admin-editor fields untouched.
      const legacySearchControls = Array.from(articleTab.querySelectorAll(
        '[id="abq-article-search"],[id="abq-article-category"],' +
        'input[placeholder*="بحث"],input[aria-label*="بحث"],input[placeholder*="ابحث"],input[aria-label*="ابحث"],' +
        'input[placeholder*="عنوان البحث"],input[placeholder*="المؤلف"],' +
        'input[placeholder*="search" i],input[aria-label*="search" i],' +
        'select[aria-label*="تصنيف"],select[aria-label*="فلتر"],select[aria-label*="category" i]'
      ));
      // Catch legacy category dropdowns without aria-label by their visible option text.
      const legacyCategorySelects = Array.from(articleTab.querySelectorAll("select")).filter(select =>
        Array.from(select.options || []).some(option => /جميع التصنيفات|كل التصنيفات|all categories/i.test(option.textContent || ""))
      );
      for (const select of legacyCategorySelects) {
        if (!legacySearchControls.includes(select)) legacySearchControls.push(select);
      }
      for (const control of legacySearchControls) {
        if (!control.isConnected) continue;
        const wrapper = control.closest(
          "[class*='bg-blue-50/60'][class*='border-blue-700'], [class*='border-blue-700'][class*='rounded-2xl']"
        );
        if (wrapper && !wrapper.closest(".abq-articles-library")) {
          wrapper.remove();
        } else {
          control.remove();
        }
      }
      if (!articleTab) return;
      // The legacy search/filter controls live outside the new article library.
      // Remove their whole legacy wrapper while preserving the library and its admin editor.
      const legacyForms = Array.from(articleTab.querySelectorAll("form"))
        .filter(form => !form.closest(".abq-articles-library") &&
          (form.querySelector("input,select,textarea") ||
           /بحث|ابحث|تصنيف|فلتر|تصفية|search|filter|category/i.test(form.textContent || "")));
      for (const form of legacyForms) {
        if (form.isConnected && !form.closest(".abq-articles-library")) form.remove();
      }
      const legacyControls = Array.from(articleTab.querySelectorAll("input,select,textarea"))
        .filter(control => !control.closest(".abq-articles-library") &&
          !control.closest("form"));
      for (const control of legacyControls) {
        if (!control.isConnected || control.closest(".abq-articles-library")) continue;
        let area = control.parentElement;
        while (area && area !== articleTab && area.parentElement !== articleTab) {
          if (area.closest(".abq-articles-library")) break;
          const cls = String(area.className || "").toLowerCase();
          const text = String(area.textContent || "");
          if (/search|filter|category|بحث|ابحث|تصنيف|فلتر|تصفية/.test(cls) ||
              /بحث|ابحث|تصنيف|فلتر|تصفية/.test(text)) break;
          area = area.parentElement;
        }
        if (area && area !== articleTab && !area.closest(".abq-articles-library")) area.remove();
        else control.remove();
      }
      // Also remove standalone legacy filter wrappers (including select-only category filters).
      const legacyFilterAreas = Array.from(articleTab.querySelectorAll(
        '[class*="search"],[class*="filter"],[class*="category"],[class*="Search"],[class*="Filter"],[aria-label*="تصنيف"],[aria-label*="بحث"]'
      )).filter(node => node !== articleTab);
      for (const area of legacyFilterAreas) {
        if (!area.isConnected || area.closest(".abq-articles-library")) continue;
        if (area.matches("select,input,textarea") || area.querySelector("input,select,textarea")) area.remove();
      }
    };
    const cleanupLegacyArticleCards = () => {
      cleanupLegacySearchArea();
      // Preserve all article subjects, including energy-bio research. Only collapse
      // duplicate copies of the two legacy cards that remain intentionally managed here.
      const headings = Array.from(articleTab.querySelectorAll("h1,h2,h3,h4,h5,h6"));
      const seen = new Set();
      const knownTitles = [
        normalizeDomTitle("التفكير الزائد: كيف تكسر دائرة الاجترار بخطوات عملية"),
        normalizeDomTitle("أثر الأذكار في الإتزان النفسي")
      ];
      for (const titleNode of headings) {
        const title = normalizeDomTitle(titleNode.textContent);
        if (!knownTitles.some(known => title.includes(known))) continue;
        const inLibrary = Boolean(titleNode.closest(".abq-articles-library"));
        if (inLibrary) { seen.add(title); continue; }
        if (!seen.has(title)) { seen.add(title); continue; }
        let node = titleNode.parentElement;
        let candidate = null;
        while (node && node !== document.body && node !== articleTab) {
          if (node.contains(root) || node.querySelector(".abq-articles-library")) break;
          const text = normalizeDomTitle(node.textContent);
          if (knownTitles.some(other => other !== title && text.includes(other))) break;
          candidate = node;
          node = node.parentElement;
        }
        if (candidate && !candidate.contains(root)) candidate.remove();
      }
    };
    // Observe only mutations that may reintroduce duplicate legacy cards or search controls.
    // Ignore the new library and unrelated page/tab mutations to avoid repeatedly
    // walking or removing content across the entire platform.
    const legacySearchObserver = new MutationObserver(mutations => {
      const mayContainLegacyArticleUi = mutations.some(mutation =>
        Array.from(mutation.addedNodes || []).some(node => {
          if (node.nodeType !== 1 || node.closest?.(".abq-articles-library")) return false;
          const text = normalizeDomTitle(node.textContent || "");
          return node.matches?.(
            '[id="abq-article-search"],[id="abq-article-category"],' +
            'input[placeholder*="بحث"],input[aria-label*="بحث"],input[placeholder*="ابحث"],' +
            'select[aria-label*="تصنيف"],select[aria-label*="فلتر"]'
          ) ||
          Boolean(node.querySelector?.(
            '[id="abq-article-search"],[id="abq-article-category"],' +
            'input[placeholder*="بحث"],input[aria-label*="بحث"],input[placeholder*="ابحث"],' +
            'select[aria-label*="تصنيف"],select[aria-label*="فلتر"]'
          )) ||
          text.includes(normalizeDomTitle("التفكير الزائد: كيف تكسر دائرة الاجترار بخطوات عملية")) ||
          text.includes(normalizeDomTitle("أثر الأذكار في الإتزان النفسي"));
        })
      );
      if (mayContainLegacyArticleUi) cleanupLegacyArticleCards();
    });
    if (articleTab) legacySearchObserver.observe(articleTab, { childList: true, subtree: true });
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
    fetch("/api/articles", { headers: { "Accept": "application/json" }, credentials:"same-origin", cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.articles)) throw new Error("Invalid articles response");
        // Promote the new renderer into the legacy list's exact location only after
        // a valid API response, preserving the old list if loading fails.
        if (legacyArticleList?.isConnected) legacyArticleList.replaceWith(root);
        const normalizeArticleTitle = value => String(value || "").normalize("NFKC").toLocaleLowerCase("ar")
          .replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/[\u064B-\u065F\u0670ـ]/g, "")
          .replace(/[^\p{L}\p{N}]+/gu, "");
        const isRetiredHijamaArticle = article => {
          const id = String(article?.id || "").toLocaleLowerCase("en");
          const title = String(article?.title || "").normalize("NFKC").replace(/[\u064B-\u065F\u0670ـ]/g, "").replace(/\s+/g, " ").trim();
          return id.includes("hijama") || (title.includes("الحجامة") && title.includes("الطب النبوي"));
        };
        const filterUniqueArticles = items => {
          const seenArticleTitles = new Set();
          return items.filter(article => {
            if (!article || typeof article.title !== "string" || typeof article.content !== "string" || isRetiredHijamaArticle(article)) return false;
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
        // The public library is divided into clear subject areas while stored legacy
        // categories remain unchanged for backward compatibility with the API and D1.
        const librarySections = [
          {title:"القرآن الكريم وعلومه",icon:"📖",description:"القرآن والتدبر والتفسير وعلومه",category:"القرآن الكريم وعلومه"},
          {title:"الحديث الشريف وعلومه",icon:"📜",description:"السنة النبوية والحديث الشريف وعلومه",category:"الحديث الشريف وعلومه"},
          {title:"03 📿 الذكر والإتزان الإيماني",icon:"🌿",description:"الأذكار والأدعية والاتزان الإيماني",category:"الأذكار والاتزان"},
          {title:"علم النفس الإسلامي والتنمية البشرية",icon:"🧠",description:"النفس والشخصية والمهارات الإنسانية",category:"التنمية البشرية"},
          {title:"الطب التكميلي والتوعية الصحية",icon:"🌱",description:"الممارسات التكميلية والمعرفة الصحية",category:"الطب التكميلي"},
          {title:"الأبحاث والدراسات",icon:"🔬",description:"الدراسات والتحليل العلمي",category:"البحث العلمي"},
          {title:"المعرفة والفكر",icon:"📚",description:"موضوعات معرفية وفكرية متنوعة",category:"موضوعات معرفية"}
        ];
        let selectedCategory = "";
        const intro = el("div","abq-library-intro","مرحبًا بك في مكتبة العبقري؛ مساحة معرفية منظمة تجمع المقالات والأبحاث في أقسام واضحة، مع الحفاظ على المحتوى المنشور وبياناته.");
        const sectionGrid = el("div","abq-library-sections");
        const tools = el("div","abq-articles-tools");
        const searchInput = el("input");
        searchInput.type = "search";
        searchInput.placeholder = "ابحث في العناوين والمحتوى والوسوم...";
        searchInput.setAttribute("aria-label","البحث في مكتبة العبقري");
        const categorySelect = el("select");
        categorySelect.setAttribute("aria-label","تصفية حسب القسم");
        const allOption = el("option","","جميع الأقسام");
        allOption.value = "";
        categorySelect.appendChild(allOption);
        librarySections.filter(section => section.category).forEach(section => {
          const option = el("option","",section.title);
          option.value = section.category;
          categorySelect.appendChild(option);
        });
        tools.append(searchInput,categorySelect);
        const grid = el("div", "abq-articles-grid");
        const count = el("p", "abq-article-meta", "");
        root.append(intro,sectionGrid,tools,count,grid);

        function renderSections() {
          sectionGrid.replaceChildren();
          librarySections.forEach(section => {
            const total = section.category ? articles.filter(article => article.category === section.category).length : 0;
            const button = el("button","abq-library-section");
            button.type = "button";
            button.disabled = Boolean(section.comingSoon);
            button.setAttribute("aria-pressed",String(selectedCategory === (section.category || "__quran__")));
            button.append(el("span","",section.icon),el("strong","",section.title),
              el("small","",section.comingSoon ? "قريبًا — لا توجد مواد مصنفة هنا بعد" : "عدد المواد: " + total));
            if (section.category) button.addEventListener("click",() => {
              selectedCategory = selectedCategory === section.category ? "" : section.category;
              categorySelect.value = selectedCategory;
              render();
            });
            sectionGrid.appendChild(button);
          });
        }

        function render() {
          renderSections();
          const query = searchInput.value.trim().toLocaleLowerCase("ar");
          const visible = articles.filter(article => {
            const categoryMatch = !selectedCategory || article.category === selectedCategory;
            const haystack = [article.title,article.excerpt,article.content,article.category,...(Array.isArray(article.tags)?article.tags:[])].join(" ").toLocaleLowerCase("ar");
            return categoryMatch && (!query || haystack.includes(query));
          });
          grid.replaceChildren();
          count.textContent = "عدد النتائج: " + visible.length;
          if (!visible.length) {
            grid.appendChild(el("div", "abq-articles-status", "لا توجد نتائج مطابقة. جرّب كلمات بحث أخرى."));
            return;
          }
          visible.forEach(a => {
            const card = el("article", "abq-article-card");
            card.appendChild(el("h3", "", a.title));
            const meta = [a.category, a.date].filter(Boolean).join(" • ");
            if (meta) card.appendChild(el("p", "abq-article-meta", meta));
            if (Array.isArray(a.tags) && a.tags.length) card.appendChild(el("p", "abq-article-meta", a.tags.join(" • ")));
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
        searchInput.addEventListener("input",render);
        categorySelect.addEventListener("change",() => { selectedCategory = categorySelect.value; render(); });

        // Owner authorization is verified server-side through the signed GitHub OAuth session.
        let adminAuthenticated = Boolean(initiallyAdmin);
        let adminMode = false;
        const adminBar = el("div", "abq-articles-tools");
        const adminButton = el("button", "", "تفعيل أدوات الإدارة");
        adminButton.type = "button";
        const addButton = el("button", "", "إضافة مقال مجدول");
        const logoutButton = el("button", "", "تسجيل الخروج");
        logoutButton.type = "button";
        addButton.type = "button";
        adminButton.style.cssText = "padding:.7rem 1rem;border:1px solid #b88a2b;border-radius:12px;background:#fff;color:#17345b;font:inherit;font-weight:700;cursor:pointer";
        addButton.style.cssText = adminButton.style.cssText;
        logoutButton.style.cssText = adminButton.style.cssText;
        logoutButton.hidden = !initiallyAdmin;
        logoutButton.addEventListener("click", async () => {
          logoutButton.disabled = true;
          try {
            const response = await fetch("/api/admin/github/logout", {
              method: "POST",
              credentials: "same-origin",
              cache: "no-store",
              headers: {"Accept":"application/json"}
            });
            if (!response.ok) throw new Error("تعذر إنهاء جلسة الإدارة.");
            window.location.assign("/");
          } catch (error) {
            logoutButton.disabled = false;
            setAdminStatus(error?.message || "تعذر تسجيل الخروج؛ حاول مرة أخرى.");
          }
        });
        addButton.hidden = !initiallyAdmin;
        if (initiallyAdmin) { adminMode = true; adminButton.textContent = "وضع الإدارة مفعّل"; }
        adminBar.style.gridTemplateColumns = "1fr";
        adminBar.append(adminButton, addButton, logoutButton);
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
          if (multiline) { input.rows = name === "content" ? 14 : 3; input.maxLength = name === "content" ? 200000 : (name === "seoDescription" ? 500 : (name === "seoKeywords" ? 1000 : 2000)); }
          else if (name === "date") input.maxLength = 80;
          else if (name === "title" || name === "seoTitle") input.maxLength = 240;
          else if (name === "tags") input.maxLength = 1600;
          else if (name === "canonicalUrl" || name === "ogImage") input.maxLength = 1000;
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
        // Present all seven canonical library sections in administration while
        // preserving the existing stored category values for backward compatibility.
        // Quran and Hadith are new category values; legacy categories remain unchanged.
        [
          ["القرآن الكريم وعلومه","القرآن الكريم وعلومه"],
          ["الحديث الشريف وعلومه","الحديث الشريف وعلومه"],
          ["03 📿 الذكر والإتزان الإيماني","الأذكار والاتزان"],
          ["علم النفس الإسلامي والتنمية البشرية","التنمية البشرية"],
          ["الطب التكميلي والتوعية الصحية","الطب التكميلي"],
          ["الأبحاث والدراسات","البحث العلمي"],
          ["المعرفة والفكر","موضوعات معرفية"]
        ].forEach(([label,value]) => {
          const option = el("option", "", label); option.value = value; editCategory.appendChild(option);
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
          field("المحتوى الكامل","content","",true),
          field("الوسوم (افصل بينها بفاصلة)","tags",""),
          field("عنوان SEO","seoTitle",""),
          field("وصف SEO","seoDescription","",true),
          field("كلمات SEO المفتاحية","seoKeywords","",true),
          field("الرابط الأساسي Canonical URL (اختياري)","canonicalUrl",""),
          field("رابط صورة المشاركة Open Graph (اختياري)","ogImage",""));
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
          editForm.elements.tags.value = Array.isArray(article.tags) ? article.tags.join(", ") : "";
          editForm.elements.seoTitle.value = article.seo_title || article.title || "";
          editForm.elements.seoDescription.value = article.seo_description || article.excerpt || "";
          editForm.elements.seoKeywords.value = article.seo_keywords || "";
          editForm.elements.canonicalUrl.value = article.canonical_url || "";
          editForm.elements.ogImage.value = article.og_image || "";
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
          editTitle.textContent = "إضافة مقال جديد أو نشره فورًا";
          editForm.elements.title.required = true;
          editForm.elements.date.required = true;
          editForm.elements.scheduledAt.required = false;
          editorStatus.textContent = "يمكن حفظ المقال ونشره فورًا بترك موعد النشر فارغًا، أو جدولة نشره باختيار موعد مستقبلي.";
          editForm.hidden = false;
          editForm.scrollIntoView({behavior:"smooth",block:"start"});
        }
        addButton.addEventListener("click", startCreating);
        adminButton.addEventListener("click", async () => {
          try {
            const sessionResponse = await fetch("/api/admin/github/session", {credentials:"same-origin",cache:"no-store"});
            const session = await sessionResponse.json().catch(()=>({}));
            if (!sessionResponse.ok || !session.admin || session.owner !== "alabqry55") { window.location.assign("/api/admin/github/login"); return; }
            const response = await fetch("/api/articles", {headers:{"Accept":"application/json"},credentials:"same-origin",cache:"no-store"});
            const data = await response.json().catch(()=>({}));
            if (!response.ok || !Array.isArray(data.articles) || !data.admin) throw new Error(data.fallback ? "نسخة المعاينة لا تتصل بقاعدة D1 عبر binding باسم DB؛ لم يتم حفظ أو تغيير أي مقال." : (data.error || "تعذر تحميل المقالات المجدولة."));
            adminAuthenticated = true; articles = filterUniqueArticles(data.articles); adminMode = true;
            addButton.hidden = false; logoutButton.hidden = false; render();
            setAdminStatus("تم التحقق من حساب GitHub المالك وتحميل المقالات المنشورة والمجدولة.");
            editForm.hidden = true; adminButton.textContent = "وضع الإدارة مفعّل";
          } catch (error) { setAdminStatus(error.message || "تعذر تفعيل الإدارة."); }
        });
        cancelButton.addEventListener("click", () => { editForm.hidden = true; });
        editForm.addEventListener("submit", async event => {
          event.preventDefault();
          if (!adminAuthenticated) { editorStatus.textContent = "سجّل الدخول بحساب GitHub المالك أولًا."; return; }
          if (editForm.elements.scheduledAt.value && (Number.isNaN(new Date(editForm.elements.scheduledAt.value).getTime()) || new Date(editForm.elements.scheduledAt.value).getTime() <= Date.now())) {
            editorStatus.textContent = "موعد النشر المحدد غير صالح أو ليس في المستقبل. اتركه فارغًا للنشر الفوري أو اختر موعدًا لاحقًا.";
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
            tags: editForm.elements.tags.value.split(/[،,\n]+|(?=#)/).map(tag => tag.trim()).filter(Boolean),
            seoTitle: editForm.elements.seoTitle.value.trim(),
            seoDescription: editForm.elements.seoDescription.value.trim(),
            seoKeywords: editForm.elements.seoKeywords.value.trim(),
            canonicalUrl: editForm.elements.canonicalUrl.value.trim(),
            ogImage: editForm.elements.ogImage.value.trim(),
            scheduledAt: editForm.elements.scheduledAt.value ? new Date(editForm.elements.scheduledAt.value).toISOString() : null
          };
          let saveResponseStatus = 0;
          try {
            const response = await fetch("/api/articles", {
              method:"POST",
              headers:{"Content-Type":"application/json","Accept":"application/json"},
              credentials:"same-origin",
              body:JSON.stringify({action:"save",article}),
              cache:"no-store"
            });
            saveResponseStatus = response.status;
            const result = await response.json().catch(()=>({}));
            if (!response.ok || !result.ok) {
              if (response.status === 401) { adminAuthenticated = false; throw new Error("انتهت جلسة المالك. سجّل الدخول مجددًا بحساب GitHub alabqry55."); }
              if (response.status === 409) throw new Error(result.error || "هذا العنوان موجود بالفعل؛ لم يتم إنشاء نسخة مكررة.");
              const detail = result.error || ("فشل الحفظ (HTTP "+response.status+").");
              throw new Error(result.requestId ? detail + " رقم التتبع: " + result.requestId : detail);
            }
            editorStatus.textContent = "تم تأكيد الحفظ السحابي. جارٍ إعادة تحميل القائمة من قاعدة البيانات...";
            const refreshed = await fetch("/api/articles", {headers:{"Accept":"application/json"},credentials:"same-origin",cache:"no-store"});
            const refreshedData = await refreshed.json().catch(()=>({}));
            if (!refreshed.ok || !refreshedData.admin || !Array.isArray(refreshedData.articles)) {
              throw new Error("تم إرسال الحفظ، لكن تعذر تأكيد القائمة المحدثة. أعد تحميل الإدارة للتحقق.");
            }
            articles = filterUniqueArticles(refreshedData.articles);
            editForm.hidden = true;
            render();
            editorStatus.textContent = creatingArticle ? (article.scheduledAt ? "تم حفظ المقال وجدولة نشره سحابيًا." : "تم حفظ المقال الجديد ونشره فورًا، مع تأكيد الحفظ في قاعدة البيانات.") : "تم حفظ المقال وتأكيد بياناته السحابية.";
          } catch (error) {
            // A failed response does not prove that D1 rejected the write. Read the row back
            // before reporting failure, so a committed save is not needlessly submitted again.
            if ((saveResponseStatus >= 500 || error instanceof TypeError ||
                 String(error?.message || "").includes("تعذر تأكيد القائمة المحدثة")) && adminAuthenticated) {
              try {
                const checkResponse = await fetch("/api/articles", {
                  headers:{"Accept":"application/json"},
                  credentials:"same-origin",
                  cache:"no-store"
                });
                const checkData = await checkResponse.json().catch(()=>({}));
                const confirmed = checkResponse.ok && checkData.admin === true &&
                  Array.isArray(checkData.articles) && checkData.articles.some(saved =>
                    String(saved.id) === String(article.id) &&
                    saved.title === article.title &&
                    saved.category === article.category &&
                    saved.date === article.date &&
                    saved.excerpt === article.excerpt &&
                    saved.content === article.content &&
                    (saved.scheduled_at || null) === (article.scheduledAt || null)
                  );
                if (confirmed) {
                  articles = filterUniqueArticles(checkData.articles);
                  editForm.hidden = true;
                  render();
                  editorStatus.textContent = "تم العثور على المقال في قاعدة البيانات والتحقق من بياناته بعد تعذر تأكيد استجابة الحفظ.";
                  return;
                }
              } catch (_) {
                // Preserve the original save error when read-back is unavailable.
              }
            }
            editorStatus.textContent = error?.message || "تعذر تأكيد الحفظ السحابي.";
          } finally {
            saveButton.disabled = false;
            saveButton.textContent = "حفظ التعديلات";
          }
        });

        // All article-list search controls have been removed.
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
        fallbackAdminButton.addEventListener("click", () => { window.location.assign("/api/admin/github/login"); });
      });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
// Production redeploy trigger: preserve behavior; verify Cloudflare Pages publishes main.
