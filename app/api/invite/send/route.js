// app/api/invite/send/route.js
// Wedding invite dispatcher — WhatsApp (Twilio) or Email (Resend)
// POST /api/invite/send
// Body: { guestIds: string[] }

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; // e.g. https://ourvows.com

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildInviteLink(token) {
  return `${BASE_URL}/rsvp?token=${token}`;
}

function whatsappMessage(guest, link) {
  return (
    `Hello ${guest.first_name}! 🌸\n\n` +
    `You're warmly invited to the wedding of *${process.env.COUPLE_NAMES}*.\n\n` +
    `Please RSVP using your personal link:\n${link}\n\n` +
    `We can't wait to celebrate with you! 💍`
  );
}

// ─── send functions ────────────────────────────────────────────────────────────

async function sendWhatsApp(guest, link) {
  const message = await twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, // e.g. whatsapp:+14155238886
    to: `whatsapp:${guest.phone}`,
    body: whatsappMessage(guest, link),
  });

  return { sid: message.sid, status: message.status };
}

async function sendEmail(guest, link) {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL, // e.g. "The Sharma Wedding <noreply@ourvows.com>"
    to: guest.email,
    subject: `You're invited! 💍 ${process.env.COUPLE_NAMES}`,
    html: buildEmailHtml(guest, link),
  });

  if (error) throw new Error(error.message);
  return { messageId: data.id };
}

// ─── logging ──────────────────────────────────────────────────────────────────

async function logDelivery({ guestId, channel, status, meta, errorMessage }) {
  const { error } = await supabase.from("delivery_log").insert({
    guest_id: guestId,
    channel,           // 'whatsapp' | 'email'
    status,            // 'sent' | 'failed'
    meta,              // sid / messageId / etc.
    error_message: errorMessage ?? null,
    sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[delivery_log] insert failed:", error.message);
  }
}

// ─── route handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { guestIds } = body;

    if (!Array.isArray(guestIds) || guestIds.length === 0) {
      return NextResponse.json(
        { error: "guestIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // 1. Fetch guests + their invite tokens in one query
    const { data: guests, error: fetchError } = await supabase
      .from("guests")
      .select("id, first_name, email, phone, preferred_channel, invite_token")
      .in("id", guestIds);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // 2. Dispatch invites concurrently
    const results = await Promise.allSettled(
      guests.map(async (guest) => {
        if (!guest.invite_token) {
          throw new Error(`No invite token for guest ${guest.id}`);
        }

        const link = buildInviteLink(guest.invite_token);
        const channel = guest.preferred_channel === "email" || !guest.phone
          ? "email"
          : "whatsapp";

        try {
          let meta;

          if (channel === "whatsapp") {
            meta = await sendWhatsApp(guest, link);
          } else {
            meta = await sendEmail(guest, link);
          }

          await logDelivery({ guestId: guest.id, channel, status: "sent", meta });

          return { guestId: guest.id, channel, status: "sent" };
        } catch (err) {
          await logDelivery({
            guestId: guest.id,
            channel,
            status: "failed",
            errorMessage: err.message,
          });

          return { guestId: guest.id, channel, status: "failed", error: err.message };
        }
      })
    );

    // 3. Summarise results
    const summary = results.map((r) =>
      r.status === "fulfilled" ? r.value : { status: "failed", error: r.reason?.message }
    );

    const sent = summary.filter((r) => r.status === "sent").length;
    const failed = summary.filter((r) => r.status === "failed").length;

    return NextResponse.json({ sent, failed, results: summary }, { status: 200 });
  } catch (err) {
    console.error("[invite/send] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── email template ────────────────────────────────────────────────────────────

function buildEmailHtml(guest, link) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're Invited!</title>
</head>
<body style="margin:0;padding:0;background:#fdf8f3;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f3;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8ddd0;">

          <!-- header -->
          <tr>
            <td align="center" style="background:#2c1810;padding:40px 40px 32px;">
              <p style="margin:0;font-size:13px;letter-spacing:4px;color:#c9a96e;text-transform:uppercase;">
                Together with their families
              </p>
              <h1 style="margin:12px 0 0;font-size:36px;color:#fdf8f3;font-weight:400;letter-spacing:2px;">
                ${process.env.COUPLE_NAMES}
              </h1>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td style="padding:40px 48px 32px;">
              <p style="margin:0 0 20px;font-size:18px;color:#2c1810;">
                Dear ${guest.first_name},
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#4a3728;">
                We joyfully request the pleasure of your company as we celebrate
                the beginning of our life together. Your presence would make our
                day truly complete.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.8;color:#4a3728;">
                Please use your personal link below to RSVP and let us know your
                meal preferences and any dietary requirements.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="background:#2c1810;border-radius:8px;padding:14px 36px;">
                    <a href="${link}"
                      style="color:#fdf8f3;text-decoration:none;font-size:15px;letter-spacing:2px;font-family:Georgia,serif;">
                      RSVP NOW
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#9e8878;text-align:center;word-break:break-all;">
                ${link}
              </p>
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="background:#fdf8f3;padding:24px 48px;border-top:1px solid #e8ddd0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9e8878;line-height:1.8;">
                This invitation was sent exclusively to you. Please do not share
                your link.<br/>
                Questions? Reply to this email or contact us at
                <a href="mailto:${process.env.COUPLE_EMAIL}"
                  style="color:#c9a96e;">${process.env.COUPLE_EMAIL}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}