"use client";

/**
 * FILE: app/dashboard/[weddingId]/cards/page.jsx
 * Added: Bulk Email Send section — select guests, click send, all get personalised emails
 */

import { useState, use, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CardsHubPage({ params }) {
  const { weddingId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [wedding, setWedding] = useState({
    bride_name:"", groom_name:"", bride_family:"", groom_family:"",
    wedding_date:"", venue:"", venue_address:"", city:"",
    dress_code:"", extra_note:"",
  });

  const [guests, setGuests]               = useState([]);
  const [functions, setFunctions]         = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [search, setSearch]               = useState("");
  const [filterGroup, setFilterGroup]     = useState("");
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [error, setError]                 = useState("");

  // ── Bulk send state ────────────────────────────────────────────────────────
  const [bulkSelected, setBulkSelected]   = useState([]); // guest ids
  const [bulkSending,  setBulkSending]    = useState(false);
  const [bulkResult,   setBulkResult]     = useState(null);
  const [bulkError,    setBulkError]      = useState("");
  const [bulkSearch,   setBulkSearch]     = useState("");
  const [bulkProgress, setBulkProgress]  = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: w } = await supabase
        .from("weddings").select("*").eq("id", weddingId).single();

      if (w) setWedding({
        bride_name:    w.bride_name    ?? "",
        groom_name:    w.groom_name    ?? "",
        bride_family:  w.bride_family  ?? "",
        groom_family:  w.groom_family  ?? "",
        wedding_date:  w.wedding_date  ?? "",
        venue:         w.venue         ?? "",
        venue_address: w.venue_address ?? "",
        city:          w.city          ?? "",
        dress_code:    w.dress_code    ?? "",
        extra_note:    w.extra_note    ?? "",
      });

      const { data: fns } = await supabase
        .from("wedding_functions")
        .select("id, name, function_date, start_time, venue_detail")
        .eq("wedding_id", weddingId)
        .order("function_date", { ascending: true });

      setFunctions(fns ?? []);

      const { data: guestRows } = await supabase
        .from("guests")
        .select("id, full_name, phone, email, group_tag")
        .eq("wedding_id", weddingId)
        .order("full_name", { ascending: true });

      const guestIds = (guestRows ?? []).map(g => g.id);
      let invites = [];
      if (guestIds.length > 0) {
        const { data: inv } = await supabase
          .from("guest_function_invites")
          .select("guest_id, function_id")
          .in("guest_id", guestIds);
        invites = inv ?? [];
      }

      const inviteMap = {};
      for (const inv of invites) {
        if (!inviteMap[inv.guest_id]) inviteMap[inv.guest_id] = [];
        inviteMap[inv.guest_id].push(inv.function_id);
      }

      const fnMap = {};
      for (const fn of (fns ?? [])) fnMap[fn.id] = fn;

      const enriched = (guestRows ?? []).map(g => ({
        ...g,
        invited_functions: (inviteMap[g.id] ?? []).map(fid => fnMap[fid]).filter(Boolean),
      }));

      setGuests(enriched);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function saveWeddingDetails() {
    setSaving(true);
    try {
      await supabase.from("weddings").update(wedding).eq("id", weddingId);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  const filteredGuests = guests.filter(g => {
    const ms = !search || g.full_name?.toLowerCase().includes(search.toLowerCase()) || g.phone?.includes(search);
    const mg = !filterGroup || g.group_tag === filterGroup;
    return ms && mg;
  });

  const uniqueGroups = [...new Set(guests.map(g => g.group_tag).filter(Boolean))];

  function goManual(guest) {
    const fnIds = guest.invited_functions.map(f => f.id).join(",");
    router.push(`/dashboard/${weddingId}/cards/manual?guestId=${guest.id}&fnIds=${fnIds}`);
  }

  function goAI(guest) {
    const fnIds = guest.invited_functions.map(f => f.id).join(",");
    router.push(`/dashboard/${weddingId}/cards/ai?guestId=${guest.id}&fnIds=${fnIds}`);
  }

  // ── Bulk send helpers ──────────────────────────────────────────────────────
  const guestsWithEmail = guests.filter(g => g.email);
  const bulkFilteredGuests = guestsWithEmail.filter(g =>
    !bulkSearch || g.full_name?.toLowerCase().includes(bulkSearch.toLowerCase())
  );

  function toggleBulk(id) {
    setBulkSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleAllBulk() {
    setBulkSelected(
      bulkSelected.length === bulkFilteredGuests.length
        ? []
        : bulkFilteredGuests.map(g => g.id)
    );
  }

  async function handleBulkSend() {
    if (bulkSelected.length === 0) return;
    setBulkSending(true);
    setBulkError("");
    setBulkResult(null);
    setBulkProgress(0);

    try {
      // Send in batches of 10 to show progress
      const batchSize = 10;
      let totalSent = 0, totalFailed = 0, allErrors = [];

      for (let i = 0; i < bulkSelected.length; i += batchSize) {
        const batch = bulkSelected.slice(i, i + batchSize);

        const res = await fetch("/api/send-bulk-invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weddingId, guestIds: batch }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Bulk send failed");

        totalSent   += data.sent   ?? 0;
        totalFailed += data.failed ?? 0;
        allErrors    = [...allErrors, ...(data.errors ?? [])];

        setBulkProgress(Math.min(100, Math.round(((i + batchSize) / bulkSelected.length) * 100)));
      }

      setBulkResult({ sent: totalSent, failed: totalFailed, errors: allErrors });
      setBulkSelected([]);
    } catch (err) {
      setBulkError(err.message);
    } finally {
      setBulkSending(false);
      setBulkProgress(0);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-sm">Loading card studio…</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      <div>
        <h1 className="text-2xl font-semibold text-navy">Invitation Cards</h1>
        <p className="text-sm text-steel mt-1">
          Set up wedding details → Bulk send emails → Or build a custom card per guest.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3">
          ⚠️ {error}
        </div>
      )}

      {/* ── SECTION 1: Wedding Details ── */}
      <section className="bg-white rounded-xl border border-sand p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-crimson text-white text-xs flex items-center justify-center font-bold">1</span>
            Wedding Details
          </h2>
          <button type="button" onClick={saveWeddingDetails} disabled={saving}
            className="px-4 py-2 bg-crimson hover:bg-opacity-90 disabled:opacity-60
              text-white text-sm font-semibold rounded-lg transition-colors">
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Details"}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          These populate all invitation cards automatically. Fill once, used everywhere.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ["bride_name",    "Bride's Full Name",   "e.g. Priya Sharma"],
            ["groom_name",    "Groom's Full Name",   "e.g. Arjun Mehta"],
            ["bride_family",  "Bride's Parents",     "e.g. Mr. & Mrs. Sharma"],
            ["groom_family",  "Groom's Parents",     "e.g. Mr. & Mrs. Mehta"],
            ["wedding_date",  "Wedding Date",        "e.g. 15th February 2025"],
            ["venue",         "Venue Name",          "e.g. The Grand Leela Palace"],
            ["venue_address", "Venue Address",       "Full address"],
            ["city",          "City",                "e.g. Mumbai"],
            ["dress_code",    "Dress Code",          "e.g. Ethnic / Cocktail"],
            ["extra_note",    "Special Note",        "e.g. No gifts, just blessings"],
          ].map(([key, label, ph]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">{label}</label>
              <input type="text" value={wedding[key]}
                onChange={e => setWedding(w => ({ ...w, [key]: e.target.value }))}
                placeholder={ph}
                className="px-3 py-2.5 border border-sand rounded-lg text-sm bg-cream
                  focus:outline-none focus:border-gold"/>
            </div>
          ))}
        </div>

        {functions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Functions in this wedding:</p>
            <div className="flex flex-wrap gap-2">
              {functions.map(fn => (
                <div key={fn.id} className="px-3 py-1.5 bg-cream border border-sand rounded-xl text-xs text-navy">
                  <span className="font-semibold">{fn.name}</span>
                  {fn.function_date && <span className="opacity-60 ml-1">· {fn.function_date}</span>}
                  {fn.start_time    && <span className="opacity-60 ml-1">· {fn.start_time}</span>}
                  {fn.venue_detail  && <span className="opacity-60 ml-1">· {fn.venue_detail}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── SECTION 2: BULK EMAIL SEND ── */}
      <section className="bg-white rounded-xl border border-sand p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-crimson text-white text-xs flex items-center justify-center font-bold">2</span>
            Bulk Email Send
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/>
            Each guest receives a personalised email with only their functions
          </div>
        </div>

        {guestsWithEmail.length === 0 ? (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
            ⚠ No guests have email addresses saved. Go to Guest List to add emails first.
          </div>
        ) : (
          <>
            {/* Search + select all */}
            <div className="flex gap-3 items-center">
              <input type="text" value={bulkSearch}
                onChange={e => setBulkSearch(e.target.value)}
                placeholder="Search guests…"
                className="flex-1 px-3 py-2 border border-sand rounded-lg text-sm bg-cream
                  focus:outline-none focus:border-gold"/>
              <button type="button" onClick={toggleAllBulk}
                className="px-3 py-2 text-xs font-medium border border-sand
                  rounded-lg hover:bg-cream text-steel transition whitespace-nowrap">
                {bulkSelected.length === bulkFilteredGuests.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {/* Guest checkboxes */}
            <div className="border border-sand rounded-xl overflow-hidden divide-y divide-gray-50 max-h-72 overflow-y-auto bg-white">
              {bulkFilteredGuests.map(guest => (
                <div key={guest.id}
                  onClick={() => toggleBulk(guest.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition
                    ${bulkSelected.includes(guest.id) ? "bg-cream" : "hover:bg-cream"}`}>
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition
                    ${bulkSelected.includes(guest.id) ? "border-crimson bg-crimson" : "border-sand bg-white"}`}>
                    {bulkSelected.includes(guest.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{guest.full_name}</p>
                    <p className="text-xs text-gray-400">{guest.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {guest.invited_functions.length === 0
                        ? <span className="text-xs text-rose-400">No functions assigned</span>
                        : guest.invited_functions.map(fn => (
                            <span key={fn.id} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                              {fn.name}
                            </span>
                          ))
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar (shown while sending) */}
            {bulkSending && (
              <div className="space-y-2">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all duration-300"
                    style={{ width: `${bulkProgress}%` }}/>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Sending emails… {bulkProgress}%
                </p>
              </div>
            )}

            {/* Result */}
            {bulkResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-emerald-700">
                  ✓ Done — {bulkResult.sent} sent, {bulkResult.failed} failed
                </p>
                {bulkResult.errors?.length > 0 && (
                  <div className="text-xs text-rose-600 space-y-0.5">
                    {bulkResult.errors.map((e, i) => (
                      <p key={i}>• {e.guest}: {e.reason}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {bulkError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                ⚠ {bulkError}
              </div>
            )}

            {/* Send button */}
            <button type="button" onClick={handleBulkSend}
              disabled={bulkSelected.length === 0 || bulkSending}
              className="w-full flex items-center justify-center gap-2 py-3.5
                bg-crimson hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed
                text-white font-bold text-sm rounded-xl transition">
              {bulkSending ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>Sending…</>
              ) : (
                <>✉️ Send Email to {bulkSelected.length} Guest{bulkSelected.length !== 1 ? "s" : ""}</>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Only guests with email addresses are shown. Each email is personalised with only their invited functions.
            </p>
          </>
        )}
      </section>

      {/* ── BULK CARD SENDER LINK ── */}
      <section className="bg-white border border-sand rounded-xl p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-navy">Bulk Card Sender</h2>
          <p className="text-sm text-steel mt-1">
            Pick a card style → select all guests → send designed cards to everyone at once via Email or WhatsApp.
          </p>
        </div>
        <button type="button"
          onClick={() => router.push(`/dashboard/${weddingId}/cards/bulk`)}
          className="flex-shrink-0 px-5 py-3 bg-crimson text-white font-semibold text-sm rounded-lg hover:bg-opacity-90 transition-colors">
          Open Bulk Sender →
        </button>
      </section>

      {/* ── SECTION 3: Pick Single Guest for Custom Card ── */}
      <section className="bg-white rounded-xl border border-sand p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-crimson text-white text-xs flex items-center justify-center font-bold">3</span>
          Custom Card Builder
        </h2>
        <p className="text-xs text-gray-400">
          Build a beautifully designed card for a specific guest — manual or AI generated.
        </p>

        <div className="flex gap-3">
          <input type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or phone…"
            className="flex-1 px-3 py-2 border border-sand rounded-lg text-sm bg-cream
              focus:outline-none focus:border-gold"/>
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
            className="px-3 py-2 border border-sand rounded-lg text-sm bg-white
              focus:outline-none focus:border-gold">
            <option value="">All Groups</option>
            {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="border border-sand rounded-xl overflow-hidden divide-y divide-gray-50 max-h-96 overflow-y-auto bg-white">
          {filteredGuests.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No guests found.</div>
          ) : filteredGuests.map(guest => (
            <div key={guest.id}
              onClick={() => setSelectedGuest(selectedGuest?.id === guest.id ? null : guest)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition
                ${selectedGuest?.id === guest.id ? "bg-cream" : "hover:bg-cream"}`}>
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5
                ${selectedGuest?.id === guest.id ? "bg-crimson text-white" : "bg-cream text-navy"}`}>
                {guest.full_name?.[0]?.toUpperCase() ?? "?"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{guest.full_name}</p>
                  {guest.group_tag && (
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{guest.group_tag}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {[guest.phone, guest.email].filter(Boolean).join(" · ")}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {guest.invited_functions.length === 0
                    ? <span className="text-xs text-rose-400">No functions assigned</span>
                    : guest.invited_functions.map(fn => (
                        <span key={fn.id} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                          {fn.name}
                        </span>
                      ))
                  }
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 mt-1 flex-shrink-0 flex items-center justify-center transition
                ${selectedGuest?.id === guest.id ? "border-crimson bg-crimson" : "border-sand"}`}>
                {selectedGuest?.id === guest.id && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4: Choose Card Mode ── */}
      {selectedGuest && (
        <section className="bg-white rounded-xl border border-sand p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-crimson text-white text-xs flex items-center justify-center font-bold">4</span>
            Create Card for {selectedGuest.full_name}
          </h2>

          <div className="bg-cream border border-sand rounded-xl p-4">
            <p className="text-xs font-semibold text-navy mb-2">Card will show only:</p>
            {selectedGuest.invited_functions.length === 0
              ? <p className="text-xs text-rose-500">⚠ No functions assigned. Visit Guest List to assign functions first.</p>
              : (
                <div className="space-y-1">
                  {selectedGuest.invited_functions.map(fn => (
                    <div key={fn.id} className="text-xs text-navy flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0"/>
                      <span className="font-semibold">{fn.name}</span>
                      {fn.function_date && <span className="opacity-60">· {fn.function_date}</span>}
                      {fn.start_time    && <span className="opacity-60">· {fn.start_time}</span>}
                      {fn.venue_detail  && <span className="opacity-60">· {fn.venue_detail}</span>}
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {selectedGuest.invited_functions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button type="button" onClick={() => goManual(selectedGuest)}
                className="flex flex-col items-center gap-3 p-6 border-2 border-sand
                  hover:border-gold hover:bg-cream rounded-xl transition group text-center">
                <div className="w-12 h-12 rounded-xl bg-cream group-hover:bg-white flex items-center justify-center text-2xl transition">🎨</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Manual Card Builder</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    12 styles · 12 palettes · 4 fonts · custom text · motifs · borders · sliders
                  </p>
                </div>
                <span className="text-xs text-crimson font-semibold">Open Builder →</span>
              </button>

              <button type="button" onClick={() => goAI(selectedGuest)}
                className="flex flex-col items-center gap-3 p-6 border-2 border-sand
                  hover:border-gold hover:bg-cream rounded-xl transition group text-center">
                <div className="w-12 h-12 rounded-xl bg-cream group-hover:bg-white flex items-center justify-center text-2xl transition">✨</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">AI Card Generator</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Describe your vibe — AI builds the full card. Customize after.
                  </p>
                </div>
                <span className="text-xs text-amber-600 font-semibold">Generate with AI →</span>
              </button>
            </div>
          )}
        </section>
      )}

    </div>
  );
}
