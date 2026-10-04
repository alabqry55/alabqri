const MP3="https://mp3quran.net/api/v3";
const AQC="https://cdn.islamic.network/quran/audio";

export async function onRequestGet({request}){
  const u=new URL(request.url);
  const source=u.searchParams.get("source")||"alqurancloud";
  const surah=Number(u.searchParams.get("surah"));
  const ayah=Number(u.searchParams.get("ayah"));
  if(!Number.isInteger(surah)||surah<1||surah>114||!Number.isInteger(ayah)||ayah<1||ayah>286){
    return json({ok:false,error:"invalid_parameters"},400);
  }

  try{
    if(source==="alqurancloud"){
      const edition=u.searchParams.get("edition");
      if(!edition||!/^[a-z0-9._-]+$/i.test(edition)) return json({ok:false,error:"invalid_edition"},400);
      const global=await globalAyah(surah,ayah);
      return json({
        ok:true,source:"alqurancloud",
        audioUrl:AQC+"/128/"+encodeURIComponent(edition)+"/"+global+".mp3",
        start:0,end:null,exactAyah:true,
        attribution:"Al Quran Cloud / Islamic Network"
      });
    }

    if(source==="mp3quran"){
      const read=Number(u.searchParams.get("read"));
      const reciter=Number(u.searchParams.get("reciter"));
      if(!Number.isInteger(read)||read<1||read>10000||!Number.isInteger(reciter)||reciter<1||reciter>10000){
        return json({ok:false,error:"invalid_read"},400);
      }

      const [r,t]=await Promise.all([
        upstream(MP3+"/reciters?language=ar&reciter="+reciter,21600),
        upstream(MP3+"/ayat_timing?surah="+surah+"&read="+read,86400)
      ]);
      const m=(r.reciters?.[0]?.moshaf||[]).find(x=>Number(x.id)===read);
      const timing=Array.isArray(t)?t.find(x=>Number(x.ayah)===ayah):null;
      if(!m||!timing) return json({ok:false,error:"timing_unavailable"},404);

      const server=String(m.server||"");
      if(!/^https:\/\/server\d+\.mp3quran\.net\//i.test(server)){
        return json({ok:false,error:"audio_source_not_allowed"},400);
      }
      return json({
        ok:true,source:"mp3quran",
        audioUrl:server+String(surah).padStart(3,"0")+".mp3",
        start:Number(timing.start_time||0)/1000,
        end:Number(timing.end_time||0)/1000,
        exactAyah:true,attribution:"MP3Quran.net"
      });
    }

    return json({ok:false,error:"source_not_supported"},400);
  }catch(e){
    return json({ok:false,error:"audio_unavailable"},502);
  }
}

async function globalAyah(surah,ayah){
  const data=await upstream("https://api.alquran.cloud/v1/surah/"+surah,86400);
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
