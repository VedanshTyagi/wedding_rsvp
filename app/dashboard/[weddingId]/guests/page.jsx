"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GuestsPage() {
  const { weddingId } = useParams();
  const router = useRouter();

  const [guests, setGuests] = useState([]);
  const [summary, setSummary] = useState({});
  const [functionIds, setFunctionIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── fetch guests ────────────────────────────────────────────────────────────
  async function fetchGuests() {
    setLoading(true);

    const { data, error } = await supabase
      .from("guests")
      .select(`
        id, full_name, phone, email, group_tag,
        dietary_pref, is_outstation, travel_city,
        guest_function_invites ( function_id ),
        rsvp_responses ( status, function_id )
      `)
      .eq("wedding_id", weddingId)
      .order("full_name");

    if (!error) setGuests(data || []);
    setLoading(false);
  }

  // ── fetch rsvp summary ──────────────────────────────────────────────────────
  async function fetchSummary(fnIds) {
    if (!fnIds || fnIds.length === 0) return;

    const { data: rsvpSummary } = await supabase
      .from("rsvp_responses")
      .select(`
        status,
        wedding_functions ( id, name, function_date )
      `)
      .in("function_id", fnIds);

    if (!rsvpSummary) return;

    const grouped = rsvpSummary.reduce((acc, row) => {
      const fn = row.wedding_functions?.name;
      if (!fn) return acc;
      if (!acc[fn]) acc[fn] = { confirmed: 0, pending: 0, declined: 0 };
      acc[fn][row.status] = (acc[fn][row.status] || 0) + 1;
      return acc;
    }, {});

    setSummary(grouped);
  }

  // ── fetch wedding functions ─────────────────────────────────────────────────
  async function fetchFunctionIds() {
    const { data } = await supabase
      .from("wedding_functions")
      .select("id")
      .eq("wedding_id", weddingId);

    const ids = (data || []).map((f) => f.id);
    setFunctionIds(ids);
    return ids;
  }

  useEffect(() => {
    async function init() {
      const ids = await fetchFunctionIds();
      await fetchGuests();
      await fetchSummary(ids);
    }
    if (weddingId) init();
  }, [weddingId]);

  // ── add single guest ────────────────────────────────────────────────────────
  async function addGuest(guestData, fnIds) {
    const { data: guest, error } = await supabase
      .from("guests")
      .insert({ wedding_id: weddingId, ...guestData })
      .select()
      .single();

    if (error || !guest) {
      console.error("addGuest error:", error?.message);
      return;
    }

    const invites = fnIds.map((fid) => ({
      guest_id: guest.id,
      function_id: fid,
    }));
    await supabase.from("guest_function_invites").insert(invites);

    const rsvpRows = fnIds.map((fid) => ({
      guest_id: guest.id,
      function_id: fid,
      status: "pending",
    }));
    await supabase.from("rsvp_responses").insert(rsvpRows);

    await fetchGuests();
  }

  // ── csv upload ──────────────────────────────────────────────────────────────
  function handleCSVUpload(file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        const rows = data.map((row) => ({
          wedding_id: weddingId,
          full_name: row["Name"],
          phone: row["Phone"],
          email: row["Email"],
          group_tag: row["Group"]?.toLowerCase() || "general",
          dietary_pref: row["Dietary"]?.toLowerCase() || "vegetarian",
          is_outstation: row["Outstation"] === "Yes",
        }));

        const { error } = await supabase.from("guests").insert(rows);
        if (error) {
          console.error("CSV upload error:", error.message);
          return;
        }
        await fetchGuests();
      },
    });
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "Georgia, serif" }}>

      <h1 style={{ fontSize: 28, fontWeight: 400, color: "#2c1810", marginBottom: 4 }}>
        Guests
      </h1>
      <p style={{ fontSize: 14, color: "#9e8878", marginTop: 0, marginBottom: 32 }}>
        {guests.length} guest{guests.length !== 1 ? "s" : ""} for this wedding
      </p>

      {/* rsvp summary */}
      {Object.keys(summary).length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
          {Object.entries(summary).map(([fn, counts]) => (
            <div key={fn} style={{ background: "#fdf5ee", borderRadius: 8, padding: "12px 16px", border: "1px solid #e8ddd0" }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 500, color: "#2c1810" }}>{fn}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#1a5c35" }}>✓ {counts.confirmed || 0} confirmed</p>
              <p style={{ margin: 0, fontSize: 12, color: "#9e8878" }}>⏳ {counts.pending || 0} pending</p>
              <p style={{ margin: 0, fontSize: 12, color: "#7a1a1a" }}>✗ {counts.declined || 0} declined</p>
            </div>
          ))}
        </div>
      )}

      {/* csv upload */}
      <div style={{ marginBottom: 24, padding: "12px 16px", border: "1px dashed #e8ddd0", borderRadius: 8 }}>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#4a3728" }}>Upload guests via CSV</p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleCSVUpload(e.target.files[0])}
          style={{ fontSize: 13 }}
        />
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9e8878" }}>
          Columns: Name, Phone, Email, Group, Dietary, Outstation
        </p>
      </div>

      {/* guest list */}
      {loading ? (
        <p style={{ color: "#9e8878", fontSize: 14 }}>Loading guests...</p>
      ) : guests.length === 0 ? (
        <p style={{ color: "#9e8878", fontSize: 14 }}>No guests yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e8ddd0" }}>
              {["Name", "Phone", "Email", "Group", "Dietary", "RSVP"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#9e8878", fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => {
              const rsvpStatus = guest.rsvp_responses?.[0]?.status || "—";
              return (
                <tr key={guest.id} style={{ borderBottom: "1px solid #f5ede5" }}>
                  <td style={{ padding: "8px 12px", color: "#2c1810" }}>{guest.full_name}</td>
                  <td style={{ padding: "8px 12px", color: "#4a3728" }}>{guest.phone || "—"}</td>
                  <td style={{ padding: "8px 12px", color: "#4a3728" }}>{guest.email || "—"}</td>
                  <td style={{ padding: "8px 12px", color: "#4a3728" }}>{guest.group_tag || "—"}</td>
                  <td style={{ padding: "8px 12px", color: "#4a3728" }}>{guest.dietary_pref || "—"}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 12, fontSize: 12,
                      background: rsvpStatus === "confirmed" ? "#f0faf4" : rsvpStatus === "declined" ? "#fdf0f0" : "#fdf5ee",
                      color: rsvpStatus === "confirmed" ? "#1a5c35" : rsvpStatus === "declined" ? "#7a1a1a" : "#9e8878",
                    }}>
                      {rsvpStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}