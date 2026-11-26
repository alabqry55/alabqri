import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { onRequest as articlePage } from "../../functions/articles/[id].js";

function mockDb(row) {
  const statements=[];
  return {
    statements,
    prepare(sql) {
      statements.push(String(sql));
      return { bind(id) { assert.equal(id,row?.id || "missing"); return this; }, async first() { return row; } };
    }
  };
}

const baseArticle = {
  id:"raqya-001",
  title:"مفهوم الرقية الشرعية <script>alert(1)</script>",
  category:"القرآن الكريم وعلومه",
  date:"26/11/2026",
  excerpt:"تعريف بالرقية الشرعية & ضوابطها",
  content:"المحتوى الكامل\nالسطر الثاني <img src=x onerror=alert(1)>",
  scheduled_at:null,
  tags_json:'["الرقية_الشرعية","القرآن_الكريم"]',
  seo_title:"مفهوم الرقية الشرعية وأدلتها",
  seo_description:"تعرف على الضوابط الشرعية للرقية.",
  canonical_url:"",
  og_image:"https://alabqri.pages.dev/assets/og.png"
};

test("permalink renders a public article with stable canonical and social metadata", async () => {
  const db=mockDb({...baseArticle});
  const response=await articlePage({
    request:new Request("https://preview.alabqri.pages.dev/articles/raqya-001"),
    params:{id:"raqya-001"},
    env:{DB:db}
  });
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/<link rel="canonical" href="https:\/\/alabqri\.pages\.dev\/articles\/raqya-001">/);
  assert.match(html,/property="og:url" content="https:\/\/alabqri\.pages\.dev\/articles\/raqya-001"/);
  assert.match(html,/<title>مفهوم الرقية الشرعية وأدلتها<\/title>/);
  assert.match(html,/application\/ld\+json/);
  assert.match(html,/المحتوى الكامل/);
  assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);
  assert.doesNotMatch(html,/<img src=x onerror=alert\(1\)>/);
  assert.ok(db.statements.every(sql=>sql.trim().toUpperCase().startsWith("SELECT ")));
});

test("canonical Azkar permalink resolves a legacy row by title when its database ID differs", async () => {
  const row={...baseArticle,id:"legacy-azkar-row",title:"🌿 أثر الأذكار في الإتزان النفسي"};
  const statements=[];
  const db={prepare(sql){statements.push(String(sql));return{bind(){return this;},async first(){return statements.length===1?null:row;}};}};
  const response=await articlePage({
    request:new Request("https://alabqri.pages.dev/articles/azkar-balance"),
    params:{id:"azkar-balance"},
    env:{DB:db}
  });
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/canonical" href="https:\/\/alabqri\.pages\.dev\/articles\/azkar-balance"/);
  assert.match(html,/أثر الأذكار/);
  assert.ok(statements.every(sql=>sql.trim().toUpperCase().startsWith("SELECT ")));
});

test("permalink hides articles scheduled for a future date", async () => {
  const db=mockDb({...baseArticle,scheduled_at:"2999-01-01T00:00:00.000Z"});
  const response=await articlePage({
    request:new Request("https://alabqri.pages.dev/articles/raqya-001"),
    params:{id:"raqya-001"},
    env:{DB:db}
  });
  assert.equal(response.status,404);
  assert.match(await response.text(),/غير منشور للعامة/);
});

test("permalink rejects invalid IDs and unsupported methods", async () => {
  const invalid=await articlePage({
    request:new Request("https://alabqri.pages.dev/articles/%3Cscript%3E"),
    params:{id:"<script>"},
    env:{DB:mockDb({...baseArticle})}
  });
  assert.equal(invalid.status,404);
  const method=await articlePage({
    request:new Request("https://alabqri.pages.dev/articles/raqya-001",{method:"POST"}),
    params:{id:"raqya-001"},
    env:{DB:mockDb({...baseArticle})}
  });
  assert.equal(method.status,405);
});

test("library cards expose direct links while preserving the existing reader UI", async () => {
  const source=await readFile(new URL("../../assets/articles-library.js",import.meta.url),"utf8");
  assert.ok(source.includes('permalink.href = "/articles/" + encodeURIComponent(String(a.id))'));
  assert.ok(source.includes('details.appendChild(summary)'));
  assert.ok(source.includes('classList.add("is-expanded")'));
});
