// app/api/weddings/[weddingId]/rooms/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request, { params }) {
  const { weddingId } = await params;
  const supabase = getClient();

  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("id, room_number, capacity, room_type, check_in_date, check_out_date, notes")
      .eq("wedding_id", weddingId)
      .order("room_number", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ rooms: data ?? [] });

  } catch (error) {
    console.error("[GET /rooms]", error);
    return NextResponse.json({ message: error.message ?? "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { weddingId } = await params;
  const supabase = getClient();

  try {
    const { name, capacity, room_type } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ message: "Room name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        wedding_id:  weddingId,
        room_number: name.trim(),
        capacity:    capacity ?? 2,
        room_type:   room_type ?? "double",
      })
      .select("id, room_number, capacity, room_type")
      .single();

    if (error) throw error;
    return NextResponse.json({ room: { ...data, name: data.room_number } }, { status: 201 });

  } catch (error) {
    console.error("[POST /rooms]", error);
    return NextResponse.json({ message: error.message ?? "Failed to add room" }, { status: 500 });
  }
}
