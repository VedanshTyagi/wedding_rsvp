/**
 * FILE: app/api/weddings/[weddingId]/accommodation/assign/route.js
 * POST   → assign a guest to a room
 * DELETE → unassign a guest from a room
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const supabase = createClient();

  try {
    const { room_id, guest_id } = await request.json();

    if (!room_id || !guest_id) {
      return NextResponse.json(
        { message: "room_id and guest_id are required" },
        { status: 400 }
      );
    }

    // Check room capacity before assigning
    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .select("capacity")
      .eq("id", room_id)
      .single();

    if (roomErr) throw roomErr;

    const { count, error: countErr } = await supabase
      .from("room_assignments")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room_id);

    if (countErr) throw countErr;

    if (count >= room.capacity) {
      return NextResponse.json(
        { message: "Room is full" },
        { status: 400 }
      );
    }

    // Insert assignment
    const { error } = await supabase
      .from("room_assignments")
      .insert({ room_id, guest_id });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    console.error("[POST /accommodation/assign]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to assign guest" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const supabase = createClient();

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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[DELETE /accommodation/assign]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to unassign guest" },
      { status: 500 }
    );
  }
}
