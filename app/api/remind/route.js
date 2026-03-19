// app/api/remind/route.js
// POST — finds pending RSVPs, fires WhatsApp or email reminders, updates reminder_sent_at

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
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildInviteLink(token) {
  return `${BASE_URL}/rsvp?token=${token}`;
}

function whatsappReminder(guest, link) {
  return (
    `Hi ${guest.full_name}! 🌸\n\n` +
    `Just a gentle reminder — we'd love to hear from you!\n\n` +
    `You haven't RSVP'd yet for *${process.env.COUPLE_NAMES}*'s wedding.\n\n` +
    `Please let us know if you can make it:\n${link}\n\n` +
    `Thank you! 💍`
  );
}

function buildReminderEmailHtml(guest, link) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Reminder — Please RSVP</title>
</head>
<body style="margin:0;padding:0;background:#fdf8f3;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f3;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8ddd0;">
          <tr>
            <td align="center" style="background:#2c1810;padding:32px 40px;">
              <p style="margin:0;font-size:13px;letter-spacing:4px;color:#c9a96e;text-transform:uppercase;">
                Gentle reminder
              </p>
              <h1 style="margin:12px 0 0;font-size:30px;color:#fdf8f3;font-weight:400;letter-spacing:2px;">
                ${process.env.COUPLE_NAMES}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 48px 32px;">
              <p style="margin:0 0 20px;font-size:18px;color:#2c1810;">Dear ${guest.full_name},</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#4a3728;">
                We noticed you haven't responded to our wedding invitation yet.
                We'd love to know if you can join us to celebrate our special day!
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.8;color:#4a3728;">
                Please take a moment to RSVP using your personal link below.
              </p>
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
          <tr>
            <td style="background:#fdf8f3;padding:24px 48px;border-top:1px solid #e8ddd0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9e8878;line-height:1.8;">
                Questions? Contact us at
                <a href="mailto:${process.env.COUPLE_EMAIL}" style="color:#c9a96e;">
                  ${process.env.COUPLE_EMAIL}
                </a>
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

// ─── send functions ────────────────────────────────────────────────────────────

async function sendWhatsApp(guest, link) {
  const message = await twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${guest.phone}`,
    body: whatsappReminder(guest, link),
  });
  return { sid: message.sid, status: message.status };
}

async function sendEmail(guest, link) {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: guest.email,
    subject: `Reminder: Please RSVP — ${process.env.COUPLE_NAMES} 💍`,
    html: buildReminderEmailHtml(guest, link),
  });
  if (error) throw new Error(error.message);
  return { messageId: data.id };
}

// ─── route handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.API_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // fetch pending guests where reminder never sent OR sent > 7 days ago
    const { data: pendingGuests, error: fetchError } = await supabase
      .from("rsvp_responses")
      .select(`
        id,
        guest_id,
        status,
        reminder_sent_at,
        guests (
          id,
          full_name,
          email,
          phone,
          preferred_channel,
          invite_token
        )
      `)
      .eq("status", "pending")
      .or(`reminder_sent_at.is.null,reminder_sent_at.lt.${sevenDaysAgo}`);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!pendingGuests || pendingGuests.length === 0) {
      return NextResponse.json({ message: "No pending reminders", reminded: 0 });
    }

    // fire reminders concurrently
    const results = await Promise.allSettled(
      pendingGuests.map(async (rsvp) => {
        const guest = rsvp.guests;
        if (!guest?.invite_token) {
          throw new Error(`No invite token for guest ${rsvp.guest_id}`);
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

          // update reminder_sent_at on rsvp_responses
          await supabase
            .from("rsvp_responses")
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("id", rsvp.id);

          // log to delivery_log
          await supabase.from("delivery_log").insert({
            guest_id: guest.id,
            channel,
            status: "sent",
            meta,
            sent_at: new Date().toISOString(),
          });

          return { guestId: guest.id, channel, status: "sent" };
        } catch (err) {
          await supabase.from("delivery_log").insert({
            guest_id: guest.id,
            channel,
            status: "failed",
            error_message: err.message,
            sent_at: new Date().toISOString(),
          });

          return { guestId: guest.id, channel, status: "failed", error: err.message };
        }
      })
    );

    const summary = results.map((r) =>
      r.status === "fulfilled" ? r.value : { status: "failed", error: r.reason?.message }
    );

    const reminded = summary.filter((r) => r.status === "sent").length;
    const failed = summary.filter((r) => r.status === "failed").length;

    return NextResponse.json({ reminded, failed, results: summary }, { status: 200 });
  } catch (err) {
    console.error("[remind] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
