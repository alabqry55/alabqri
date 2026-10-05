(function(){
"use strict";
if(window.__ABQ_QURAN_PLAYER__) return; window.__ABQ_QURAN_PLAYER__=true;
const API="/api/quran";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const state={reciters:[],surahs:[],texts:null,current:0,queue:[],playing:false,segmentEnd:null,sourceMeta:null,repeat:false,favorites:[]};
const PREF_KEY="abq_quran_player_v1";
function loadPrefs(){try{const p=JSON.parse(localStorage.getItem(PREF_KEY)||"{}");state.favorites=Array.isArray(p.favorites)?p.favorites:[];return p}catch(e){return {}}}
function savePrefs(){try{localStorage.setItem(PREF_KEY,JSON.stringify({reciter:$("abq-qp-reciter")?.value||"",read:$("abq-qp-read")?.value||"",surah:$("abq-qp-surah")?.value||"",from:$("abq-qp-from")?.value||"1",to:$("abq-qp-to")?.value||"1",repeat:!!state.repeat,favorites:state.favorites}))}catch(e){}}
function isFavorite(id){return state.favorites.includes(id)}
function updateFavoriteButton(){const b=$("abq-qp-favorite"),r=selectedRead();if(!b||!r)return;b.textContent=isFavorite(r.id)?"★ في المفضلة":"☆ مفضلة";b.setAttribute("aria-pressed",String(isFavorite(r.id)))}
const $=id=>document.getElementById(id);
function inject(){
 const target=$("azkar"); if(!target) return false;
 if($("abq-quran-player")) return true;
 const wrap=document.createElement("div"); wrap.id="abq-quran-player"; wrap.dir="rtl";
 wrap.innerHTML=`
 <style id="abq-quran-player-style">
 #abq-quran-player{font-family:Cairo,sans-serif;margin:1rem auto;max-width:980px}
 #abq-quran-player *{box-sizing:border-box}
 .abq-qp-card{background:linear-gradient(145deg,#fffdf7,#f8fafc);border:2px solid #bfdbfe;border-radius:18px;padding:18px;box-shadow:0 14px 34px -24px rgba(15,23,42,.45)}
 .abq-qp-title{text-align:center;font-size:1.15rem;font-weight:900;color:#1e3a8a;margin:0 0 14px}
 .abq-qp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 .abq-qp-field label{display:block;font-size:.78rem;font-weight:800;color:#334155;margin:0 0 5px}
 .abq-qp-field select{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:.65rem .7rem;background:#fff;color:#0f172a;font-family:inherit;font-weight:700}
 .abq-qp-ayahs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
 .abq-qp-controls{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin:14px 0 10px}
 .abq-qp-btn{border:1px solid #93c5fd;background:#eff6ff;color:#1e3a8a;border-radius:999px;padding:.55rem .8rem;font-family:inherit;font-weight:900;cursor:pointer}
 .abq-qp-btn.primary{background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;border-color:#2563eb}
 .abq-qp-btn:disabled{opacity:.45;cursor:not-allowed}
 .abq-qp-progress{width:100%;accent-color:#2563eb}
 .abq-qp-status{text-align:center;font-size:.78rem;color:#475569;min-height:1.3rem}
 .abq-qp-verse{margin-top:12px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:15px;min-height:90px;text-align:center;font-family:Amiri,serif;font-size:1.45rem;line-height:2.15;color:#1e293b}
 .abq-qp-verse.active{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1)}
 .abq-qp-meta{text-align:center;margin-top:8px;font-size:.72rem;color:#64748b}
 @media(max-width:640px){.abq-qp-grid{grid-template-columns:1fr}.abq-qp-card{padding:12px}.abq-qp-verse{font-size:1.3rem;line-height:2}.abq-qp-title{font-size:1rem}}
 </style>
 <div class="abq-qp-card">
  <h3 class="abq-qp-title">🎧 اختر القارئ والسورة والآية</h3>
  <div class="abq-qp-grid">
   <div class="abq-qp-field"><label for="abq-qp-reciter-search">🔎 بحث عن قارئ</label><input id="abq-qp-reciter-search" type="search" placeholder="اكتب اسم القارئ..." autocomplete="off" style="width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:.65rem .7rem;background:#fff;color:#0f172a;font-family:inherit;font-weight:700;margin-bottom:6px"><label for="abq-qp-reciter">🎙 القارئ</label><select id="abq-qp-reciter"></select></div>
   <div class="abq-qp-field"><label for="abq-qp-surah">📖 السورة</label><select id="abq-qp-surah"></select></div>
   <div class="abq-qp-field"><label for="abq-qp-read">📜 الرواية / المصحف</label><select id="abq-qp-read"></select></div>
   <div class="abq-qp-field"><label>🔢 نطاق الآيات</label><div class="abq-qp-ayahs"><select id="abq-qp-from" aria-label="من الآية"></select><select id="abq-qp-to" aria-label="إلى الآية"></select></div></div>
  </div>
  <div class="abq-qp-controls">
   <button class="abq-qp-btn primary" id="abq-qp-play">▶ تشغيل</button>
   <button class="abq-qp-btn" id="abq-qp-prev">⏮ السابقة</button>
   <button class="abq-qp-btn" id="abq-qp-next">التالية ⏭</button>
   <button class="abq-qp-btn" id="abq-qp-repeat">🔁 تكرار</button><button class="abq-qp-btn" id="abq-qp-favorite">☆ مفضلة</button>
  </div>
  <input id="abq-qp-progress" class="abq-qp-progress" type="range" min="0" max="100" value="0" step=".1" aria-label="موضع التلاوة">
  <div id="abq-qp-status" class="abq-qp-status">جاري تحميل القراء والسور…</div>
  <div id="abq-qp-verse" class="abq-qp-verse">اختر القارئ والسورة لعرض الآيات.</div>
  <div id="abq-qp-meta" class="abq-qp-meta">المشغل يستخدم مصادر خارجية موثوقة ولا يخزن ملفات التلاوة داخل المنصة.</div>
  <audio id="abq-qp-audio" preload="metadata"></audio>
 </div>`;
 target.insertBefore(wrap,target.firstChild);
 return true;
}
async function getJSON(url){const r=await fetch(url,{headers:{accept:"application/json"}});if(!r.ok)throw new Error("HTTP");return r.json();}
function fill(el,items,placeholder){el.innerHTML=""; if(placeholder){const o=document.createElement("option");o.value="";o.textContent=placeholder;el.appendChild(o)} items.forEach(x=>{const o=document.createElement("option");o.value=x.value;o.textContent=x.label;el.appendChild(o)});}
function selectedReciter(){const v=$("abq-qp-reciter").value;return state.reciters.find(x=>x.name===v)||state.reciters.find(x=>String(x.id)===String(v));}
function selectedRead(){const r=selectedReciter(); if(!r)return null; return r.reads?.find(x=>x.id===$("abq-qp-read").value)||r;}
function populateReciters(filterText=""){ 
 const groups={};
 const q=String(filterText||"").trim().toLocaleLowerCase("ar");
 state.reciters.forEach(r=>{const key=r.name||"قارئ";if(!q||key.toLocaleLowerCase("ar").includes(q))(groups[key]||(groups[key]=[])).push(r)});
 const items=Object.keys(groups).sort((a,b)=>a.localeCompare(b,"ar")).map(name=>({value:groups[name][0].name,label:name}));
 fill($("abq-qp-reciter"),items,"اختر القارئ");
 $("abq-qp-reciter").onchange=populateReads;
}
function populateReads(){
 const name=$("abq-qp-reciter").value;
 const reads=state.reciters.filter(x=>x.name===name);
 const merged=[];
 reads.forEach(r=>merged.push({value:r.id,label:(r.readName? r.readName+" — ":"")+r.source+(r.exactAyah?" • آية دقيقة":" • تحقق الآية عند التشغيل")}));
 fill($("abq-qp-read"),merged,"اختر الرواية");
 $("abq-qp-read").value=merged[0]?.value||"";
 updateAyahs(); loadText(); updateFavoriteButton(); savePrefs(); setStatus("تم اختيار الرواية.");
}
function populateSurahs(){
 fill($("abq-qp-surah"),state.surahs.map(s=>({value:s.id,label:s.id+" — "+s.name+" ("+s.ayahs+")"})));
 $("abq-qp-surah").addEventListener("change",()=>{updateAyahs();loadText();savePrefs();});
}
function updateAyahs(){
 const s=state.surahs.find(x=>x.id==Number($("abq-qp-surah").value)); if(!s)return;
 const items=Array.from({length:s.ayahs},(_,i)=>({value:i+1,label:"الآية "+(i+1)}));
 fill($("abq-qp-from"),items); fill($("abq-qp-to"),items);
 $("abq-qp-from").value="1"; $("abq-qp-to").value=String(Math.min(s.ayahs,1));
}
async function loadText(){
 const surah=Number($("abq-qp-surah").value); if(!surah)return;
 try{const data=await getJSON(API+"/text?surah="+surah);state.texts=data.surah.ayahs;renderVerse(1);}
 catch(e){$("abq-qp-verse").textContent="تعذر تحميل نص الآيات مؤقتًا.";}
}
function renderVerse(n){
 const a=(state.texts||[]).find(x=>x.number===n); $("abq-qp-verse").textContent=a?("﴿"+a.text+"﴾"):"";
 $("abq-qp-verse").classList.add("active");
}
function queueBuild(){
 const from=Number($("abq-qp-from").value),to=Number($("abq-qp-to").value);
 if(from>to){$("abq-qp-to").value=String(from);return queueBuild();}
 state.queue=[];for(let n=from;n<=to;n++)state.queue.push(n);state.current=0;
}
async function loadCurrent(autoplay){
 const read=selectedRead(), surah=Number($("abq-qp-surah").value), ayah=state.queue[state.current];
 if(!read||!surah||!ayah)return;
 const p=new URLSearchParams({source:read.source,surah:String(surah),ayah:String(ayah)});
 if(read.source==="alqurancloud")p.set("edition",read.edition);
 else {p.set("read",read.readId);p.set("reciter",read.reciterId);}
 setStatus("جاري تجهيز الآية "+ayah+"…");
 try{
  const data=await getJSON(API+"/audio?"+p.toString());
  const audio=$("abq-qp-audio"); state.sourceMeta=data; audio.src=data.audioUrl; audio.load();
  const start=Number(data.start||0), end=data.end==null?null:Number(data.end);
  state.segmentEnd=end; renderVerse(ayah); $("abq-qp-meta").textContent="القارئ: "+(read.name||"")+" • المصدر: "+(data.attribution||read.source);
  audio.onloadedmetadata=()=>{if(start>0)audio.currentTime=Math.min(start,Math.max(0,audio.duration-.05));if(autoplay)audio.play().catch(()=>{});};
  if(!autoplay) setStatus("جاهز للتشغيل — الآية "+ayah);
 }catch(e){
  if(read.source==="mp3quran" && read.fallbackEdition){
   try{
    const fp=new URLSearchParams({source:"alqurancloud",edition:read.fallbackEdition,surah:String(surah),ayah:String(ayah)});
    const fb=await getJSON(API+"/audio?"+fp.toString());
    const a=$("abq-qp-audio"); state.sourceMeta=fb; a.src=fb.audioUrl; a.load(); state.segmentEnd=null;
    a.onloadedmetadata=()=>{if(autoplay)a.play().catch(()=>{});};
    $("abq-qp-meta").textContent="القارئ: "+(read.name||"")+" • المصدر الاحتياطي: Al Quran Cloud";
    setStatus("تم الانتقال تلقائيًا إلى المصدر الاحتياطي."); return;
   }catch(ignore){}
  }
  setStatus(read.source==="mp3quran"?"تعذر تحديد الآية في هذه الرواية؛ اختر رواية تدعم توقيت الآيات.":"تعذر تحميل التلاوة مؤقتًا.");
 }
}
function setStatus(t){$("abq-qp-status").textContent=t;}
function next(){if(state.current<state.queue.length-1){state.current++;loadCurrent(true)}else{state.playing=false;setStatus("انتهى المقطع المحدد.");}}
function prev(){state.current=Math.max(0,state.current-1);loadCurrent(state.playing);}
function bind(){
 const audio=$("abq-qp-audio");
 $("abq-qp-play").onclick=async()=>{if(!state.queue.length)queueBuild(); if(audio.src && !audio.paused){audio.pause();state.playing=false;setStatus("تم الإيقاف المؤقت.");}else{state.playing=true;await loadCurrent(true);}};
 $("abq-qp-prev").onclick=prev; $("abq-qp-next").onclick=next;
 $("abq-qp-repeat").onclick=()=>{state.repeat=!state.repeat;$("abq-qp-repeat").textContent=state.repeat?"🔁 التكرار: مفعّل":"🔁 تكرار";savePrefs();};
 $("abq-qp-favorite").onclick=()=>{const r=selectedRead();if(!r)return;const i=state.favorites.indexOf(r.id);if(i>=0)state.favorites.splice(i,1);else state.favorites.push(r.id);updateFavoriteButton();savePrefs();};
 $("abq-qp-reciter-search").oninput=e=>{const current=$("abq-qp-reciter").value;populateReciters(e.target.value);const exists=[...$("abq-qp-reciter").options].some(o=>o.value===current);if(exists){$("abq-qp-reciter").value=current;populateReads();}};
 $("abq-qp-from").onchange=queueBuild; $("abq-qp-to").onchange=queueBuild;
 audio.ontimeupdate=()=>{if(state.segmentEnd!==null && audio.currentTime>=state.segmentEnd-.08){if(state.repeat){loadCurrent(true)}else next()} if(audio.duration) $("abq-qp-progress").value=(audio.currentTime/audio.duration)*100;};
 $("abq-qp-progress").oninput=()=>{if(audio.duration)audio.currentTime=(Number($("abq-qp-progress").value)/100)*audio.duration;};
 audio.onplay=()=>{state.playing=true;setStatus("جاري تشغيل الآية "+state.queue[state.current]);};
 audio.onpause=()=>{if(state.playing)state.playing=false;};
}
async function init(){
 if(!inject())return;
 const prefs=loadPrefs();
 bind();
 try{
  const [r,s]=await Promise.all([getJSON(API+"/reciters"),getJSON(API+"/surahs")]);
  state.reciters=r.reciters||[]; state.surahs=s.surahs||[];
  populateReciters();populateSurahs();
  if(state.reciters.length){$("abq-qp-reciter").value=prefs.reciter&&[...$("abq-qp-reciter").options].some(o=>o.value===prefs.reciter)?prefs.reciter:state.reciters[0].name;populateReads();}
  if(prefs.read&&[...$("abq-qp-read").options].some(o=>o.value===prefs.read))$("abq-qp-read").value=prefs.read;
  $("abq-qp-surah").value=prefs.surah&&state.surahs.some(s=>String(s.id)===String(prefs.surah))?String(prefs.surah):"1";updateAyahs();
  if(prefs.from)$("abq-qp-from").value=prefs.from;if(prefs.to)$("abq-qp-to").value=prefs.to;
  if(Number($("abq-qp-from").value)>Number($("abq-qp-to").value))$("abq-qp-to").value=$("abq-qp-from").value;
  state.repeat=!!prefs.repeat;$("abq-qp-repeat").textContent=state.repeat?"🔁 التكرار: مفعّل":"🔁 تكرار";updateFavoriteButton();loadText();queueBuild();
  setStatus("اختر القارئ والسورة ثم حدّد الآيات واضغط تشغيل.");
 }catch(e){setStatus("تعذر تحميل بيانات القراء حاليًا؛ حاول تحديث الصفحة.");}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();