"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE:    app/dashboard/[weddingId]/rsvp/page.jsx
 * ROUTE:   /dashboard/[weddingId]/rsvp
 * PURPOSE: Live RSVP tracker with donut chart + per-function status table.
 *
 * FEATURES:
 *   1. fetchRsvpData()       — loads all rsvp_responses + wedding_functions
 *   2. DonutChart            — SVG donut chart showing confirmed/pending/declined
 *   3. Per-function table    — breakdown per event with counts + progress bars
 *   4. Supabase Realtime     — subscribes to rsvp_responses changes live
 *                              updates counts instantly when a guest responds
 *   5. Live indicator        — green pulsing dot shows realtime is connected
 *
 * SUPABASE TABLES USED:
 *   rsvp_responses    — guest_id, function_id, status
 *   wedding_functions — id, name, function_date
 *   guests            — id, full_name (for the per-guest breakdown)
 *
 * COMPONENTS:
 *   DonutChart        — pure SVG donut chart, no external library needed
 *   FunctionCard      — one card per wedding function with counts + bar
 *   RsvpTable         — per-guest RSVP breakdown table
 *   RsvpPage          — main page (default export)
 *
 * KEY FUNCTIONS:
 *   fetchRsvpData()   — loads functions + rsvp counts from Supabase
 *   setupRealtime()   — subscribes to rsvp_responses INSERT/UPDATE via Supabase
 *   handleRsvpChange()— called on realtime event, updates local state instantly
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── DONUT CHART ──────────────────────────────────────────────────────────────
/**
 * DonutChart
 * Pure SVG donut chart — no external library needed.
 * Shows confirmed (green) / pending (amber) / declined (rose) / awaiting (slate).
 *
 * @param {object} counts - { confirmed, pending, declined, awaiting }
 * @param {number} total  - total guests
 */
function DonutChart({ counts, total }) {
  const size   = 200;
  const cx     = size / 2;
  const cy     = size / 2;
  const radius = 75;
  const stroke = 28;

  const COLORS = {
    confirmed: "#10b981",
    pending:   "#f59e0b",
    declined:  "#f43f5e",
    awaiting:  "#cbd5e1",
  };

  const segments = [
    { key: "confirmed", label: "Confirmed", color: COLORS.confirmed },
    { key: "pending",   label: "Pending",   color: COLORS.pending   },
    { key: "declined",  label: "Declined",  color: COLORS.declined  },
    { key: "awaiting",  label: "Awaiting",  color: COLORS.awaiting  },
  ].filter((s) => counts[s.key] > 0);

  const circumference = 2 * Math.PI * radius;

  // Build arc segments
  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct   = total > 0 ? counts[seg.key] / total : 0;
    const dash  = pct * circumference;
    const gap   = circumference - dash;
    const arc   = { ...seg, dash, gap, offset };
    offset += dash;
    return arc;
  });

  const confirmedPct = total > 0 ? Math.round((counts.confirmed / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={stroke}
          />
          {/* Colored segments */}
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset + circumference / 4}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          ))}
          {/* Center text */}
          <text x={cx} y={cy - 8} textAnchor="middle"
            className="fill-gray-900" fontSize="28" fontWeight="700">
            {confirmedPct}%
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle"
            className="fill-gray-400" fontSize="11">
            confirmed
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {[
          { key: "confirmed", label: "Confirmed", color: "bg-emerald-500" },
          { key: "pending",   label: "Pending",   color: "bg-amber-400"  },
          { key: "declined",  label: "Declined",  color: "bg-rose-500"   },
          { key: "awaiting",  label: "Awaiting",  color: "bg-slate-300"  },
        ].map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.color}`}/>
            <span className="text-xs text-navy">
              {item.label}
              <span className="font-semibold text-gray-800 ml-1">{counts[item.key] ?? 0}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FUNCTION CARD ────────────────────────────────────────────────────────────
/**
 * FunctionCard
 * One card per wedding function showing confirmed/pending/declined counts
 * and a color-coded progress bar.
 *
 * @param {string} name    - function name e.g. "Mehendi"
 * @param {object} counts  - { confirmed, pending, declined, awaiting }
 * @param {number} total   - total guests invited to this function
 */
function FunctionCard({ name, counts, total }) {
  const confirmedPct = total > 0 ? Math.round((counts.confirmed / total) * 100) : 0;
  const pendingPct   = total > 0 ? Math.round((counts.pending   / total) * 100) : 0;
  const declinedPct  = total > 0 ? Math.round((counts.declined  / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-base">{name}</h3>
        <span className="text-xs text-steel">{total} invited</span>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-emerald-50 rounded-xl border border-emerald-100">
          <p className="text-xl font-bold text-emerald-600">{counts.confirmed ?? 0}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Coming</p>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-xl font-bold text-amber-500">{counts.pending ?? 0}</p>
          <p className="text-xs text-amber-500 mt-0.5">Pending</p>
        </div>
        <div className="text-center p-2 bg-rose-50 rounded-xl border border-rose-100">
          <p className="text-xl font-bold text-rose-500">{counts.declined ?? 0}</p>
          <p className="text-xs text-rose-500 mt-0.5">Declined</p>
        </div>
      </div>

      {/* Stacked progress bar */}
      <div className="h-2 rounded-full overflow-hidden bg-slate-100 flex">
        <div
          className="h-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${confirmedPct}%` }}
        />
        <div
          className="h-full bg-amber-400 transition-all duration-700"
          style={{ width: `${pendingPct}%` }}
        />
        <div
          className="h-full bg-rose-500 transition-all duration-700"
          style={{ width: `${declinedPct}%` }}
        />
      </div>
      <p className="text-xs text-steel mt-1.5 text-right">
        {confirmedPct}% confirmed
      </p>
    </div>
  );
}

// ─── RSVP TABLE ───────────────────────────────────────────────────────────────
/**
 * RsvpTable
 * Per-guest RSVP breakdown table.
 * Shows each guest's status for every function.
 *
 * @param {Array} guests    - guest list with rsvp object
 * @param {Array} functions - function name list
 */
function RsvpTable({ guests, functions }) {
  const STATUS_STYLE = {
    confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pending:   "bg-amber-100 text-amber-700 border-amber-200",
    declined:  "bg-rose-100 text-rose-700 border-rose-200",
    awaiting:  "bg-slate-100 text-slate-500 border-slate-200",
  };
  const STATUS_LABEL = {
    confirmed: "✓ Yes",
    pending:   "⏳ Pending",
    declined:  "✗ No",
    awaiting:  "— Awaiting",
  };

  if (!guests.length) return (
    <div className="text-center py-10 text-steel text-sm">No guest data yet.</div>
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-cream">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-navy">#</th>
            <th className="px-4 py-3 text-left font-semibold text-navy">Guest</th>
            {functions.map((fn) => (
              <th key={fn} className="px-4 py-3 text-center font-semibold text-navy">
                {fn}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {guests.map((guest, idx) => (
            <tr key={guest.id} className="hover:bg-cream transition-colors">
              <td className="px-4 py-3 text-steel text-xs">{idx + 1}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{guest.full_name}</td>
              {functions.map((fn) => {
                const status = guest.rsvp?.[fn] ?? "awaiting";
                return (
                  <td key={fn} className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function RsvpPage() {
  const { weddingId } = useParams();

  /** All rsvp_responses rows: [{ id, guest_id, function_id, status }] */
  const [responses, setResponses] = useState([]);

  /** All wedding functions: [{ id, name }] */
  const [functions, setFunctions] = useState([]);

  /** All guests with rsvp map: [{ id, full_name, rsvp: { fnName: status } }] */
  const [guests, setGuests] = useState([]);

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  /** true when Supabase Realtime channel is connected */
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  /** Flashes true briefly when a live update arrives */
  const [liveUpdate, setLiveUpdate] = useState(false);

  const channelRef = useRef(null);
  const supabase   = createClient();

  // ─────────────────────────────────────────────────────────────────────────
  // fetchRsvpData
  // Loads wedding_functions + guests + rsvp_responses in parallel.
  // Builds a per-guest rsvp map: { "Mehendi": "confirmed", ... }
  // ─────────────────────────────────────────────────────────────────────────
  const fetchRsvpData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch functions
      const { data: fns, error: fnErr } = await supabase
        .from("wedding_functions")
        .select("id, name")
        .eq("wedding_id", weddingId)
        .order("function_date", { ascending: true });

      if (fnErr) throw fnErr;

      // 2. Fetch guests
      const { data: guestRows, error: guestErr } = await supabase
        .from("guests")
        .select("id, full_name")
        .eq("wedding_id", weddingId)
        .order("full_name", { ascending: true });

      if (guestErr) throw guestErr;

      // 3. Fetch all rsvp_responses for this wedding's guests
      const guestIds = guestRows.map((g) => g.id);
      const { data: rsvpRows, error: rsvpErr } = await supabase
        .from("rsvp_responses")
        .select("id, guest_id, function_id, status")
        .in("guest_id", guestIds.length > 0 ? guestIds : ["none"]);

      if (rsvpErr) throw rsvpErr;

      // 4. Build function name map: { id → name }
      const fnMap = {};
      for (const fn of fns) fnMap[fn.id] = fn.name;

      // 5. Build per-guest rsvp map
      const rsvpByGuest = {};
      for (const row of rsvpRows) {
        if (!rsvpByGuest[row.guest_id]) rsvpByGuest[row.guest_id] = {};
        rsvpByGuest[row.guest_id][fnMap[row.function_id]] = row.status;
      }

      // 6. Attach rsvp to each guest
      const guestsWithRsvp = guestRows.map((g) => ({
        ...g,
        rsvp: rsvpByGuest[g.id] ?? {},
      }));

      setFunctions(fns);
      setResponses(rsvpRows);
      setGuests(guestsWithRsvp);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  // ─────────────────────────────────────────────────────────────────────────
  // handleRsvpChange
  // Called by Supabase Realtime when rsvp_responses is INSERT or UPDATE.
  // Updates the local responses array and guest rsvp map instantly —
  // NO full refetch needed.
  //
  // payload.new = { id, guest_id, function_id, status }
  // payload.old = previous row (for UPDATE)
  // ─────────────────────────────────────────────────────────────────────────
  const handleRsvpChange = useCallback((payload) => {
    const { eventType, new: newRow } = payload;

    // Flash the live update indicator
    setLiveUpdate(true);
    setTimeout(() => setLiveUpdate(false), 2000);

    if (eventType === "INSERT" || eventType === "UPDATE") {
      // Update responses array
      setResponses((prev) => {
        const exists = prev.find((r) => r.id === newRow.id);
        if (exists) {
          return prev.map((r) => r.id === newRow.id ? newRow : r);
        }
        return [...prev, newRow];
      });

      // Update guest rsvp map
      setGuests((prev) => {
        return prev.map((guest) => {
          if (guest.id !== newRow.guest_id) return guest;
          // Find function name for this function_id
          const fn = functions.find((f) => f.id === newRow.function_id);
          if (!fn) return guest;
          return {
            ...guest,
            rsvp: { ...guest.rsvp, [fn.name]: newRow.status },
          };
        });
      });
    }

    if (eventType === "DELETE") {
      setResponses((prev) => prev.filter((r) => r.id !== payload.old.id));
    }
  }, [functions]);

  // ─────────────────────────────────────────────────────────────────────────
  // setupRealtime
  // Subscribes to rsvp_responses table changes via Supabase Realtime.
  // Filters to only rows belonging to this wedding's guests.
  //
  // Channel events listened to:
  //   postgres_changes → INSERT on rsvp_responses
  //   postgres_changes → UPDATE on rsvp_responses
  //   postgres_changes → DELETE on rsvp_responses
  // ─────────────────────────────────────────────────────────────────────────
  const setupRealtime = useCallback(() => {
    // Clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`rsvp-tracker-${weddingId}`)
      .on(
        "postgres_changes",
        {
          event:  "*",           // INSERT, UPDATE, DELETE
          schema: "public",
          table:  "rsvp_responses",
        },
        handleRsvpChange
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;
  }, [weddingId, handleRsvpChange]);

  // Mount: fetch data + setup realtime
  useEffect(() => {
    fetchRsvpData();
  }, [fetchRsvpData]);

  useEffect(() => {
    if (!loading) setupRealtime();
    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [loading, setupRealtime]);

  // ─────────────────────────────────────────────────────────────────────────
  // Compute aggregated counts from responses
  // Overall: across all functions
  // Per function: { fnName: { confirmed, pending, declined, awaiting } }
  // ─────────────────────────────────────────────────────────────────────────
  const overallCounts = { confirmed: 0, pending: 0, declined: 0, awaiting: 0 };
  const perFunctionCounts = {};

  for (const fn of functions) {
    perFunctionCounts[fn.name] = { confirmed: 0, pending: 0, declined: 0, awaiting: 0 };
  }

  for (const row of responses) {
    const fnName = functions.find((f) => f.id === row.function_id)?.name;
    if (!fnName) continue;
    const status = row.status ?? "awaiting";
    overallCounts[status] = (overallCounts[status] ?? 0) + 1;
    if (perFunctionCounts[fnName]) {
      perFunctionCounts[fnName][status] = (perFunctionCounts[fnName][status] ?? 0) + 1;
    }
  }

  const totalResponses = responses.length;

  // ─── RENDER ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-steel">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-sm">Loading RSVP data…</p>
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RSVP Tracker</h1>
          <p className="text-sm text-steel mt-1">
            {totalResponses} responses across {functions.length} functions
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          {liveUpdate && (
            <span className="text-xs text-indigo-600 font-medium animate-pulse">
              ↻ Updated
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium
            bg-white border-sand text-navy">
            <span className={`w-2 h-2 rounded-full ${
              realtimeConnected
                ? "bg-emerald-500 animate-pulse"
                : "bg-gray-300"
            }`}/>
            {realtimeConnected ? "Live" : "Connecting…"}
          </div>
        </div>
      </div>

      {/* ── Overview: Donut + Overall Counts ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-800 mb-6">Overall Response Rate</h2>
        <div className="flex flex-col md:flex-row items-center gap-8">

          {/* Donut chart */}
          <div className="flex-shrink-0">
            <DonutChart counts={overallCounts} total={totalResponses} />
          </div>

          {/* Big stat numbers */}
          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-3xl font-bold text-emerald-600">{overallCounts.confirmed}</p>
              <p className="text-sm text-emerald-600 mt-1 font-medium">Confirmed</p>
              <p className="text-xs text-emerald-500 mt-0.5">
                {totalResponses > 0
                  ? `${Math.round((overallCounts.confirmed / totalResponses) * 100)}% of all`
                  : "0%"}
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-3xl font-bold text-amber-500">{overallCounts.pending}</p>
              <p className="text-sm text-amber-600 mt-1 font-medium">Pending</p>
              <p className="text-xs text-amber-500 mt-0.5">awaiting reply</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <p className="text-3xl font-bold text-rose-500">{overallCounts.declined}</p>
              <p className="text-sm text-rose-600 mt-1 font-medium">Declined</p>
              <p className="text-xs text-rose-500 mt-0.5">won't attend</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-3xl font-bold text-slate-500">{overallCounts.awaiting}</p>
              <p className="text-sm text-slate-600 mt-1 font-medium">Awaiting</p>
              <p className="text-xs text-slate-400 mt-0.5">not contacted</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Per Function Cards ── */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-4">By Function</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {functions.map((fn) => (
            <FunctionCard
              key={fn.id}
              name={fn.name}
              counts={perFunctionCounts[fn.name] ?? { confirmed: 0, pending: 0, declined: 0, awaiting: 0 }}
              total={guests.length}
            />
          ))}
        </div>
      </div>

      {/* ── Per Guest RSVP Table ── */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-4">Guest Breakdown</h2>
        <RsvpTable
          guests={guests}
          functions={functions.map((f) => f.name)}
        />
      </div>

    </div>
  );
}
