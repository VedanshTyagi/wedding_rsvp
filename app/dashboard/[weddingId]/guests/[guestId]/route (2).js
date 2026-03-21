/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE:    app/api/weddings/[weddingId]/guests/[guestId]/route.js
 * PURPOSE: Handles single guest fetch and update.
 *
 * ROUTES:
 *   GET   /api/weddings/[weddingId]/guests/[guestId]  → fetch one guest
 *   PATCH /api/weddings/[weddingId]/guests/[guestId]  → update guest + invites
 *
 * SUPABASE TABLES USED:
 *   guests                  — core guest record
 *   guest_function_invites  — which functions guest is invited to
 *   rsvp_responses          — RSVP status per function
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/weddings/[weddingId]/guests/[guestId]
//
// Returns one guest with their current function invite IDs.
//
// Response shape:
// {
//   id, name, phone, email, group_tag, dietary, outstation,
//   function_ids: ["fn_001", "fn_002"]
// }
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  const { weddingId, guestId } = params;
  const supabase = createClient();

  try {
    // 1. Fetch the guest row
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("id, name, phone, email, group_tag, dietary, outstation")
      .eq("id", guestId)
      .eq("wedding_id", weddingId)
      .single();

    if (guestError) throw guestError;
    if (!guest) {
      return NextResponse.json({ message: "Guest not found" }, { status: 404 });
    }

    // 2. Fetch this guest's current function invites
    const { data: invites, error: inviteError } = await supabase
      .from("guest_function_invites")
      .select("function_id")
      .eq("guest_id", guestId);

    if (inviteError) throw inviteError;

    return NextResponse.json({
      ...guest,
      function_ids: invites.map((i) => i.function_id),
    });

  } catch (error) {
    console.error("[GET /guests/[guestId]]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to fetch guest" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/weddings/[weddingId]/guests/[guestId]
//
// Updates guest fields and diffs function invites:
//   added[]   → INSERT guest_function_invites + rsvp_responses (pending)
//   removed[] → DELETE guest_function_invites + rsvp_responses
//   unchanged → rsvp_responses left completely untouched
//
// Request body:
// {
//   name, phone, email, group_tag, dietary, outstation,
//   function_ids: ["fn_001", "fn_003"]   ← full new selection
// }
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  const { weddingId, guestId } = params;
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

    // 1. Update the guest row
    const { error: updateError } = await supabase
      .from("guests")
      .update({
        name:       name.trim(),
        phone:      phone?.trim() ?? null,
        email:      email?.trim() ?? null,
        group_tag:  group_tag   ?? null,
        dietary:    dietary     ?? null,
        outstation: outstation  ?? false,
      })
      .eq("id", guestId)
      .eq("wedding_id", weddingId);

    if (updateError) throw updateError;

    // 2. Fetch existing invites to compute diff
    const { data: existingInvites, error: fetchError } = await supabase
      .from("guest_function_invites")
      .select("function_id")
      .eq("guest_id", guestId);

    if (fetchError) throw fetchError;

    const existingIds = new Set(existingInvites.map((i) => i.function_id));
    const newIds      = new Set(function_ids);

    // added   = in new selection but NOT in existing
    const added   = function_ids.filter((id) => !existingIds.has(id));
    // removed = in existing but NOT in new selection
    const removed = [...existingIds].filter((id) => !newIds.has(id));

    // 3. Delete removed invites
    if (removed.length > 0) {
      const { error: deleteInviteError } = await supabase
        .from("guest_function_invites")
        .delete()
        .eq("guest_id", guestId)
        .in("function_id", removed);

      if (deleteInviteError) throw deleteInviteError;

      // Also delete their rsvp_responses
      const { error: deleteRsvpError } = await supabase
        .from("rsvp_responses")
        .delete()
        .eq("guest_id", guestId)
        .in("function_id", removed);

      if (deleteRsvpError) throw deleteRsvpError;
    }

    // 4. Insert new invites + seed pending RSVPs
    if (added.length > 0) {
      const { error: insertInviteError } = await supabase
        .from("guest_function_invites")
        .insert(added.map((fnId) => ({
          guest_id:    guestId,
          function_id: fnId,
        })));

      if (insertInviteError) throw insertInviteError;

      const { error: insertRsvpError } = await supabase
        .from("rsvp_responses")
        .insert(added.map((fnId) => ({
          guest_id:    guestId,
          function_id: fnId,
          status:      "pending",
        })));

      if (insertRsvpError) throw insertRsvpError;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[PATCH /guests/[guestId]]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to update guest" },
      { status: 500 }
    );
  }
}
