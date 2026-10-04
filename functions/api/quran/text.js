const API="https://api.alquran.cloud/v1/surah/";
export async function onRequestGet({request}){
  const u=new URL(request.url), surah=Number(u.searchParams.get("surah"));
  if(!Number.isInteger(surah)||surah<1||surah>114) return json({ok:false,error:"invalid_surah"},400);
  try{
    const res=await fetch(API+surah+"/quran-uthmani",{cf:{cacheTtl:86400,cacheEverything:true},headers:{"accept":"application/json"}});
    if(!res.ok) throw new Error("upstream");
    const body=await res.json(), data=body.data||{};
    const ayahs=(data.ayahs||[]).map(a=>({number:Number(a.numberInSurah),globalNumber:Number(a.number),text:String(a.text||"")}));
    return json({ok:true,surah:{id:surah,name:data.name||"",ayahs}});
  }catch(e){return json({ok:false,error:"text_unavailable"},502);}
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{
  "content-type":"application/json; charset=UTF-8","cache-control":status===200?"public, max-age=3600, s-maxage=86400":"no-store"
}});}
