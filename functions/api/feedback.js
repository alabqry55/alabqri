/**
 * منصة العبقري — واجهة برمجية للآراء والتعليقات والإعجاب
 * المسار: /api/feedback
 * يتطلب: ربط قاعدة بيانات D1 باسم DB في إعدادات Cloudflare Pages
 *        (نفس الربط المستخدم أصلاً في /api/visitors)
 * كما يتطلب متغير بيئة FEEDBACK_ADMIN_KEY لحذف التعليقات من لوحة التحكم.
 *
 * جدول قاعدة البيانات المطلوب (نفّذه مرة واحدة فقط في D1، راجع ملف schema.sql):
 *   abq_feedback (id, name, text, rating, created_at, ip_hash)
 *   abq_likes    (ip_hash PRIMARY KEY, created_at)
 */

const BLOCKED_WORDS = ['كلب', 'حمار', 'غبي', 'لعنة', 'fuck', 'shit', 'bitch', 'asshole', 'idiot'];
const COOLDOWN_MS = 5 * 60 * 1000; // 5 دقائق بين كل تعليق وآخر لنفس الزائر
const MAX_TEXT_LEN = 500;
const MAX_NAME_LEN = 60;

function containsBlockedWord(value) {
  const lower = String(value || '').toLowerCase();
  return BLOCKED_WORDS.some((w) => lower.includes(w.toLowerCase()));
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

async function hashIP(ip, salt) {
  const data = new TextEncoder().encode(String(ip || 'unknown') + '|' + String(salt || 'abq'));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}

async function ensureTables(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS abq_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      text TEXT NOT NULL,
      rating TEXT,
      created_at TEXT NOT NULL,
      ip_hash TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS abq_likes (
      ip_hash TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    )`)
  ]);
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    await ensureTables(env.DB);

    const commentsRes = await env.DB.prepare(
      'SELECT id, name, text, rating, created_at as date FROM abq_feedback ORDER BY id DESC LIMIT 50'
    ).all();

    const likesRes = await env.DB.prepare('SELECT COUNT(*) as total FROM abq_likes').first();

    return jsonResponse({
      comments: (commentsRes.results || []).reverse(),
      likes: likesRes ? Number(likesRes.total) : 0
    });
  } catch (err) {
    return jsonResponse({ comments: [], likes: 0, error: 'server_error' }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    await ensureTables(env.DB);

    const body = await request.json().catch(() => ({}));
    const action = body.action;
    const ip = getClientIP(request);
    const ipHash = await hashIP(ip, env.FEEDBACK_IP_SALT || 'abqari-salt');

    if (action === 'like') {
      const existing = await env.DB.prepare('SELECT ip_hash FROM abq_likes WHERE ip_hash = ?')
        .bind(ipHash).first();

      if (!existing) {
        await env.DB.prepare('INSERT INTO abq_likes (ip_hash, created_at) VALUES (?, ?)')
          .bind(ipHash, new Date().toISOString()).run();
      }
      const likesRes = await env.DB.prepare('SELECT COUNT(*) as total FROM abq_likes').first();
      return jsonResponse({ likes: likesRes ? Number(likesRes.total) : 0 });
    }

    if (action === 'comment') {
      const name = String(body.name || '').trim().slice(0, MAX_NAME_LEN);
      const text = String(body.text || '').trim().slice(0, MAX_TEXT_LEN);
      const rating = String(body.rating || '').trim();
      const validRatings = ['excellent', 'good', 'average', 'suggestion'];

      if (!text) {
        return jsonResponse({ error: 'empty_text' }, 400);
      }
      if (!validRatings.includes(rating)) {
        return jsonResponse({ error: 'invalid_rating' }, 400);
      }
      if (containsBlockedWord(text) || containsBlockedWord(name)) {
        return jsonResponse({ error: 'inappropriate_content' }, 400);
      }

      // تحقق من حد الإرسال (5 دقائق لكل زائر عبر IP)، متجاوَز محلياً عبر localStorage لكن مطبَّق هنا فعلياً كحماية حقيقية
      const last = await env.DB.prepare(
        'SELECT created_at FROM abq_feedback WHERE ip_hash = ? ORDER BY id DESC LIMIT 1'
      ).bind(ipHash).first();

      if (last) {
        const elapsed = Date.now() - new Date(last.created_at).getTime();
        if (elapsed < COOLDOWN_MS) {
          return jsonResponse({ error: 'rate_limited' }, 429);
        }
      }

      const createdAt = new Date().toISOString();
      await env.DB.prepare(
        'INSERT INTO abq_feedback (name, text, rating, created_at, ip_hash) VALUES (?, ?, ?, ?, ?)'
      ).bind(name || 'زائر المنصة', text, rating, createdAt, ipHash).run();

      const commentsRes = await env.DB.prepare(
        'SELECT id, name, text, rating, created_at as date FROM abq_feedback ORDER BY id DESC LIMIT 50'
      ).all();

      return jsonResponse({ comments: (commentsRes.results || []).reverse() });
    }

    if (action === 'delete') {
      const adminKey = request.headers.get('X-Admin-Key') || '';
      if (!env.FEEDBACK_ADMIN_KEY || adminKey !== env.FEEDBACK_ADMIN_KEY) {
        return jsonResponse({ error: 'unauthorized' }, 401);
      }
      const id = Number(body.id);
      if (!id) return jsonResponse({ error: 'invalid_id' }, 400);

      await env.DB.prepare('DELETE FROM abq_feedback WHERE id = ?').bind(id).run();

      const commentsRes = await env.DB.prepare(
        'SELECT id, name, text, rating, created_at as date FROM abq_feedback ORDER BY id DESC LIMIT 50'
      ).all();

      return jsonResponse({ comments: (commentsRes.results || []).reverse() });
    }

    return jsonResponse({ error: 'unknown_action' }, 400);
  } catch (err) {
    return jsonResponse({ error: 'server_error' }, 500);
  }
}
