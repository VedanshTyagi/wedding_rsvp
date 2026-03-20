import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { weddingId } = await params;
  const supabase = await createClient();

  try {
    // 1. Fetch rooms
    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select("id, room_number, capacity, room_type, check_in_date")
      .eq("wedding_id", weddingId)
      .order("room_number", { ascending: true });

    if (roomsError) throw roomsError;

    // 2. Fetch assignments — skip if no rooms
    let assignments = [];
    if (rooms.length > 0) {
      const { data, error: assignError } = await supabase
        .from("room_assignments")
        .select("id, room_id, guest_id")
        .in("room_id", rooms.map((r) => r.id));

      if (assignError) throw assignError;
      assignments = data ?? [];
    }

    // 3. Fetch outstation guests
    const { data: outstationGuests, error: guestsError } = await supabase
      .from("guests")
      .select("id, full_name, phone, travel_city")
      .eq("wedding_id", weddingId)
      .eq("is_outstation", true)
      .order("full_name", { ascending: true });

    if (guestsError) throw guestsError;

    // Normalize room_number → name for frontend
    const normalizedRooms = rooms.map((r) => ({
      ...r,
      name: r.room_number,
    }));

    return NextResponse.json({
      rooms:             normalizedRooms  ?? [],
      assignments:       assignments,
      outstation_guests: outstationGuests ?? [],
    });

  } catch (error) {
    console.error("[GET /accommodation]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to fetch accommodation" },
      { status: 500 }
    );
  }
}