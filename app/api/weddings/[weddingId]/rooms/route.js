// app/api/weddings/[weddingId]/rooms/route.js
// POST — adds a new room to the wedding

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { weddingId } = await params;
 const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

  try {
    const body = await request.json();
    const { name, capacity, room_type } = body;

    if (!name || !capacity) {
      return NextResponse.json(
        { message: "name and capacity are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        wedding_id: weddingId,
        room_number: name,      // your schema uses room_number not name
        capacity:    Number(capacity),
        room_type:   room_type ?? "double",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ room: data }, { status: 201 });
  } catch (error) {
    console.error("[POST /rooms]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to add room" },
      { status: 500 }
    );
  }
}