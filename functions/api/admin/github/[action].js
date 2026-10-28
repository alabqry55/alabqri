const OWNER_LOGIN = "alabqry55";
const OWNER_GITHUB_ID = "312770372";
const SESSION_COOKIE = "__Host-abq_admin";
const STATE_COOKIE = "__Host-abq_github_state";
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}});
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const encode = value => b64url(new TextEncoder().encode(value));
const decode = value => atob(value.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-value.length%4)%4));
const cookie = (request, name) => (request.headers.get("Cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="))?.slice(name.length+1) || "";
const setCookie = (name,value,maxAge) => name+"="+value+"; Path=/; Max-Age="+maxAge+"; Secure; HttpOnly; SameSite=Lax";
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return b64url(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value)));
}
async function verifySignature(value, signature, secret) {
  const expected = await sign(value,secret);
  if (expected.length !== signature.length) return false;
  let diff=0; for(let i=0;i<expected.length;i++) diff |= expected.charCodeAt(i)^signature.charCodeAt(i);
  return diff===0;
}
export async function readOwnerSession(request, env) {
  if (!env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length < 32) return null;
  const raw=cookie(request,SESSION_COOKIE);
  const dot=raw.lastIndexOf(".");
  if(dot<1) return null;
  const payload=raw.slice(0,dot), signature=raw.slice(dot+1);
  if(!await verifySignature(payload,signature,env.ADMIN_SESSION_SECRET)) return null;
  try {
    const session=JSON.parse(decode(payload));
    const now=Math.floor(Date.now()/1000);
    if(session.login!==OWNER_LOGIN || !session.id || !Number.isInteger(session.exp) || session.exp<=now || session.iat>now+60 || session.exp-session.iat>3600) return null;
    return {login:OWNER_LOGIN,id:String(session.id),expiresAt:session.exp};
  } catch { return null; }
}
export async function onRequest({request,env}) {
  const url=new URL(request.url);
  const action=url.pathname.split("/").filter(Boolean).pop();
  if(!["login","callback","session","logout"].includes(action)) return json({error:"Not found."},404);
  if(action==="session") {
    const owner=await readOwnerSession(request,env);
    return json({authenticated:Boolean(owner),admin:Boolean(owner),owner:owner?OWNER_LOGIN:null,expiresAt:owner?.expiresAt||null},owner?200:401);
  }
  if(action==="logout") {
    return new Response(null,{status:302,headers:{Location:"/", "Cache-Control":"no-store","Set-Cookie":setCookie(SESSION_COOKIE,"",0)}});
  }
  if(!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length<32) {
    return json({error:"GitHub OAuth is not configured. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET and a 32+ character ADMIN_SESSION_SECRET in Cloudflare Pages secrets."},503);
  }
  if(action==="login") {
    const state=b64url(crypto.getRandomValues(new Uint8Array(32)));
    const callback=url.origin+"/api/admin/github/callback";
    const authorize=new URL("https://github.com/login/oauth/authorize");
    authorize.searchParams.set("client_id",env.GITHUB_CLIENT_ID);
    authorize.searchParams.set("redirect_uri",callback);
    authorize.searchParams.set("scope","read:user");
    authorize.searchParams.set("state",state);
    return new Response(null,{status:302,headers:{Location:authorize.toString(),"Cache-Control":"no-store","Set-Cookie":setCookie(STATE_COOKIE,state,600)}});
  }
  if(action==="callback") {
    const state=cookie(request,STATE_COOKIE);
    const returned=url.searchParams.get("state")||"";
    const code=url.searchParams.get("code")||"";
    if(!state || !returned || state!==returned || !code) return json({error:"OAuth state validation failed."},400);
    const callback=url.origin+"/api/admin/github/callback";
    const tokenResponse=await fetch("https://github.com/login/oauth/access_token",{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json","User-Agent":"ALABQRI-Owner-Admin"},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code,redirect_uri:callback})});
    const tokenData=await tokenResponse.json().catch(()=>({}));
    if(!tokenResponse.ok || !tokenData.access_token) return json({error:"GitHub OAuth token exchange failed."},502);
    const userResponse=await fetch("https://api.github.com/user",{headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+tokenData.access_token,"X-GitHub-Api-Version":"2022-11-28","User-Agent":"ALABQRI-Owner-Admin"}});
    const user=await userResponse.json().catch(()=>({}));
    if(!userResponse.ok || String(user.login||"").toLowerCase()!==OWNER_LOGIN || String(user.id)!==OWNER_GITHUB_ID) {
      return new Response("غير مصرح بالدخول. لوحة الإدارة مخصصة لحساب GitHub alabqry55 فقط.",{status:403,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store","Set-Cookie":setCookie(STATE_COOKIE,"",0)}});
    }
    const now=Math.floor(Date.now()/1000);
    const payload=encode(JSON.stringify({id:String(user.id),login:OWNER_LOGIN,iat:now,exp:now+3600}));
    const session=payload+"."+await sign(payload,env.ADMIN_SESSION_SECRET);
    const headers=new Headers({"Location":"/","Cache-Control":"no-store","Referrer-Policy":"no-referrer"});
    headers.append("Set-Cookie",setCookie(SESSION_COOKIE,session,3600));
    headers.append("Set-Cookie",setCookie(STATE_COOKIE,"",0));
    return new Response(null,{status:302,headers});
  }
  return json({error:"Unsupported action."},400);
}
