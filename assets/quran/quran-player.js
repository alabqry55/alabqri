(function(){
"use strict";
if(window.__ABQ_QURAN_PLAYER__)return;
window.__ABQ_QURAN_PLAYER__=true;

const API="/api/quran";
const $=id=>document.getElementById(id);
const state={reciters:[],surahs:[],texts:null,current:0,queue:[],playing:false,repeat:false,source:null,segmentEnd:null,favorites:[]};
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
#abq-quran-player{font-family:Cairo,sans-serif;margin:1rem auto;max-width:980px}
#abq-quran-player .abq-qp-card{background:linear-gradient(145deg,#fffdf7,#f8fafc);border:2px solid #bfdbfe;border-radius:18px;padding:18px;box-shadow:0 14px 34px -24px rgba(15,23,42,.45)}
#abq-quran-player .abq-qp-title{text-align:center;font-size:1.15rem;font-weight:900;color:#1e3a8a;margin:0 0 14px}
#abq-quran-player .abq-qp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
#abq-quran-player label{display:block;font-size:.78rem;font-weight:800;color:#334155;margin:0 0 5px}
#abq-quran-player select,#abq-quran-player input[type=search]{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:.65rem .7rem;background:#fff;color:#0f172a;font:inherit;font-weight:700}
#abq-quran-player .abq-qp-ayahs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#abq-quran-player .abq-qp-controls{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin:14px 0 10px}
#abq-quran-player .abq-qp-btn{border:1px solid #93c5fd;background:#eff6ff;color:#1e3a8a;border-radius:999px;padding:.55rem .8rem;font:inherit;font-weight:900;cursor:pointer}
#abq-quran-player .abq-qp-btn.primary{background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;border-color:#2563eb}
#abq-quran-player .abq-qp-btn.waiting{background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#172554;border-color:#f59e0b;animation:abqQpWait 1.4s ease-in-out infinite}
@keyframes abqQpWait{50%{transform:scale(1.025);opacity:.82}}
#abq-quran-player .abq-qp-btn:disabled{opacity:.45;cursor:not-allowed}
#abq-quran-player .abq-qp-status{text-align:center;color:#475569;min-height:1.4rem;font-size:.78rem}
#abq-quran-player .abq-qp-verse-head{text-align:center;color:#1d4ed8;font-size:.75rem;font-weight:900;margin-top:12px}
#abq-quran-player .abq-qp-verse{margin-top:6px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:15px;min-height:90px;text-align:center;font-family:Amiri,serif;font-size:1.45rem;line-height:2.15;color:#1e293b}
#abq-quran-player .abq-qp-meta{text-align:center;color:#64748b;font-size:.72rem;margin-top:8px}
#abq-quran-player .abq-qp-progress{width:100%;accent-color:#2563eb}
@media(max-width:640px){#abq-quran-player .abq-qp-grid{grid-template-columns:1fr}#abq-quran-player .abq-qp-card{padding:12px}#abq-quran-player .abq-qp-verse{font-size:1.3rem;line-height:2}}
</style>
<div class="abq-qp-card">
<h3 class="abq-qp-title">🎧 مشغل القرآن الكريم — التلاوة آيةً بآية</h3>
<div class="abq-qp-grid">
<div><label for="abq-qp-reciter-search">🔎 بحث في القراء</label><input id="abq-qp-reciter-search" type="search" placeholder="اكتب اسم القارئ..." autocomplete="off"></div>
<div><label for="abq-qp-reciter">🎙️ القارئ</label><select id="abq-qp-reciter"></select></div>
<div><label for="abq-qp-surah">📖 السورة</label><select id="abq-qp-surah"></select></div>
<div><label for="abq-qp-read">📚 الرواية / المصدر</label><select id="abq-qp-read"></select></div>
<div><label>🎯 نطاق الآيات</label><div class="abq-qp-ayahs"><select id="abq-qp-from" aria-label="من الآية"></select><select id="abq-qp-to" aria-label="إلى الآية"></select></div></div>
</div>
<div class="abq-qp-controls">
<button class="abq-qp-btn primary" id="abq-qp-play">▶️ تشغيل</button>
<button class="abq-qp-btn" id="abq-qp-prev">⏮️ السابقة</button>
<button class="abq-qp-btn" id="abq-qp-next">⏭️ التالية</button>
<button class="abq-qp-btn" id="abq-qp-repeat">🔁 تكرار</button>
<button class="abq-qp-btn" id="abq-qp-favorite">☆ المفضلة</button>
</div>
<input id="abq-qp-progress" class="abq-qp-progress" type="range" min="0" max="100" value="0" step=".1" aria-label="تقدم التلاوة">
<div id="abq-qp-status" class="abq-qp-status">جاري تجهيز القراء والسور...</div>
<div id="abq-qp-verse-head" class="abq-qp-verse-head">—</div>
<div id="abq-qp-verse">—</div>
<div id="abq-qp-meta" class="abq-qp-meta">—</div>
<audio id="abq-qp-audio" preload="metadata"></audio>
</div>`;
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
 updateAyahs();savePrefs();
}
function populateSurahs(){
 fill($("abq-qp-surah"),state.surahs.map(s=>({value:s.id,label:s.id+" — "+s.name+" ("+s.ayahs+")"})));
 const p=loadPrefs();$("abq-qp-surah").value=p.surah&&[...$("abq-qp-surah").options].some(o=>o.value===p.surah)?p.surah:"1";
 $("abq-qp-surah").onchange=()=>{updateAyahs();savePrefs()};
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
 try{const d=await getJSON(API+"/text?surah="+surah);state.texts=d.surah?.ayahs||d.data?.ayahs||d.surah?.ayahs||d.data?.ayahs||[];renderVerse(1)}
 catch{state.texts=[];renderVerse(1)}
}
function renderVerse(n){
 const a=(state.texts||[]).find(x=>Number(x.numberInSurah)===Number(n));
 const s=state.surahs.find(x=>Number(x.id)===Number($("abq-qp-surah")?.value));
 const r=selectedReciter();
 $("abq-qp-verse-head").textContent=a?(s?.name||"")+" — الآية "+n:"";
 $("abq-qp-verse").textContent=a?(a.text||""):"";
 $("abq-qp-meta").textContent=r?(r.name+" • "+(r.readName||"تلاوة آية بآية")):"";
}
function queueBuild(){
 const f=Number($("abq-qp-from").value),t=Number($("abq-qp-to").value);
 state.queue=[];for(let n=f;n<=t;n++)state.queue.push(n);state.current=0;
 renderVerse(state.queue[0]||1);
}
function setStatus(t){$("abq-qp-status").textContent=t}
function setPlayButton(mode){
 const b=$("abq-qp-play");if(!b)return;
 b.classList.toggle("waiting",mode==="waiting");
 if(mode==="playing"){b.textContent="⏸️ إيقاف";b.title="إيقاف الاستماع مؤقتًا"}
 else if(mode==="waiting"){b.textContent="⏳ جاري تجهيز التلاوة...";b.title="جاري تجهيز التلاوة"}
 else {b.textContent="▶️ تشغيل";b.title="تشغيل التلاوة"}
}
async function sourceFor(r,surah,ayah){
 const p=new URLSearchParams({source:r.source,surah:String(surah),ayah:String(ayah)});
 if(r.source==="alqurancloud")p.set("edition",r.edition);
 else {p.set("read",String(r.readId||r.reciterId));p.set("reciter",String(r.reciterId||r.readId));if(r.fallbackEdition)p.set("fallbackEdition",r.fallbackEdition)}
 return getJSON(API+"/audio?"+p.toString());
}
async function loadCurrent(autoplay){
 const r=selectedRead(),surah=Number($("abq-qp-surah").value),ayah=state.queue[state.current];
 if(!r||!surah||!ayah)return;
 const audio=$("abq-qp-audio");state.source=null;state.segmentEnd=null;
 setPlayButton("waiting");setStatus("جاري تجهيز الآية "+ayah+"...");
 try{
  const d=await sourceFor(r,surah,ayah);
  state.source=d;state.segmentEnd=d.end==null?null:Number(d.end);
  audio.src=d.audioUrl;audio.load();
  renderVerse(ayah);
  audio.onloadedmetadata=()=>{
    if(d.start>0)audio.currentTime=Math.min(Number(d.start),Math.max(0,audio.duration-.05));
    if(autoplay){state.playing=true;setPlayButton("playing");audio.play().catch(()=>{state.playing=false;setPlayButton("waiting");setStatus("اضغط تشغيل مرة أخرى للسماح بالتشغيل في المتصفح")})}
    else {setPlayButton("idle");setStatus((d.fallback?"تم استخدام مصدر احتياطي موثوق":"جاهز للتشغيل")+" • الآية "+ayah)}
  };
  audio.onerror=async()=>{
    if(r.source==="mp3quran"&&r.fallbackEdition){
      try{
        const fb={...r,source:"alqurancloud",edition:r.fallbackEdition};
        const d2=await sourceFor(fb,surah,ayah);state.source=d2;state.segmentEnd=null;audio.src=d2.audioUrl;audio.load();
        setStatus("تم التحويل تلقائيًا لمصدر احتياطي موثوق • الآية "+ayah);
        if(autoplay){state.playing=true;setPlayButton("playing");await audio.play().catch(()=>{})}
        return;
      }catch{}
    }
    state.playing=false;setPlayButton("waiting");setStatus("تعذر تشغيل هذه التلاوة مؤقتًا — جرّب قارئًا آخر");
  };
 }catch(e){state.playing=false;setPlayButton("waiting");setStatus("تعذر تجهيز التلاوة — جرّب القارئ أو المصدر الآخر")}
}
function next(){
 if(state.current<state.queue.length-1){state.current++;loadCurrent(true)}
 else if(state.repeat){state.current=0;loadCurrent(true)}
 else {state.playing=false;setPlayButton("idle");setStatus("انتهى نطاق الاستماع المحدد")}
}
function prev(){state.current=Math.max(0,state.current-1);loadCurrent(state.playing)}
function bind(){
 const audio=$("abq-qp-audio");
 $("abq-qp-play").onclick=async()=>{
  if(!state.queue.length)queueBuild();
  if(audio.src&&!audio.paused){
   audio.pause();state.playing=false;setPlayButton("waiting");setStatus("تم إيقاف الاستماع مؤقتًا — اضغط تشغيل للمتابعة");return;
  }
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
  updateAyahs();queueBuild();await loadText();updateFavorite();
  setStatus("تم تجهيز جميع القراء المتاحين للتشغيل");
 }catch(e){setStatus("تعذر تحميل قائمة القراء مؤقتًا — أعد المحاولة")}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();