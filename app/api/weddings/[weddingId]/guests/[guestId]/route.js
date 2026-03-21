import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { weddingId, guestId } = await params;
  const supabase = await createClient();

  try {
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("id, full_name, phone, email, group_tag, dietary_preference, is_outstation")
      .eq("id", guestId)
      .eq("wedding_id", weddingId)
      .single();

    if (guestError) throw guestError;
    if (!guest) return NextResponse.json({ message: "Guest not found" }, { status: 404 });

    const { data: invites, error: inviteError } = await supabase
      .from("guest_function_invites")
      .select("function_id")
      .eq("guest_id", guestId);

    if (inviteError) throw inviteError;

    return NextResponse.json({
      ...guest,
      name:         guest.full_name,
      dietary:      guest.dietary_preference,
      outstation:   guest.is_outstation,
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

export async function PATCH(request, { params }) {
  const { weddingId, guestId } = await params;
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { name, phone, email, group_tag, dietary, outstation, function_ids } = body;

    if (!name?.trim()) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("guests")
      .update({
        full_name:     name.trim(),
        phone:         phone?.trim()  ?? null,
        email:         email?.trim()  ?? null,
        group_tag:     group_tag      ?? null,
        dietary_preference:  dietary        ?? null,
        is_outstation: outstation     ?? false,
      })
      .eq("id", guestId)
      .eq("wedding_id", weddingId);

    if (updateError) throw updateError;

    const { data: existingInvites, error: fetchError } = await supabase
      .from("guest_function_invites")
      .select("function_id")
      .eq("guest_id", guestId);

    if (fetchError) throw fetchError;

    const existingIds = new Set(existingInvites.map((i) => i.function_id));
    const newIds      = new Set(function_ids);
    const added       = function_ids.filter((id) => !existingIds.has(id));
    const removed     = [...existingIds].filter((id) => !newIds.has(id));

    if (removed.length > 0) {
      await supabase.from("guest_function_invites").delete().eq("guest_id", guestId).in("function_id", removed);
      await supabase.from("rsvp_responses").delete().eq("guest_id", guestId).in("function_id", removed);
    }

    if (added.length > 0) {
      await supabase.from("guest_function_invites").insert(added.map((fnId) => ({ guest_id: guestId, function_id: fnId })));
      await supabase.from("rsvp_responses").insert(added.map((fnId) => ({ guest_id: guestId, function_id: fnId, status: "pending" })));
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