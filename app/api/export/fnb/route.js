// app/api/export/fnb/route.js
// GET — builds and streams an .xlsx F&B report
// confirmed guest counts + dietary breakdown per wedding function

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabase = await createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const weddingId = searchParams.get("weddingId");

    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 });
    }

    // 1. fetch all wedding functions
    const { data: functions, error: fnError } = await supabase
      .from("wedding_functions")
      .select("id, name, function_date")
      .eq("wedding_id", weddingId)
      .order("function_date");

    if (fnError) {
      return NextResponse.json({ error: fnError.message }, { status: 500 });
    }

    // 2. fetch confirmed rsvps with guest details
    const { data: rsvps, error: rsvpError } = await supabase
      .from("rsvp_responses")
      .select("function_id, guest_count, dietary_requirements, guest_id")
      .eq("status", "confirmed");

    if (rsvpError) {
      return NextResponse.json({ error: rsvpError.message }, { status: 500 });
    }

    // 3. fetch guests for this wedding
    const guestIds = (rsvps || []).map((r) => r.guest_id).filter(Boolean);
    const { data: guests } = await supabase
      .from("guests")
      .select("id, full_name, email, phone, dietary_pref, group_tag, is_outstation")
      .in("id", guestIds);

    const guestMap = Object.fromEntries((guests || []).map((g) => [g.id, g]));

    // 4. build workbook
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Summary per function ─────────────────────────────────────────
    const summaryRows = [];
    summaryRows.push([
      "Function",
      "Date",
      "Confirmed Guests",
      "Total Headcount",
      "Vegetarian",
      "Non-Vegetarian",
      "Vegan",
      "Jain",
      "Gluten-Free",
      "Other / Not Specified",
    ]);

    for (const fn of functions || []) {
      const fnRsvps = (rsvps || []).filter((r) => r.function_id === fn.id);
      const confirmedGuests = fnRsvps.length;
      const totalHeadcount = fnRsvps.reduce((s, r) => s + (r.guest_count || 1), 0);

      // dietary from rsvp_responses.dietary_requirements
      const dietary = { vegetarian: 0, "non-vegetarian": 0, vegan: 0, jain: 0, "gluten-free": 0, other: 0 };
      for (const r of fnRsvps) {
        const d = (r.dietary_requirements || guestMap[r.guest_id]?.dietary_pref || "other").toLowerCase().trim();
        if (dietary[d] !== undefined) dietary[d]++;
        else dietary.other++;
      }

      summaryRows.push([
        fn.name,
        fn.function_date ? new Date(fn.function_date).toLocaleDateString() : "TBD",
        confirmedGuests,
        totalHeadcount,
        dietary["vegetarian"],
        dietary["non-vegetarian"],
        dietary["vegan"],
        dietary["jain"],
        dietary["gluten-free"],
        dietary["other"],
      ]);
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);

    // column widths
    summarySheet["!cols"] = [
      { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 16 },
      { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 10 },
      { wch: 14 }, { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // ── Sheet 2: Guest list per function ──────────────────────────────────────
    for (const fn of functions || []) {
      const fnRsvps = (rsvps || []).filter((r) => r.function_id === fn.id);

      const rows = [];
      rows.push([
        "Name", "Email", "Phone", "Group",
        "Dietary", "Headcount", "Outstation",
      ]);

      for (const r of fnRsvps) {
        const g = guestMap[r.guest_id];
        if (!g) continue;
        rows.push([
          g.full_name || "—",
          g.email || "—",
          g.phone || "—",
          g.group_tag || "general",
          r.dietary_requirements || g.dietary_pref || "not specified",
          r.guest_count || 1,
          g.is_outstation ? "Yes" : "No",
        ]);
      }

      if (rows.length === 1) {
        rows.push(["No confirmed guests yet", "", "", "", "", "", ""]);
      }

      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet["!cols"] = [
        { wch: 22 }, { wch: 26 }, { wch: 16 }, { wch: 14 },
        { wch: 16 }, { wch: 12 }, { wch: 12 },
      ];

      // sheet name max 31 chars
      const sheetName = fn.name.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, sheet, sheetName);
    }

    // ── Sheet 3: Outstation guests ────────────────────────────────────────────
    const outstationGuests = (guests || []).filter((g) => g.is_outstation);
    const outstationRows = [["Name", "Email", "Phone", "Group", "Dietary"]];
    for (const g of outstationGuests) {
      outstationRows.push([
        g.full_name || "—",
        g.email || "—",
        g.phone || "—",
        g.group_tag || "general",
        g.dietary_pref || "not specified",
      ]);
    }
    if (outstationRows.length === 1) {
      outstationRows.push(["No outstation guests", "", "", "", ""]);
    }
    const outstationSheet = XLSX.utils.aoa_to_sheet(outstationRows);
    outstationSheet["!cols"] = [
      { wch: 22 }, { wch: 26 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, outstationSheet, "Outstation Guests");

    // 5. convert to buffer and stream
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename = `fnb-report-${weddingId.slice(0, 8)}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buf.length.toString(),
      },
    });
  } catch (err) {
    console.error("[export/fnb] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
