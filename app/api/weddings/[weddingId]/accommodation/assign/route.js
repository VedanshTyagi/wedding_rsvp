// app/api/weddings/[weddingId]/accommodation/assign/route.js
// POST   — assigns a guest to a room
// DELETE — removes a guest from a room

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { weddingId } = await params;
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

  try {
    const { room_id, guest_id } = await request.json();

    if (!room_id || !guest_id) {
      return NextResponse.json(
        { message: "room_id and guest_id are required" },
        { status: 400 }
      );
    }

    // check room belongs to this wedding
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, capacity")
      .eq("id", room_id)
      .eq("wedding_id", weddingId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    // check capacity
    const { count } = await supabase
      .from("room_assignments")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room_id);

    if (count >= room.capacity) {
      return NextResponse.json({ message: "Room is full" }, { status: 409 });
    }

    // check not already assigned
    const { data: existing } = await supabase
      .from("room_assignments")
      .select("id")
      .eq("guest_id", guest_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { message: "Guest is already assigned to a room" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("room_assignments")
      .insert({ room_id, guest_id })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ assignment: data }, { status: 201 });
  } catch (error) {
    console.error("[POST /accommodation/assign]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to assign guest" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { weddingId } = await params;
  const supabase = await createClient();

  try {
    const { room_id, guest_id } = await request.json();

    if (!room_id || !guest_id) {
      return NextResponse.json(
        { message: "room_id and guest_id are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("room_assignments")
      .delete()
      .eq("room_id", room_id)
      .eq("guest_id", guest_id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /accommodation/assign]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to unassign guest" },
      { status: 500 }
    );
  }
}