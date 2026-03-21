// FILE: app/api/send-invite-email/route.js

import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { to, subject, guestName, message, cardDataUrl } = await request.json();

    if (!to) return NextResponse.json({ error: "No email address provided" }, { status: 400 });

    // Build HTML email body
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="margin:0;padding:0;background:#f9f5ef;font-family:'Georgia',serif;">
        <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

          <!-- Card image -->
          ${cardDataUrl ? `
          <div style="text-align:center;margin-bottom:32px;">
            <img src="${cardDataUrl}" alt="Wedding Invitation"
              style="width:100%;max-width:560px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.15);"/>
          </div>
          ` : ""}

          <!-- Message body -->
          <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e8ddd0;">
            <pre style="white-space:pre-wrap;font-family:'Georgia',serif;font-size:14px;
              line-height:1.8;color:#2c1810;margin:0;">${message}</pre>
          </div>

          <!-- Footer -->
          <p style="text-align:center;font-size:12px;color:#9e8878;margin-top:24px;">
            This invitation was sent with WedRSVP
          </p>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "WedRSVP Invites <onboarding@resend.dev>",
      to:   [to],
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });

  } catch (err) {
    console.error("Send invite email error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
