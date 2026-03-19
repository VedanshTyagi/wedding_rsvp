"use client";

// app/dashboard/[weddingId]/invites/send/page.jsx
// Send Invites page — pick template, select guests, choose channel, send

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TEMPLATES = [
  { id: "classic", label: "Classic Elegance", desc: "Warm ivory tones, serif typography" },
  { id: "modern", label: "Modern Minimal", desc: "Clean lines, sans-serif, monochrome" },
  { id: "floral", label: "Floral Garden", desc: "Soft pastels, botanical accents" },
];

const CHANNEL_OPTIONS = [
  { value: "auto", label: "Auto (use guest preference)" },
  { value: "whatsapp", label: "WhatsApp only" },
  { value: "email", label: "Email only" },
];

export default function SendInvitesPage() {
  const { weddingId } = useParams();

  const [guests, setGuests] = useState([]);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [template, setTemplate] = useState("classic");
  const [channel, setChannel] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [results, setResults] = useState(null);
  const [deliveryLog, setDeliveryLog] = useState([]);
  const [error, setError] = useState(null);

  // fetch guests for this wedding
  useEffect(() => {
    async function fetchGuests() {
      setFetching(true);
      const { data, error } = await supabase
        .from("guests")
        .select("id, full_name, email, phone, preferred_channel")
        .eq("wedding_id", weddingId)
        .order("first_name");

      if (!error) setGuests(data || []);
      setFetching(false);
    }
    fetchGuests();
  }, [weddingId]);

  // fetch recent delivery log
  useEffect(() => {
    async function fetchLog() {
      const { data } = await supabase
        .from("delivery_log")
        .select("id, guest_id, channel, status, error_message, sent_at, guests(first_name)")
        .order("sent_at", { ascending: false })
        .limit(20);
      setDeliveryLog(data || []);
    }
    fetchLog();
  }, [results]);

  function toggleGuest(id) {
    setSelectedGuests((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    setSelectedGuests(
      selectedGuests.length === guests.length ? [] : guests.map((g) => g.id)
    );
  }

  async function handleSend() {
    if (selectedGuests.length === 0) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/invite/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
        },
        body: JSON.stringify({
          guestIds: selectedGuests,
          template,
          channelOverride: channel === "auto" ? null : channel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "Georgia, serif" }}>

      <h1 style={{ fontSize: 28, fontWeight: 400, color: "#2c1810", marginBottom: 4 }}>
        Send Invites
      </h1>
      <p style={{ fontSize: 14, color: "#9e8878", marginTop: 0, marginBottom: 32 }}>
        Select guests, choose a template and channel, then send.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>

        {/* template picker */}
        <div>
          <p style={labelStyle}>Invite template</p>
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              onClick={() => setTemplate(t.id)}
              style={{
                ...cardStyle,
                border: template === t.id ? "2px solid #2c1810" : "1px solid #e8ddd0",
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: "#2c1810" }}>{t.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9e8878" }}>{t.desc}</p>
            </div>
          ))}
        </div>

        {/* channel picker */}
        <div>
          <p style={labelStyle}>Channel</p>
          {CHANNEL_OPTIONS.map((c) => (
            <div
              key={c.value}
              onClick={() => setChannel(c.value)}
              style={{
                ...cardStyle,
                border: channel === c.value ? "2px solid #2c1810" : "1px solid #e8ddd0",
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: "#2c1810" }}>{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* guest list */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={labelStyle}>Guests ({guests.length})</p>
          <button onClick={toggleAll} style={ghostBtn}>
            {selectedGuests.length === guests.length ? "Deselect all" : "Select all"}
          </button>
        </div>

        {fetching ? (
          <p style={{ color: "#9e8878", fontSize: 14 }}>Loading guests...</p>
        ) : (
          <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid #e8ddd0", borderRadius: 8 }}>
            {guests.map((guest, i) => (
              <div
                key={guest.id}
                onClick={() => toggleGuest(guest.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  cursor: "pointer",
                  borderBottom: i < guests.length - 1 ? "1px solid #f0e8df" : "none",
                  background: selectedGuests.includes(guest.id) ? "#fdf5ee" : "#fff",
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4,
                  border: "1.5px solid #c9a96e",
                  background: selectedGuests.includes(guest.id) ? "#2c1810" : "transparent",
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {selectedGuests.includes(guest.id) && (
                    <span style={{ color: "#fff", fontSize: 11 }}>✓</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, color: "#2c1810" }}>{guest.first_name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#9e8878" }}>
                    {guest.email || guest.phone} · {guest.preferred_channel}
                  </p>
                </div>
                {guest.invite_sent_at && (
                  <span style={{ fontSize: 11, color: "#c9a96e", background: "#fdf5ee", padding: "2px 8px", borderRadius: 12 }}>
                    Sent
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* send button */}
      <button
        onClick={handleSend}
        disabled={loading || selectedGuests.length === 0}
        style={{
          background: selectedGuests.length === 0 ? "#ccc" : "#2c1810",
          color: "#fdf8f3",
          border: "none",
          borderRadius: 8,
          padding: "14px 40px",
          fontSize: 15,
          letterSpacing: 2,
          cursor: selectedGuests.length === 0 ? "not-allowed" : "pointer",
          fontFamily: "Georgia, serif",
          marginBottom: 24,
        }}
      >
        {loading ? "Sending..." : `Send to ${selectedGuests.length} guest${selectedGuests.length !== 1 ? "s" : ""}`}
      </button>

      {/* results banner */}
      {results && (
        <div style={{ background: "#f0faf4", border: "1px solid #b6dfc6", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 15, color: "#1a5c35" }}>
            ✓ Sent: <strong>{results.sent}</strong> &nbsp;·&nbsp; Failed: <strong>{results.failed}</strong>
          </p>
        </div>
      )}

      {error && (
        <div style={{ background: "#fdf0f0", border: "1px solid #f0b6b6", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 14, color: "#7a1a1a" }}>Error: {error}</p>
        </div>
      )}

      {/* delivery log */}
      <div>
        <p style={labelStyle}>Recent delivery log</p>
        {deliveryLog.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9e8878" }}>No deliveries yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e8ddd0" }}>
                {["Guest", "Channel", "Status", "Time"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#9e8878", fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveryLog.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f5ede5" }}>
                  <td style={{ padding: "8px 12px", color: "#2c1810" }}>{log.guests?.first_name || log.guest_id}</td>
                  <td style={{ padding: "8px 12px", color: "#4a3728" }}>{log.channel}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 12, fontSize: 12,
                      background: log.status === "sent" ? "#f0faf4" : "#fdf0f0",
                      color: log.status === "sent" ? "#1a5c35" : "#7a1a1a",
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", color: "#9e8878" }}>
                    {new Date(log.sent_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 12,
  letterSpacing: 2,
  textTransform: "uppercase",
  color: "#9e8878",
  marginBottom: 10,
  marginTop: 0,
};

const cardStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  background: "#fff",
};

const ghostBtn = {
  background: "transparent",
  border: "1px solid #e8ddd0",
  borderRadius: 6,
  padding: "6px 14px",
  fontSize: 12,
  cursor: "pointer",
  color: "#4a3728",
  fontFamily: "Georgia, serif",
};
