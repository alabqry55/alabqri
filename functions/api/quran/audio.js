const MP3="https://www.mp3quran.net/api/v3";
const AQC_API="https://api.alquran.cloud/v1";
const AQC_CDN="https://cdn.islamic.network/quran/audio/128";

export async function onRequestGet({request}){
  const u=new URL(request.url);
  const source=u.searchParams.get("source")||"alqurancloud";
  const surah=Number(u.searchParams.get("surah"));
  const ayah=Number(u.searchParams.get("ayah"));
  if(!Number.isInteger(surah)||surah<1||surah>114||!Number.isInteger(ayah)||ayah<1||ayah>286)
    return json({ok:false,error:"invalid_parameters"},400);

  try{
    if(source==="alqurancloud"){
      const edition=u.searchParams.get("edition");
      if(!edition||!/^[a-z0-9._-]+$/i.test(edition)) return json({ok:false,error:"invalid_edition"},400);
      const global=await globalAyah(surah,ayah);
      const editions=await upstream(AQC_API+"/edition/format/audio",86400);
      const list=Array.isArray(editions?.data)?editions.data:[];
      const found=list.find(x=>String(x.identifier)===edition);
      if(!found) return json({ok:false,error:"edition_unavailable"},404);
      return json({
        ok:true,source:"alqurancloud",audioUrl:AQC_CDN+"/"+encodeURIComponent(edition)+"/"+global+".mp3",
        start:0,end:null,exactAyah:true,attribution:"Al Quran Cloud / Islamic Network"
      });
    }

    if(source==="mp3quran"){
      const read=Number(u.searchParams.get("read"));
      const reciter=Number(u.searchParams.get("reciter"));
      const fallbackEdition=u.searchParams.get("fallbackEdition")||"";
      if(!Number.isInteger(read)||read<1||read>10000||!Number.isInteger(reciter)||reciter<1||reciter>10000)
        return json({ok:false,error:"invalid_read"},400);

      const [reads,t]=await Promise.all([
        upstream(MP3+"/ayat_timing/reads",21600),
        upstream(MP3+"/ayat_timing?surah="+surah+"&read="+read,86400)
      ]);
      const m=(Array.isArray(reads)?reads:[]).find(x=>Number(x.id)===read);
      const timing=Array.isArray(t)?t.find(x=>Number(x.ayah)===ayah):null;
      if(m&&timing){
        const server=String(m.folder_url||"");
        if(/^https:\/\/(?:server\d+\.mp3quran\.net|cdn\.mp3quran\.net)\//i.test(server)){
          return json({
            ok:true,source:"mp3quran",
            audioUrl:server+String(surah).padStart(3,"0")+".mp3",
            start:Number(timing.start_time||0)/1000,end:Number(timing.end_time||0)/1000,
            exactAyah:true,attribution:"MP3Quran.net"
          });
        }
      }
      if(fallbackEdition&&/^[a-z0-9._-]+$/i.test(fallbackEdition)){
        const global=await globalAyah(surah,ayah);
        const editions=await upstream(AQC_API+"/edition/format/audio",86400);
        const found=(Array.isArray(editions?.data)?editions.data:[]).find(x=>String(x.identifier)===fallbackEdition);
        if(found) return json({
          ok:true,source:"alqurancloud",fallback:true,
          audioUrl:AQC_CDN+"/"+encodeURIComponent(fallbackEdition)+"/"+global+".mp3",
          start:0,end:null,exactAyah:true,attribution:"Al Quran Cloud / Islamic Network"
        });
      }
      return json({ok:false,error:"audio_unavailable"},404);
    }
    return json({ok:false,error:"source_not_supported"},400);
  }catch(e){
    return json({ok:false,error:"audio_unavailable"},502);
  }
}

async function globalAyah(surah,ayah){
  const data=await upstream(AQC_API+"/surah/"+surah,86400);
  const row=data.data?.ayahs?.find(a=>Number(a.numberInSurah)===ayah);
  if(!row) throw new Error("ayah");
  return Number(row.number);
}
async function upstream(url,ttl){
  const res=await fetch(url,{cf:{cacheTtl:ttl,cacheEverything:true},headers:{accept:"application/json"}});
  if(!res.ok) throw new Error("upstream");
  return res.json();
}
function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    "content-type":"application/json; charset=UTF-8",
    "cache-control":status===200?"public, max-age=300, s-maxage=3600":"no-store"
  }});
}
