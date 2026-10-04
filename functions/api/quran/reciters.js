const MP3 = "https://www.mp3quran.net/api/v3";

const AQC_EDITIONS = [
  ["ar.alafasy","مشاري راشد العفاسي"],
  ["ar.husary","محمود خليل الحصري"],
  ["ar.minshawi","محمد صديق المنشاوي"],
  ["ar.minshawimujawwad","محمد صديق المنشاوي"],
  ["ar.sudais","عبدالرحمن السديس"],
  ["ar.shuraim","سعود الشريم"],
  ["ar.abdulbasit","عبد الباسط عبد الصمد"],
  ["ar.abdulbasitmujawwad","عبد الباسط عبد الصمد"],
  ["ar.ajamy","أحمد بن علي العجمي"],
  ["ar.muhammadayoub","محمد أيوب"],
  ["ar.hudhaify","علي بن عبدالرحمن الحذيفي"],
  ["ar.muhammadjibreel","محمد جبريل"],
  ["ar.parhizgar","محمود خليل الحصري"],
  ["ar.abdullahbasfar","عبدالله بصفر"]
];

export async function onRequestGet({ request }) {
  const lang = new URL(request.url).searchParams.get("language") || "ar";
  if (lang !== "ar") return json({ok:false,error:"language_not_supported"},400);
  try {
    const mp3 = await cachedFetch(MP3 + "/reciters?language=ar", 21600);
    const mp3Reciters = Array.isArray(mp3?.reciters) ? mp3.reciters : [];
    const fallbackMap = new Map(AQC_EDITIONS.map(([id,name])=>[norm(name),id]));
    const list = [];

    for (const r of mp3Reciters) {
      for (const m of (Array.isArray(r.moshaf)?r.moshaf:[])) {
        const id = String(m.id);
        list.push({
          id:"mp3quran:"+id, source:"mp3quran", reciterId:String(r.id), readId:id,
          name:String(r.name||"قارئ"), readName:String(m.name||""),
          server:String(m.server||""), surahTotal:Number(m.surah_total||0),
          surahs:String(m.surah_list||"").split(",").filter(Boolean).map(Number),
          exactAyah:false, fallbackEdition:fallbackMap.get(norm(r.name||""))||null,
          license:"provider_terms"
        });
      }
    }

    for (const [edition,name] of AQC_EDITIONS) {
      list.push({
        id:"alqurancloud:"+edition, source:"alqurancloud", edition,
        reciterId:edition, name, readName:"تلاوة آية بآية",
        exactAyah:true, license:"provider_terms"
      });
    }

    const seen=new Set();
    const unique=list.filter(x=>{if(!x.id||seen.has(x.id))return false;seen.add(x.id);return true;});
    unique.sort((a,b)=>String(a.name).localeCompare(String(b.name),"ar"));
    return json({
      ok:true,version:2,reciters:unique,
      meta:{mp3quran:mp3Reciters.length,aqcCurated:AQC_EDITIONS.length}
    });
  } catch(e) {
    return json({ok:false,error:"reciters_unavailable"},502);
  }
}

async function cachedFetch(url,ttl){
  const res=await fetch(url,{cf:{cacheTtl:ttl,cacheEverything:true},headers:{accept:"application/json"}});
  if(!res.ok) throw new Error("upstream");
  return res.json();
}
function norm(s){
  return String(s||"").toLowerCase()
    .replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
    .replace(/[^\u0600-\u06FFa-z0-9]+/g,"").trim();
}
function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    "content-type":"application/json; charset=UTF-8",
    "cache-control":status===200?"public, max-age=900, s-maxage=21600":"no-store"
  }});
}
