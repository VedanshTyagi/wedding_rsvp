/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE:    app/api/weddings/[weddingId]/functions/route.js
 * PURPOSE: Returns all functions/events for a wedding.
 *          Used by the Add Guest and Edit Guest pages to render checkboxes.
 *
 * ROUTES:
 *   GET /api/weddings/[weddingId]/functions
 *
 * Response:
 * [
 *   { id: "fn_001", name: "Mehendi",   date: "2025-02-14", venue: "Garden" },
 *   { id: "fn_002", name: "Wedding",   date: "2025-02-15", venue: "Lawn"   },
 *   { id: "fn_003", name: "Reception", date: "2025-02-16", venue: "Hall"   }
 * ]
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { weddingId } = params;
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("wedding_functions")
      .select("id, name, date, venue")
      .eq("wedding_id", weddingId)
      .order("date", { ascending: true });

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
