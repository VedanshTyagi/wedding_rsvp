"use client";

// app/dashboard/[weddingId]/crm/page.jsx
// CRM settings — API key, endpoint URL, last sync time, Sync Now button

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CRMPage() {
  const { weddingId } = useParams();

  const [crmUrl, setCrmUrl] = useState("");
  const [crmApiKey, setCrmApiKey] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [lastSyncData, setLastSyncData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  // ── load saved settings + last sync ────────────────────────────────────────
  useEffect(() => {
    async function load() {
      // load crm settings from weddings table
      const { data: wedding } = await supabase
        .from("weddings")
        .select("crm_webhook_url, crm_api_key")
        .eq("id", weddingId)
        .single();

      if (wedding) {
        setCrmUrl(wedding.crm_webhook_url || "");
        setCrmApiKey(wedding.crm_api_key || "");
      }

      // load last sync log
      const { data: log } = await supabase
        .from("crm_sync_log")
        .select("synced_at, payload, status")
        .eq("wedding_id", weddingId)
        .order("synced_at", { ascending: false })
        .limit(1)
        .single();

      if (log) {
        setLastSync(log.synced_at);
        setLastSyncData(log.payload?.summary || null);
      }
    }

    if (weddingId) load();
  }, [weddingId]);

  // ── save settings ───────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("weddings")
      .update({
        crm_webhook_url: crmUrl,
        crm_api_key: crmApiKey,
      })
      .eq("id", weddingId);

    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: "Failed to save settings: " + error.message });
    } else {
      setMessage({ type: "success", text: "Settings saved successfully." });
    }
  }

  // ── sync now ────────────────────────────────────────────────────────────────
  async function handleSync() {
    setSyncing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/crm-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
        },
        body: JSON.stringify({ weddingId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Sync failed");

      setLastSync(data.syncedAt);
      setLastSyncData(data.summary);
      setMessage({ type: "success", text: "Sync completed successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSyncing(false);
    }
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "Georgia, serif" }}>

      <h1 style={{ fontSize: 28, fontWeight: 400, color: "#2c1810", marginBottom: 4 }}>
        CRM Settings
      </h1>
      <p style={{ fontSize: 14, color: "#9e8878", marginTop: 0, marginBottom: 32 }}>
        Configure your CRM endpoint to sync confirmed RSVP data.
      </p>

      {/* settings form */}
      <div style={{ background: "#fff", border: "1px solid #e8ddd0", borderRadius: 12, padding: "24px 28px", marginBottom: 24 }}>
        <p style={labelStyle}>Webhook / endpoint URL</p>
        <input
          type="url"
          value={crmUrl}
          onChange={(e) => setCrmUrl(e.target.value)}
          placeholder="https://hooks.zapier.com/..."
          style={inputStyle}
        />

        <p style={{ ...labelStyle, marginTop: 20 }}>API key (optional)</p>
        <input
          type="password"
          value={crmApiKey}
          onChange={(e) => setCrmApiKey(e.target.value)}
          placeholder="Bearer token or API key"
          style={inputStyle}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ ...btnStyle, marginTop: 20 }}
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>

      {/* last sync info */}
      <div style={{ background: "#fdf5ee", border: "1px solid #e8ddd0", borderRadius: 12, padding: "20px 28px", marginBottom: 24 }}>
        <p style={labelStyle}>Last sync</p>
        {lastSync ? (
          <>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "#2c1810" }}>
              {new Date(lastSync).toLocaleString()}
            </p>
            {lastSyncData && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div style={statCard}>
                  <p style={statLabel}>Events synced</p>
                  <p style={statValue}>{lastSyncData.totalEvents}</p>
                </div>
                <div style={statCard}>
                  <p style={statLabel}>Confirmed guests</p>
                  <p style={statValue}>{lastSyncData.totalConfirmedGuests}</p>
                </div>
                <div style={statCard}>
                  <p style={statLabel}>Total headcount</p>
                  <p style={statValue}>{lastSyncData.totalHeadcount}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 14, color: "#9e8878" }}>Never synced</p>
        )}
      </div>

      {/* sync now button */}
      <button
        onClick={handleSync}
        disabled={syncing || !crmUrl}
        style={{
          ...btnStyle,
          background: syncing || !crmUrl ? "#ccc" : "#9A2143",
          width: "100%",
          padding: "14px",
          fontSize: 15,
          letterSpacing: 2,
          cursor: syncing || !crmUrl ? "not-allowed" : "pointer",
        }}
      >
        {syncing ? "Syncing..." : "Sync Now"}
      </button>

      {!crmUrl && (
        <p style={{ fontSize: 12, color: "#9e8878", textAlign: "center", marginTop: 8 }}>
          Save a webhook URL above to enable sync
        </p>
      )}

      {/* message banner */}
      {message && (
        <div style={{
          marginTop: 16,
          padding: "12px 16px",
          borderRadius: 8,
          background: message.type === "success" ? "#f0faf4" : "#fdf0f0",
          border: `1px solid ${message.type === "success" ? "#b6dfc6" : "#f0b6b6"}`,
          fontSize: 14,
          color: message.type === "success" ? "#1a5c35" : "#7a1a1a",
        }}>
          {message.text}
        </div>
      )}

      {/* export link */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #e8ddd0" }}>
        <p style={labelStyle}>Export</p>
        <a
          href={`/api/export/fnb?weddingId=${weddingId}`}
          style={{
            display: "inline-block",
            padding: "10px 24px",
            border: "1px solid #e8ddd0",
            borderRadius: 8,
            fontSize: 13,
            color: "#2c1810",
            textDecoration: "none",
            fontFamily: "Georgia, serif",
          }}
        >
          Download F&B report (.xlsx)
        </a>
        <p style={{ fontSize: 12, color: "#9e8878", marginTop: 6 }}>
          Confirmed guest counts and dietary breakdown per function
        </p>
      </div>

    </div>
  );
}

const labelStyle = {
  fontSize: 12,
  letterSpacing: 2,
  textTransform: "uppercase",
  color: "#9e8878",
  margin: "0 0 8px",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #e8ddd0",
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "Georgia, serif",
  color: "#2c1810",
  background: "#fdf8f3",
  boxSizing: "border-box",
};

const btnStyle = {
  background: "#9A2143",
  color: "#fdf8f3",
  border: "none",
  borderRadius: 8,
  padding: "10px 24px",
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "Georgia, serif",
  letterSpacing: 1,
};

const statCard = {
  background: "#fff",
  border: "1px solid #e8ddd0",
  borderRadius: 8,
  padding: "10px 14px",
};

const statLabel = {
  margin: "0 0 4px",
  fontSize: 11,
  color: "#9e8878",
  textTransform: "uppercase",
  letterSpacing: 1,
};

const statValue = {
  margin: 0,
  fontSize: 22,
  fontWeight: 500,
  color: "#2c1810",
};
