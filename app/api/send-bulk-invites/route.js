// FILE: app/api/send-bulk-invites/route.js
// Sends personalised invitation emails to multiple guests at once.
// Each guest gets an email showing ONLY their assigned functions.

import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { weddingId, guestIds } = await request.json();

    if (!weddingId || !guestIds?.length) {
      return NextResponse.json({ error: "weddingId and guestIds are required" }, { status: 400 });
    }

    // 1. Fetch wedding details
    const { data: wedding, error: wErr } = await supabase
      .from("weddings")
      .select("*")
      .eq("id", weddingId)
      .single();
    if (wErr) throw new Error("Failed to fetch wedding: " + wErr.message);

    // 2. Fetch all selected guests
    const { data: guests, error: gErr } = await supabase
      .from("guests")
      .select("id, full_name, email, phone")
      .in("id", guestIds);
    if (gErr) throw new Error("Failed to fetch guests: " + gErr.message);

    // 3. Fetch all function invites for these guests
    const { data: invites, error: iErr } = await supabase
      .from("guest_function_invites")
      .select("guest_id, function_id")
      .in("guest_id", guestIds);
    if (iErr) throw new Error("Failed to fetch invites: " + iErr.message);

    // 4. Fetch all wedding functions
    const functionIds = [...new Set((invites ?? []).map(i => i.function_id))];
    let functionsMap = {};
    if (functionIds.length > 0) {
      const { data: fns } = await supabase
        .from("wedding_functions")
        .select("id, name, function_date, start_time, venue_detail")
        .in("id", functionIds);
      for (const fn of (fns ?? [])) functionsMap[fn.id] = fn;
    }

    // 5. Build invite map: guestId → their functions
    const guestFnMap = {};
    for (const inv of (invites ?? [])) {
      if (!guestFnMap[inv.guest_id]) guestFnMap[inv.guest_id] = [];
      if (functionsMap[inv.function_id]) {
        guestFnMap[inv.guest_id].push(functionsMap[inv.function_id]);
      }
    }

    // 6. Send emails
    const results = { sent: 0, failed: 0, errors: [] };

    for (const guest of guests) {
      if (!guest.email) {
        results.failed++;
        results.errors.push({ guest: guest.full_name, reason: "No email address" });
        continue;
      }

      const guestFns = guestFnMap[guest.id] ?? [];

      // Build personalised message
      const bride = wedding.bride_name  || "Bride";
      const groom = wedding.groom_name  || "Groom";
      const bp    = wedding.bride_family;
      const gp    = wedding.groom_family;

      let textMsg = `Shubh Vivah\n\n`;
      if (bp || gp) {
        textMsg += `${bp || ""}${bp && gp ? " & " : ""}${gp || ""}\n`;
        textMsg += `cordially invite you to the wedding of\n\n`;
      }
      textMsg += `${bride} & ${groom}\n\n`;

      for (const fn of guestFns) {
        textMsg += `${fn.name}\n`;
        if (fn.function_date) textMsg += `Date: ${fn.function_date}\n`;
        if (fn.start_time)    textMsg += `Time: ${fn.start_time}\n`;
        if (fn.venue_detail)  textMsg += `Venue: ${fn.venue_detail}\n`;
        textMsg += "\n";
      }

      if (wedding.venue)      textMsg += `Venue: ${wedding.venue}${wedding.city ? `, ${wedding.city}` : ""}\n`;
      if (wedding.dress_code) textMsg += `Dress Code: ${wedding.dress_code}\n`;
      if (wedding.extra_note) textMsg += `\n${wedding.extra_note}\n`;
      textMsg += `\nWith love & blessings`;

      // Build HTML email
      const fnRowsHtml = guestFns.map(fn => `
        <div style="border-top:1px solid #e8ddd0;padding:14px 0;text-align:center;">
          <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(201,150,58,.9);opacity:.8;">${fn.name}</p>
          ${fn.function_date ? `<p style="margin:6px 0 0;font-size:16px;color:#f5d08a;font-family:'Georgia',serif;">${fn.function_date}</p>` : ""}
          ${fn.start_time    ? `<p style="margin:3px 0 0;font-size:12px;color:#f5d08a;opacity:.7;">${fn.start_time}</p>` : ""}
          ${fn.venue_detail  ? `<p style="margin:3px 0 0;font-size:11px;color:#f5d08a;opacity:.6;">${fn.venue_detail}</p>` : ""}
        </div>
      `).join("");

      const htmlEmail = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
        <body style="margin:0;padding:0;background:#f9f5ef;font-family:'Georgia',serif;">
          <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

            <!-- Card -->
            <div style="background:linear-gradient(145deg,#3d0b0b,#1a0505);border-radius:14px;overflow:hidden;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
              <div style="border:1px solid rgba(201,150,58,.4);border-radius:10px;margin:10px;padding:40px 48px;display:flex;flex-direction:column;align-items:center;gap:12px;">

                <p style="margin:0;color:rgba(201,150,58,.85);font-size:13px;opacity:.8;text-align:center;">ॐ गणेशाय नमः</p>
                <p style="margin:0;font-size:22px;text-align:center;">🪔 ॐ 🪔</p>
                <p style="margin:0;color:rgba(201,150,58,.85);font-size:11px;letter-spacing:3px;text-transform:uppercase;opacity:.75;text-align:center;">— शुभ विवाह —</p>

                <div style="width:80px;height:1px;background:rgba(201,150,58,.4);opacity:.5;"></div>

                ${bp || gp ? `
                <div style="color:#f5d08a;font-size:11px;text-align:center;opacity:.65;line-height:1.7;">
                  ${bp ? `<p style="margin:0;">${bp}</p>` : ""}
                  ${gp ? `<p style="margin:0;">${gp}</p>` : ""}
                  <p style="margin:4px 0 0;font-size:10px;opacity:.7;">joyfully invite you to celebrate</p>
                </div>` : ""}

                <p style="margin:0;color:#f5d08a;font-family:'Georgia',serif;font-size:28px;font-weight:700;text-align:center;line-height:1.2;">${bride}</p>
                <p style="margin:0;color:rgba(201,150,58,.85);font-family:'Georgia',serif;font-size:18px;font-style:italic;opacity:.8;">weds</p>
                <p style="margin:0;color:#f5d08a;font-family:'Georgia',serif;font-size:28px;font-weight:700;text-align:center;line-height:1.2;">${groom}</p>

                <div style="width:80px;height:1px;background:rgba(201,150,58,.4);opacity:.5;"></div>

                ${fnRowsHtml}

                ${wedding.venue ? `
                <p style="margin:0;color:#f5d08a;font-size:11px;text-align:center;opacity:.6;line-height:1.6;">
                  ${wedding.venue}${wedding.city ? `, ${wedding.city}` : ""}
                </p>` : ""}

                ${wedding.dress_code ? `
                <p style="margin:0;color:rgba(201,150,58,.85);font-size:10px;text-align:center;opacity:.7;letter-spacing:1px;">
                  Dress Code: ${wedding.dress_code}
                </p>` : ""}

                <p style="margin:0;font-size:19px;text-align:center;opacity:.85;">❋ ✦ ❋</p>
              </div>
            </div>

            ${wedding.extra_note ? `
            <div style="margin-top:20px;background:#fff;border-radius:12px;padding:20px;border:1px solid #e8ddd0;text-align:center;">
              <p style="margin:0;font-size:13px;color:#4a3728;font-style:italic;">${wedding.extra_note}</p>
            </div>` : ""}

            <p style="text-align:center;font-size:11px;color:#9e8878;margin-top:24px;">
              Sent with WedRSVP
            </p>
          </div>
        </body>
        </html>
      `;

      try {
        const { error: sendErr } = await resend.emails.send({
          from:    "WedRSVP Invites <onboarding@resend.dev>",
          to:      [guest.email],
          subject: `You're Invited — ${bride} & ${groom}'s Wedding`,
          html:    htmlEmail,
          text:    textMsg,
        });

        if (sendErr) throw new Error(sendErr.message);
        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push({ guest: guest.full_name, reason: err.message });
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
    }

    return NextResponse.json(results);

  } catch (err) {
    console.error("[bulk-invites] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
