#!/usr/bin/env node
/**
 * ALABQRI local owner-session publisher.
 * Requires Node.js 22+. Uses only built-in fetch and WebSocket.
 * Create-only: saveMany only. Never reads or exports browser cookies.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const ORIGIN = "https://alabqri.pages.dev";
const CDP_ENDPOINT = "http://127.0.0.1:9222/json/list";
const CATEGORIES = new Set([
  "القرآن الكريم وعلومه", "الحديث الشريف وعلومه", "التنمية البشرية",
  "الطب التكميلي", "الأذكار والاتزان", "البحث العلمي", "موضوعات معرفية"
]);

function normalizeTitle(value) {
  return String(value || "").toLocaleLowerCase("ar")
    .replace(/\p{Extended_Pictographic}/gu, "").replace(/[#*_~]/g, "")
    .replace(/[إأآ]/g, "ا").replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F\u0670ـ]/g, "")
    .replace(/[\s:：،؛,.!?؟]+/g, " ").trim();
}

function validate(payload) {
  if (!payload || payload.action !== "saveMany" || !Array.isArray(payload.articles)) {
    throw new Error('يجب أن يحتوي الملف على action="saveMany" وarticles=[...]');
  }
  if (payload.articles.length < 1 || payload.articles.length > 30) {
    throw new Error("يسمح من مقال واحد إلى 30 مقالًا.");
  }
  const ids = new Set();
  const titles = new Set();
  payload.articles.forEach((a, i) => {
    if (!a || typeof a !== "object") throw new Error("بيانات المقال " + (i + 1) + " غير صالحة.");
    const id = String(a.id || "");
    const title = String(a.title || "").trim();
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) throw new Error("معرّف غير صالح للمقال " + (i + 1) + ".");
    if (!title || title.length > 240) throw new Error("عنوان غير صالح للمقال " + (i + 1) + ".");
    if (!CATEGORIES.has(a.category)) throw new Error("تصنيف غير معتمد للمقال: " + title);
    if (typeof a.content !== "string" || !a.content.trim() || a.content.length > 200000) throw new Error("محتوى غير صالح للمقال: " + title);
    if (typeof a.excerpt !== "string" || a.excerpt.length > 2000) throw new Error("ملخص غير صالح للمقال: " + title);
    if (typeof a.date !== "string" || a.date.length > 80) throw new Error("تاريخ غير صالح للمقال: " + title);
    const key = normalizeTitle(title);
    if (ids.has(id) || titles.has(key)) throw new Error("توجد معرّفات أو عناوين مكررة داخل الملف.");
    ids.add(id); titles.add(key);
    if (a.publishImmediately === true) {
      if (i !== 0 || a.scheduledAt) throw new Error("النشر الفوري مسموح للمقال الأول فقط ومن دون موعد مجدول.");
    } else {
      const date = String(a.scheduledAt || "");
      if (!date || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})$/.test(date) ||
          !Number.isFinite(Date.parse(date)) || Date.parse(date) <= Date.now()) {
        throw new Error("موعد النشر يجب أن يكون مستقبليًا وصالحًا للمقال: " + title);
      }
    }
  });
}

async function connect() {
  if (typeof WebSocket !== "function") throw new Error("يلزم Node.js 22 أو أحدث.");
  const response = await fetch(CDP_ENDPOINT, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error("تعذر الوصول إلى متصفح النشر المحلي على المنفذ 9222.");
  const targets = await response.json();
  const target = targets.find(x => x.type === "page" && x.url && new URL(x.url).origin === ORIGIN && x.webSocketDebuggerUrl);
  if (!target) throw new Error("افتح الموقع الإنتاجي في نافذة متصفح النشر المخصصة أولًا.");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("انتهت مهلة الاتصال بالمتصفح.")), 8000);
    ws.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener("error", () => { clearTimeout(timer); reject(new Error("تعذر الاتصال بالمتصفح.")); }, { once: true });
  });
  let seq = 0;
  const pending = new Map();
  ws.addEventListener("message", event => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }
    if (!msg.id || !pending.has(msg.id)) return;
    const p = pending.get(msg.id); pending.delete(msg.id);
    if (msg.error) p.reject(new Error(msg.error.message || "فشل أمر المتصفح."));
    else p.resolve(msg.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || "فشل تنفيذ الطلب داخل الصفحة.");
    return r.result && r.result.value;
  };
  return { ws, evaluate };
}

async function main() {
  const file = process.argv[2];
  if (!file || process.argv.length !== 3) throw new Error("الاستخدام: node tools/local-publisher/publish-articles.cjs <articles.json>");
  const fullPath = path.resolve(process.cwd(), file);
  const stat = fs.statSync(fullPath);
  if (!stat.isFile() || stat.size > 600000) throw new Error("ملف JSON غير صالح أو يتجاوز 600KB.");
  const payload = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  validate(payload);

  console.log("\nمنصة العبقري — الحفظ المحلي");
  console.log("الموقع الإنتاجي فقط | إنشاء مقالات جديدة | لا حذف ولا استبدال\n");
  payload.articles.forEach((a, i) => {
    console.log((i + 1) + ". " + a.title);
    console.log("   " + (a.publishImmediately === true ? "نشر فوري" : "موعد النشر: " + a.scheduledAt));
  });

  const { ws, evaluate } = await connect();
  try {
    const check = await evaluate('(async()=>{const r=await fetch("/api/articles",{credentials:"same-origin",cache:"no-store"});const d=await r.json().catch(()=>null);return {status:r.status,admin:d?.admin===true,articles:Array.isArray(d?.articles)?d.articles.map(a=>({id:String(a.id||""),title:String(a.title||"")})):[]}})()');
    if (!check || check.status !== 200 || check.admin !== true) {
      throw new Error("جلسة المالك غير موثقة. سجّل الدخول بحساب alabqry55 في نافذة المتصفح ثم أعد المحاولة.");
    }
    const ids = new Set(check.articles.map(a => a.id));
    const titles = new Set(check.articles.map(a => normalizeTitle(a.title)));
    const duplicate = payload.articles.find(a => ids.has(String(a.id)) || titles.has(normalizeTitle(a.title)));
    if (duplicate) throw new Error("المقال موجود مسبقًا أو عنوانه مكرر: " + duplicate.title + ". أوقفت الأداة الحفظ.");

    const rl = readline.createInterface({ input: stdin, output: stdout });
    let answer;
    try { answer = await rl.question('\nاكتب «نشر» حرفيًا لتأكيد الحفظ: '); }
    finally { rl.close(); }
    if (answer.trim() !== "نشر") throw new Error("أُلغيت العملية؛ لم يُرسل طلب الحفظ.");

    const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
    const expression = '(async()=>{const b=Uint8Array.from(atob("' + b64 + '"),c=>c.charCodeAt(0));const body=new TextDecoder().decode(b);const r=await fetch("/api/articles",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body});const d=await r.json().catch(()=>({error:"استجابة غير مفهومة"}));return {status:r.status,data:d}})()';
    const result = await evaluate(expression);
    console.log("\nاستجابة الخادم:");
    console.log(JSON.stringify(result, null, 2));
    if (result?.status !== 200 || result?.data?.ok !== true || result?.data?.verified !== true) {
      throw new Error("لم يؤكد الخادم الحفظ والتحقق. لا تعاود الإرسال قبل مراجعة المقالات.");
    }
    console.log("\nأكد الخادم حفظ " + result.data.saved + " مقالًا والتحقق منه.");
  } finally {
    ws.close();
  }
}

main().catch(error => {
  console.error("\nرفض التنفيذ: " + (error.message || String(error)));
  process.exitCode = 1;
});
