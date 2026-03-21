import { createServerClient } from '@supabase/ssr'
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { weddingId } = await params;
  const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // ignore in Server Components
            }
          },
        },
      }
    )

  try {
    const { name, capacity, room_type } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ message: "Room name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        wedding_id:   weddingId,
        room_number:  name.trim(),   // ← mapped correctly
        capacity:     capacity ?? 2,
        room_type:    room_type ?? "double",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id }, { status: 201 });

  } catch (error) {
    console.error("[POST /rooms]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to add room" },
      { status: 500 }
    );
  }
}