const OWNER_LOGIN = "alabqry55";
const SESSION_COOKIE = "__Host-abq_admin";
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const decode = value => atob(value.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-value.length%4)%4));
const cookie = (request, name) => (request.headers.get("Cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="))?.slice(name.length+1) || "";
async function sign(value, secret) {
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return b64url(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value)));
}
async function safeEqual(a,b) {
  if(a.length!==b.length) return false;
  let diff=0; for(let i=0;i<a.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
export async function readOwnerSession(request, env) {
  if(!env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length<32) return null;
  const raw=cookie(request,SESSION_COOKIE), dot=raw.lastIndexOf(".");
  if(dot<1) return null;
  const payload=raw.slice(0,dot), signature=raw.slice(dot+1);
  if(!await safeEqual(await sign(payload,env.ADMIN_SESSION_SECRET),signature)) return null;
  try {
    const session=JSON.parse(decode(payload)), now=Math.floor(Date.now()/1000);
    if(session.login!==OWNER_LOGIN || !session.id || !Number.isInteger(session.exp) || !Number.isInteger(session.iat) ||
       session.exp<=now || session.iat>now+60 || session.exp-session.iat>3600) return null;
    return {login:OWNER_LOGIN,id:String(session.id),expiresAt:session.exp};
  } catch { return null; }
}
