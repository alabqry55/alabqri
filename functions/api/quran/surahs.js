const API="https://api.alquran.cloud/v1/surah";
export async function onRequestGet(){
  try{
    const res=await fetch(API,{cf:{cacheTtl:86400,cacheEverything:true},headers:{"accept":"application/json"}});
    if(!res.ok) throw new Error("upstream");
    const body=await res.json();
    const surahs=(body.data||[]).map(s=>({
      id:Number(s.number),name:String(s.name||""),englishName:String(s.englishName||""),
      englishTranslation:String(s.englishNameTranslation||""),
      revelationType:String(s.revelationType||""),ayahs:Number(s.numberOfAyahs||0)
    }));
    return json({ok:true,surahs});
  }catch(e){return json({ok:false,error:"surahs_unavailable"},502);}
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{
  "content-type":"application/json; charset=UTF-8","cache-control":status===200?"public, max-age=3600, s-maxage=86400":"no-store"
}});}
