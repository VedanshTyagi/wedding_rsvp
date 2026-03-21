// app/api/rsvp/route.js
// GET  — load guest + functions by invite_token
// POST — save RSVP responses

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ── GET /api/rsvp?token=xxx ───────────────────────────────────────────────────
export async function GET(request) {
  const supabase = getClient();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ message: "Token is required" }, { status: 400 });
  }

  try {
    // find guest by invite_token
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("id, full_name, dietary_preference, plus_one, plus_one_name, children_count, wedding_id")
      .eq("invite_token", token)
      .single();

    if (guestError || !guest) {
      return NextResponse.json({ message: "Invite not found" }, { status: 404 });
    }

    // get functions this guest is invited to
    const { data: invites, error: inviteError } = await supabase
      .from("guest_function_invites")
      .select("function_id")
      .eq("guest_id", guest.id);

    if (inviteError) throw inviteError;

    const functionIds = (invites ?? []).map((i) => i.function_id);

    if (functionIds.length === 0) {
      return NextResponse.json({ message: "No functions found for this invite" }, { status: 404 });
    }

    // get function details
    const { data: functions, error: fnError } = await supabase
      .from("wedding_functions")
      .select("id, name, function_date, start_time, venue_detail")
      .in("id", functionIds)
      .order("function_date", { ascending: true });

    if (fnError) throw fnError;

    // get existing rsvp responses
    const { data: rsvpRows } = await supabase
      .from("rsvp_responses")
      .select("function_id, status")
      .eq("guest_id", guest.id)
      .in("function_id", functionIds);

    const rsvpMap = {};
    for (const r of rsvpRows ?? []) {
      rsvpMap[r.function_id] = r.status;
    }

    // attach rsvp_status to each function
    const functionsWithRsvp = functions.map((fn) => ({
      ...fn,
      rsvp_status: rsvpMap[fn.id] ?? "pending",
    }));

    return NextResponse.json({
      guest,
      functions: functionsWithRsvp,
    });

  } catch (error) {
    console.error("[GET /api/rsvp]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to load invite" },
      { status: 500 }
    );
  }
}

// ── POST /api/rsvp ────────────────────────────────────────────────────────────
export async function POST(request) {
  const supabase = getClient();

  try {
    const body = await request.json();
    const { token, responses, dietary, plus_one, plus_one_name, children_count } = body;

    if (!token || !responses) {
      return NextResponse.json({ message: "Token and responses are required" }, { status: 400 });
    }

    // find guest
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("id")
      .eq("invite_token", token)
      .single();

    if (guestError || !guest) {
      return NextResponse.json({ message: "Invalid token" }, { status: 404 });
    }

    // update rsvp_responses for each function
    const updates = Object.entries(responses).map(([functionId, status]) =>
      supabase
        .from("rsvp_responses")
        .upsert({
          guest_id:             guest.id,
          function_id:          functionId,
          status,
          dietary_requirements: dietary,
          responded_at:         new Date().toISOString(),
        }, { onConflict: "guest_id,function_id" })
    );

    await Promise.all(updates);

    // update guest dietary + plus one + children
    await supabase
      .from("guests")
      .update({
        dietary_preference: dietary,
        plus_one:           plus_one,
        plus_one_name:      plus_one ? plus_one_name : null,
        children_count:     Number(children_count) || 0,
      })
      .eq("id", guest.id);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("[POST /api/rsvp]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to submit RSVP" },
      { status: 500 }
    );
  }
}
