/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE:    app/api/weddings/[weddingId]/guests/route.js
 * PURPOSE: Handles all guest operations for a specific wedding.
 *
 * ROUTES:
 *   GET  /api/weddings/[weddingId]/guests        → fetch all guests + rsvp
 *   POST /api/weddings/[weddingId]/guests        → add new guest + invites + rsvp
 *
 * SUPABASE TABLES USED:
 *   guests                  — core guest record
 *   guest_function_invites  — which functions a guest is invited to
 *   rsvp_responses          — one row per guest per function (status = pending)
 *   wedding_functions       — the events for this wedding (mehendi, wedding etc)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/weddings/[weddingId]/guests
//
// Returns all guests for this wedding with their RSVP status per function.
//
// Response shape:
// {
//   guests: [
//     {
//       id, name, email, phone, group_tag, dietary, outstation,
//       rsvp: { "Mehendi": "confirmed", "Wedding": "pending" }
//     }
//   ],
//   functions: ["Mehendi", "Wedding", "Reception"]
// }
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  const { weddingId } = params;
  const supabase = createClient();

  try {
    // 1. Fetch all guests for this wedding
    const { data: guests, error: guestsError } = await supabase
      .from("guests")
      .select("id, name, email, phone, group_tag, dietary, outstation")
      .eq("wedding_id", weddingId)
      .order("name", { ascending: true });

    if (guestsError) throw guestsError;

    // 2. Fetch all wedding functions for this wedding
    const { data: functions, error: functionsError } = await supabase
      .from("wedding_functions")
      .select("id, name")
      .eq("wedding_id", weddingId)
      .order("date", { ascending: true });

    if (functionsError) throw functionsError;

    // 3. Fetch all rsvp_responses for this wedding in one query
    const { data: rsvpRows, error: rsvpError } = await supabase
      .from("rsvp_responses")
      .select("guest_id, function_id, status")
      .in("guest_id", guests.map((g) => g.id));

    if (rsvpError) throw rsvpError;

    // 4. Build a lookup: { "guestId_functionId": "confirmed" }
    const rsvpLookup = {};
    for (const row of rsvpRows) {
      rsvpLookup[`${row.guest_id}_${row.function_id}`] = row.status;
    }

    // 5. Build function name lookup: { id → name }
    const fnNameMap = {};
    for (const fn of functions) {
      fnNameMap[fn.id] = fn.name;
    }

    // 6. Attach rsvp object to each guest
    // rsvp = { "Mehendi": "confirmed", "Wedding": "pending", ... }
    const guestsWithRsvp = guests.map((guest) => {
      const rsvp = {};
      for (const fn of functions) {
        const key = `${guest.id}_${fn.id}`;
        rsvp[fn.name] = rsvpLookup[key] ?? "awaiting";
      }
      return { ...guest, rsvp };
    });

    return NextResponse.json({
      guests:    guestsWithRsvp,
      functions: functions.map((f) => f.name),
    });

  } catch (error) {
    console.error("[GET /guests]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to fetch guests" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/weddings/[weddingId]/guests
//
// Creates a new guest and seeds invites + pending RSVPs for each function.
//
// Request body:
// {
//   name, phone, email, group_tag, dietary, outstation,
//   function_ids: ["fn_001", "fn_002"]
// }
//
// DB writes:
//   1. INSERT INTO guests
//   2. INSERT INTO guest_function_invites (one per function_id)
//   3. INSERT INTO rsvp_responses status="pending" (one per function_id)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request, { params }) {
  const { weddingId } = params;
  const supabase = createClient();

  try {
    const body = await request.json();
    const { name, phone, email, group_tag, dietary, outstation, function_ids } = body;

    // Basic server-side validation
    if (!name?.trim()) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }
    if (!Array.isArray(function_ids) || function_ids.length === 0) {
      return NextResponse.json(
        { message: "At least one function must be selected" },
        { status: 400 }
      );
    }

    // 1. Insert guest row
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .insert({
        wedding_id: weddingId,
        name:       name.trim(),
        phone:      phone?.trim() ?? null,
        email:      email?.trim() ?? null,
        group_tag:  group_tag   ?? null,
        dietary:    dietary     ?? null,
        outstation: outstation  ?? false,
      })
      .select("id")
      .single();

    if (guestError) throw guestError;

    const guestId = guest.id;

    // 2. Insert guest_function_invites rows
    const inviteRows = function_ids.map((fnId) => ({
      guest_id:    guestId,
      function_id: fnId,
    }));

    const { error: inviteError } = await supabase
      .from("guest_function_invites")
      .insert(inviteRows);

    if (inviteError) throw inviteError;

    // 3. Seed rsvp_responses as "pending" for each function
    const rsvpRows = function_ids.map((fnId) => ({
      guest_id:    guestId,
      function_id: fnId,
      status:      "pending",
    }));

    const { error: rsvpError } = await supabase
      .from("rsvp_responses")
      .insert(rsvpRows);

    if (rsvpError) throw rsvpError;

    return NextResponse.json({ id: guestId }, { status: 201 });

  } catch (error) {
    console.error("[POST /guests]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to create guest" },
      { status: 500 }
    );
  }
}
