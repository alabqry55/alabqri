/**
 * Cloudflare Pages Function — /api/visitors
 * total = total page visits; today = unique visitors today; now = active visitors in last 5 minutes.
 * No IP address is stored.
 */
export async function onRequestGet({ env, request }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS visitor_sessions (
      session_id TEXT PRIMARY KEY,
      first_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_visit_date TEXT
    )`).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS visitor_daily (
      visit_date TEXT PRIMARY KEY,
      unique_visitors INTEGER NOT NULL DEFAULT 0
    )`).run();

    const cookieHeader = request.headers.get("Cookie") || "";
    const existingId = readCookie(cookieHeader, "abq_vid");
    const sessionId = existingId || crypto.randomUUID();
    const cairoDate = new Intl.DateTimeFormat("en-CA", {
      timeZone:"Africa/Cairo", year:"numeric", month:"2-digit", day:"2-digit"
    }).format(new Date());

    const session = existingId ? await env.DB.prepare(
      `SELECT session_id,last_visit_date FROM visitor_sessions WHERE session_id=?1`
    ).bind(existingId).first() : null;
    const isNewToday = !session || session.last_visit_date !== cairoDate;

    await env.DB.prepare(`INSERT INTO visitors (id,total,updated_at)
      VALUES (1,1,CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET total=total+1,updated_at=CURRENT_TIMESTAMP`).run();

    await env.DB.prepare(`INSERT INTO visitor_sessions
      (session_id,first_seen,last_seen,last_visit_date)
      VALUES (?1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?2)
      ON CONFLICT(session_id) DO UPDATE SET
        last_seen=CURRENT_TIMESTAMP,last_visit_date=?2`).bind(sessionId,cairoDate).run();

    if (isNewToday) {
      await env.DB.prepare(`INSERT INTO visitor_daily (visit_date,unique_visitors)
        VALUES (?1,1)
        ON CONFLICT(visit_date) DO UPDATE SET unique_visitors=unique_visitors+1`).bind(cairoDate).run();
    }

    await env.DB.prepare(`DELETE FROM visitor_sessions
      WHERE last_seen < datetime('now','-2 days')`).run();

    const row=await env.DB.prepare(`SELECT total,updated_at FROM visitors WHERE id=1`).first();
    const daily=await env.DB.prepare(`SELECT unique_visitors FROM visitor_daily WHERE visit_date=?1`).bind(cairoDate).first();
    const active=await env.DB.prepare(`SELECT COUNT(*) AS active_now FROM visitor_sessions
      WHERE last_seen >= datetime('now','-5 minutes')`).first();

    return new Response(JSON.stringify({
      total:Number(row?.total||0),
      today:Number(daily?.unique_visitors||0),
      now:Number(active?.active_now||0),
      updated_at:row?.updated_at||null
    }),{
      status:200,
      headers:{
        "content-type":"application/json; charset=UTF-8",
        "cache-control":"no-store, no-cache, must-revalidate",
        "set-cookie":`abq_vid=${encodeURIComponent(sessionId)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`
      }
    });
  } catch (error) {
    return json({ error:"Visitor counter database error." },500);
  }
}

function readCookie(header,name) {
  const prefix=name+"=";
  for(const part of header.split(";")){
    const item=part.trim();
    if(item.indexOf(prefix)===0) return decodeURIComponent(item.slice(prefix.length));
  }
  return null;
}
function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      "content-type":"application/json; charset=UTF-8",
      "cache-control":"no-store, no-cache, must-revalidate"
    }
  });
}
