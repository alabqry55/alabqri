const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

function authorized(request, env) {
  const expected = env.CERTIFICATE_ADMIN_KEY;
  const supplied = request.headers.get('Authorization') || '';
  return Boolean(expected && supplied.startsWith('Bearer ') && supplied.slice(7) === expected);
}
function json(data, status = 200) {
  return Response.json(data, { status, headers });
}

export async function onRequest({ request, env }) {
  if (!env.DB) return json({ error: 'قاعدة بيانات الشهادات غير مهيأة.' }, 503);
  if (!env.CERTIFICATE_ADMIN_KEY) return json({ error: 'لم يتم إعداد مفتاح إدارة الشهادات على الخادم.' }, 503);
  if (!authorized(request, env)) return json({ error: 'غير مصرح بالوصول.' }, 401);

  try {
    if (request.method === 'GET') {
      const result = await env.DB.prepare(
        'SELECT certificate_number, holder_name, program_name, hours, issue_date, issuer, status, created_at, updated_at FROM certificates ORDER BY created_at DESC LIMIT 500'
      ).all();
      return json({ certificates: result.results || [] });
    }
    if (request.method === 'POST') {
      const body = await request.json();
      const certificateNumber = String(body?.certificateNumber || '').trim().toUpperCase();
      const holderName = String(body?.holderName || '').trim();
      const programName = String(body?.programName || '').trim();
      const issueDate = String(body?.issueDate || '').trim();
      const issuer = String(body?.issuer || 'مركز العبقري للتدريب والإستشارات').trim();
      const hours = body?.hours === '' || body?.hours == null ? null : Number(body.hours);
      if (!/^[A-Z0-9][A-Z0-9-]{3,59}$/.test(certificateNumber) ||
          !holderName || holderName.length > 180 ||
          !programName || programName.length > 180 ||
          !/^\\d{4}-\\d{2}-\\d{2}$/.test(issueDate) ||
          (hours !== null && (!Number.isInteger(hours) || hours < 0 || hours > 10000)) ||
          issuer.length > 180) {
        return json({ error: 'تحقق من رقم الشهادة والاسم والبرنامج والتاريخ وعدد الساعات.' }, 400);
      }
      const inserted = await env.DB.prepare(
        "INSERT INTO certificates (certificate_number, holder_name, program_name, hours, issue_date, issuer, status) VALUES (?, ?, ?, ?, ?, ?, 'active')"
      ).bind(certificateNumber, holderName, programName, hours, issueDate, issuer).run();
      if (!inserted.success) return json({ error: 'تعذر إضافة الشهادة.' }, 500);
      return json({ success: true, certificateNumber }, 201);
    }
    if (request.method === 'PATCH') {
      const body = await request.json();
      const certificateNumber = String(body?.certificateNumber || '').trim().toUpperCase();
      if (!/^[A-Z0-9][A-Z0-9-]{3,59}$/.test(certificateNumber)) return json({ error: 'رقم الشهادة غير صحيح.' }, 400);
      const result = await env.DB.prepare(
        "UPDATE certificates SET status = 'revoked', updated_at = CURRENT_TIMESTAMP WHERE certificate_number = ? AND status != 'revoked'"
      ).bind(certificateNumber).run();
      if (!result.meta?.changes) return json({ error: 'الشهادة غير موجودة أو ملغاة بالفعل.' }, 404);
      return json({ success: true, certificateNumber, status: 'revoked' });
    }
    return json({ error: 'الطريقة غير مدعومة.' }, 405);
  } catch (error) {
    if (String(error?.message || '').includes('UNIQUE')) return json({ error: 'رقم الشهادة مستخدم بالفعل.' }, 409);
    return json({ error: 'حدث خطأ أثناء معالجة الطلب.' }, 500);
  }
}
