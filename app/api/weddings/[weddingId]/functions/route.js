import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { weddingId } = params;
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("wedding_functions")
      .select("id, name, function_date, venue_detail")
      .eq("wedding_id", weddingId)
      .order("function_date", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? []);

  } catch (error) {
    console.error("[GET /functions]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to fetch functions" },
      { status: 500 }
    );
  }
}