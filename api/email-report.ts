import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { email, shareUrl, summary } = req.body ?? {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid email is required" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || "NetCheck <hello@getnetcheck.com>";

    if (!apiKey) {
      return res.status(500).json({ success: false, error: "Email provider not configured" });
    }

    const safeNet = typeof summary?.netProceeds === "number"
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(summary.netProceeds))
      : null;

    const html = `
      <div style="font-family: Inter, Arial, sans-serif; background:#f8fafc; padding:32px; color:#0f172a;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:20px; overflow:hidden;">
          <div style="padding:24px 24px 12px; background:linear-gradient(135deg,#ecfdf5 0%,#f8fafc 100%); border-bottom:1px solid #e2e8f0;">
            <div style="display:inline-block; background:#34d399; color:white; padding:10px 16px; border-radius:16px; font-size:24px; font-weight:800;">Net<span style="font-weight:300;">Check</span></div>
            <h1 style="margin:20px 0 8px; font-size:28px; line-height:1.1;">Your NetCheck report</h1>
            <p style="margin:0; color:#475569; font-size:16px;">Here’s the scenario you wanted to keep handy.</p>
          </div>
          <div style="padding:24px;">
            ${safeNet ? `<div style="padding:16px; border-radius:16px; background:#f8fafc; border:1px solid #e2e8f0; margin-bottom:20px;"><div style="font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:#64748b; margin-bottom:6px;">Estimated ${summary?.netProceeds >= 0 ? "net proceeds" : "bring to closing"}</div><div style="font-size:32px; font-weight:800; color:${summary?.netProceeds >= 0 ? "#10b981" : "#ef4444"};">${safeNet}</div></div>` : ""}
            <p style="margin:0 0 18px; color:#334155; line-height:1.6;">Open your scenario below to review the numbers, make edits, or share it with someone you trust.</p>
            <a href="${shareUrl}" style="display:inline-block; background:#34d399; color:white; text-decoration:none; padding:14px 18px; border-radius:14px; font-weight:700;">Open my NetCheck scenario</a>
            <p style="margin:18px 0 0; font-size:12px; color:#94a3b8; line-height:1.5;">NetCheck provides estimates only — not legal, tax, or financial advice. Actual results may vary.</p>
          </div>
        </div>
      </div>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Your NetCheck report",
        html,
      }),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      return res.status(502).json({ success: false, error: data?.message || data?.error || "Failed to send email" });
    }

    return res.json({ success: true, id: data.id });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || "Failed to send email" });
  }
}
