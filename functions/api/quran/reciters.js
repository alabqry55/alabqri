const MP3 = "https://www.mp3quran.net/api/v3";
const AQC = "https://api.alquran.cloud/v1";

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const lang = url.searchParams.get("language") || "ar";
  if (lang !== "ar") return json({ok:false,error:"language_not_supported"},400);
  try {
    const [mp3, timing, aqc] = await Promise.all([
      cachedFetch(MP3 + "/reciters?language=ar", 21600),
      cachedFetch(MP3 + "/ayat_timing/reads", 21600),
      cachedFetch(AQC + "/edition/format/audio", 21600)
    ]);
    const mp3Reciters = Array.isArray(mp3?.reciters) ? mp3.reciters : [];
    const timed = new Set((Array.isArray(timing)?timing:[]).map(x=>String(x.id)));
    const list = [];
    for (const r of mp3Reciters) {
      for (const m of (Array.isArray(r.moshaf)?r.moshaf:[])) {
        const id = String(m.id);
        list.push({
          id:"mp3quran:"+id, source:"mp3quran", reciterId:String(r.id),
          readId:id, name:String(r.name||"قارئ"), readName:String(m.name||""),
          server:String(m.server||""), surahTotal:Number(m.surah_total||0),
          surahs:String(m.surah_list||"").split(",").filter(Boolean).map(Number),
          exactAyah:timed.has(id), fallbackEdition:aqcByName.get(norm(r.name||""))||null, license:"provider_terms"
        });
      }
    }
    const aqcEditions = Array.isArray(aqc?.data)?aqc.data:[];
    const aqcByName = new Map(aqcEditions.filter(e=>e && e.language==="ar" && e.format==="audio").map(e=>[norm(e.name||""),String(e.identifier||"")]));
    for (const e of aqcEditions) {
      if (e && e.format==="audio" && e.language==="ar") {
        list.push({
          id:"alqurancloud:"+String(e.identifier||""),
          source:"alqurancloud", edition:String(e.identifier||""),
          reciterId:String(e.identifier||""), name:String(e.name||"قارئ"),
          englishName:String(e.englishName||""), readName:String(e.type||""),
          exactAyah:true, license:"provider_terms"
        });
      }
    }
    const seen=new Set();
    const unique=list.filter(x=>{ if(!x.id || seen.has(x.id)) return false; seen.add(x.id); return true; });
    unique.sort((a,b)=>a.name.localeCompare(b.name,"ar"));
    return json({ok:true,version:1,reciters:unique,meta:{mp3quran:mp3Reciters.length,alquranCloud:aqcEditions.length}});
  } catch(e) {
    return json({ok:false,error:"reciters_unavailable"},502);
  }
}

async function cachedFetch(url, ttl) {
  const res=await fetch(url,{cf:{cacheTtl:ttl,cacheEverything:true},headers:{"accept":"application/json"}});
  if(!res.ok) throw new Error("upstream");
  return res.json();
}
function norm(s){return String(s||"").toLowerCase().replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/[^\u0600-\u06FFa-z0-9]+/g,"").trim();}
function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    "content-type":"application/json; charset=UTF-8",
    "cache-control":status===200?"public, max-age=900, s-maxage=21600":"no-store"
  }});
}
