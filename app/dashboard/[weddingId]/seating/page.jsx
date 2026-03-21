"use client";

// app/dashboard/[weddingId]/seating/page.jsx
// Seating plan — tables, capacity, guest assignment, occupied vs available seats

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SeatingPage() {
  const { weddingId } = useParams();

  const [tables, setTables] = useState([]);
  const [guests, setGuests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState("");
  const [newTable, setNewTable] = useState({ name: "", capacity: 8, functionId: "" });
  const [addingTable, setAddingTable] = useState(false);
  const [message, setMessage] = useState(null);

  // ── edit state ───────────────────────────────────────────────────────────────
  const [editingTable, setEditingTable] = useState(null); // tableId being edited
  const [editForm, setEditForm] = useState({ name: "", capacity: 8, functionId: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingTable, setDeletingTable] = useState(null); // tableId being deleted

  // ── fetch all data ──────────────────────────────────────────────────────────
  async function fetchAll() {
    setLoading(true);

    const [
      { data: tablesData },
      { data: guestsData },
      { data: assignData },
      { data: fnData },
    ] = await Promise.all([
      supabase
        .from("seating_tables")
        .select("id, table_name, capacity, notes, function_id")
        .order("created_at"),
      supabase
        .from("guests")
        .select("id, full_name, group_tag")
        .eq("wedding_id", weddingId)
        .order("full_name"),
      supabase
        .from("seating_assignments")
        .select("id, table_id, guest_id"),
      supabase
        .from("wedding_functions")
        .select("id, name")
        .eq("wedding_id", weddingId),
    ]);

    setTables(tablesData || []);
    setGuests(guestsData || []);
    setAssignments(assignData || []);
    setFunctions(fnData || []);
    setLoading(false);
  }

  useEffect(() => {
    if (weddingId) fetchAll();
  }, [weddingId]);

  // ── helpers ─────────────────────────────────────────────────────────────────
  function getTableAssignments(tableId) {
    return assignments.filter((a) => a.table_id === tableId);
  }

  function getGuestById(guestId) {
    return guests.find((g) => g.id === guestId);
  }

  function getFunctionName(functionId) {
    return functions.find((f) => f.id === functionId)?.name || "";
  }

  function getUnassignedGuests() {
    const assignedIds = new Set(assignments.map((a) => a.guest_id));
    return guests.filter((g) => !assignedIds.has(g.id));
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  // ── assign guest to table ───────────────────────────────────────────────────
  async function assignGuest(tableId) {
    if (!selectedGuest) return;

    const table = tables.find((t) => t.id === tableId);
    const occupied = getTableAssignments(tableId).length;

    if (occupied >= table.capacity) {
      showMessage("error", "Table is full!");
      return;
    }

    const { data, error } = await supabase
      .from("seating_assignments")
      .insert({ table_id: tableId, guest_id: selectedGuest })
      .select()
      .single();

    if (error) {
      showMessage("error", "Failed to assign: " + error.message);
      return;
    }

    setAssignments((prev) => [...prev, data]);
    setSelectedGuest("");
    setAssigning(null);
    showMessage("success", "Guest assigned successfully.");
  }

  // ── remove assignment ───────────────────────────────────────────────────────
  async function removeAssignment(assignmentId) {
    const { error } = await supabase
      .from("seating_assignments")
      .delete()
      .eq("id", assignmentId);

    if (!error) {
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    }
  }

  // ── add table ───────────────────────────────────────────────────────────────
  async function addTable() {
    if (!newTable.name || !newTable.functionId) return;

    const { data, error } = await supabase
      .from("seating_tables")
      .insert({
        table_name: newTable.name,
        capacity: newTable.capacity,
        function_id: newTable.functionId,
      })
      .select()
      .single();

    if (error) {
      showMessage("error", "Failed to add table: " + error.message);
      return;
    }

    setTables((prev) => [...prev, data]);
    setNewTable({ name: "", capacity: 8, functionId: "" });
    setAddingTable(false);
    showMessage("success", "Table added.");
  }

  // ── edit table ──────────────────────────────────────────────────────────────
  function startEdit(table) {
    setEditingTable(table.id);
    setEditForm({
      name:       table.table_name,
      capacity:   table.capacity,
      functionId: table.function_id ?? "",
    });
    // close assign panel if open for this table
    if (assigning === table.id) setAssigning(null);
  }

  function cancelEdit() {
    setEditingTable(null);
    setEditForm({ name: "", capacity: 8, functionId: "" });
  }

  async function saveEdit(tableId) {
    if (!editForm.name.trim()) return;
    setSavingEdit(true);

    const { data, error } = await supabase
      .from("seating_tables")
      .update({
        table_name:  editForm.name.trim(),
        capacity:    Number(editForm.capacity),
        function_id: editForm.functionId || null,
      })
      .eq("id", tableId)
      .select()
      .single();

    setSavingEdit(false);

    if (error) {
      showMessage("error", "Failed to update table: " + error.message);
      return;
    }

    setTables((prev) => prev.map((t) => (t.id === tableId ? data : t)));
    cancelEdit();
    showMessage("success", "Table updated.");
  }

  // ── delete table ────────────────────────────────────────────────────────────
  async function deleteTable(tableId, tableName) {
    if (!confirm(`Delete "${tableName}"? All guest assignments for this table will also be removed.`)) return;
    setDeletingTable(tableId);

    // remove assignments first
    const { error: assignError } = await supabase
      .from("seating_assignments")
      .delete()
      .eq("table_id", tableId);

    if (assignError) {
      showMessage("error", "Failed to remove assignments: " + assignError.message);
      setDeletingTable(null);
      return;
    }

    const { error } = await supabase
      .from("seating_tables")
      .delete()
      .eq("id", tableId);

    setDeletingTable(null);

    if (error) {
      showMessage("error", "Failed to delete table: " + error.message);
      return;
    }

    setTables((prev) => prev.filter((t) => t.id !== tableId));
    setAssignments((prev) => prev.filter((a) => a.table_id !== tableId));
    showMessage("success", `"${tableName}" deleted.`);
  }

  // ── summary stats ────────────────────────────────────────────────────────────
  const totalSeats = tables.reduce((s, t) => s + t.capacity, 0);
  const totalOccupied = assignments.length;
  const totalAvailable = totalSeats - totalOccupied;
  const unassignedGuests = getUnassignedGuests();

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl font-body mx-auto">

      {/* header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-navy">Seating Plan</h1>
          <p className="text-sm text-steel mt-1">
            Assign guests to tables and manage seat availability
          </p>
        </div>
        <button
          onClick={() => setAddingTable(true)}
          className="bg-crimson text-white text-sm px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
        >
          + Add table
        </button>
      </div>

      {/* message banner */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
          message.type === "success"
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {message.text}
        </div>
      )}

      {/* summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Tables",      value: tables.length },
          { label: "Total seats", value: totalSeats },
          { label: "Occupied",    value: totalOccupied },
          { label: "Available",   value: totalAvailable },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-sand rounded-xl p-4 text-center">
            <p className="font-display text-2xl text-navy">{s.value}</p>
            <p className="text-xs text-steel mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* unassigned guests */}
      {unassignedGuests.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-700 font-medium">
            {unassignedGuests.length} guest{unassignedGuests.length > 1 ? "s" : ""} not yet seated
          </p>
        </div>
      )}

      {/* add table form */}
      {addingTable && (
        <div className="mb-5 bg-white border border-sand rounded-xl p-5">
          <p className="font-display text-navy mb-4">New table</p>
          <div className="flex gap-3 items-end flex-wrap">

            <div className="flex-1 min-w-[160px]">
              <label className="text-xs text-steel uppercase tracking-wide block mb-1">Table name</label>
              <input
                type="text"
                value={newTable.name}
                onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                placeholder="e.g. Table 1, Family Table"
                className="w-full border border-sand rounded-lg px-3 py-2 text-sm text-navy bg-cream focus:outline-none focus:border-gold"
              />
            </div>

            <div className="w-48">
              <label className="text-xs text-steel uppercase tracking-wide block mb-1">Function</label>
              <select
                value={newTable.functionId}
                onChange={(e) => setNewTable({ ...newTable, functionId: e.target.value })}
                className="w-full border border-sand rounded-lg px-3 py-2 text-sm text-navy bg-cream focus:outline-none focus:border-gold"
              >
                <option value="">Select function...</option>
                {functions.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="w-32">
              <label className="text-xs text-steel uppercase tracking-wide block mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                max="30"
                value={newTable.capacity}
                onChange={(e) => setNewTable({ ...newTable, capacity: +e.target.value })}
                className="w-full border border-sand rounded-lg px-3 py-2 text-sm text-navy bg-cream focus:outline-none focus:border-gold"
              />
            </div>

            <button
              onClick={addTable}
              disabled={!newTable.name || !newTable.functionId}
              className="bg-crimson text-white px-4 py-2 rounded-lg text-sm hover:bg-opacity-90 disabled:opacity-40"
            >
              Save
            </button>
            <button
              onClick={() => setAddingTable(false)}
              className="border border-sand text-steel px-4 py-2 rounded-lg text-sm hover:border-steel"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* tables grid */}
      {loading ? (
        <p className="text-steel text-sm">Loading seating plan...</p>
      ) : tables.length === 0 ? (
        <div className="bg-white border border-dashed border-sand rounded-xl p-10 text-center">
          <p className="font-display text-navy text-lg mb-2">No tables yet</p>
          <p className="text-sm text-steel">Add your first table to start building the seating plan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tables.map((table) => {
            const tableAssignments = getTableAssignments(table.id);
            const occupied  = tableAssignments.length;
            const available = table.capacity - occupied;
            const isFull    = available === 0;
            const fillPct   = Math.round((occupied / table.capacity) * 100);
            const isEditing = editingTable === table.id;
            const isDeleting = deletingTable === table.id;

            return (
              <div key={table.id}
                className="bg-white border border-sand rounded-xl p-5 hover:border-gold hover:shadow-sm transition-all">

                {/* ── EDIT MODE ── */}
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <p className="font-display text-navy text-sm">Edit table</p>

                    <div>
                      <label className="text-xs text-steel uppercase tracking-wide block mb-1">Table name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full border border-sand rounded-lg px-3 py-2 text-sm text-navy bg-cream focus:outline-none focus:border-gold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-steel uppercase tracking-wide block mb-1">Function</label>
                        <select
                          value={editForm.functionId}
                          onChange={(e) => setEditForm({ ...editForm, functionId: e.target.value })}
                          className="w-full border border-sand rounded-lg px-3 py-2 text-sm text-navy bg-cream focus:outline-none focus:border-gold"
                        >
                          <option value="">None</option>
                          {functions.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-steel uppercase tracking-wide block mb-1">Capacity</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={editForm.capacity}
                          onChange={(e) => setEditForm({ ...editForm, capacity: +e.target.value })}
                          className="w-full border border-sand rounded-lg px-3 py-2 text-sm text-navy bg-cream focus:outline-none focus:border-gold"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(table.id)}
                        disabled={savingEdit || !editForm.name.trim()}
                        className="flex-1 bg-crimson text-white py-2 rounded-lg text-sm hover:bg-opacity-90 disabled:opacity-40"
                      >
                        {savingEdit ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-sand text-steel rounded-lg text-sm hover:border-steel"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ── NORMAL VIEW ── */}

                    {/* table header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display text-navy text-base">{table.table_name}</h3>
                        <p className="text-xs text-steel mt-0.5">
                          {getFunctionName(table.function_id) && (
                            <span className="text-gold mr-2">{getFunctionName(table.function_id)}</span>
                          )}
                          {occupied}/{table.capacity} seats ·{" "}
                          <span className={isFull ? "text-crimson" : "text-green-600"}>
                            {isFull ? "Full" : `${available} available`}
                          </span>
                        </p>
                      </div>

                      {/* right side: fill bar + edit/delete buttons */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-xs text-steel mb-1">{fillPct}%</div>
                          <div className="w-20 h-1.5 bg-sand rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${fillPct}%`,
                                background: isFull ? "#9A2143" : "#BFA054",
                              }}
                            />
                          </div>
                        </div>

                        {/* edit + delete buttons */}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => startEdit(table)}
                            className="w-7 h-7 rounded-lg bg-sand/30 text-navy hover:bg-sand flex items-center justify-center transition"
                            title="Edit table"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteTable(table.id, table.table_name)}
                            disabled={isDeleting}
                            className="w-7 h-7 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition disabled:opacity-50"
                            title="Delete table"
                          >
                            {isDeleting ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* seat circles visual */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {Array.from({ length: table.capacity }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center
                            ${i < occupied
                              ? "bg-gold border-gold text-white"
                              : "bg-cream border-sand text-steel"
                            }`}
                        >
                          {i < occupied ? "✓" : ""}
                        </div>
                      ))}
                    </div>

                    {/* assigned guests list */}
                    {tableAssignments.length > 0 && (
                      <div className="mb-3 flex flex-col gap-1">
                        {tableAssignments.map((a) => {
                          const guest = getGuestById(a.guest_id);
                          return (
                            <div key={a.id}
                              className="flex items-center justify-between px-2 py-1 bg-cream rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-sand flex items-center justify-center text-xs text-navy font-medium">
                                  {guest?.full_name?.[0] || "?"}
                                </div>
                                <span className="text-xs text-navy">{guest?.full_name || "Unknown"}</span>
                                {guest?.group_tag && (
                                  <span className="text-xs text-steel">· {guest.group_tag}</span>
                                )}
                              </div>
                              <button
                                onClick={() => removeAssignment(a.id)}
                                className="text-steel hover:text-crimson text-xs transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* assign guest dropdown */}
                    {assigning === table.id ? (
                      <div className="flex gap-2 mt-2">
                        <select
                          value={selectedGuest}
                          onChange={(e) => setSelectedGuest(e.target.value)}
                          className="flex-1 border border-sand rounded-lg px-2 py-1.5 text-xs text-navy bg-cream focus:outline-none focus:border-gold"
                        >
                          <option value="">Select guest...</option>
                          {getUnassignedGuests().map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.full_name} {g.group_tag ? `(${g.group_tag})` : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => assignGuest(table.id)}
                          disabled={!selectedGuest}
                          className="bg-crimson text-white px-3 py-1.5 rounded-lg text-xs hover:bg-opacity-90 disabled:opacity-40"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => { setAssigning(null); setSelectedGuest(""); }}
                          className="border border-sand text-steel px-3 py-1.5 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      !isFull && (
                        <button
                          onClick={() => { setAssigning(table.id); setSelectedGuest(""); }}
                          disabled={unassignedGuests.length === 0}
                          className="mt-1 w-full border border-dashed border-sand text-steel text-xs py-1.5 rounded-lg hover:border-gold hover:text-navy transition-colors disabled:opacity-40"
                        >
                          + Assign guest
                        </button>
                      )
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
