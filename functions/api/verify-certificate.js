/**
 * Cloudflare Pages Function — POST /api/verify-certificate
 *
 * Public, read-only verification against the official D1 registry.
 * Never treats hard-coded/demo records as valid certificates.
 * Registry writes must be performed through a separately protected admin path.
 */
const JSON_HEADERS = {
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "no-store, no-cache, must-revalidate"
};

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ valid: false, message: "خدمة التحقق غير مهيأة حاليًا." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ valid: false, message: "صيغة الطلب غير صحيحة." }, 400);
  }

  const certificateNumber = String(body?.certificateNumber || "")
    .trim()
    .toUpperCase();

  if (!/^[A-Z0-9][A-Z0-9-]{3,59}$/.test(certificateNumber)) {
    return json({ valid: false, message: "يرجى إدخال رقم شهادة صحيح." }, 400);
  }

  try {
    const cert = await env.DB.prepare(
      `SELECT certificate_number, holder_name, program_name, hours,
              issue_date, issuer, status
       FROM certificates
       WHERE certificate_number = ?1
       LIMIT 1`
    ).bind(certificateNumber).first();

    if (!cert) {
      return json({
        valid: false,
        message: "لم يتم العثور على شهادة بهذا الرقم في السجل الرسمي."
      }, 404);
    }

    if (cert.status !== "active") {
      return json({
        valid: false,
        status: cert.status === "revoked" ? "revoked" : "inactive",
        message: cert.status === "revoked"
          ? "هذه الشهادة ملغاة وغير سارية."
          : "هذه الشهادة غير سارية."
      }, 200);
    }

    return json({
      valid: true,
      certificateNumber: cert.certificate_number,
      traineeName: cert.holder_name,
      programName: cert.program_name,
      hours: cert.hours == null ? "" : String(cert.hours),
      issueDate: cert.issue_date,
      issuer: cert.issuer,
      status: "active"
    });
  } catch (error) {
    // Keep database details out of the public response. A missing migration
    // is reported as not configured rather than falsely validating a record.
    const message = String(error?.message || "").toLowerCase();
    const missingRegistry = message.includes("no such table") &&
      message.includes("certificates");

    return json({
      valid: false,
      message: missingRegistry
        ? "سجل الشهادات لم يُهيأ بعد. يرجى المحاولة لاحقًا."
        : "تعذر إتمام التحقق الآن."
    }, missingRegistry ? 503 : 500);
  }
}

export async function onRequestGet() {
  return json({
    endpoint: "/api/verify-certificate",
    method: "POST",
    description: "بوابة التحقق من شهادات مركز العبقري"
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}
