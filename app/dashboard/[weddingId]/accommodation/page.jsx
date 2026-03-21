"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

// ─── ROOM CARD ────────────────────────────────────────────────────────────────
function RoomCard({ room, assignedGuests, unassignedGuests, onAssign, onUnassign, onDelete, onEdit }) {
  const [selectedGuest, setSelectedGuest] = useState("");
  const [assigning, setAssigning]         = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [editing, setEditing]             = useState(false);
  const [editName, setEditName]           = useState(room.name);
  const [editCapacity, setEditCapacity]   = useState(room.capacity);
  const [editType, setEditType]           = useState(room.room_type ?? "double");
  const [saving, setSaving]               = useState(false);

  const available = room.capacity - assignedGuests.length;
  const isFull    = available <= 0;

  async function handleAssign() {
    if (!selectedGuest) return;
    setAssigning(true);
    await onAssign(room.id, selectedGuest);
    setSelectedGuest("");
    setAssigning(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${room.name}"? This will also remove all guest assignments for this room.`)) return;
    setDeleting(true);
    await onDelete(room.id);
    setDeleting(false);
  }

  async function handleEditSave() {
    if (!editName.trim()) return;
    setSaving(true);
    await onEdit(room.id, {
      name:      editName.trim(),
      capacity:  Number(editCapacity),
      room_type: editType,
    });
    setSaving(false);
    setEditing(false);
  }

  const ROOM_TYPE_ICON = {
    single:    "🛏",
    double:    "🛏🛏",
    suite:     "🏨",
    dormitory: "🏠",
  };

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-gold p-5 flex flex-col gap-4">
        <h3 className="font-bold text-gray-800 text-sm">Edit Room</h3>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-navy">Room Name</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="px-3 py-2 border border-sand rounded-lg text-sm bg-cream
              focus:outline-none focus:border-gold"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-navy">Capacity</label>
            <input
              type="number"
              min="1" max="20"
              value={editCapacity}
              onChange={(e) => setEditCapacity(e.target.value)}
              className="px-3 py-2 border border-sand rounded-lg text-sm bg-cream
                focus:outline-none focus:border-gold"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-navy">Type</label>
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              className="px-3 py-2 border border-sand rounded-lg text-sm
                bg-cream focus:outline-none focus:border-gold"
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="suite">Suite</option>
              <option value="dormitory">Dormitory</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleEditSave}
            disabled={saving || !editName.trim()}
            className="flex-1 py-2 bg-crimson hover:bg-opacity-90 disabled:opacity-50
              text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => { setEditing(false); setEditName(room.name); setEditCapacity(room.capacity); setEditType(room.room_type ?? "double"); }}
            className="px-4 py-2 bg-white border border-sand text-navy
              text-sm rounded-xl hover:bg-cream transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Normal view ────────────────────────────────────────────────────────────
  return (
    <div className={`bg-white rounded-xl border p-5 flex flex-col gap-4
      ${isFull ? "border-rose-200" : "border-sand"}`}>

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

        {/* Action buttons + capacity badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Edit button */}
          <button
            onClick={() => setEditing(true)}
            className="w-7 h-7 rounded-lg bg-sand/30 text-navy hover:bg-sand
              flex items-center justify-center transition"
            title="Edit room"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                   m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-7 h-7 rounded-lg bg-rose-50 text-rose-400
              hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center
              transition disabled:opacity-50"
            title="Delete room"
          >
            {deleting ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5
                     4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            )}
          </button>

          {/* Capacity badge */}
          <div className={`text-center px-3 py-1.5 rounded-xl border text-xs font-semibold
            ${isFull
              ? "bg-rose-50 border-rose-200 text-rose-600"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
            <p className="text-lg font-bold leading-none">{available}</p>
            <p className="mt-0.5">{isFull ? "Full" : "Free"}</p>
          </div>
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
                bg-cream rounded-xl border border-sand">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-full bg-white text-crimson border border-sand
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
              bg-cream text-navy focus:outline-none focus:border-gold"
          >
            <option value="">Assign a guest…</option>
            {unassignedGuests.map((g) => (
              <option key={g.id} value={g.id}>{g.full_name}</option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedGuest || assigning}
            className="px-3 py-2 bg-crimson hover:bg-opacity-90 disabled:opacity-50
              text-white text-sm font-semibold rounded-xl transition-colors"
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
function AddRoomForm({ onAdd }) {
  const [open, setOpen]         = useState(false);
  const [name, setName]         = useState("");
  const [capacity, setCapacity] = useState(2);
  const [roomType, setRoomType] = useState("double");
  const [saving, setSaving]     = useState(false);

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
        className="w-full py-4 border-2 border-dashed border-sand rounded-xl
          text-sm text-steel hover:border-gold hover:text-navy
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
      className="bg-white rounded-xl border border-sand p-5 space-y-4">
      <h3 className="font-bold text-gray-800 text-sm">New Room</h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-navy">Room Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Room 101, Garden Suite"
          className="px-3 py-2 border border-sand rounded-lg text-sm bg-cream
            focus:outline-none focus:border-gold"
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
            className="px-3 py-2 border border-sand rounded-lg text-sm bg-cream
              focus:outline-none focus:border-gold"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-navy">Type</label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="px-3 py-2 border border-sand rounded-lg text-sm
              bg-cream focus:outline-none focus:border-gold"
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
          className="flex-1 py-2 bg-crimson hover:bg-opacity-90 disabled:opacity-50
            text-white text-sm font-semibold rounded-xl transition-colors">
          {saving ? "Saving…" : "Add Room"}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="px-4 py-2 bg-white border border-sand text-navy
            text-sm rounded-xl hover:bg-cream transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── UNASSIGNED LIST ──────────────────────────────────────────────────────────
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
    <div className="bg-white rounded-xl border border-sand overflow-hidden">
      <div className="px-5 py-4 border-b border-sand bg-cream flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">Unassigned Outstation Guests</h3>
        <span className="px-2 py-0.5 bg-white text-navy border border-sand
          rounded-full text-xs font-semibold">
          {guests.length} need rooms
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {guests.map((guest) => (
          <div key={guest.id}
            className="flex items-center gap-3 px-5 py-3 hover:bg-cream transition">
            <span className="w-8 h-8 rounded-full bg-white text-crimson border border-sand
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

  const [rooms, setRooms]                     = useState([]);
  const [outstationGuests, setOutstationGuests] = useState([]);
  const [assignments, setAssignments]           = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [assignError, setAssignError]           = useState("");

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

  async function handleAssign(roomId, guestId) {
    try {
      const res = await fetch(`/api/weddings/${weddingId}/accommodation/assign`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ room_id: roomId, guest_id: guestId }),
      });
      if (!res.ok) throw new Error("Failed to assign guest");
      await fetchData();
    } catch (err) {
      setAssignError(err.message);
      setTimeout(() => setAssignError(""), 4000);
    }
  }

  async function handleUnassign(roomId, guestId) {
    try {
      const res = await fetch(`/api/weddings/${weddingId}/accommodation/assign`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ room_id: roomId, guest_id: guestId }),
      });
      if (!res.ok) throw new Error("Failed to unassign guest");
      await fetchData();
    } catch (err) {
      setAssignError(err.message);
      setTimeout(() => setAssignError(""), 4000);
    }
  }

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

  // ── NEW: handleDeleteRoom ──────────────────────────────────────────────────
  async function handleDeleteRoom(roomId) {
    try {
      const res = await fetch(`/api/weddings/${weddingId}/rooms/${roomId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete room");
      await fetchData();
    } catch (err) {
      setAssignError(err.message);
      setTimeout(() => setAssignError(""), 4000);
    }
  }

  // ── NEW: handleEditRoom ────────────────────────────────────────────────────
  async function handleEditRoom(roomId, roomData) {
    try {
      const res = await fetch(`/api/weddings/${weddingId}/rooms/${roomId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(roomData),
      });
      if (!res.ok) throw new Error("Failed to update room");
      await fetchData();
    } catch (err) {
      setAssignError(err.message);
      setTimeout(() => setAssignError(""), 4000);
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const guestMap = {};
  for (const g of outstationGuests) guestMap[g.id] = g;

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

  const unassignedGuests = outstationGuests.filter((g) => !assignedGuestIds.has(g.id));

  const totalRooms     = rooms.length;
  const totalCapacity  = rooms.reduce((sum, r) => sum + (r.capacity ?? 0), 0);
  const totalAssigned  = assignedGuestIds.size;
  const totalAvailable = totalCapacity - totalAssigned;

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
    <div className="max-w-6xl mx-auto space-y-8">

      <div>
        <h1 className="text-2xl font-semibold text-navy">Accommodation</h1>
        <p className="text-sm text-steel mt-1">Manage rooms and assign outstation guests.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3">
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Rooms",     value: totalRooms,     color: "text-gray-800"    },
          { label: "Total Capacity",  value: totalCapacity,  color: "text-gold"        },
          { label: "Guests Assigned", value: totalAssigned,  color: "text-emerald-600" },
          { label: "Spots Available", value: totalAvailable, color: "text-amber-500"   },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-sand p-4 text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-steel mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <UnassignedList guests={unassignedGuests} />

      {assignError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3">
          ⚠️ {assignError}
        </div>
      )}

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
              onDelete={handleDeleteRoom}
              onEdit={handleEditRoom}
            />
          ))}
          <AddRoomForm onAdd={handleAddRoom} />
        </div>
      </div>

    </div>
  );
}