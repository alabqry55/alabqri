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
        const activationButton = Array.from(document.querySelectorAll("button")).find(button => (button.textContent || "").trim() === "تفعيل أدوات الإدارة");
        if (activationButton) activationButton.click();
        else window.location.assign("/api/admin/github/login");
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
    .abq-articles-library{direction:rtl;text-align:right;margin:1rem 0;width:100%;max-width:none;min-width:0;box-sizing:border-box;font-family:inherit}
    .abq-library-intro{display:block;margin:2px 0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;outline:0!important;line-height:1.9;font-size:1rem;color:#24352d;white-space:pre-line}#abq-unified-4way-nav .abq-unified-core img{pointer-events:none!important;cursor:default!important}
    .abq-library-sections{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:.8rem;margin:1rem 0}
    /* One shared outer frame encloses the seven individually framed library sections. */
    .abq-articles-library .abq-library-sections{border:2px solid #2563eb; border-radius:18px; padding:12px; box-sizing:border-box;}
    .abq-library-section{display:flex;flex-direction:column;align-items:flex-start;gap:.35rem;min-height:112px;padding:1rem;border:1px solid #d8e2dc;border-radius:15px;background:#fff;color:#173b2d;text-align:right;font:inherit;cursor:pointer;transition:border-color .15s,background .15s}
    .abq-library-section:hover,.abq-library-section[aria-pressed="true"]{border-color:#b88a2b;background:#fbfaf5}
    .abq-library-section:disabled{cursor:default;opacity:.68}
    .abq-library-section strong{font-size:1rem;line-height:1.7}
    .abq-library-section small{color:#64748b;line-height:1.6}
    .abq-articles-tools{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:.65rem;margin:1rem 0}
    .abq-articles-tools input,.abq-articles-tools select{box-sizing:border-box;width:100%;min-width:0;padding:.75rem .85rem;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#172033;font:inherit}
    .abq-articles-status{padding:1rem;border:1px solid #dbe3ee;border-radius:14px;background:#f8fafc;color:#334155;line-height:1.8}
    .abq-articles-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));gap:1rem}
    .abq-article-card{min-width:0;padding:1rem;border:1px solid #d6e0ec;border-radius:16px;background:#fff;box-shadow:0 3px 12px #0f172a0a;color:#172033}
    .abq-article-card.is-expanded{grid-column:1 / -1;width:100%;max-width:none;box-sizing:border-box}
    .abq-article-card.is-expanded .abq-article-content{width:100%;max-width:none;box-sizing:border-box}
    .abq-reader-back{display:inline-flex;align-items:center;justify-content:center;margin-top:1rem;padding:.65rem 1rem;border:2px solid #2563eb;border-radius:10px;background:#fff;color:#173b2d;font:inherit;font-weight:700;cursor:pointer}
    .abq-article-card h3{font-size:1.08rem;line-height:1.7;margin:0 0 .5rem}
    .abq-article-meta{font-size:.82rem;color:#64748b;margin:.3rem 0 .65rem}
    .abq-article-excerpt{line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere}
    .abq-article-content{margin-top:.8rem;padding-top:.8rem;border-top:1px solid #e2e8f0;line-height:1.95;white-space:pre-wrap;overflow-wrap:anywhere}
    .abq-article-card details>summary{cursor:pointer;margin-top:.8rem;font-weight:700;color:#075985}
    .abq-library-section{position:relative;min-height:118px;box-shadow:0 3px 12px #0f172a08}
    .abq-library-section>span:first-child{font-size:1.35rem}
    .abq-library-section:focus-visible,.abq-admin-button:focus-visible,.abq-editor-action:focus-visible{outline:3px solid #b88a2b;outline-offset:3px}
    .abq-admin-bar{display:flex;align-items:stretch;gap:.65rem;flex-wrap:wrap;padding:.85rem;border:1px solid #d9e3dc;border-radius:16px;background:#fbfcfa}
    .abq-admin-trigger-pair{display:flex;align-items:stretch;gap:.65rem;flex-wrap:wrap;margin:.85rem 0;direction:rtl}
    .abq-admin-trigger-pair>*{flex:0 1 auto}
    @media(max-width:560px){.abq-admin-trigger-pair>*{flex:1 1 100%;width:100%}}
    .abq-admin-button,.abq-editor-action{padding:.75rem 1rem;border:1px solid #b88a2b;border-radius:12px;background:#fff;color:#173b2d;font:inherit;font-weight:700;cursor:pointer}
    .abq-admin-button-primary,.abq-editor-action-primary{background:#173b2d;color:#fff;border-color:#173b2d}
    .abq-admin-button-danger{border-color:#e2b8b8;color:#9f2727}
    .abq-admin-login{margin:1rem 0;padding:1.25rem;border:1px solid #d9e3dc;border-right:4px solid #b88a2b;border-radius:18px;background:linear-gradient(135deg,#fbfcfa,#f5f8f5);color:#24352d;text-align:center}
    .abq-admin-login[hidden]{display:none}
    .abq-admin-login-icon{display:grid;place-items:center;width:56px;height:56px;margin:0 auto .65rem;border-radius:50%;background:#e9f0eb;font-size:1.6rem}
    .abq-admin-login h3,.abq-editor-section-title{margin:.35rem 0 .6rem;color:#173b2d;line-height:1.7}
    .abq-admin-login p{line-height:1.9;color:#64748b}
    .abq-admin-login-actions,.abq-editor-actions{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.9rem}
    .abq-editor-form{border-color:#d9e3dc;border-radius:18px;padding:1.2rem}
    .abq-editor-section-title{padding:.55rem .75rem;border-right:3px solid #b88a2b;border-radius:8px;background:#f7f9f6;font-size:1rem}
    .abq-editor-field{display:block;margin:.75rem 0;font-weight:700;color:#24352d}
    .abq-editor-control,.abq-editor-field input,.abq-editor-field textarea,.abq-editor-field select{display:block;box-sizing:border-box;width:100%;margin-top:.4rem;padding:.8rem .9rem;border:1px solid #cbd5e1;border-radius:11px;background:#fff;color:#172033;font:inherit;line-height:1.8}
    .abq-editor-field input:focus,.abq-editor-field textarea:focus,.abq-editor-field select:focus{outline:2px solid #b88a2b;outline-offset:1px;border-color:#b88a2b}
    .abq-editor-status{padding:.7rem .85rem;border-radius:10px;background:#f8fafc;line-height:1.9}
    .abq-editor-intro{margin:.2rem 0 1rem;padding:.8rem 1rem;border:1px solid #e3e9e3;border-radius:12px;background:#fbfcfa;color:#52645a;line-height:1.85}
    .abq-editor-section-help{margin:-.25rem 0 .65rem;color:#64748b;font-size:.9rem;line-height:1.8}
    .abq-editor-form>h3{font-size:1.25rem;color:#173b2d;margin:.1rem 0 .6rem;line-height:1.7}
    .abq-admin-login .abq-admin-login-status{margin:.8rem 0 0;padding:.65rem .8rem;border-radius:10px;background:#fff8e8;color:#76551b;line-height:1.8}
    .abq-admin-workspace{margin:1rem 0;padding:1rem;border:1px solid #d9e3dc;border-radius:18px;background:#fff}
    .abq-workspace-nav{display:flex;gap:.55rem;flex-wrap:wrap;margin-bottom:1rem}
    .abq-workspace-tab{padding:.65rem .85rem;border:1px solid #d9e3dc;border-radius:10px;background:#fbfcfa;color:#173b2d;font:inherit;font-weight:700;cursor:pointer}
    .abq-workspace-tab[aria-pressed="true"]{background:#173b2d;border-color:#173b2d;color:#fff}
    .abq-workspace-panel{display:grid;gap:.75rem}
    .abq-workspace-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:.7rem}
    .abq-workspace-stat,.abq-workspace-item{padding:.85rem;border:1px solid #e1e8e2;border-radius:12px;background:#fbfcfa;min-width:0}
    .abq-workspace-stat strong{display:block;font-size:1.35rem;color:#173b2d}
    .abq-workspace-item h4{margin:0 0 .35rem;color:#173b2d;line-height:1.7}
    .abq-workspace-item p{margin:.25rem 0;line-height:1.8;overflow-wrap:anywhere}
    .abq-workspace-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.6rem}
    .abq-workspace-note{padding:.75rem;border-right:3px solid #b88a2b;background:#fbfaf5;border-radius:8px;line-height:1.85}
    .abq-workspace-preview{padding:1rem;border:1px solid #d9e3dc;border-radius:14px;background:#fff;line-height:2;white-space:pre-wrap;overflow-wrap:anywhere}
    @media(max-width:560px){.abq-workspace-tab{width:100%;text-align:right}.abq-admin-workspace{padding:.75rem}}
    @media(max-width:560px){.abq-articles-tools{grid-template-columns:1fr}.abq-library-section{min-height:92px}.abq-admin-bar>*{width:100%}.abq-editor-form{padding:.9rem}}

    /* Unified approved blue frame for every boxed control and content panel in the library tab. */
    .abq-articles-library .abq-library-section,
    .abq-articles-library .abq-articles-tools input,
    .abq-articles-library .abq-articles-tools select,
    .abq-articles-library .abq-articles-status,
    .abq-articles-library .abq-article-card,
    .abq-articles-library .abq-article-content,
    .abq-articles-library .abq-admin-bar,
    .abq-articles-library .abq-admin-button,
    .abq-articles-library .abq-admin-login,
    .abq-articles-library .abq-admin-login-icon,
    .abq-articles-library .abq-admin-login-status,
    .abq-articles-library .abq-admin-workspace,
    .abq-articles-library .abq-workspace-tab,
    .abq-articles-library .abq-workspace-stat,
    .abq-articles-library .abq-workspace-item,
    .abq-articles-library .abq-workspace-note,
    .abq-articles-library .abq-workspace-preview,
    .abq-articles-library .abq-editor-form,
    .abq-articles-library .abq-editor-action,
    .abq-articles-library .abq-editor-control,
    .abq-articles-library .abq-editor-field input,
    .abq-articles-library .abq-editor-field textarea,
    .abq-articles-library .abq-editor-field select,
    .abq-articles-library .abq-editor-section-title,
    .abq-articles-library .abq-editor-intro,
    .abq-articles-library .abq-editor-status {
      border: 2px solid #2563eb !important;
    }
  `;
  function renameLibraryNavigationTab() {
    const targetSelectors = [
      'nav a[href="#articles"]',
      'nav button[aria-controls="articles"]',
      'nav [role="tab"][aria-controls="articles"]',
      'nav [data-target="#articles"]',
      'nav [data-bs-target="#articles"]',
      'nav [onclick*="articles"]'
    ];
    let tab = targetSelectors.flatMap(selector => Array.from(document.querySelectorAll(selector)))[0] || null;
    if (!tab) {
      tab = Array.from(document.querySelectorAll("nav a, nav button, nav [role='tab']")).find(node => {
        const label = (node.textContent || "").replace(/\\s+/g, " ").trim();
        return label.includes("أحدث المقالات والأبحاث") ||
          label.includes("المقالات والأبحاث") ||
          label.includes("إدارة محتوى المقالات");
      }) || null;
    }
    const coursesTab = document.querySelector('.nav-btn[onclick*="courses"]');
    const coursesIcon = coursesTab?.querySelector(".abq-tab-icon");
    if (coursesIcon) coursesIcon.textContent = "🧠";
    if (!tab) return false;
    const libraryIcon = tab.querySelector(".abq-tab-icon");
    const libraryLabel = tab.querySelector(".abq-tab-label");
    if (libraryIcon && libraryLabel) {
      libraryIcon.textContent = "📚";
      libraryLabel.textContent = "مكتبة وأبحاث العبقري";
    } else {
      tab.textContent = "📚 مكتبة وأبحاث العبقري";
    }
    tab.setAttribute("aria-label", "📚 مكتبة وأبحاث العبقري");
    return true;
  }

  function init() {
    if (window.__abqArticlesLibraryInitialized) return;
    renameLibraryNavigationTab();
    const articleTab = document.getElementById("articles");
    if (!articleTab) return;
    // Give the library's visible page heading the approved public identity and
    // remove only its obsolete one-line explainer; keep all article content intact.
    const normalizeLibraryLabel = value => String(value || "").replace(/[\\u200B-\\u200F\\uFEFF]/g, " ").replace(/\\s+/g, " ").trim();
    let libraryHeadingUpdated = false;
    let libraryIntroUpdated = false;
    const applyLibraryPageIdentity = () => {
      // Remove the retired explanatory sentence without disturbing surrounding library content.
      const obsoleteExplainer = "مساحة مستقلة لعرض المقالات والأبحاث والموضوعات المعرفية، مع إمكانية فتح المحتوى الكامل من خلال زر «اقرأ».";
      Array.from(articleTab.querySelectorAll("p,small,span,div"))
        .filter(node => normalizeLibraryLabel(node.textContent) === normalizeLibraryLabel(obsoleteExplainer))
        .sort((a,b) => a.querySelectorAll("*").length - b.querySelectorAll("*").length)
        .forEach(node => node.remove());
      // Match the visible title by its text, even if the page shell uses a div/span
      // rather than a semantic heading element.
      if (!libraryHeadingUpdated) {
        const headingCandidates = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6,[role='heading'],p,div,span,strong"))
          .filter(node => {
            const label = normalizeLibraryLabel(node.textContent);
            return label.includes("المكتبة المعرفية") && label.length <= 80;
          })
          .sort((a,b) => normalizeLibraryLabel(a.textContent).length - normalizeLibraryLabel(b.textContent).length);
        const heading = headingCandidates[0];
        if (heading) {
          heading.textContent = "📚 مكتبة وأبحاث العبقري";
          libraryHeadingUpdated = true;
        } else {
          libraryHeadingUpdated = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6,[role='heading'],p,div,span,strong"))
            .some(node => normalizeLibraryLabel(node.textContent) === "📚 مكتبة وأبحاث العبقري");
        }
      }

      // Build the library introduction directly in the rendered library container.
      // Do not depend on the course-tab reference paragraph: it may not exist when
      // the library mounts, which previously prevented the bold treatment from running.
      let intro = Array.from(document.querySelectorAll(".abq-library-intro"))
        .find(node => node.closest("#articles") || node.closest("[id='articles']"))
        || document.querySelector(".abq-library-intro")
        || null;

      // Some page builds do not include the intro node in the initial HTML.
      // Create it inside the articles tab at the same position as the reference
      // preview, so the typography treatment always targets a real rendered node.
      if (!intro) {
        intro = document.createElement("div");
        intro.className = "abq-library-intro";
        const librarySectionHeading = Array.from(articleTab.querySelectorAll("h1,h2,h3,h4,h5,h6"))
          .find(node => normalizeLibraryLabel(node.textContent).includes(headingText));
        if (librarySectionHeading?.parentNode) {
          librarySectionHeading.parentNode.insertBefore(intro, librarySectionHeading);
        } else {
          articleTab.prepend(intro);
        }
      }

      if (intro) {
        const paragraphs = [
          "صرحٌ معرفي يجمع المقالات والأبحاث والدراسات في مختلف التخصصات، ضمن منظومة علمية منظمة تُيسّر الوصول إلى المعرفة وتُثري الفكر وتدعم التعلم المستمر.",
          "هنا تلتقي أصالة المعرفة بمنهجية البحث؛ لنقدّم محتوى هادفًا، منظمًا، ومتعدد المجالات، يُعين القارئ على الفهم والاطلاع، ويجعل من العلم والمعرفة أساسًا للوعي والتطوير.",
          "إعداد وتطوير: مركز العبقري للتدريب والإستشارات • تحت إشراف: د. أحمد السيد رَسَّه (أحمد الزمخشري)"
        ];
        const currentText = normalizeLibraryLabel(intro.textContent);
        const expectedText = paragraphs.map(normalizeLibraryLabel).join("");
        if (currentText !== expectedText) {
          intro.replaceChildren(...paragraphs.map((value, index) => {
            const paragraph = document.createElement("p");
            paragraph.textContent = value;
            paragraph.style.margin = index === 0 ? "0" : "2px 0 0";
            return paragraph;
          }));
        }
        intro.style.background = "transparent";
        intro.style.border = "0";
        intro.style.borderRadius = "0";
        intro.style.boxShadow = "none";
        intro.style.padding = "0";
        intro.style.whiteSpace = "pre-line";
        intro.style.setProperty("font-weight", "700", "important");
        intro.querySelectorAll("p, p *").forEach(node => {
          node.style.setProperty("font-weight", "700", "important");
        });
        intro.querySelectorAll(":scope > p").forEach(paragraph => {
          paragraph.style.setProperty("font-weight", "700", "important");
          paragraph.style.whiteSpace = "pre-line";
          paragraph.style.background = "transparent";
          paragraph.style.border = "0";
          paragraph.style.boxShadow = "none";
        });
        libraryIntroUpdated = true;
      } else {
        libraryIntroUpdated = false;
      }
      return libraryHeadingUpdated && libraryIntroUpdated;
    };
    applyLibraryPageIdentity();
    const libraryIdentityObserver = new MutationObserver(() => {
      if (applyLibraryPageIdentity()) libraryIdentityObserver.disconnect();
    });
    libraryIdentityObserver.observe(document.documentElement, {childList:true,subtree:true});

    // Reuse the existing article-list position instead of aborting initialization.
    // The legacy list stays visible until the API responds successfully; then the
    // new seven-section renderer replaces only that list container (not the admin UI).
    const legacyArticleList = articleTab.querySelector("#abq-articles-list");
    const headingScope = articleTab;
    const heading = Array.from(headingScope.querySelectorAll("h1,h2,h3,h4")).find(el =>
      (el.textContent || "").replace(/\s+/g, " ").trim().includes(headingText)
    );
    if (!heading) return;
    const section = heading.closest("section") || heading.parentElement;    if (!section) return;
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
    heading.remove();
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
      .then(async data => {
        if (!data || !Array.isArray(data.articles)) throw new Error("Invalid articles response");
        // Taxonomy is an independent read-only source. If it is not installed yet,
        // preserve the existing legacy-category library instead of hiding articles.
        let taxonomy = null;
        try {
          const taxonomyResponse = await fetch("/api/library/taxonomy", {
            headers: { "Accept": "application/json" },
            credentials: "same-origin",
            cache: "no-store"
          });
          if (taxonomyResponse.ok) {
            const candidate = await taxonomyResponse.json();
            if (candidate?.available === true &&
                Array.isArray(candidate.sections) &&
                Array.isArray(candidate.specialties) &&
                Array.isArray(candidate.contentTypes) &&
                Array.isArray(candidate.classifications)) taxonomy = candidate;
          }
        } catch (_) { /* retain the legacy-compatible renderer */ }
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
        const legacySectionDefinitions = [
          {id:"quran",title:"القرآن الكريم وعلومه",icon:"📖",description:"القرآن والتدبر والتفسير وعلومه",category:"القرآن الكريم وعلومه"},
          {id:"hadith",title:"الحديث الشريف وعلومه",icon:"📜",description:"السنة النبوية والحديث الشريف وعلومه",category:"الحديث الشريف وعلومه"},
          {id:"dhikr-balance",title:"الذكر والإتزان الإيماني",icon:"📿",description:"الأذكار والأدعية والاتزان الإيماني",category:"الأذكار والاتزان"},
          {id:"islamic-psychology-development",title:"علم النفس الإسلامي والتنمية البشرية",icon:"🧠",description:"النفس والشخصية والمهارات الإنسانية",category:"التنمية البشرية"},
          {id:"complementary-health",title:"الطب التكميلي والتوعية الصحية",icon:"🌱",description:"الممارسات التكميلية والمعرفة الصحية",category:"الطب التكميلي"},
          {id:"research-studies",title:"الأبحاث والدراسات",icon:"🔬",description:"الدراسات والتحليل العلمي",category:"البحث العلمي"},
          {id:"knowledge-thought",title:"المعرفة والفكر",icon:"📚",description:"موضوعات معرفية وفكرية متنوعة",category:"موضوعات معرفية"}
        ];
        const legacySectionById = new Map(legacySectionDefinitions.map(section => [section.id, section]));
        const librarySections = taxonomy
          ? taxonomy.sections.filter(section => section.active !== 0).map(section => {
              const legacy = legacySectionById.get(String(section.id)) || {};
              return {
                id: String(section.id),
                title: String(section.name || legacy.title || section.id).replace(/^\s*03\s+/, "").replace(/^📿\s*/, "").replace(/📿/g, "").trim(),
                icon: legacy.icon || "📚",
                description: legacy.description || "مواد معرفية ضمن هذا القسم",
                category: legacy.category || ""
              };
            })
          : legacySectionDefinitions;
        const classificationsByArticle = new Map(
          (taxonomy?.classifications || []).map(item => [String(item.article_id), item])
        );
        const legacySectionByCategory = new Map(
          legacySectionDefinitions.map(section => [section.category, section.id])
        );
        const sectionForArticle = article => {
          const classification = classificationsByArticle.get(String(article.id));
          if (classification?.primary_section_id) return String(classification.primary_section_id);
          return legacySectionByCategory.get(String(article.category || "")) || "";
        };
        const specialtyNames = new Map((taxonomy?.specialties || []).map(item => [String(item.id), String(item.name || item.id)]));
        const contentTypeNames = new Map((taxonomy?.contentTypes || []).map(item => [String(item.id), String(item.name || item.id)]));
        let selectedSectionId = "";
        let selectedSpecialtyId = "";
        let selectedContentTypeId = "";

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
        librarySections.forEach(section => {          const option = el("option","",section.icon + " " + section.title);
          option.value = section.id;
          categorySelect.appendChild(option);
        });
        const specialtySelect = el("select");
        specialtySelect.setAttribute("aria-label","تصفية حسب التخصص");
        specialtySelect.appendChild(el("option","","جميع التخصصات"));
        specialtySelect.options[0].value = "";
        const contentTypeSelect = el("select");
        contentTypeSelect.setAttribute("aria-label","تصفية حسب نوع المادة");
        contentTypeSelect.appendChild(el("option","","جميع أنواع المواد"));
        contentTypeSelect.options[0].value = "";
        if (taxonomy) {
          taxonomy.specialties.filter(item => item.active !== 0).forEach(item => {
            const option = el("option","",item.name);
            option.value = item.id;
            specialtySelect.appendChild(option);
          });
          taxonomy.contentTypes.filter(item => item.active !== 0).forEach(item => {
            const option = el("option","",item.name);
            option.value = item.id;
            contentTypeSelect.appendChild(option);
          });
          tools.append(searchInput,categorySelect,specialtySelect,contentTypeSelect);
        } else {
          specialtySelect.hidden = true;
          contentTypeSelect.hidden = true;
          tools.append(searchInput,categorySelect);
        }
        const grid = el("div", "abq-articles-grid");
        const count = el("p", "abq-article-meta", "");
        root.append(sectionGrid,tools,count,grid);

        function renderSections() {
          sectionGrid.replaceChildren();
          librarySections.forEach(section => {
            const total = articles.filter(article => sectionForArticle(article) === section.id).length;
            const button = el("button","abq-library-section");
            button.type = "button";
            button.setAttribute("aria-pressed",String(selectedSectionId === section.id));
            button.append(el("span","",section.icon),el("strong","",String(librarySections.indexOf(section) + 1).padStart(2, "0") + " " + section.title),
              el("small","",section.description + " • عدد المواد: " + total));
            button.addEventListener("click",() => {
              selectedSectionId = selectedSectionId === section.id ? "" : section.id;
              categorySelect.value = selectedSectionId;
              render();
            });
            sectionGrid.appendChild(button);
          });
        }

        function render() {
          renderSections();
          renderAdminWorkspace();
          if (taxonomy) {
            const availableSpecialties = taxonomy.specialties.filter(item =>
              item.active !== 0 && (!selectedSectionId || String(item.primary_section_id) === selectedSectionId)
            );
            specialtySelect.replaceChildren(el("option","","جميع التخصصات"));
            specialtySelect.options[0].value = "";
            availableSpecialties.forEach(item => {
              const option = el("option","",item.name);
              option.value = item.id;
              specialtySelect.appendChild(option);
            });
            if (!availableSpecialties.some(item => String(item.id) === selectedSpecialtyId)) {
              selectedSpecialtyId = "";
            }
            specialtySelect.value = selectedSpecialtyId;
          }
          const query = searchInput.value.trim().toLocaleLowerCase("ar");
          const visible = articles.filter(article => {
            const classification = classificationsByArticle.get(String(article.id));
            const sectionMatch = !selectedSectionId || sectionForArticle(article) === selectedSectionId;
            const specialtyMatch = !selectedSpecialtyId || String(classification?.primary_specialty_id || "") === selectedSpecialtyId;
            const contentTypeMatch = !selectedContentTypeId || String(classification?.content_type_id || "") === selectedContentTypeId;
            const haystack = [article.title,article.excerpt,article.content,article.category,...(Array.isArray(article.tags)?article.tags:[])].join(" ").toLocaleLowerCase("ar");
            return sectionMatch && specialtyMatch && contentTypeMatch && (!query || haystack.includes(query));
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
            const classification = classificationsByArticle.get(String(a.id));
            const sectionName = librarySections.find(section => section.id === sectionForArticle(a))?.title || a.category;
            const specialtyName = specialtyNames.get(String(classification?.primary_specialty_id || ""));
            const contentTypeName = contentTypeNames.get(String(classification?.content_type_id || ""));
            const meta = [sectionName, specialtyName, contentTypeName, a.date].filter(Boolean).join(" • ");
            if (meta) card.appendChild(el("p", "abq-article-meta", meta));
            if (Array.isArray(a.tags) && a.tags.length) card.appendChild(el("p", "abq-article-meta", a.tags.join(" • ")));
            if (adminMode && a.scheduled_at) {
              const publishDate = new Date(a.scheduled_at);
              card.appendChild(el("p", "abq-article-meta", "موعد النشر: " + (Number.isNaN(publishDate.getTime()) ? a.scheduled_at : publishDate.toLocaleString("ar-EG", {timeZone:"Africa/Cairo"}))));
            }
            if (a.excerpt) card.appendChild(el("p", "abq-article-excerpt", a.excerpt));
            const details = el("details");
            const summary = el("summary", "", "قراءة البحث");
            details.appendChild(summary);
            details.appendChild(el("div", "abq-article-content", a.content));
            const backButton = el("button", "abq-reader-back", "العودة إلى قائمة الأبحاث");
            backButton.type = "button";
            backButton.addEventListener("click", () => { details.open = false; summary.focus(); });
            details.appendChild(backButton);
            details.addEventListener("toggle", () => {
              if (details.open) {
                grid.querySelectorAll("details[open]").forEach(openDetails => {
                  if (openDetails === details) return;
                  openDetails.open = false;
                  openDetails.closest(".abq-article-card")?.classList.remove("is-expanded");
                });
                card.classList.add("is-expanded");
                summary.textContent = "إغلاق البحث";
              } else {
                card.classList.remove("is-expanded");
                summary.textContent = "قراءة البحث";
              }
            });
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
        categorySelect.addEventListener("change",() => { selectedSectionId = categorySelect.value; render(); });
        specialtySelect.addEventListener("change",() => { selectedSpecialtyId = specialtySelect.value; render(); });
        contentTypeSelect.addEventListener("change",() => { selectedContentTypeId = contentTypeSelect.value; render(); });

        // Owner authorization is verified server-side through the signed GitHub OAuth session.
        let adminAuthenticated = Boolean(initiallyAdmin);
        let adminMode = false;
        const adminBar = el("div", "abq-admin-bar");
        const adminButton = el("button", "abq-admin-button", "تفعيل أدوات الإدارة");
        adminButton.type = "button";
        const addButton = el("button", "abq-admin-button abq-admin-button-primary", "إضافة مقال أو بحث");
        const logoutButton = el("button", "abq-admin-button abq-admin-button-danger", "تسجيل الخروج");
        logoutButton.type = "button";
        addButton.type = "button";
        adminButton.classList.add("abq-admin-button");
        addButton.classList.add("abq-admin-button-primary");
        logoutButton.classList.add("abq-admin-button-danger");
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

        // Keep the activation control beside the existing article-admin entry point.
        const adminTriggerPair = document.createElement("div");
        adminTriggerPair.className = "abq-admin-trigger-pair";
        adminTriggerPair.setAttribute("role", "group");
        adminTriggerPair.setAttribute("aria-label", "أدوات دخول وإدارة المقالات والأبحاث");
        function placeAdminActivationButton() {
          const trigger = Array.from(document.querySelectorAll("button,a,[role='button']")).find(node =>
            node !== adminButton && !adminTriggerPair.contains(node) &&
            [node.innerText, node.textContent, node.getAttribute("aria-label"), node.getAttribute("title")]
              .filter(Boolean).join(" ").replace(/[\\u200B-\\u200F\\uFEFF]/g, " ")
              .replace(/\\s+/g, " ").trim()
              .includes("لوحة تحكم المقالات والأبحاث") &&
            [node.innerText, node.textContent, node.getAttribute("aria-label"), node.getAttribute("title")]
              .filter(Boolean).join(" ").includes("إضافة ومراجعة")
          );
          if (!trigger || trigger.parentElement === adminTriggerPair) return Boolean(trigger);
          trigger.parentNode.insertBefore(adminTriggerPair, trigger);
          adminTriggerPair.append(trigger, adminButton);
          return true;
        }
        if (!placeAdminActivationButton()) {
          const adminTriggerObserver = new MutationObserver(() => {
            if (placeAdminActivationButton()) adminTriggerObserver.disconnect();
          });
          adminTriggerObserver.observe(document.body, {childList:true,subtree:true});
        }

        // Owner-only workspace views reuse the existing authenticated read/save API.
        // Taxonomy remains read-only here: the current save endpoint does not accept
        // specialty/content-type identifiers, so the UI must not imply those are saved.
        const adminWorkspace = el("section", "abq-admin-workspace");
        adminWorkspace.hidden = !adminMode;
        adminWorkspace.setAttribute("aria-label", "مراكز إدارة المكتبة");
        const workspaceNav = el("nav", "abq-workspace-nav");
        workspaceNav.setAttribute("aria-label", "أقسام إدارة المكتبة");
        const workspacePanel = el("div", "abq-workspace-panel");
        adminWorkspace.append(workspaceNav, workspacePanel);
        root.insertBefore(adminWorkspace, tools);
        const workspaceViews = [
          ["review","مراجعة المقالات والأبحاث"],
          ["schedule","إدارة النشر والجدولة"],
          ["taxonomy","التصنيفات والتخصصات"],
          ["seo","بيانات SEO والفهرسة"],
          ["preview","المعاينة والتحقق"]
        ];
        let activeWorkspace = "review";
        let previewArticleId = "";
        const workspaceTabs = new Map();
        workspaceViews.forEach(([key,label]) => {
          const tab = el("button", "abq-workspace-tab", label);
          tab.type = "button";
          tab.setAttribute("aria-pressed", String(key === activeWorkspace));
          tab.addEventListener("click", () => {
            activeWorkspace = key;
            workspaceTabs.forEach((button, buttonKey) => button.setAttribute("aria-pressed", String(buttonKey === key)));
            renderAdminWorkspace();
          });
          workspaceTabs.set(key, tab);
          workspaceNav.appendChild(tab);
        });
        const workspaceAction = (label, handler, primary=false) => {
          const button = el("button", primary ? "abq-editor-action abq-editor-action-primary" : "abq-editor-action", label);
          button.type = "button";
          button.addEventListener("click", handler);
          return button;
        };
        const workspaceDate = value => {
          const date = new Date(value);
          return Number.isNaN(date.getTime()) ? String(value || "غير محدد") : date.toLocaleString("ar-EG", {timeZone:"Africa/Cairo"});
        };
        function renderAdminWorkspace() {
          if (!adminMode || !adminAuthenticated) { adminWorkspace.hidden = true; return; }
          adminWorkspace.hidden = false;
          workspacePanel.replaceChildren();
          if (activeWorkspace === "review") {
            const scheduled = articles.filter(article => article.scheduled_at && Date.parse(article.scheduled_at) > Date.now()).length;
            const published = articles.length - scheduled;
            const stats = el("div", "abq-workspace-grid");
            [[articles.length,"إجمالي المواد"],[published,"مواد منشورة أو مستحقة"],[scheduled,"مواد مجدولة مستقبلًا"]].forEach(([value,label]) => {
              const item = el("div", "abq-workspace-stat");
              item.append(el("strong","",String(value)),el("span","",label));
              stats.appendChild(item);
            });
            workspacePanel.append(stats,el("p","abq-workspace-note","مركز مراجعة المحتوى يعرض حالة النشر المتاحة في النظام. لا توجد حاليًا حالة اعتماد تحريرية مستقلة؛ لذلك لن نعرض المسودات أو الموافقات كأنها حالات محفوظة."));
            articles.forEach(article => {
              const item = el("article","abq-workspace-item");
              item.append(el("h4","",article.title),el("p","abq-article-meta",article.scheduled_at && Date.parse(article.scheduled_at)>Date.now() ? "مجدول للنشر • "+workspaceDate(article.scheduled_at) : "منشور / مستحق للعرض"));
              item.append(el("p","",article.excerpt || "لا يوجد ملخص."));
              const actions=el("div","abq-workspace-actions");
              actions.append(workspaceAction("تحرير المادة",()=>startEditing(article),true),workspaceAction("فتح المعاينة",()=>{previewArticleId=String(article.id);activeWorkspace="preview";workspaceTabs.forEach((button,key)=>button.setAttribute("aria-pressed",String(key==="preview")));renderAdminWorkspace();}));
              item.appendChild(actions);workspacePanel.appendChild(item);
            });
            if (!articles.length) workspacePanel.appendChild(el("p","abq-articles-status","لا توجد مواد متاحة للمراجعة."));
          } else if (activeWorkspace === "schedule") {
            const scheduled = articles.filter(article => article.scheduled_at && Date.parse(article.scheduled_at)>Date.now()).sort((a,b)=>Date.parse(a.scheduled_at)-Date.parse(b.scheduled_at));
            workspacePanel.append(el("p","abq-workspace-note","إدارة المواعيد تستخدم حقل الجدولة الموجود بالفعل. يمكنك فتح المادة وتعديل موعدها؛ ترك الموعد فارغًا يعني النشر الفوري وفق مسار الحفظ الحالي."));
            if (!scheduled.length) workspacePanel.appendChild(el("p","abq-articles-status","لا توجد مواد مجدولة في المستقبل حاليًا."));
            scheduled.forEach(article=>{
              const item=el("article","abq-workspace-item");
              item.append(el("h4","",article.title),el("p","abq-article-meta","موعد النشر: "+workspaceDate(article.scheduled_at)));
              item.appendChild(workspaceAction("تعديل موعد النشر",()=>startEditing(article),true));
              workspacePanel.appendChild(item);
            });
          } else if (activeWorkspace === "taxonomy") {            workspacePanel.append(el("p","abq-workspace-note","عرض التصنيفات من واجهة القراءة فقط. لا يتم تعديل التخصص أو نوع المادة من هذه الشاشة؛ لأن مسار الحفظ الحالي لا يستقبل معرفاتهما، ولن نضيف واجهة توحي بحفظ غير مدعوم."));
            if (!taxonomy) { workspacePanel.appendChild(el("p","abq-articles-status","مصدر التصنيفات غير متاح في هذه البيئة؛ لم يتم إجراء أي تعديل على التصنيفات.")); return; }
            librarySections.forEach(section=>{
              const item=el("article","abq-workspace-item");
              const linked=(taxonomy.specialties||[]).filter(s=>String(s.primary_section_id)===String(section.id)&&s.active!==0);
              item.append(el("h4","",String(librarySections.indexOf(section)+1).padStart(2,"0")+" "+section.icon+" "+section.title));
              item.append(el("p","",linked.length ? "التخصصات: "+linked.map(s=>s.name).join("، ") : "لا توجد تخصصات نشطة معروضة لهذا القسم."));
              workspacePanel.appendChild(item);
            });
            const types=el("article","abq-workspace-item");
            types.append(el("h4","","أنواع المحتوى"),el("p","",(taxonomy.contentTypes||[]).filter(t=>t.active!==0).map(t=>t.name).join(" • ")||"لا توجد أنواع محتوى نشطة."));
            workspacePanel.appendChild(types);
          } else if (activeWorkspace === "seo") {
            workspacePanel.append(el("p","abq-workspace-note","مراجعة بيانات SEO المخزنة لكل مادة. هذه الشاشة لا تدّعي أن Google فهرس الصفحة؛ حالة الفهرسة الفعلية تُراجع من Search Console."));
            articles.forEach(article=>{
              const title=article.seo_title||article.seoTitle||article.title||"";
              const description=article.seo_description||article.seoDescription||article.excerpt||"";
              const canonical=article.canonical_url||article.canonicalUrl||"";
              const image=article.og_image||article.ogImage||"";
              const missing=[!title&&"عنوان SEO",!description&&"وصف SEO",!canonical&&"Canonical",!image&&"صورة المشاركة"].filter(Boolean);
              const item=el("article","abq-workspace-item");
              item.append(el("h4","",article.title),el("p","", "عنوان SEO: "+(title||"غير متوفر")),el("p","","وصف SEO: "+(description||"غير متوفر")),el("p","","Canonical: "+(canonical||"غير محدد")),el("p","","Open Graph: "+(image||"غير محدد")),el("p","abq-article-meta",missing.length?"يحتاج مراجعة: "+missing.join("، "):"الحقول الأساسية متوفرة."));
              item.appendChild(workspaceAction("تحرير بيانات SEO",()=>startEditing(article),true));
              workspacePanel.appendChild(item);
            });
          } else if (activeWorkspace === "preview") {
            const chosen=articles.find(article=>String(article.id)===previewArticleId)||articles[0];
            if (!chosen) { workspacePanel.appendChild(el("p","abq-articles-status","لا توجد مادة لمعاينتها.")); return; }
            previewArticleId=String(chosen.id);
            const picker=el("select","abq-editor-control");
            picker.setAttribute("aria-label","اختر مادة للمعاينة");
            articles.forEach(article=>{const option=el("option","",article.title);option.value=String(article.id);picker.appendChild(option);});
            picker.value=previewArticleId;
            picker.addEventListener("change",()=>{previewArticleId=picker.value;renderAdminWorkspace();});
            const preview=el("article","abq-workspace-preview");
            preview.append(el("h2","",chosen.title),el("p","abq-article-meta",[chosen.date,chosen.category].filter(Boolean).join(" • ")),el("p","",chosen.excerpt||""),el("div","",chosen.content||""));
            workspacePanel.append(picker,preview,el("p","abq-workspace-note","المعاينة داخل لوحة الإدارة ولا تنشر المادة أو تغيّر حالتها."));
            workspacePanel.appendChild(workspaceAction("تحرير المادة",()=>startEditing(chosen),true));
          }
        }

        const loginPanel = el("section", "abq-admin-login");
        loginPanel.hidden = true;
        loginPanel.setAttribute("aria-labelledby", "abq-admin-login-title");
        loginPanel.appendChild(el("div", "abq-admin-login-icon", "🔐"));
        loginPanel.appendChild(el("h3", "", "تفعيل أدوات الإدارة"));
        loginPanel.lastChild.id = "abq-admin-login-title";
        loginPanel.appendChild(el("p", "", "تسجيل الدخول بحساب GitHub المالك المعتمد فقط. يتم التحقق من الصلاحية على الخادم دون إدخال أو كشف أي مفتاح سري."));
        const loginActions = el("div", "abq-admin-login-actions");
        const githubLoginButton = el("button", "abq-admin-button abq-admin-button-primary", "المتابعة باستخدام GitHub");
        githubLoginButton.type = "button";
        githubLoginButton.addEventListener("click", () => window.location.assign("/api/admin/github/login"));
        const closeLoginButton = el("button", "abq-admin-button", "إغلاق");
        closeLoginButton.type = "button";
        closeLoginButton.addEventListener("click", () => { loginPanel.hidden = true; });
        loginActions.append(githubLoginButton, closeLoginButton);
        loginPanel.appendChild(loginActions);
        root.insertBefore(loginPanel, tools);

        const editForm = el("form", "abq-article-card abq-editor-form");
        editForm.hidden = true;
        editForm.style.margin = "1rem 0";
        editForm.setAttribute("aria-labelledby", "abq-editor-title");
        const field = (labelText, name, value, multiline=false) => {
          const wrap = el("label", "abq-editor-field");
          wrap.appendChild(el("span", "", labelText));
          const input = multiline ? el("textarea") : el("input");
          input.name = name;
          input.value = value || "";
          input.required = ["title","date","excerpt","content"].includes(name);
          input.className = "abq-editor-control";
          if (multiline) { input.rows = name === "content" ? 14 : 3; input.maxLength = name === "content" ? 200000 : (name === "seoDescription" ? 500 : (name === "seoKeywords" ? 1000 : 2000)); }
          else if (name === "date") input.maxLength = 80;
          else if (name === "title" || name === "seoTitle") input.maxLength = 240;
          else if (name === "tags") input.maxLength = 1600;
          else if (name === "canonicalUrl" || name === "ogImage") input.maxLength = 1000;
          wrap.appendChild(input);
          return wrap;
        };
        const editTitle = el("h3", "", "تعديل مقال");
        editTitle.id = "abq-editor-title";
        const editIntro = el("p", "abq-editor-intro", "أدخل بيانات المادة في مجموعات واضحة. راجع القسم وبيانات النشر والمحتوى وبيانات SEO قبل الحفظ؛ ولن تُعلن الواجهة نجاح الحفظ إلا بعد تأكيده من الخدمة.");
        const editId = el("input");
        editId.type = "hidden";
        editId.name = "id";
        const editCategoryWrap = el("label");
        editCategoryWrap.style.cssText = "display:block;margin:.7rem 0;font-weight:700";
        editCategoryWrap.className = "abq-editor-field";
        editCategoryWrap.appendChild(el("span", "", "القسم الرئيسي"));
        const editCategory = el("select");
        editCategory.name = "category";
        // Present all seven canonical library sections in administration while
        // preserving the existing stored category values for backward compatibility.
        // Quran and Hadith are new category values; legacy categories remain unchanged.
        librarySections.forEach((section, index) => {
          const number = String(index + 1).padStart(2, "0");
          const option = el("option", "", number + " " + section.icon + " " + section.title);
          option.value = section.category || section.title;
          editCategory.appendChild(option);
        });
        editCategory.classList.add("abq-editor-control");
        editCategoryWrap.appendChild(editCategory);
        const scheduleWrap = el("label");
        scheduleWrap.style.cssText = "display:block;margin:.7rem 0;font-weight:700";
        scheduleWrap.appendChild(el("span", "", "موعد النشر المجدول (بتوقيت جهازك / القاهرة)"));
        const scheduleInput = el("input");
        scheduleInput.type = "datetime-local";
        scheduleInput.name = "scheduledAt";
        scheduleInput.className = "abq-editor-control";
        scheduleWrap.appendChild(scheduleInput);
        editForm.append(editTitle, editId, editIntro,
          el("h4", "abq-editor-section-title", "أولًا: البيانات الأساسية"),
          el("p", "abq-editor-section-help", "حدد عنوانًا واضحًا واختر القسم الرئيسي الأنسب للمادة."),
          field("عنوان المقال أو البحث","title",""),
          editCategoryWrap,
          el("h4", "abq-editor-section-title", "ثانيًا: بيانات النشر"),
          el("p", "abq-editor-section-help", "احتفظ بتاريخ المادة الأصلي، واستخدم موعد الجدولة فقط إذا أردت نشرها لاحقًا."),
          field("التاريخ الأصلي الظاهر للمقال (لا يتغير تلقائيًا)","date",""),
          scheduleWrap,
          el("h4", "abq-editor-section-title", "ثالثًا: محتوى المادة"),
          el("p", "abq-editor-section-help", "اكتب ملخصًا مناسبًا ثم أدرج المحتوى الكامل مع تنظيم العناوين والفقرات."),
          field("الوصف المختصر","excerpt","",true),
          field("المحتوى الكامل","content","",true),
          el("h4", "abq-editor-section-title", "رابعًا: الوسوم وبيانات SEO"),
          el("p", "abq-editor-section-help", "أضف وسومًا دقيقة، وراجع عنوان SEO والوصف والكلمات المفتاحية والروابط الاختيارية."),
          field("الوسوم (افصل بينها بفاصلة)","tags",""),
          field("عنوان SEO","seoTitle",""),
          field("وصف SEO","seoDescription","",true),
          field("كلمات SEO المفتاحية","seoKeywords","",true),
          field("الرابط الأساسي Canonical URL (اختياري)","canonicalUrl",""),
          field("رابط صورة المشاركة Open Graph (اختياري)","ogImage",""));
        const editorActions = el("div");
        editorActions.className = "abq-editor-actions";
        const saveButton = el("button", "", "حفظ التعديلات");
        saveButton.type = "submit";
        saveButton.className = "abq-editor-action abq-editor-action-primary";
        const cancelButton = el("button", "", "إلغاء");
        cancelButton.type = "button";
        cancelButton.className = "abq-editor-action";
        editorActions.append(saveButton,cancelButton);
        const editorStatus = el("p", "abq-editor-status", "");
        editForm.append(editorActions,editorStatus);
        const adminStatus = el("p", "abq-article-meta", "");
        adminStatus.setAttribute("role", "status");
        adminStatus.style.cssText = "padding:.6rem .8rem;border-radius:10px;background:#f8fafc;line-height:1.8";
        function setAdminStatus(message) {
          adminStatus.textContent = message;
          editorStatus.textContent = message;
        }
        function showAdminLogin() {
          loginPanel.hidden = false;
          editForm.hidden = true;
          draftsPanel.hidden = true;
          loginPanel.scrollIntoView({behavior:"smooth",block:"center"});
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
          editTitle.textContent = "إضافة مقال أو بحث";
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
            if (!sessionResponse.ok || !session.admin || session.owner !== "alabqry55") { showAdminLogin(); return; }
            loginPanel.hidden = true;
            const response = await fetch("/api/articles", {headers:{"Accept":"application/json"},credentials:"same-origin",cache:"no-store"});
            const data = await response.json().catch(()=>({}));
            if (!response.ok || !Array.isArray(data.articles) || !data.admin) throw new Error(data.fallback ? "نسخة المعاينة لا تتصل بقاعدة D1 عبر binding باسم DB؛ لم يتم حفظ أو تغيير أي مقال." : (data.error || "تعذر تحميل المقالات المجدولة."));
            adminAuthenticated = true; articles = filterUniqueArticles(data.articles); adminMode = true;
            draftsPanel.hidden = false;
            addButton.hidden = false; logoutButton.hidden = false; adminWorkspace.hidden = false; render();
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
              const detail = result.error || ("فشل الحفظ (HTTP "+response.status+").");              throw new Error(result.requestId ? detail + " رقم التتبع: " + result.requestId : detail);
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

        const draftButton = el("button", "abq-editor-action", "حفظ كمسودة");
        draftButton.type = "button";
        draftButton.title = "يحفظ نسخة خاصة في مخزن المسودات دون نشرها أو تعديل المقالات المنشورة.";
        editorActions.insertBefore(draftButton, cancelButton);

        const draftsPanel = el("section", "abq-article-card");
        draftsPanel.style.margin = "1rem 0";
        const draftsHeading = el("h3", "", "المسودات الخاصة");
        const draftsHelp = el("p", "abq-editor-intro", "المسودات محفوظة في مخزن KV مستقل، ولا تظهر للزوار ولا تُنشر تلقائيًا.");
        const draftsSelect = el("select", "abq-editor-control");
        draftsSelect.setAttribute("aria-label", "اختر مسودة لاستعادتها");
        const draftsLoadButton = el("button", "abq-editor-action", "تحديث قائمة المسودات");
        draftsLoadButton.type = "button";
        const draftsRestoreButton = el("button", "abq-editor-action", "استعادة المسودة");
        draftsRestoreButton.type = "button";
        const draftsDeleteButton = el("button", "abq-editor-action", "حذف المسودة");
        draftsDeleteButton.type = "button";
        const draftsStatus = el("p", "abq-article-meta", "");
        draftsStatus.setAttribute("role", "status");
        const draftsActions = el("div", "abq-editor-actions");
        draftsActions.append(draftsLoadButton, draftsRestoreButton, draftsDeleteButton);
        draftsPanel.append(draftsHeading, draftsHelp, draftsSelect, draftsActions, draftsStatus);
        draftsPanel.hidden = !adminAuthenticated;
        root.insertBefore(draftsPanel, tools);
        let draftRecords = [];

        async function refreshDrafts() {
          if (!adminAuthenticated) throw new Error("سجّل الدخول بحساب GitHub المالك أولًا.");
          const response = await fetch("/api/admin/article-drafts", {
            headers: {"Accept":"application/json"},
            credentials: "same-origin",
            cache: "no-store"
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !Array.isArray(data.drafts)) {
            throw new Error(data.error || "تعذر تحميل المسودات. تحقق من ربط ARTICLE_DRAFTS في بيئة المعاينة.");
          }
          draftRecords = data.drafts;
          draftsSelect.replaceChildren();
          const placeholder = el("option", "", draftRecords.length ? "اختر مسودة محفوظة" : "لا توجد مسودات محفوظة");
          placeholder.value = "";
          draftsSelect.appendChild(placeholder);
          for (const record of draftRecords) {
            const option = el("option", "", (record.article?.title || "مسودة بلا عنوان") + " — " + new Date(record.updatedAt || Date.now()).toLocaleString("ar-EG"));
            option.value = record.id;
            draftsSelect.appendChild(option);
          }
          draftsStatus.textContent = "عدد المسودات المحفوظة: " + draftRecords.length;
        }

        draftsLoadButton.addEventListener("click", async () => {
          draftsLoadButton.disabled = true;
          try { await refreshDrafts(); }
          catch (error) { draftsStatus.textContent = error.message || "تعذر تحميل المسودات."; }
          finally { draftsLoadButton.disabled = false; }
        });

        draftsRestoreButton.addEventListener("click", () => {
          const record = draftRecords.find(item => item.id === draftsSelect.value);
          if (!record?.article) { draftsStatus.textContent = "اختر مسودة صالحة أولًا."; return; }
          const existsInLibrary = articles.some(item => String(item.id) === String(record.id));
          startEditing(record.article);
          creatingArticle = !existsInLibrary;
          editTitle.textContent = "استعادة مسودة: " + (record.article.title || "مسودة بلا عنوان");
          editorStatus.textContent = "تم تحميل المسودة إلى المحرر. لم يتم نشرها أو تعديل المقالات المنشورة.";
          draftsStatus.textContent = "تم تحميل المسودة إلى المحرر دون نشرها.";
        });

        draftsDeleteButton.addEventListener("click", async () => {
          const id = draftsSelect.value;
          if (!id) { draftsStatus.textContent = "اختر مسودة لحذفها أولًا."; return; }
          if (!window.confirm("هل تريد حذف هذه المسودة الخاصة نهائيًا؟ لن يؤثر ذلك على المقالات المنشورة.")) return;
          draftsDeleteButton.disabled = true;
          try {
            const response = await fetch("/api/admin/article-drafts", {
              method: "POST",
              headers: {"Content-Type":"application/json","Accept":"application/json"},
              credentials: "same-origin",
              body: JSON.stringify({action:"delete",id}),
              cache: "no-store"
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.deleted) throw new Error(result.error || "تعذر حذف المسودة.");
            await refreshDrafts();
            draftsStatus.textContent = "تم حذف المسودة من مخزنها المستقل.";
          } catch (error) {
            draftsStatus.textContent = error.message || "تعذر حذف المسودة.";
          } finally { draftsDeleteButton.disabled = false; }
        });

        draftButton.addEventListener("click", async () => {
          if (!adminAuthenticated) { editorStatus.textContent = "سجّل الدخول بحساب GitHub المالك أولًا."; return; }
          const draft = {
            id: editForm.elements.id.value,
            title: editForm.elements.title.value.trim(),
            category: editCategory.value,
            date: editForm.elements.date.value.trim(),
            excerpt: editForm.elements.excerpt.value.trim(),
            content: editForm.elements.content.value,
            tags: editForm.elements.tags.value.split(/[،,\\n]+|(?=#)/).map(tag => tag.trim()).filter(Boolean),
            seoTitle: editForm.elements.seoTitle.value.trim(),
            seoDescription: editForm.elements.seoDescription.value.trim(),
            seoKeywords: editForm.elements.seoKeywords.value.trim(),
            canonicalUrl: editForm.elements.canonicalUrl.value.trim(),
            ogImage: editForm.elements.ogImage.value.trim(),
            scheduledAt: editForm.elements.scheduledAt.value ? new Date(editForm.elements.scheduledAt.value).toISOString() : null
          };
          draftButton.disabled = true;
          draftButton.textContent = "جارٍ حفظ المسودة...";
          try {
            const response = await fetch("/api/admin/article-drafts", {
              method: "POST",
              headers: {"Content-Type":"application/json","Accept":"application/json"},
              credentials: "same-origin",
              body: JSON.stringify({action:"save",id:draft.id,draft}),
              cache: "no-store"
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.verified) throw new Error(result.error || "تعذر تأكيد حفظ المسودة.");
            await refreshDrafts();
            draftsSelect.value = draft.id;
            editorStatus.textContent = "تم حفظ المسودة والتحقق منها في مخزن KV المستقل. لم يتم نشرها ولم تتغير قاعدة المقالات.";
            draftsStatus.textContent = "المسودة محفوظة بأمان في المخزن المستقل.";
          } catch (error) {
            editorStatus.textContent = error.message || "تعذر حفظ المسودة.";
          } finally {
            draftButton.disabled = false;
            draftButton.textContent = "حفظ كمسودة";
          }
        });

        // All article-list search controls have been removed.
        render();
      })
      .catch(() => {
        showStatus("تعذر تحميل قائمة المقالات من الخدمة الآن. لم يتم حذف أي بيانات أو إجراء أي تعديل عليها.");
        const fallbackPanel = el("section", "abq-admin-login");
        fallbackPanel.setAttribute("aria-labelledby", "abq-library-fallback-title");
        fallbackPanel.appendChild(el("div", "abq-admin-login-icon", "🔐"));
        const fallbackTitle = el("h3", "", "تفعيل أدوات الإدارة");
        fallbackTitle.id = "abq-library-fallback-title";
        fallbackPanel.appendChild(fallbackTitle);
        fallbackPanel.appendChild(el("p", "", "يمكنك المتابعة عبر GitHub للتحقق من حساب المالك. إذا استمر تعذر تحميل المكتبة، فتحقق من اتصال خدمة المقالات قبل إجراء أي تعديل."));
        const fallbackStatus = el("p", "abq-admin-login-status", "حالة المكتبة: لم يكتمل التحميل؛ لم يتم حفظ أو حذف أي مادة.");
        fallbackStatus.setAttribute("role", "status");
        const fallbackAdminButton = el("button", "abq-admin-button abq-admin-button-primary", "المتابعة باستخدام GitHub");
        fallbackAdminButton.type = "button";
        fallbackAdminButton.addEventListener("click", () => { window.location.assign("/api/admin/github/login"); });
        const fallbackActions = el("div", "abq-admin-login-actions");
        fallbackActions.appendChild(fallbackAdminButton);
        fallbackPanel.append(fallbackStatus, fallbackActions);
        root.appendChild(fallbackPanel);
      });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
// Production redeploy trigger: preserve behavior; verify Cloudflare Pages publishes main.