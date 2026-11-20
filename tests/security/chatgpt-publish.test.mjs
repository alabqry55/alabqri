import test from "node:test";
import assert from "node:assert/strict";
import { onRequest as articlesRequest } from "../../functions/api/articles.js";

const SITE = "https://alabqri.example";
const TOKEN = "test-chatgpt-publish-token-with-more-than-32-characters";

function article(overrides = {}) {
  return {
    id: "chatgpt-test-article-001",
    title: "مقال اختبار النشر المباشر",
    category: "القرآن الكريم وعلومه",
    date: "19 نوفمبر 2026",
    excerpt: "وصف مختصر للاختبار.",
    content: "محتوى المقال الاختباري.",
    tags: ["اختبار", "النشر المباشر"],
    seoTitle: "مقال اختبار النشر المباشر",
    seoDescription: "وصف SEO للاختبار.",
    seoKeywords: "اختبار، نشر مباشر",
    canonicalUrl: "",
    ogImage: "",
    ...overrides
  };
}

function memoryDb() {
  const rows = new Map();
  const audit = [];
  let touched = false;
  const prepare = sql => {
    let values = [];
    return {
      bind(...args) { values = args; return this; },
      async run() {
        touched = true;
        if (sql.includes("INSERT INTO articles(")) {
          const [id,title,category,date,excerpt,content,scheduled_at,tags_json,seo_title,seo_description,seo_keywords,canonical_url,og_image] = values;
          if (rows.has(id)) throw new Error("UNIQUE constraint failed: articles.id");
          rows.set(id,{id,title,category,date,excerpt,content,scheduled_at,tags_json,seo_title,seo_description,seo_keywords,canonical_url,og_image});
        } else if (sql.includes("INSERT INTO article_admin_audit")) {
          audit.push({actor:values[0],action:values[1],article_id:values[2],details:values[3]});
        }
        return {success:true};
      },
      async all() {
        if (sql.trim().startsWith("SELECT id,title FROM articles") || sql.trim()==="SELECT id,title FROM articles") {
          return {results:[...rows.values()].map(({id,title})=>({id,title}))};
        }
        if (sql.trim().startsWith("SELECT id,title FROM articles WHERE id <>")) {
          return {results:[...rows.values()].filter(row=>row.id!==values[0]).map(({id,title})=>({id,title}))};
        }
        return {results:[]};
      },
      async first() {
        if (sql.includes("FROM articles WHERE id=?1")) return rows.get(values[0]) || null;
        return null;
      }
    };
  };
  return {
    rows,audit,get touched(){return touched;},
    prepare,
    async batch(statements) { for (const statement of statements) await statement.run(); }
  };
}

function request(body, token = TOKEN) {
  return new Request(SITE + "/api/articles", {
    method:"POST",
    headers:{
      "Authorization":"Bearer " + token,
      "Content-Type":"application/json",
      "Accept":"application/json"
    },
    body:JSON.stringify(body)
  });
}

test("ChatGPT publish rejects missing or invalid integration credentials before touching D1", async () => {
  for (const authorization of [null,"Bearer wrong-token"]) {
    const db = memoryDb();
    const headers = {"Content-Type":"application/json"};
    if (authorization) headers.Authorization = authorization;
    const response = await articlesRequest({
      request:new Request(SITE+"/api/articles",{method:"POST",headers,body:JSON.stringify({action:"save",publishApproved:true,article:article()})}),
      env:{DB:db,CHATGPT_PUBLISH_TOKEN:TOKEN}
    });
    assert.equal(response.status,401);
    assert.equal(db.touched,false);
  }
});

test("ChatGPT publish requires explicit approval and cannot invoke other article actions", async () => {
  for (const body of [
    {action:"save",publishApproved:false,article:article()},
    {action:"delete",publishApproved:true,id:"anything"},
    {action:"saveMany",publishApproved:true,articles:[article()]}
  ]) {
    const db=memoryDb();
    const response=await articlesRequest({request:request(body),env:{DB:db,CHATGPT_PUBLISH_TOKEN:TOKEN}});
    assert.equal(response.status,403);
    assert.equal(db.touched,false);
  }
});

test("ChatGPT can create one immediately published article and receives a verified receipt", async () => {
  const db=memoryDb();
  const response=await articlesRequest({
    request:request({action:"save",publishApproved:true,article:article()}),
    env:{DB:db,CHATGPT_PUBLISH_TOKEN:TOKEN}
  });
  const payload=await response.json();
  assert.equal(response.status,200);
  assert.equal(payload.ok,true);
  assert.equal(payload.verified,true);
  assert.equal(payload.published,true);
  assert.equal(payload.source,"chatgpt");
  assert.equal(payload.id,"chatgpt-test-article-001");
  assert.equal(db.rows.get(payload.id).title,"مقال اختبار النشر المباشر");
  assert.equal(db.audit.length,1);
  assert.equal(db.audit[0].actor,"chatgpt-integration");
  assert.equal(db.audit[0].action,"chatgpt_publish");
});

test("ChatGPT publishing is create-only and rejects duplicate IDs or titles", async () => {
  const db=memoryDb();
  const first=await articlesRequest({request:request({action:"save",publishApproved:true,article:article()}),env:{DB:db,CHATGPT_PUBLISH_TOKEN:TOKEN}});
  assert.equal(first.status,200);
  const duplicateId=await articlesRequest({request:request({action:"save",publishApproved:true,article:article({title:"عنوان مختلف"})}),env:{DB:db,CHATGPT_PUBLISH_TOKEN:TOKEN}});
  assert.equal(duplicateId.status,409);
  const duplicateTitle=await articlesRequest({request:request({action:"save",publishApproved:true,article:article({id:"chatgpt-test-article-002"})}),env:{DB:db,CHATGPT_PUBLISH_TOKEN:TOKEN}});
  assert.equal(duplicateTitle.status,409);
  assert.equal(db.rows.size,1);
});

test("ChatGPT publishing cannot schedule articles", async () => {
  const db=memoryDb();
  const response=await articlesRequest({
    request:request({action:"save",publishApproved:true,article:article({scheduledAt:"2026-12-01T10:00:00.000Z"})}),
    env:{DB:db,CHATGPT_PUBLISH_TOKEN:TOKEN}
  });
  assert.equal(response.status,400);
  assert.equal(db.rows.size,0);
});
