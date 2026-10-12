const jsonHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return Response.json({ valid: false, message: 'خدمة التحقق غير مهيأة حاليًا.' }, { status: 503, headers: jsonHeaders });
    }
    const body = await request.json();
    const certificateNumber = String(body?.certificateNumber || '').trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{3,59}$/.test(certificateNumber)) {
      return Response.json({ valid: false, message: 'يرجى إدخال رقم شهادة صحيح.' }, { status: 400, headers: jsonHeaders });
    }
    const cert = await env.DB.prepare(
      'SELECT certificate_number, holder_name, program_name, hours, issue_date, issuer, status FROM certificates WHERE certificate_number = ? LIMIT 1'
    ).bind(certificateNumber).first();
    if (!cert) {
      return Response.json({ valid: false, message: 'لم يتم العثور على شهادة بهذا الرقم في السجل الرسمي.' }, { status: 404, headers: jsonHeaders });
    }
    if (cert.status !== 'active') {
      return Response.json({ valid: false, status: 'revoked', message: 'هذه الشهادة ملغاة وغير سارية.' }, { status: 200, headers: jsonHeaders });
    }
    return Response.json({
      valid: true,
      certificateNumber: cert.certificate_number,
      traineeName: cert.holder_name,
      programName: cert.program_name,
      hours: cert.hours == null ? '' : String(cert.hours),
      issueDate: cert.issue_date,
      issuer: cert.issuer,
      status: 'active'
    }, { status: 200, headers: jsonHeaders });
  } catch (error) {
    return Response.json({ valid: false, message: 'تعذر إتمام التحقق الآن.' }, { status: 500, headers: jsonHeaders });
  }
}

export async function onRequestGet() {
  return Response.json({ endpoint: '/api/verify-certificate', method: 'POST', description: 'بوابة التحقق من شهادات مركز العبقري' }, { headers: jsonHeaders });
}
