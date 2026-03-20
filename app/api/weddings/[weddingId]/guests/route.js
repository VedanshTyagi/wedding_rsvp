import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { weddingId } = await params;
  const supabase = await createClient()

  try {
    const { data: guests, error: guestsError } = await supabase
      .from("guests")
      .select("id, full_name, email, phone, group_tag, dietary_pref, is_outstation, plus_one, plus_one_name, children_count")
      .eq("wedding_id", weddingId)
      .order("full_name", { ascending: true });

    if (guestsError) throw guestsError;

    const { data: functions, error: functionsError } = await supabase
      .from("wedding_functions")
      .select("id, name")
      .eq("wedding_id", weddingId)
      .order("function_date", { ascending: true });

    if (functionsError) throw functionsError;

    let rsvpRows = [];
    if (guests.length > 0) {
      const { data, error: rsvpError } = await supabase
        .from("rsvp_responses")
        .select("guest_id, function_id, status")
        .in("guest_id", guests.map((g) => g.id));
      if (rsvpError) throw rsvpError;
      rsvpRows = data ?? [];
}


    const rsvpLookup = {};
    for (const row of rsvpRows) {
      rsvpLookup[`${row.guest_id}_${row.function_id}`] = row.status;
    }

    const guestsWithRsvp = guests.map((guest) => {
      const rsvp = {};
      for (const fn of functions) {
        const key = `${guest.id}_${fn.id}`;
        rsvp[fn.name] = rsvpLookup[key] ?? "awaiting";
      }
      return {
        ...guest,
        name:           guest.full_name,
        dietary:        guest.dietary_pref,
        outstation:     guest.is_outstation,
        plus_one:       guest.plus_one       ?? false,
        plus_one_name:  guest.plus_one_name  ?? null,
        children_count: guest.children_count ?? 0,
        rsvp,
      };
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

export async function POST(request, { params }) {
  const { weddingId } = params;
  const supabase = createClient();

  try {
    const body = await request.json();
    const { name, phone, email, group_tag, dietary, outstation, function_ids } = body;

    if (!name?.trim()) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }
    if (!Array.isArray(function_ids) || function_ids.length === 0) {
      return NextResponse.json({ message: "At least one function must be selected" }, { status: 400 });
    }

    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .insert({
        wedding_id:    weddingId,
        full_name:     name.trim(),
        phone:         phone?.trim()  ?? null,
        email:         email?.trim()  ?? null,
        group_tag:     group_tag      ?? null,
        dietary_pref:  dietary        ?? null,
        is_outstation: outstation     ?? false,
      })
      .select("id")
      .single();

    if (guestError) throw guestError;

    const guestId = guest.id;

    const { error: inviteError } = await supabase
      .from("guest_function_invites")
      .insert(function_ids.map((fnId) => ({ guest_id: guestId, function_id: fnId })));

    if (inviteError) throw inviteError;

    const { error: rsvpError } = await supabase
      .from("rsvp_responses")
      .insert(function_ids.map((fnId) => ({
        guest_id:    guestId,
        function_id: fnId,
        status:      "pending",
      })));

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
