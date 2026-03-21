// app/api/weddings/[weddingId]/rooms/[roomId]/route.js
// PATCH  — update room name, capacity, room_type
// DELETE — delete room and all its assignments

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function PATCH(request, { params }) {
  const { weddingId, roomId } = await params;
  const supabase = getClient();

  try {
    const { name, capacity, room_type } = await request.json();

    if (!name || !capacity) {
      return NextResponse.json(
        { message: "name and capacity are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("rooms")
      .update({
        room_number: name,
        capacity:    Number(capacity),
        room_type:   room_type ?? "double",
      })
      .eq("id", roomId)
      .eq("wedding_id", weddingId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ room: data }, { status: 200 });
  } catch (error) {
    console.error("[PATCH /rooms/:roomId]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to update room" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { weddingId, roomId } = await params;
  const supabase = getClient();

  try {
    // delete assignments first (FK constraint)
    const { error: assignError } = await supabase
      .from("room_assignments")
      .delete()
      .eq("room_id", roomId);

    if (assignError) throw assignError;

    // then delete the room
    const { error: roomError } = await supabase
      .from("rooms")
      .delete()
      .eq("id", roomId)
      .eq("wedding_id", weddingId);

    if (roomError) throw roomError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /rooms/:roomId]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to delete room" },
      { status: 500 }
    );
  }
}