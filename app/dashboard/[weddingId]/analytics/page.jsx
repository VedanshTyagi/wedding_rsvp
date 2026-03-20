"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from "recharts";
import { createClient } from "@/lib/supabase/client";

const COLORS = {
  confirmed:  "#10b981",
  pending:    "#f59e0b",
  declined:   "#f43f5e",
  awaiting:   "#cbd5e1",
  outstation: "#6366f1",
  local:      "#a3e635",
};

const DIETARY_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#a3e635", "#06b6d4",
];

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className={`text-3xl font-bold ${color ?? "text-gray-900"}`}>{value}</p>
      <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
      {sub && <p className="text-xs text-steel mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── RSVP BAR CHART ───────────────────────────────────────────────────────────
function RsvpBarChart({ data }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-steel text-sm">
      No data yet
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        barCategoryGap="30%" barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false} tickLine={false}/>
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false} tickLine={false} allowDecimals={false}/>
        <Tooltip
          contentStyle={{
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: "12px", fontSize: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
          }}
          cursor={{ fill: "#f8fafc" }}
        />
        <Legend
          iconType="circle" iconSize={8}
          formatter={(v) => <span style={{ fontSize: 12, color: "#374151" }}>{v}</span>}
        />
        <Bar dataKey="confirmed" name="Confirmed" fill={COLORS.confirmed} radius={[4,4,0,0]}>
          <LabelList dataKey="confirmed" position="top"
            style={{ fontSize: 10, fill: "#6b7280" }}/>
        </Bar>
        <Bar dataKey="pending" name="Pending" fill={COLORS.pending} radius={[4,4,0,0]}>
          <LabelList dataKey="pending" position="top"
            style={{ fontSize: 10, fill: "#6b7280" }}/>
        </Bar>
        <Bar dataKey="declined" name="Declined" fill={COLORS.declined} radius={[4,4,0,0]}>
          <LabelList dataKey="declined" position="top"
            style={{ fontSize: 10, fill: "#6b7280" }}/>
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── OUTSTATION DONUT ─────────────────────────────────────────────────────────
function OutstationDonut({ outstation, local }) {
  const total = outstation + local;
  const data  = [
    { name: "Outstation", value: outstation, color: COLORS.outstation },
    { name: "Local",      value: local,      color: COLORS.local      },
  ].filter((d) => d.value > 0);

  if (total === 0) return (
    <div className="flex items-center justify-center h-48 text-steel text-sm">
      No guest data yet
    </div>
  );

  const outstationPct = Math.round((outstation / total) * 100);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={55} outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color}/>
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: "10px", fontSize: "12px"
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-bold text-gray-900">{outstationPct}%</p>
          <p className="text-xs text-steel">outstation</p>
        </div>
      </div>
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-500"/>
          <span className="text-xs text-navy">
            Outstation <strong>{outstation}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-lime-400"/>
          <span className="text-xs text-navy">
            Local <strong>{local}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── DIETARY TABLE ────────────────────────────────────────────────────────────
function DietaryTable({ counts, total }) {
  const LABELS = {
    veg:        { label: "Vegetarian",     icon: "🥦" },
    nonveg:     { label: "Non-Vegetarian", icon: "🍗" },
    vegan:      { label: "Vegan",          icon: "🌱" },
    jain:       { label: "Jain",           icon: "🙏" },
    vegetarian: { label: "Vegetarian",     icon: "🥦" },
    other:      { label: "Other",          icon: "✳️" },
  };

  const rows = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0);

  if (!rows.length) return (
    <p className="text-sm text-steel text-center py-6">No dietary data yet</p>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-cream">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-navy">Preference</th>
            <th className="px-4 py-3 text-center font-semibold text-navy">Count</th>
            <th className="px-4 py-3 text-left font-semibold text-navy w-40">Share</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {rows.map(([key, count], idx) => {
            const pct  = total > 0 ? Math.round((count / total) * 100) : 0;
            const info = LABELS[key] ?? { label: key, icon: "•" };
            return (
              <tr key={key} className="hover:bg-cream transition-colors">
                <td className="px-4 py-3 flex items-center gap-2">
                  <span>{info.icon}</span>
                  <span className="font-medium text-gray-800">{info.label}</span>
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-900">{count}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: DIETARY_COLORS[idx % DIETARY_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs text-steel w-8 text-right">{pct}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── OVERDUE RSVP LIST ────────────────────────────────────────────────────────
function OverdueRsvpList({ guests }) {
  if (!guests.length) return (
    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50
      border border-emerald-100 rounded-xl text-sm text-emerald-600">
      ✓ No overdue RSVPs — everyone has responded recently!
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-rose-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">Overdue RSVPs</h3>
        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 border border-rose-200
          rounded-full text-xs font-semibold">
          {guests.length} pending &gt; 7 days
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {guests.map((guest) => (
          <div key={guest.id}
            className="flex items-center gap-3 px-5 py-3 hover:bg-cream transition">
            <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-500
              text-sm flex items-center justify-center font-bold flex-shrink-0">
              {guest.full_name?.[0]?.toUpperCase() ?? "?"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{guest.full_name}</p>
              <p className="text-xs text-steel">{guest.functions?.join(", ")}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold text-rose-500">{guest.days_waiting}d</p>
              <p className="text-xs text-steel">waiting</p>
            </div>
            {guest.phone && (
              <a href={`tel:${guest.phone}`}
                className="flex-shrink-0 px-2 py-1 bg-indigo-50 text-indigo-600
                  rounded-lg text-xs font-medium hover:bg-indigo-100 transition">
                Call
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AnalyticsPage({ params }) {
  const { weddingId } = params;
  const supabase = createClient();

  const [barData,        setBarData]        = useState([]);
  const [outstation,     setOutstation]     = useState(0);
  const [local,          setLocal]          = useState(0);
  const [dietaryCounts,  setDietaryCounts]  = useState({});
  const [overdueGuests,  setOverdueGuests]  = useState([]);
  const [totalGuests,    setTotalGuests]    = useState(0);
  const [totalConfirmed, setTotalConfirmed] = useState(0);
  const [responseRate,   setResponseRate]   = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [exporting,      setExporting]      = useState(false);
  const [error,          setError]          = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // fetchAnalytics — loads all data in parallel
  // ─────────────────────────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [fnResult, rsvpResult, guestResult] = await Promise.all([
        supabase
          .from("wedding_functions")
          .select("id, name")
          .eq("wedding_id", weddingId)
          .order("function_date", { ascending: true }),

        supabase
          .from("rsvp_responses")
          .select("guest_id, function_id, status, responded_at"),

        supabase
          .from("guests")
          .select("id, full_name, phone, email, is_outstation, dietary_pref, created_at")
          .eq("wedding_id", weddingId),
      ]);

      if (fnResult.error)    throw fnResult.error;
      if (rsvpResult.error)  throw rsvpResult.error;
      if (guestResult.error) throw guestResult.error;

      const functions = fnResult.data   ?? [];
      const responses = rsvpResult.data ?? [];
      const guests    = guestResult.data ?? [];
      const guestIds  = new Set(guests.map((g) => g.id));

      // Filter to this wedding's guests only
      const weddingResponses = responses.filter((r) => guestIds.has(r.guest_id));

      // 1. Bar chart data
      const fnMap    = {};
      const barCounts = {};
      for (const fn of functions) {
        fnMap[fn.id]       = fn.name;
        barCounts[fn.name] = { name: fn.name, confirmed: 0, pending: 0, declined: 0 };
      }
      for (const r of weddingResponses) {
        const fnName = fnMap[r.function_id];
        if (fnName && barCounts[fnName] &&
          (r.status === "confirmed" || r.status === "pending" || r.status === "declined")) {
          barCounts[fnName][r.status]++;
        }
      }
      setBarData(Object.values(barCounts));

      // 2. Outstation vs local
      const outstationCount = guests.filter((g) => g.is_outstation).length;
      setOutstation(outstationCount);
      setLocal(guests.length - outstationCount);
      setTotalGuests(guests.length);

      // 3. Dietary counts
      const dietary = {};
      for (const g of guests) {
        const key = g.dietary_pref ?? "other";
        dietary[key] = (dietary[key] ?? 0) + 1;
      }
      setDietaryCounts(dietary);

      // 4. Response rate
      const confirmed = weddingResponses.filter((r) => r.status === "confirmed").length;
      const responded = weddingResponses.filter((r) => r.status !== "pending").length;
      setTotalConfirmed(confirmed);
      setResponseRate(
        weddingResponses.length > 0
          ? Math.round((responded / weddingResponses.length) * 100)
          : 0
      );

      // 5. Overdue RSVPs: pending > 7 days
      const now = new Date();
      const pendingByGuest = {};

      for (const r of weddingResponses) {
        if (r.status !== "pending") continue;
        const updatedAt   = new Date(r.responded_at ?? new Date());
        const daysWaiting = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
        if (daysWaiting < 7) continue;

        const fnName = fnMap[r.function_id] ?? "Unknown";
        if (!pendingByGuest[r.guest_id]) {
          pendingByGuest[r.guest_id] = { days_waiting: 0, functions: [] };
        }
        pendingByGuest[r.guest_id].functions.push(fnName);
        pendingByGuest[r.guest_id].days_waiting = Math.max(
          pendingByGuest[r.guest_id].days_waiting,
          daysWaiting
        );
      }

      const guestMap = {};
      for (const g of guests) guestMap[g.id] = g;

      const overdue = Object.entries(pendingByGuest)
        .map(([guestId, data]) => ({ ...guestMap[guestId], ...data }))
        .filter((g) => g.full_name)
        .sort((a, b) => b.days_waiting - a.days_waiting);

      setOverdueGuests(overdue);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // ─────────────────────────────────────────────────────────────────────────
  // handleExport
  // Calls GET /api/export/fnb and triggers browser file download.
  // ─────────────────────────────────────────────────────────────────────────
  async function handleExport() {
    try {
      setExporting(true);
      const res = await fetch(`/api/export/fnb?weddingId=${weddingId}`);
      if (!res.ok) throw new Error("Export failed");

      const disposition = res.headers.get("Content-Disposition");
      const filename = disposition
        ? disposition.split("filename=")[1]?.replace(/"/g, "") ?? "fnb-export.csv"
        : "fnb-export.csv";

      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  }

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-steel">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-rose-500 text-sm">⚠️ {error}</p>
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-steel mt-1">
            Live data from Supabase — refreshes on page load.
          </p>
        </div>

        {/* Buttons — grouped together */}
        <div className="flex items-center gap-2">

          {/* Export F&B button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700
              disabled:bg-indigo-400 text-white rounded-xl text-sm font-medium
              transition shadow-sm"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Exporting…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Export F&B
              </>
            )}
          </button>

          {/* Refresh button */}
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-sand
              rounded-xl text-sm font-medium text-navy hover:bg-cream
              transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>

        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Guests"    value={totalGuests}            color="text-gray-900"   />
        <StatCard label="Confirmed"       value={totalConfirmed}         color="text-emerald-600"
          sub="across all functions" />
        <StatCard label="Response Rate"   value={`${responseRate}%`}     color="text-indigo-600"
          sub="replied yes or no" />
        <StatCard label="Overdue RSVPs"   value={overdueGuests.length}
          color={overdueGuests.length > 0 ? "text-rose-500" : "text-steel"}
          sub="pending > 7 days" />
      </div>

      {/* Row 1: Bar Chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-1">RSVP by Function</h2>
          <p className="text-xs text-steel mb-5">
            Confirmed / Pending / Declined per wedding event
          </p>
          <RsvpBarChart data={barData} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6
          flex flex-col items-center justify-center">
          <h2 className="text-base font-bold text-gray-800 mb-1 self-start">Guest Origin</h2>
          <p className="text-xs text-steel mb-5 self-start">
            Outstation vs local guests
          </p>
          <OutstationDonut outstation={outstation} local={local} />
        </div>
      </div>

      {/* Row 2: Dietary Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-800 mb-1">Dietary Preferences</h2>
        <p className="text-xs text-steel mb-5">
          Breakdown of food requirements across all guests
        </p>
        <DietaryTable counts={dietaryCounts} total={totalGuests} />
      </div>

      {/* Row 3: Overdue RSVP list */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-4">
          Overdue RSVPs
          <span className="text-xs font-normal text-steel ml-2">
            Pending for more than 7 days
          </span>
        </h2>
        <OverdueRsvpList guests={overdueGuests} />
      </div>

    </div>
  );
}
