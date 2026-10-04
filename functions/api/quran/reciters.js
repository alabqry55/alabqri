const MP3="https://www.mp3quran.net/api/v3";

const AQC_EDITIONS=[
 ["ar.alafasy","مشاري راشد العفاسي"],["ar.husary","محمود خليل الحصري"],
 ["ar.minshawi","محمد صديق المنشاوي"],["ar.minshawimujawwad","محمد صديق المنشاوي"],
 ["ar.sudais","عبدالرحمن السديس"],["ar.shuraim","سعود الشريم"],
 ["ar.abdulbasit","عبد الباسط عبد الصمد"],["ar.abdulbasitmujawwad","عبد الباسط عبد الصمد"],
 ["ar.ajamy","أحمد بن علي العجمي"],["ar.muhammadayoub","محمد أيوب"],
 ["ar.hudhaify","علي بن عبدالرحمن الحذيفي"],["ar.muhammadjibreel","محمد جبريل"],
 ["ar.parhizgar","محمود خليل الحصري"],["ar.abdullahbasfar","عبدالله بصفر"]
];

export async function onRequestGet({request}){
 const lang=new URL(request.url).searchParams.get("language")||"ar";
 if(lang!=="ar")return json({ok:false,error:"language_not_supported"},400);
 try{
  const reads=await cachedFetch(MP3+"/ayat_timing/reads",21600);
  const timingReads=Array.isArray(reads)?reads:[];
  const fallbackMap=new Map(AQC_EDITIONS.map(([id,name])=>[norm(name),id]));
  const list=timingReads.map(r=>({
    id:"mp3quran:"+String(r.id),source:"mp3quran",
    reciterId:String(r.id),readId:String(r.id),
    name:String(r.name||"قارئ"),readName:String(r.rewaya||""),
    server:String(r.folder_url||""),surahTotal:Number(r.soar_count||0),
    exactAyah:true,fallbackEdition:fallbackMap.get(norm(r.name||""))||null,
    license:"provider_terms"
  }));
  for(const [edition,name] of AQC_EDITIONS){
   list.push({id:"alqurancloud:"+edition,source:"alqurancloud",edition,
     reciterId:edition,name,readName:"تلاوة آية بآية",exactAyah:true,license:"provider_terms"});
  }
  list.sort((a,b)=>String(a.name).localeCompare(String(b.name),"ar"));
  return json({ok:true,version:3,reciters:list,meta:{mp3quranTimed:timingReads.length,aqcCurated:AQC_EDITIONS.length}});
 }catch(e){return json({ok:false,error:"reciters_unavailable"},502);}
}

async function cachedFetch(url,ttl){
 const res=await fetch(url,{cf:{cacheTtl:ttl,cacheEverything:true},headers:{accept:"application/json"}});
 if(!res.ok)throw new Error("upstream"); return res.json();
}
function norm(s){return String(s||"").toLowerCase().replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/[^\u0600-\u06FFa-z0-9]+/g,"").trim();}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{
 "content-type":"application/json; charset=UTF-8",
 "cache-control":status===200?"public, max-age=900, s-maxage=21600":"no-store"
}});}
