// Minimal no-dependency email helper.
// Sends via Resend HTTP API when RESEND_API_KEY is configured, otherwise
// no-ops gracefully — the registration link is still returned to the caller
// and shown on the success screen.
export type MailResult = { ok: boolean; sent: boolean; reason?: string }

export async function sendMail(opts: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: true, sent: false, reason: "RESEND_API_KEY not configured — email skipped" }
  }
  const from = process.env.RESEND_FROM || "Smart School <onboarding@resend.dev>"
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text }),
    })
    if (!res.ok) {
      const body = await res.text()
      return { ok: false, sent: false, reason: `Resend ${res.status}: ${body}` }
    }
    return { ok: true, sent: true }
  } catch (e) {
    return { ok: false, sent: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

export function registrationEmailHtml(opts: { schoolName: string; name: string; regFormNo: string; regLink: string; amount: number }) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5; padding:24px; font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e4e4e7;">
      <tr>
        <td style="background:#ff7732; padding:20px 28px;">
          <div style="color:#ffffff; font-size:18px; font-weight:bold;">${opts.schoolName}</div>
          <div style="color:#fff3ea; font-size:12px; margin-top:2px;">Admission Registration</div>
        </td>
      </tr>
      <tr><td style="padding:28px;">
        <p style="margin:0 0 16px; font-size:15px; color:#18181b;">Dear ${opts.name},</p>
        <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#3f3f46;">Thank you for paying the online admission enquiry fee of <strong>₹${opts.amount.toLocaleString("en-IN")}</strong>. Your registration form (No. <strong>${opts.regFormNo}</strong>) is ready.</p>
        <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#3f3f46;">Click the button below to open and complete your registration form:</p>
        <p style="margin:0 0 20px; text-align:center;">
          <a href="${opts.regLink}" style="display:inline-block; background:#ff7732; color:#ffffff; padding:12px 28px; border-radius:8px; text-decoration:none; font-size:14px; font-weight:bold;">Open Registration Form</a>
        </p>
        <p style="margin:0 0 6px; font-size:13px; color:#71717a;">If the button does not work, copy this link into your browser:</p>
        <p style="margin:0; font-size:12px; color:#a1a1aa; word-break:break-all;">${opts.regLink}</p>
      </td></tr>
      <tr><td style="background:#18181b; color:#a1a1aa; padding:14px 28px; font-size:11px;">This is an automated email — please do not reply.</td></tr>
    </table>
  </td></tr>
</table>`
}

export function registrationEmailText(opts: { schoolName: string; name: string; regFormNo: string; regLink: string; amount: number }) {
  return [
    `${opts.schoolName} — Admission Registration`,
    "",
    `Dear ${opts.name},`,
    "",
    `Thank you for paying the online admission enquiry fee of ₹${opts.amount.toLocaleString("en-IN")}.`,
    `Your registration form (No. ${opts.regFormNo}) is ready.`,
    "",
    `Open registration form: ${opts.regLink}`,
    "",
    "— Smart School",
  ].join("\n")
}