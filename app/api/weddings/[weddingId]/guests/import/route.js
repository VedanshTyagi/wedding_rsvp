// app/api/weddings/[weddingId]/guests/import/route.js
// POST — accepts array of guests from CSV and bulk inserts them

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request, { params }) {
  const { weddingId } = await params;
  const supabase = getClient();

  try {
    const body = await request.json();
    const { guests } = body;

    if (!Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json(
        { message: "No guests provided" },
        { status: 400 }
      );
    }

    // fetch all functions for this wedding to auto-create rsvp_responses
    const { data: functions, error: fnError } = await supabase
      .from("wedding_functions")
      .select("id")
      .eq("wedding_id", weddingId);

    if (fnError) throw fnError;

    const functionIds = (functions ?? []).map((f) => f.id);

    // normalize and insert guests
    const guestRows = guests.map((g) => ({
      wedding_id:         weddingId,
      full_name:          g.full_name?.trim()          || g.name?.trim() || "Unknown",
      phone:              g.phone?.trim()               || null,
      email:              g.email?.trim()               || null,
      group_tag:          g.group_tag?.trim()           || "general",
      relationship:       g.relationship?.trim()        || null,
      dietary_preference: g.dietary_preference?.trim()  || g.dietary?.trim() || "vegetarian",
      plus_one:           g.plus_one === "true" || g.plus_one === true || false,
      plus_one_name:      g.plus_one_name?.trim()       || null,
      children_count:     parseInt(g.children_count)    || 0,
      is_outstation:      g.is_outstation === "true" || g.is_outstation === true || false,
      travel_city:        g.travel_city?.trim()         || null,
      preferred_channel:  g.preferred_channel?.trim()   || "whatsapp",
    }));

    const { data: insertedGuests, error: insertError } = await supabase
      .from("guests")
      .insert(guestRows)
      .select("id");

    if (insertError) throw insertError;

    // auto-create rsvp_responses + guest_function_invites for all functions
    if (functionIds.length > 0 && insertedGuests.length > 0) {
      const rsvpRows = [];
      const inviteRows = [];

      for (const guest of insertedGuests) {
        for (const fnId of functionIds) {
          rsvpRows.push({
            guest_id:    guest.id,
            function_id: fnId,
            status:      "pending",
          });
          inviteRows.push({
            guest_id:    guest.id,
            function_id: fnId,
          });
        }
      }

      const { error: rsvpError } = await supabase
        .from("rsvp_responses")
        .insert(rsvpRows);

      if (rsvpError) console.error("[import] rsvp_responses insert error:", rsvpError);

      const { error: inviteError } = await supabase
        .from("guest_function_invites")
        .insert(inviteRows);

      if (inviteError) console.error("[import] guest_function_invites insert error:", inviteError);
    }

    return NextResponse.json(
      {
        success: true,
        imported: insertedGuests.length,
        message: `${insertedGuests.length} guests imported successfully`,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("[POST /guests/import]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to import guests" },
      { status: 500 }
    );
  }
}
