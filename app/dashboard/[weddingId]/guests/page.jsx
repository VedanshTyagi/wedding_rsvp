"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";

function StatusBadge({ status }) {
  const styles = {
    confirmed: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    declined:  "bg-rose-100 text-rose-800 border border-rose-200",
    pending:   "bg-amber-100 text-amber-800 border border-amber-200",
    awaiting:  "bg-slate-100 text-slate-500 border border-slate-200",
  };
  const label = {
    confirmed: "✓ Confirmed",
    declined:  "✗ Declined",
    pending:   "⏳ Pending",
    awaiting:  "— Awaiting",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.awaiting}`}>
      {label[status] ?? status}
    </span>
  );
}

function HeadcountCards({ guests, functions }) {
  if (!functions.length || !guests.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {functions.map((fn) => {
        const counts = { confirmed: 0, pending: 0, declined: 0, awaiting: 0 };
        let totalPeople = 0;
        for (const guest of guests) {
          const status = guest.rsvp?.[fn] ?? "awaiting";
          counts[status] = (counts[status] ?? 0) + 1;
          if (status === "confirmed") {
            totalPeople += 1;
            if (guest.plus_one) totalPeople += 1;
            totalPeople += guest.children_count ?? 0;
          }
        }
        const total = guests.length;
        return (
          <div key={fn} className="bg-white rounded-xl border border-sand shadow-sm p-4">
            <p className="text-sm font-bold text-gray-800 mb-3">{fn}</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><p className="text-lg font-bold text-emerald-600">{counts.confirmed}</p><p className="text-xs text-gray-400 mt-0.5">Confirmed</p></div>
              <div><p className="text-lg font-bold text-amber-500">{counts.pending}</p><p className="text-xs text-gray-400 mt-0.5">Pending</p></div>
              <div><p className="text-lg font-bold text-rose-500">{counts.declined}</p><p className="text-xs text-gray-400 mt-0.5">Declined</p></div>
              <div><p className="text-lg font-bold text-gray-700">{total}</p><p className="text-xs text-gray-400 mt-0.5">Total</p></div>
            </div>
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: total > 0 ? `${(counts.confirmed / total) * 100}%` : "0%" }}/>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-400">{total > 0 ? Math.round((counts.confirmed / total) * 100) : 0}% confirmed</p>
              <p className="text-xs font-semibold text-indigo-600">👥 {totalPeople} people coming</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GuestsPage({ params }) {
  const { weddingId } = params;
  const supabase = createClient();

  const [guests, setGuests]                 = useState([]);
  const [functions, setFunctions]           = useState([]);
  const [allFunctions, setAllFunctions]     = useState([]);
  const [filterGroup, setFilterGroup]       = useState("");
  const [filterFunction, setFilterFunction] = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [importing, setImporting]           = useState(false);
  const [importResult, setImportResult]     = useState(null);
  const fileInputRef                        = useRef(null);

  // Add state
  const [showAddForm, setShowAddForm]     = useState(false);
  const [addLoading, setAddLoading]       = useState(false);
  const [addError, setAddError]           = useState("");
  const [addSuccess, setAddSuccess]       = useState("");
  const [newGuest, setNewGuest]           = useState({ full_name: "", phone: "", email: "", group_tag: "" });
  const [selectedFnIds, setSelectedFnIds] = useState([]);

  // Edit state
  const [editingGuest, setEditingGuest]   = useState(null);
  const [editForm, setEditForm]           = useState({ full_name: "", phone: "", email: "", group_tag: "" });
  const [editFnIds, setEditFnIds]         = useState([]);
  const [editLoading, setEditLoading]     = useState(false);
  const [editError, setEditError]         = useState("");

  // Delete state
  const [deletingId, setDeletingId]           = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  async function fetchGuests() {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`/api/weddings/${weddingId}/guests`);
      if (!res.ok) throw new Error(`Failed to load guests (${res.status})`);
      const data = await res.json();
      setGuests(data.guests ?? []);
      setFunctions(data.functions ?? []);
      if (!filterFunction && data.functions?.length > 0) setFilterFunction(data.functions[0]);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function fetchFunctions() {
    const { data } = await supabase
      .from("wedding_functions").select("id, name")
      .eq("wedding_id", weddingId).order("function_date", { ascending: true });
    setAllFunctions(data ?? []);
  }

  useEffect(() => {
    fetchGuests(); fetchFunctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId]);

  // ── Add Guest ──────────────────────────────────────────────────────────────
  async function handleAddGuest(e) {
    e.preventDefault();
    if (!newGuest.full_name.trim()) { setAddError("Guest name is required."); return; }
    setAddLoading(true); setAddError(""); setAddSuccess("");
    try {
      const { data: inserted, error: guestErr } = await supabase
        .from("guests")
        .insert({
          wedding_id: weddingId,
          full_name:  newGuest.full_name.trim(),
          phone:      newGuest.phone.trim()     || null,
          email:      newGuest.email.trim()     || null,
          group_tag:  newGuest.group_tag.trim() || null,
        })
        .select("id").single();
      if (guestErr) throw new Error(guestErr.message);

      if (selectedFnIds.length > 0) {
        const { error: inviteErr } = await supabase
          .from("guest_function_invites")
          .upsert(
            selectedFnIds.map(fnId => ({ guest_id: inserted.id, function_id: fnId })),
            { onConflict: "guest_id,function_id" }
          );
        if (inviteErr) throw new Error(inviteErr.message);
      }

      setAddSuccess(`✓ ${newGuest.full_name} added!`);
      setNewGuest({ full_name: "", phone: "", email: "", group_tag: "" });
      setSelectedFnIds([]);
      await fetchGuests();
      setTimeout(() => { setAddSuccess(""); setShowAddForm(false); }, 2000);
    } catch (err) { setAddError(err.message); }
    finally { setAddLoading(false); }
  }

  // ── Open Edit ──────────────────────────────────────────────────────────────
  async function openEdit(guest) {
    setEditingGuest(guest);
    setEditError("");
    setEditForm({
      full_name: guest.name      ?? "",
      phone:     guest.phone     ?? "",
      email:     guest.email     ?? "",
      group_tag: guest.group_tag ?? "",
    });
    const { data } = await supabase
      .from("guest_function_invites").select("function_id").eq("guest_id", guest.id);
    setEditFnIds((data ?? []).map(r => r.function_id));
  }

  // ── Save Edit ──────────────────────────────────────────────────────────────
  async function handleEditSave(e) {
    e.preventDefault();
    if (!editForm.full_name.trim()) { setEditError("Name is required."); return; }
    setEditLoading(true); setEditError("");
    try {
      const { error: upErr } = await supabase
        .from("guests")
        .update({
          full_name: editForm.full_name.trim(),
          phone:     editForm.phone.trim()     || null,
          email:     editForm.email.trim()     || null,
          group_tag: editForm.group_tag.trim() || null,
        })
        .eq("id", editingGuest.id);
      if (upErr) throw new Error(upErr.message);

      // Replace function invites
      await supabase.from("guest_function_invites").delete().eq("guest_id", editingGuest.id);
      if (editFnIds.length > 0) {
        const { error: invErr } = await supabase
          .from("guest_function_invites")
          .insert(editFnIds.map(fnId => ({ guest_id: editingGuest.id, function_id: fnId })));
        if (invErr) throw new Error(invErr.message);
      }

      setEditingGuest(null);
      await fetchGuests();
    } catch (err) { setEditError(err.message); }
    finally { setEditLoading(false); }
  }

  // ── Delete Guest ───────────────────────────────────────────────────────────
  async function handleDelete(guestId) {
    setDeletingId(guestId);
    try {
      await supabase.from("guest_function_invites").delete().eq("guest_id", guestId);
      const { error: delErr } = await supabase.from("guests").delete().eq("id", guestId);
      if (delErr) throw new Error(delErr.message);
      setConfirmDeleteId(null);
      await fetchGuests();
    } catch (err) { alert("Delete failed: " + err.message); }
    finally { setDeletingId(null); }
  }

  function toggleFn(id, fnIds, setFnIds) {
    setFnIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleCSVImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setImportResult(null);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: async ({ data: rows, errors: parseErrors }) => {
        if (parseErrors.length > 0) {
          setImportResult({ error: "CSV parse error: " + parseErrors[0].message });
          setImporting(false); return;
        }
        const COLUMN_MAP = {
          name:  ["name", "full name", "guest name"],
          email: ["email", "email address"],
          phone: ["phone", "mobile", "contact", "phone number"],
          group: ["group", "side", "family side", "category"],
        };
        function resolveField(row, aliases) {
          for (const a of aliases) if (row[a] !== undefined) return row[a].trim();
          return "";
        }
        const mapped = rows.map(row => ({
          name:  resolveField(row, COLUMN_MAP.name),
          email: resolveField(row, COLUMN_MAP.email),
          phone: resolveField(row, COLUMN_MAP.phone),
          group: resolveField(row, COLUMN_MAP.group),
        })).filter(g => g.name);
        try {
          const res = await fetch(`/api/weddings/${weddingId}/guests/import`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guests: mapped }),
          });
          setImportResult(await res.json());
          await fetchGuests();
        } catch (err) { setImportResult({ error: err.message }); }
        finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
      },
    });
  }

  const filteredGuests = useMemo(() => guests.filter((guest) => {
    if (filterGroup && guest.group_tag?.toLowerCase() !== filterGroup.toLowerCase()) return false;
    if (filterStatus && filterFunction) {
      if ((guest.rsvp?.[filterFunction] ?? "awaiting") !== filterStatus) return false;
    }
    return true;
  }), [guests, filterGroup, filterFunction, filterStatus]);

  const uniqueGroups = useMemo(() =>
    [...new Set(guests.map(g => g.group_tag).filter(Boolean))].sort()
  , [guests]);

  // ── Shared function toggle buttons ─────────────────────────────────────────
  function FnToggles({ fnIds, setFnIds }) {
    return allFunctions.length > 0 ? (
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-600">
          Invited to Functions <span className="font-normal text-gray-400">(select all that apply)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {allFunctions.map(fn => (
            <button key={fn.id} type="button" onClick={() => toggleFn(fn.id, fnIds, setFnIds)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                ${fnIds.includes(fn.id)
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              {fn.name}
            </button>
          ))}
        </div>
        {fnIds.length === 0 && (
          <p className="text-xs text-amber-600">⚠ No functions selected — guest won't appear in card builder until assigned.</p>
        )}
      </div>
    ) : null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guest List</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filteredGuests.length} of {guests.length} guests</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={() => { setShowAddForm(v => !v); setAddError(""); setAddSuccess(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Add Guest
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport}/>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
            {importing
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Importing…</>
              : <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Import CSV</>}
          </button>
        </div>
      </div>

      {/* ── ADD GUEST FORM ── */}
      {showAddForm && (
        <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-800">Add New Guest</h2>
          <form onSubmit={handleAddGuest} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Full Name <span className="text-rose-500">*</span></label>
                <input type="text" required value={newGuest.full_name}
                  onChange={e => setNewGuest(g => ({ ...g, full_name: e.target.value }))}
                  placeholder="e.g. Priya Sharma"
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"/>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Phone</label>
                <input type="tel" value={newGuest.phone}
                  onChange={e => setNewGuest(g => ({ ...g, phone: e.target.value }))}
                  placeholder="e.g. 9876543210"
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"/>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Email</label>
                <input type="email" value={newGuest.email}
                  onChange={e => setNewGuest(g => ({ ...g, email: e.target.value }))}
                  placeholder="e.g. priya@email.com"
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"/>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Group / Side</label>
                <input type="text" value={newGuest.group_tag}
                  onChange={e => setNewGuest(g => ({ ...g, group_tag: e.target.value }))}
                  placeholder="e.g. Bride's Side"
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"/>
              </div>
            </div>
            <FnToggles fnIds={selectedFnIds} setFnIds={setSelectedFnIds} />
            {addError   && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{addError}</p>}
            {addSuccess && <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{addSuccess}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={addLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition">
                {addLoading ? "Adding…" : "Add Guest"}
              </button>
              <button type="button" onClick={() => { setShowAddForm(false); setAddError(""); }}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editingGuest && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">Edit Guest</h2>
              <button type="button" onClick={() => setEditingGuest(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Full Name <span className="text-rose-500">*</span></label>
                  <input type="text" required value={editForm.full_name}
                    onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Phone</label>
                  <input type="tel" value={editForm.phone}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Email</label>
                  <input type="email" value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Group / Side</label>
                  <input type="text" value={editForm.group_tag}
                    onChange={e => setEditForm(f => ({ ...f, group_tag: e.target.value }))}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"/>
                </div>
              </div>
              <FnToggles fnIds={editFnIds} setFnIds={setEditFnIds} />
              {editError && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{editError}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={editLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition">
                  {editLoading ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditingGuest(null)}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
            <div className="text-3xl">🗑</div>
            <h2 className="text-base font-bold text-gray-900">Delete this guest?</h2>
            <p className="text-sm text-gray-500">This will permanently remove the guest and all their function assignments. This cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-sm font-semibold rounded-xl transition">
                {deletingId === confirmDeleteId ? "Deleting…" : "Yes, Delete"}
              </button>
              <button type="button" onClick={() => setConfirmDeleteId(null)}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Headcount Cards */}
      {!loading && !error && <HeadcountCards guests={guests} functions={functions} />}

      {/* Import Toast */}
      {importResult && (
        <div className={`rounded-lg px-4 py-3 text-sm flex items-start gap-2 ${importResult.error ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {importResult.error
            ? <span>⚠️ {importResult.error}</span>
            : <span>✓ Import complete — <strong>{importResult.added}</strong> added, <strong>{importResult.skipped}</strong> skipped{importResult.errors > 0 && `, ${importResult.errors} errors`}</span>}
          <button className="ml-auto opacity-60 hover:opacity-100" onClick={() => setImportResult(null)}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <option value="">All Groups</option>
          {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterFunction} onChange={e => setFilterFunction(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <option value="">All Functions</option>
          {functions.map(fn => <option key={fn} value={fn}>{fn}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          disabled={!filterFunction}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-40">
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="declined">Declined</option>
          <option value="awaiting">Awaiting</option>
        </select>
        {(filterGroup || filterStatus) && (
          <button type="button" onClick={() => { setFilterGroup(""); setFilterStatus(""); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-steel text-sm">Loading guests…</div>
      ) : error ? (
        <div className="text-center py-20 text-rose-500 text-sm">⚠️ {error}</div>
      ) : filteredGuests.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          {guests.length === 0
            ? <span>No guests yet. Click <strong>Add Guest</strong> to get started.</span>
            : "No guests match the current filters."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-sand shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-cream">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-navy w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Group</th>
                {/* NEW COLUMN */}
                <th className="px-4 py-3 text-left font-semibold text-navy">Coming With</th>
                {functions.map((fn) => (
                  <th key={fn}
                    className={`px-4 py-3 text-center font-semibold text-navy ${
                      filterFunction === fn ? "bg-indigo-50 text-indigo-700" : ""
                    }`}>
                    {fn}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {filteredGuests.map((guest, idx) => {
                const comingWith = [];
                if (guest.plus_one) comingWith.push(guest.plus_one_name || "+1 guest");
                if (guest.children_count > 0)
                  comingWith.push(`${guest.children_count} child${guest.children_count > 1 ? "ren" : ""}`);
                return (
                  <tr key={guest.id} className="hover:bg-cream transition-colors">
                    <td className="px-4 py-3 text-steel">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{guest.name}</td>
                    <td className="px-4 py-3 text-steel">{guest.email || "—"}</td>
                    <td className="px-4 py-3 text-steel">{guest.phone || "—"}</td>
                    <td className="px-4 py-3">
                      {guest.group_tag
                        ? <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">{guest.group_tag}</span>
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {comingWith.length > 0
                        ? <div className="flex flex-col gap-0.5">{comingWith.map((item, i) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100 w-fit">{item}</span>
                          ))}</div>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    {functions.map(fn => (
                      <td key={fn} className={`px-4 py-3 text-center ${filterFunction === fn ? "bg-indigo-50/40" : ""}`}>
                        <StatusBadge status={guest.rsvp?.[fn] ?? "awaiting"} />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" onClick={() => openEdit(guest)}
                          className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition">
                          ✏ Edit
                        </button>
                        <button type="button" onClick={() => setConfirmDeleteId(guest.id)}
                          className="px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-lg transition">
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-steel">
        CSV format: <code className="bg-gray-100 px-1 rounded">Name, Email, Phone, Group</code> — extra columns are ignored.
      </p>
    </div>
  );
}
