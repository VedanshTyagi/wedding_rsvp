// app/api/weddings/[weddingId]/rooms/[roomId]/route.js
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

    if (!name?.trim()) {
      return NextResponse.json({ message: "Room name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("rooms")
      .update({
        room_number: name.trim(),
        capacity:    Number(capacity) ?? 2,
        room_type:   room_type ?? "double",
      })
      .eq("id", roomId)
      .eq("wedding_id", weddingId)
      .select("id, room_number, capacity, room_type")
      .single();

    if (error) throw error;
    return NextResponse.json({ room: { ...data, name: data.room_number } });

  } catch (error) {
    console.error("[PATCH /rooms/:roomId]", error);
    return NextResponse.json({ message: error.message ?? "Failed to update room" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { weddingId, roomId } = await params;
  const supabase = getClient();

  try {
    // delete assignments first
    const { error: assignError } = await supabase
      .from("room_assignments")
      .delete()
      .eq("room_id", roomId);

    if (assignError) throw assignError;

    // delete the room
    const { error: roomError } = await supabase
      .from("rooms")
      .delete()
      .eq("id", roomId)
      .eq("wedding_id", weddingId);

    if (roomError) throw roomError;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[DELETE /rooms/:roomId]", error);
    return NextResponse.json({ message: error.message ?? "Failed to delete room" }, { status: 500 });
  }
}
