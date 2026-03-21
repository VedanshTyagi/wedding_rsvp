"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE:    app/dashboard/[weddingId]/accommodation/page.jsx
 * ROUTE:   /dashboard/[weddingId]/accommodation
 * PURPOSE: Room manager for outstation guests.
 *
 * FEATURES:
 *   1. fetchRooms()           — loads all rooms for this wedding
 *   2. fetchGuests()          — loads outstation guests + their room assignments
 *   3. RoomCard               — shows room name, capacity, assigned/available count
 *   4. AssignDropdown         — dropdown to assign an unassigned guest to a room
 *   5. UnassignedList         — lists outstation guests with no room yet
 *   6. handleAssign()         — assigns a guest to a room (PATCH API)
 *   7. handleUnassign()       — removes a guest from a room (PATCH API)
 *
 * SUPABASE TABLES USED:
 *   rooms                — id, wedding_id, name, capacity, room_type
 *   room_assignments     — id, room_id, guest_id
 *   guests               — id, full_name, is_outstation, phone
 *
 * API ROUTES NEEDED:
 *   GET  /api/weddings/[weddingId]/rooms          → list rooms + assignments
 *   POST /api/weddings/[weddingId]/rooms          → add a new room
 *   POST /api/weddings/[weddingId]/rooms/assign   → assign guest to room
 *   DELETE /api/weddings/[weddingId]/rooms/assign → unassign guest from room
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

// ─── ROOM CARD ────────────────────────────────────────────────────────────────
/**
 * RoomCard
 * Displays one room with its capacity, assigned guests, and available spots.
 * Each assigned guest has an X button to unassign them.
 * Has a dropdown to assign a new guest from the unassigned list.
 *
 * @param {object}   room             - { id, name, capacity, room_type }
 * @param {Array}    assignedGuests   - guests currently in this room
 * @param {Array}    unassignedGuests - guests not yet assigned to any room
 * @param {Function} onAssign         - (roomId, guestId) => void
 * @param {Function} onUnassign       - (roomId, guestId) => void
 */
function RoomCard({ room, assignedGuests, unassignedGuests, onAssign, onUnassign }) {
  const [selectedGuest, setSelectedGuest] = useState("");
  const [assigning, setAssigning]         = useState(false);

  const available = room.capacity - assignedGuests.length;
  const isFull    = available <= 0;
  const [assignError, setAssignError] = useState("");

  async function handleAssign() {
    if (!selectedGuest) return;
    setAssigning(true);
    await onAssign(room.id, selectedGuest);
    setSelectedGuest("");
    setAssigning(false);
  }

  const ROOM_TYPE_ICON = {
    single:  "🛏",
    double:  "🛏🛏",
    suite:   "🏨",
    dormitory: "🏠",
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4
      ${isFull ? "border-rose-100" : "border-gray-100"}`}>

      {/* Room header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{ROOM_TYPE_ICON[room.room_type] ?? "🛏"}</span>
            <h3 className="font-bold text-gray-900 text-base">{room.name}</h3>
          </div>
          {room.room_type && (
            <p className="text-xs text-steel mt-0.5 capitalize">{room.room_type}</p>
          )}
        </div>

        {/* Capacity badge */}
        <div className={`flex-shrink-0 text-center px-3 py-1.5 rounded-xl border text-xs font-semibold
          ${isFull
            ? "bg-rose-50 border-rose-200 text-rose-600"
            : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          <p className="text-lg font-bold leading-none">{available}</p>
          <p className="mt-0.5">{isFull ? "Full" : "Free"}</p>
        </div>
      </div>

      {/* Capacity bar */}
      <div>
        <div className="flex justify-between text-xs text-steel mb-1">
          <span>{assignedGuests.length} assigned</span>
          <span>{room.capacity} capacity</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500
              ${isFull ? "bg-rose-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.min((assignedGuests.length / room.capacity) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Assigned guests */}
      {assignedGuests.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-steel uppercase tracking-wide">Assigned</p>
          {assignedGuests.map((guest) => (
            <div key={guest.id}
              className="flex items-center justify-between gap-2 px-3 py-2
                bg-cream rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600
                  text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {guest.full_name?.[0]?.toUpperCase() ?? "?"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{guest.full_name}</p>
                  {guest.phone && (
                    <p className="text-xs text-steel truncate">{guest.phone}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => onUnassign(room.id, guest.id)}
                className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-50 text-rose-400
                  hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center
                  text-xs transition"
                title="Unassign guest"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Assign new guest */}
      {!isFull && unassignedGuests.length > 0 && (
        <div className="flex gap-2 pt-1">
          <select
            value={selectedGuest}
            onChange={(e) => setSelectedGuest(e.target.value)}
            className="flex-1 px-3 py-2 border border-sand rounded-xl text-sm
              bg-white text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          >
            <option value="">Assign a guest…</option>
            {unassignedGuests.map((g) => (
              <option key={g.id} value={g.id}>{g.full_name}</option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedGuest || assigning}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300
              text-white text-sm font-semibold rounded-xl transition"
          >
            {assigning ? "…" : "Assign"}
          </button>
        </div>
      )}

      {isFull && (
        <p className="text-xs text-rose-400 text-center py-1">Room is full</p>
      )}
    </div>
  );
}

// ─── ADD ROOM FORM ────────────────────────────────────────────────────────────
/**
 * AddRoomForm
 * Inline form to add a new room to the wedding.
 */
function AddRoomForm({ onAdd }) {
  const [open, setOpen]       = useState(false);
  const [name, setName]       = useState("");
  const [capacity, setCapacity] = useState(2);
  const [roomType, setRoomType] = useState("double");
  const [saving, setSaving]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onAdd({ name: name.trim(), capacity: Number(capacity), room_type: roomType });
    setName("");
    setCapacity(2);
    setRoomType("double");
    setOpen(false);
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 border-2 border-dashed border-sand rounded-2xl
          text-sm text-steel hover:border-indigo-300 hover:text-indigo-500
          flex items-center justify-center gap-2 transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
        </svg>
        Add Room
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 space-y-4">
      <h3 className="font-bold text-gray-800 text-sm">New Room</h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-navy">Room Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Room 101, Garden Suite"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm
            focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-navy">Capacity</label>
          <input
            type="number"
            min="1" max="20"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm
              focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-navy">Type</label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm
              bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          >
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="suite">Suite</option>
            <option value="dormitory">Dormitory</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={saving || !name.trim()}
          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300
            text-white text-sm font-semibold rounded-xl transition">
          {saving ? "Saving…" : "Add Room"}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="px-4 py-2 bg-white border border-gray-300 text-navy
            text-sm rounded-xl hover:bg-cream transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── UNASSIGNED LIST ──────────────────────────────────────────────────────────
/**
 * UnassignedList
 * Shows all outstation guests who haven't been assigned to a room yet.
 */
function UnassignedList({ guests }) {
  if (guests.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50
        border border-emerald-100 rounded-xl text-sm text-emerald-600">
        ✓ All outstation guests have been assigned a room!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">Unassigned Outstation Guests</h3>
        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200
          rounded-full text-xs font-semibold">
          {guests.length} need rooms
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {guests.map((guest) => (
          <div key={guest.id}
            className="flex items-center gap-3 px-5 py-3 hover:bg-cream transition">
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600
              text-sm flex items-center justify-center font-bold flex-shrink-0">
              {guest.full_name?.[0]?.toUpperCase() ?? "?"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{guest.full_name}</p>
              {guest.travel_city && (
                <p className="text-xs text-steel">✈ from {guest.travel_city}</p>
              )}
            </div>
            {guest.phone && (
              <p className="text-xs text-steel flex-shrink-0">{guest.phone}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AccommodationPage() {
  const { weddingId } = useParams();

  /** All rooms with their assigned guests */
  const [rooms, setRooms]   = useState([]);

  /** All outstation guests */
  const [outstationGuests, setOutstationGuests] = useState([]);

  /** room_assignments: [{ id, room_id, guest_id }] */
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [assignError, setAssignError] = useState("");

  // ─────────────────────────────────────────────────────────────────────────
  // fetchData
  // GET /api/weddings/[weddingId]/accommodation
  //
  // Expected response:
  // {
  //   rooms: [{ id, name, capacity, room_type }],
  //   assignments: [{ id, room_id, guest_id }],
  //   outstation_guests: [{ id, full_name, phone, travel_city }]
  // }
  // ─────────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/weddings/${weddingId}/accommodation`);
      if (!res.ok) throw new Error(`Failed to load accommodation (${res.status})`);
      const data = await res.json();
      setRooms(data.rooms ?? []);
      setAssignments(data.assignments ?? []);
      setOutstationGuests(data.outstation_guests ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─────────────────────────────────────────────────────────────────────────
  // handleAssign
  // Assigns a guest to a room.
  // POST /api/weddings/[weddingId]/accommodation/assign
  // Body: { room_id, guest_id }
  //
  // Optimistic update: adds assignment to local state immediately,
  // then refreshes from server to confirm.
  // ─────────────────────────────────────────────────────────────────────────
  async function handleAssign(roomId, guestId) {
    try {
      const res = await fetch(`/api/weddings/${weddingId}/accommodation/assign`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ room_id: roomId, guest_id: guestId }),
      });
      if (!res.ok) throw new Error("Failed to assign guest");
      await fetchData(); // refresh
    } catch (err) {
      setAssignError(err.message);
      setTimeout(() => setAssignError(""), 4000);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // handleUnassign
  // Removes a guest from a room.
  // DELETE /api/weddings/[weddingId]/accommodation/assign
  // Body: { room_id, guest_id }
  // ─────────────────────────────────────────────────────────────────────────
  async function handleUnassign(roomId, guestId) {
    try {
      const res = await fetch(`/api/weddings/${weddingId}/accommodation/assign`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ room_id: roomId, guest_id: guestId }),
      });
      if (!res.ok) throw new Error("Failed to unassign guest");
      await fetchData(); // refresh
    } catch (err) {
      setAssignError(err.message);
      setTimeout(() => setAssignError(""), 4000);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // handleAddRoom
  // Adds a new room to the wedding.
  // POST /api/weddings/[weddingId]/rooms
  // Body: { name, capacity, room_type }
  // ─────────────────────────────────────────────────────────────────────────
  async function handleAddRoom(roomData) {
    try {
      const res = await fetch(`/api/weddings/${weddingId}/rooms`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(roomData),
      });
      if (!res.ok) throw new Error("Failed to add room");
      await fetchData();
    } catch (err) {
      setAssignError(err.message);
      setTimeout(() => setAssignError(""), 4000);
    }
  }

  // ── Derived: build per-room guest list + unassigned guests ────────────────

  // Map guest_id → guest object for quick lookup
  const guestMap = {};
  for (const g of outstationGuests) guestMap[g.id] = g;

  // Map room_id → [guest, ...] using assignments
  const roomGuestMap = {};
  const assignedGuestIds = new Set();
  for (const a of assignments) {
    if (!roomGuestMap[a.room_id]) roomGuestMap[a.room_id] = [];
    const guest = guestMap[a.guest_id];
    if (guest) {
      roomGuestMap[a.room_id].push(guest);
      assignedGuestIds.add(a.guest_id);
    }
  }

  // Unassigned = outstation guests not in any room
  const unassignedGuests = outstationGuests.filter((g) => !assignedGuestIds.has(g.id));

  // Stats
  const totalRooms     = rooms.length;
  const totalCapacity  = rooms.reduce((sum, r) => sum + (r.capacity ?? 0), 0);
  const totalAssigned  = assignedGuestIds.size;
  const totalAvailable = totalCapacity - totalAssigned;

  // ─── RENDER ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-steel">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-sm">Loading accommodation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accommodation</h1>
        <p className="text-sm text-steel mt-1">
          Manage rooms and assign outstation guests.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm
          rounded-xl px-4 py-3">
          ⚠️ {error}
        </div>
      )}

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Rooms",      value: totalRooms,                color: "text-gray-800"   },
          { label: "Total Capacity",   value: totalCapacity,             color: "text-indigo-600" },
          { label: "Guests Assigned",  value: totalAssigned,             color: "text-emerald-600"},
          { label: "Spots Available",  value: totalAvailable,            color: "text-amber-500"  },
        ].map((stat) => (
          <div key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-steel mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Unassigned outstation guests ── */}
      <UnassignedList guests={unassignedGuests} />
      {assignError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3">
          ⚠️ {assignError}
        </div>
      )}

      {/* ── Rooms grid ── */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-4">Rooms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              assignedGuests={roomGuestMap[room.id] ?? []}
              unassignedGuests={unassignedGuests}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
            />
          ))}
          {/* Add room form */}
          <AddRoomForm onAdd={handleAddRoom} />
        </div>
      </div>

    </div>
  );
}
