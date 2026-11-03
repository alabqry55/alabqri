(function(){
"use strict";
if(window.__ABQ_QURAN_PLAYER__)return;
window.__ABQ_QURAN_PLAYER__=true;

const API="/api/quran";
const $=id=>document.getElementById(id);
const state={reciters:[],surahs:[],texts:null,current:0,queue:[],playing:false,repeat:false,source:null,segmentEnd:null,favorites:[],playMode:"range",requestId:0};
const PREF="abq_quran_player_v2";

function esc(s){return String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[c]));}
function loadPrefs(){try{return JSON.parse(localStorage.getItem(PREF)||"{}")}catch{return {}}}
function savePrefs(){try{localStorage.setItem(PREF,JSON.stringify({
 reciter:$("abq-qp-reciter")?.value||"",read:$("abq-qp-read")?.value||"",surah:$("abq-qp-surah")?.value||"",
 from:$("abq-qp-from")?.value||"1",to:$("abq-qp-to")?.value||"1",repeat:!!state.repeat,favorites:state.favorites
}))}catch{}}
function isFav(id){return state.favorites.includes(id)}
function selectedReciter(){const v=$("abq-qp-reciter")?.value;return state.reciters.find(x=>x.name===v||String(x.id)===String(v))}
function selectedRead(){const r=selectedReciter();if(!r)return null;return r.source==="alqurancloud"?r:r}
function fill(el,items,placeholder){
 if(!el)return;el.innerHTML="";
 if(placeholder){const o=document.createElement("option");o.value="";o.textContent=placeholder;el.appendChild(o)}
 items.forEach(x=>{const o=document.createElement("option");o.value=x.value;o.textContent=x.label;el.appendChild(o)})
}
function inject(){
 const target=$("azkar")||$("azkar-app"); if(!target)return false;
 if($("abq-quran-player"))return true;
 const wrap=document.createElement("div");wrap.id="abq-quran-player";wrap.dir="rtl";
 wrap.innerHTML=`
<style id="abq-qp-style">
#abq-quran-player{font-family:Cairo,sans-serif;margin:1.1rem auto;max-width:1040px;color:#173c32}#abq-quran-player *{box-sizing:border-box}
#abq-quran-player .abq-qp-card{position:relative;overflow:hidden;background:radial-gradient(ellipse at 50% -30%,rgba(205,169,91,.17),transparent 55%),linear-gradient(155deg,#fffdf6,#f6f3e8);border:1px solid #c8b477;border-radius:24px;padding:clamp(14px,2.5vw,26px);box-shadow:0 18px 44px -30px rgba(8,55,43,.48)}
#abq-quran-player .abq-qp-card:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.16;background-image:radial-gradient(#b99b54 .7px,transparent .7px);background-size:18px 18px;mask-image:linear-gradient(to bottom,black,transparent 48%)}
#abq-quran-player .abq-qp-head{position:relative;text-align:center;margin:-2px 0 18px;padding:20px 12px 17px;border-radius:18px;color:#fff9e8;background:linear-gradient(135deg,#073f32,#0b6048 58%,#164b3d);border:1px solid rgba(215,187,117,.7)}
#abq-quran-player .abq-qp-head:after{content:"۞";display:block;color:#d9bd79;font-family:Amiri,serif;font-size:1.25rem;margin-top:5px;opacity:.9}
#abq-quran-player .abq-qp-kicker{font-size:.72rem;color:#e6d4a3;font-weight:800;letter-spacing:.04em}
#abq-quran-player .abq-qp-title{text-align:center;font-size:clamp(1.12rem,2.4vw,1.5rem);font-weight:900;color:#fff9e8;margin:4px 0}
#abq-quran-player .abq-qp-subtitle{font-size:.78rem;color:#e9e2cf;margin:0}
#abq-quran-player .abq-qp-grid{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
#abq-quran-player .abq-qp-field{min-width:0}
#abq-quran-player label{display:block;font-size:.8rem;font-weight:900;color:#31594b;margin:0 0 6px}
#abq-quran-player select,#abq-quran-player input[type=search]{width:100%;min-height:44px;border:1px solid #d7c99e;border-radius:12px;padding:.65rem .75rem;background:#fffefa;color:#173c32;font:inherit;font-weight:700;outline:none}
#abq-quran-player select:focus,#abq-quran-player input:focus{border-color:#a98a42;box-shadow:0 0 0 3px rgba(183,151,76,.16)}
#abq-quran-player .abq-qp-range{position:relative;margin-top:13px;padding:13px;border:1px solid #ddcfaa;border-radius:16px;background:rgba(255,255,255,.62)}
#abq-quran-player .abq-qp-range-title{font-size:.86rem;font-weight:900;color:#765e2d;margin:0 0 9px}
#abq-quran-player .abq-qp-ayahs{display:grid;grid-template-columns:1fr 1fr;gap:9px}
#abq-quran-player .abq-qp-actions{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:15px 0 9px}
#abq-quran-player .abq-qp-controls{position:relative;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:9px 0 12px}
#abq-quran-player .abq-qp-btn{border:1px solid #cdbb89;background:#fffdf5;color:#31594b;border-radius:999px;padding:.65rem .9rem;min-height:42px;font:inherit;font-size:.82rem;font-weight:900;cursor:pointer;transition:background .16s,border-color .16s}
#abq-quran-player .abq-qp-btn:hover{background:#f4ecd5;border-color:#aa8d4b}
#abq-quran-player .abq-qp-btn.primary{background:linear-gradient(135deg,#0a6048,#0b7958);color:#fff;border-color:#0a6048}
#abq-quran-player .abq-qp-btn.gold{background:linear-gradient(135deg,#b18c3e,#d4b66c);color:#243c30;border-color:#b18c3e}
#abq-quran-player .abq-qp-btn:disabled{opacity:.45;cursor:not-allowed}
#abq-quran-player .abq-qp-status{text-align:center;color:#536d60;min-height:1.5rem;font-size:.8rem;font-weight:700;padding:5px}
#abq-quran-player .abq-qp-progress{position:relative;width:100%;accent-color:#0c674d;margin:9px 0}
#abq-quran-player .abq-qp-verse-panel{position:relative;margin-top:13px;padding:14px;border:1px solid #d8c89b;border-radius:18px;background:linear-gradient(145deg,#fffefa,#f7f0dc)}
#abq-quran-player .abq-qp-verse-head{text-align:center;color:#8a6b2e;font-size:.8rem;font-weight:900;margin:0 0 6px}
#abq-quran-player .abq-qp-verse{background:transparent;min-height:92px;text-align:center;font-family:Amiri,serif;font-size:clamp(1.45rem,3vw,1.9rem);line-height:2.1;color:#173c32}
#abq-quran-player .abq-qp-meta{text-align:center;color:#6d786e;font-size:.74rem;margin-top:8px}#abq-quran-player audio{display:none}
@media(max-width:640px){#abq-quran-player .abq-qp-grid{grid-template-columns:1fr}#abq-quran-player .abq-qp-card{padding:11px;border-radius:18px}#abq-quran-player .abq-qp-head{padding:16px 9px}#abq-quran-player .abq-qp-actions{grid-template-columns:1fr}#abq-quran-player .abq-qp-controls{gap:6px}#abq-quran-player .abq-qp-btn{padding:.58rem .72rem;font-size:.77rem}}
@media(prefers-reduced-motion:reduce){#abq-quran-player .abq-qp-btn{transition:none}}
</style>
<div class="abq-qp-card">
<header class="abq-qp-head"><div class="abq-qp-kicker">مَجْلِسُ العَبْقَرِيِّ لِلذِّكْرِ وَالتَّسْبِيح</div><h3 class="abq-qp-title">المصحف الصوتي — تلاوة وخشوع</h3><p class="abq-qp-subtitle">استمع إلى القرآن الكريم بصوت القراء وبالروايات المتاحة</p></header>
<div class="abq-qp-grid">
<div class="abq-qp-field"><label for="abq-qp-reciter-search">⌕ البحث عن قارئ</label><input id="abq-qp-reciter-search" type="search" placeholder="اكتب اسم القارئ..." autocomplete="off"></div>
<div class="abq-qp-field"><label for="abq-qp-reciter">القارئ</label><select id="abq-qp-reciter"></select></div>
<div class="abq-qp-field"><label for="abq-qp-surah">السورة</label><select id="abq-qp-surah"></select></div>
<div class="abq-qp-field"><label for="abq-qp-read">الرواية / مصدر التلاوة</label><select id="abq-qp-read"></select></div></div>
<section class="abq-qp-range"><div class="abq-qp-range-title">تحديد نطاق الآيات — يُستخدم مع زر تشغيل الآيات المحددة فقط</div><div class="abq-qp-ayahs"><div><label for="abq-qp-from">من الآية</label><select id="abq-qp-from" aria-label="من الآية"></select></div><div><label for="abq-qp-to">إلى الآية</label><select id="abq-qp-to" aria-label="إلى الآية"></select></div></div></section>
<div class="abq-qp-actions"><button class="abq-qp-btn primary" id="abq-qp-play-full" type="button">▶ تشغيل السورة كاملة</button><button class="abq-qp-btn gold" id="abq-qp-play-range" type="button">▶ تشغيل الآيات المحددة</button></div>
<div class="abq-qp-controls"><button class="abq-qp-btn" id="abq-qp-play" type="button">⏸ إيقاف مؤقت</button><button class="abq-qp-btn" id="abq-qp-prev" type="button">⏮ السابقة</button><button class="abq-qp-btn" id="abq-qp-next" type="button">التالية ⏭</button><button class="abq-qp-btn" id="abq-qp-repeat" type="button">🔁 تكرار</button><button class="abq-qp-btn" id="abq-qp-favorite" type="button">☆ المفضلة</button></div>
<input id="abq-qp-progress" class="abq-qp-progress" type="range" min="0" max="100" value="0" step=".1" aria-label="تقدم التلاوة"><div id="abq-qp-status" class="abq-qp-status">جاري تجهيز القراء والسور...</div>
<section class="abq-qp-verse-panel"><div id="abq-qp-verse-head" class="abq-qp-verse-head">—</div><div id="abq-qp-verse" class="abq-qp-verse">—</div><div id="abq-qp-meta" class="abq-qp-meta">—</div></section><audio id="abq-qp-audio" preload="metadata"></audio></div>`;
 target.insertBefore(wrap,target.firstChild);
 return true;
}
async function getJSON(url){
 const r=await fetch(url,{headers:{accept:"application/json"}});
 if(!r.ok)throw new Error("HTTP "+r.status);
 return r.json();
}
function populateReciters(filter=""){
 const q=String(filter||"").trim().toLocaleLowerCase("ar");
 const groups={};
 state.reciters.forEach(r=>{const n=r.name||"قارئ";if(!q||n.toLocaleLowerCase("ar").includes(q))(groups[n]??=[]).push(r)});
 const items=Object.keys(groups).sort((a,b)=>a.localeCompare(b,"ar")).map(name=>({value:groups[name][0].id,label:name}));
 const el=$("abq-qp-reciter"),prev=el?.value;
 fill(el,items,"اختر القارئ");
 if(prev&&[...el.options].some(o=>o.value===prev))el.value=prev;
 el.onchange=()=>{populateReads();savePrefs()};
}
function populateReads(){
 const name=$("abq-qp-reciter")?.value;
 const rs=state.reciters.filter(r=>String(r.id)===String(name)||r.name===name);
 const merged=[];
 rs.forEach(r=>merged.push({value:r.id,label:(r.readName?r.readName+" — ":"")+(r.source==="alqurancloud"?"Al Quran Cloud":"MP3Quran")}));
 fill($("abq-qp-read"),merged,"اختر الرواية / المصدر");
 const p=loadPrefs();if(p.read&&[...$("abq-qp-read").options].some(o=>o.value===p.read))$("abq-qp-read").value=p.read;
 updateAyahs();queueBuild("range",true);savePrefs();
}
function populateSurahs(){
 fill($("abq-qp-surah"),state.surahs.map(s=>({value:s.id,label:s.id+" — "+s.name+" ("+s.ayahs+")"})));
 const p=loadPrefs();$("abq-qp-surah").value=p.surah&&[...$("abq-qp-surah").options].some(o=>o.value===p.surah)?p.surah:"1";
 $("abq-qp-surah").onchange=()=>{updateAyahs();queueBuild("range",true);loadText();savePrefs()};
}
function updateAyahs(){
 const s=state.surahs.find(x=>Number(x.id)===Number($("abq-qp-surah")?.value));if(!s)return;
 const items=Array.from({length:s.ayahs},(_,i)=>({value:i+1,label:"الآية "+(i+1)}));
 fill($("abq-qp-from"),items);fill($("abq-qp-to"),items);
 const p=loadPrefs();$("abq-qp-from").value=Math.min(Number(p.from)||1,s.ayahs);$("abq-qp-to").value=Math.min(Number(p.to)||s.ayahs,s.ayahs);
 if(Number($("abq-qp-from").value)>Number($("abq-qp-to").value))$("abq-qp-to").value=$("abq-qp-from").value;
 $("abq-qp-from").onchange=()=>{if(Number($("abq-qp-from").value)>Number($("abq-qp-to").value))$("abq-qp-to").value=$("abq-qp-from").value;queueBuild();savePrefs()};
 $("abq-qp-to").onchange=()=>{if(Number($("abq-qp-to").value)<Number($("abq-qp-from").value))$("abq-qp-to").value=$("abq-qp-from").value;queueBuild();savePrefs()};
}
async function loadText(){
 const surah=Number($("abq-qp-surah").value);if(!surah)return;
 try{const d=await getJSON(API+"/text?surah="+surah);state.texts=(d.surah?.ayahs||d.data?.ayahs||[]).map(a=>({numberInSurah:Number(a.numberInSurah??a.number),text:String(a.text||"")}));renderVerse(state.queue[state.current]||1)}
 catch{state.texts=[];renderVerse(state.queue[state.current]||1)}
}
function renderVerse(n){
 const a=(state.texts||[]).find(x=>Number(x.numberInSurah??x.number)===Number(n));
 const s=state.surahs.find(x=>Number(x.id)===Number($("abq-qp-surah")?.value));
 const r=selectedReciter();
 $("abq-qp-verse-head").textContent=a?(s?.name||"")+" — الآية "+n:"";
 $("abq-qp-verse").textContent=a?(a.text||""):"";
 $("abq-qp-meta").textContent=r?(r.name+" • "+(r.readName||"تلاوة آية بآية")):"";
}
function queueBuild(mode="range",reset=true){
 const s=state.surahs.find(x=>Number(x.id)===Number($("abq-qp-surah")?.value));if(!s)return;
 const f=Math.max(1,Number($("abq-qp-from")?.value)||1),t=Math.min(s.ayahs,Math.max(f,Number($("abq-qp-to")?.value)||s.ayahs));
 state.playMode=mode==="full"?"full":"range";const start=state.playMode==="full"?1:f,end=state.playMode==="full"?s.ayahs:t;
 state.queue=Array.from({length:end-start+1},(_,i)=>start+i);
 if(reset){state.requestId++;const audio=$("abq-qp-audio");if(audio){audio.pause();audio.removeAttribute("src");audio.load()}state.playing=false;state.source=null;state.segmentEnd=null;state.current=0;setPlayButton("idle");$("abq-qp-progress").value=0}
 renderVerse(state.queue[0]||1);
}
function startMode(mode){if(!selectedRead()){setStatus("اختر القارئ والرواية أولًا");return}queueBuild(mode,true);if(!state.queue.length)return;state.playing=true;setPlayButton("waiting");setStatus(mode==="full"?"جاري بدء السورة كاملة من أول آية...":"جاري بدء نطاق الآيات المحدد...");loadCurrent(true)}

function setStatus(t){$("abq-qp-status").textContent=t}
function setPlayButton(mode){
 const b=$("abq-qp-play");if(!b)return;
 b.classList.toggle("waiting",mode==="waiting");
 if(mode==="playing"){b.textContent="⏸ إيقاف مؤقت";b.title="إيقاف الاستماع مؤقتًا"}
 else if(mode==="waiting"){b.textContent="⏳ جاري التجهيز";b.title="جاري تجهيز التلاوة"}
 else {b.textContent="▶ متابعة الاستماع";b.title="متابعة التلاوة"}
}
async function sourceFor(r,surah,ayah){
 const p=new URLSearchParams({source:r.source,surah:String(surah),ayah:String(ayah)});
 if(r.source==="alqurancloud")p.set("edition",r.edition);
 else {p.set("read",String(r.readId||r.reciterId));p.set("reciter",String(r.reciterId||r.readId));if(r.fallbackEdition)p.set("fallbackEdition",r.fallbackEdition)}
 return getJSON(API+"/audio?"+p.toString());
}
async function loadCurrent(autoplay){
 const requestId=++state.requestId;
 const r=selectedRead(),surah=Number($("abq-qp-surah").value),ayah=state.queue[state.current];
 if(!r||!surah||!ayah)return;
 const audio=$("abq-qp-audio");state.source=null;state.segmentEnd=null;
 setPlayButton("waiting");setStatus("جاري تجهيز الآية "+ayah+"...");
 try{
  const d=await sourceFor(r,surah,ayah);
  if(requestId!==state.requestId)return;
  state.source=d;state.segmentEnd=d.end==null?null:Number(d.end);
  renderVerse(ayah);
  let mediaReady=false;
  const startReady=()=>{
   if(requestId!==state.requestId||mediaReady)return;
   mediaReady=true;
   if(d.start>0&&Number.isFinite(audio.duration))audio.currentTime=Math.min(Number(d.start),Math.max(0,audio.duration-.05));
   if(autoplay){
    state.playing=true;setPlayButton("playing");
    audio.play().catch(()=>{state.playing=false;setPlayButton("waiting");setStatus("اضغط تشغيل مرة أخرى للسماح بالتشغيل في المتصفح")});
   }else{
    setPlayButton("idle");
    setStatus((d.fallback?"تم استخدام مصدر احتياطي موثوق":"جاهز للتشغيل")+" • الآية "+ayah);
   }
  };
  audio.onloadedmetadata=startReady;
  audio.oncanplay=startReady;
  audio.onloadeddata=startReady;
  audio.src=d.audioUrl;
  audio.load();
  setTimeout(()=>{if(!mediaReady&&audio.readyState>=2)startReady()},2500);
  audio.onerror=async()=>{
   if(requestId!==state.requestId)return;
   if(r.source==="mp3quran"&&r.fallbackEdition){
    try{
     const fb={...r,source:"alqurancloud",edition:r.fallbackEdition};
     const d2=await sourceFor(fb,surah,ayah);
     state.source=d2;state.segmentEnd=null;
     audio.src=d2.audioUrl;audio.load();
     setStatus("تم التحويل تلقائيًا لمصدر احتياطي موثوق • الآية "+ayah);
     return;
    }catch{}
   }
   state.playing=false;setPlayButton("waiting");setStatus("تعذر تشغيل هذه التلاوة مؤقتًا — جرّب قارئًا آخر");
  };
 }catch(e){
  if(requestId!==state.requestId)return;
  state.playing=false;setPlayButton("idle");setStatus("تعذر تجهيز التلاوة — جرّب القارئ أو المصدر الآخر");
 }
}
function next(){
 if(state.current<state.queue.length-1){state.current++;loadCurrent(true)}
 else if(state.repeat){state.current=0;loadCurrent(true)}
 else {state.playing=false;setPlayButton("idle");setStatus(state.playMode==="full"?"انتهت السورة كاملة":"انتهى نطاق الآيات المحدد")}
}
function prev(){state.current=Math.max(0,state.current-1);loadCurrent(state.playing)}
function bind(){
 const audio=$("abq-qp-audio");
 $("abq-qp-play-full").onclick=()=>startMode("full");
 $("abq-qp-play-range").onclick=()=>startMode("range");
 $("abq-qp-play").onclick=async()=>{
  if(!state.queue.length)queueBuild("range",true);
  if(audio.src&&!audio.paused){
   audio.pause();state.playing=false;setPlayButton("waiting");setStatus("تم إيقاف الاستماع مؤقتًا — اضغط تشغيل للمتابعة");return;
  }
  if(audio.ended){state.current=0;state.playing=true;setPlayButton("waiting");await loadCurrent(true);return}
  if(audio.src&&audio.paused&&state.source){state.playing=true;setPlayButton("playing");try{await audio.play()}catch{state.playing=false;setPlayButton("waiting")}}
  else {state.playing=true;await loadCurrent(true)}
 };
 $("abq-qp-prev").onclick=prev;$("abq-qp-next").onclick=next;
 $("abq-qp-repeat").onclick=()=>{state.repeat=!state.repeat;$("abq-qp-repeat").textContent=state.repeat?"🔁 التكرار: مفعّل":"🔁 تكرار";savePrefs()};
 $("abq-qp-favorite").onclick=()=>{const r=selectedReciter();if(!r)return;const i=state.favorites.indexOf(r.id);if(i>=0)state.favorites.splice(i,1);else state.favorites.push(r.id);updateFavorite();savePrefs()};
 $("abq-qp-reciter-search").oninput=e=>populateReciters(e.target.value);
 $("abq-qp-read").onchange=()=>{queueBuild();savePrefs()};
 $("abq-qp-progress").oninput=()=>{if(audio.duration)audio.currentTime=Number($("abq-qp-progress").value)/100*audio.duration};
 audio.ontimeupdate=()=>{if(audio.duration)$("abq-qp-progress").value=audio.currentTime/audio.duration*100;if(state.segmentEnd!=null&&audio.currentTime>=state.segmentEnd-.08){audio.pause();next()}};
 audio.onended=()=>{if(state.playing)next()};
 audio.onplay=()=>{state.playing=true;setPlayButton("playing")};audio.onpause=()=>{if(state.playing===false)return;state.playing=false;setPlayButton("waiting")};
}
function updateFavorite(){const r=selectedReciter();const b=$("abq-qp-favorite");if(!b||!r)return;b.textContent=isFav(r.id)?"★ المفضلة":"☆ المفضلة"}
async function init(){
 if(!inject())return setTimeout(init,300);
 const p=loadPrefs();state.favorites=Array.isArray(p.favorites)?p.favorites:[];
 bind();
 try{
  const [r,s]=await Promise.all([getJSON(API+"/reciters?language=ar"),getJSON(API+"/surahs")]);
  state.reciters=r.reciters||[];state.surahs=s.surahs||[];
  populateReciters();populateSurahs();
  if(p.reciter&&[...$("abq-qp-reciter").options].some(o=>o.value===p.reciter))$("abq-qp-reciter").value=p.reciter;
  populateReads();
  if(p.surah)$("abq-qp-surah").value=p.surah;
  updateAyahs();queueBuild("range",true);await loadText();updateFavorite();
  setStatus("تم تجهيز جميع القراء المتاحين للتشغيل");
 }catch(e){setStatus("تعذر تحميل قائمة القراء مؤقتًا — أعد المحاولة")}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();