// app/dashboard/[wedding_id]/seating/page.jsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SeatingPage({ params }) {
  const { wedding_id } = params
  const supabase = createClient()

  const [tables, setTables] = useState([])
  const [guests, setGuests] = useState([])
  const [unassigned, setUnassigned] = useState([])
  const [loading, setLoading] = useState(true)

  // New table form
  const [newTableName, setNewTableName] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState(8)
  const [addingTable, setAddingTable] = useState(false)

  async function fetchData() {
    setLoading(true)

    const [{ data: tablesData }, { data: guestsData }, { data: assignmentsData }] =
      await Promise.all([
        supabase
          .from('seating_tables')
          .select('*')
          .eq('wedding_id', wedding_id)
          .order('created_at'),
        supabase
          .from('guests')
          .select('id, full_name, side, group_tag, dietary_preference')
          .eq('wedding_id', wedding_id)
          .order('full_name'),
        supabase
          .from('seating_assignments')
          .select('*')
          .eq('wedding_id', wedding_id),
      ])

    const assignments = assignmentsData || []
    const assignedGuestIds = new Set(assignments.map(a => a.guest_id))

    // Attach guests to their tables
    const tablesWithGuests = (tablesData || []).map(table => ({
      ...table,
      guests: assignments
        .filter(a => a.table_id === table.id)
        .map(a => (guestsData || []).find(g => g.id === a.guest_id))
        .filter(Boolean),
    }))

    setTables(tablesWithGuests)
    setGuests(guestsData || [])
    setUnassigned((guestsData || []).filter(g => !assignedGuestIds.has(g.id)))
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [wedding_id])

  async function handleAddTable(e) {
    e.preventDefault()
    if (!newTableName.trim()) return
    setAddingTable(true)
    await supabase.from('seating_tables').insert({
      wedding_id,
      name: newTableName.trim(),
      capacity: Number(newTableCapacity),
    })
    setNewTableName('')
    setNewTableCapacity(8)
    setAddingTable(false)
    fetchData()
  }

  async function handleAssign(guestId, tableId) {
    if (!tableId) return
    await supabase.from('seating_assignments').upsert({
      guest_id: guestId,
      table_id: tableId,
      wedding_id,
    }, { onConflict: 'guest_id,wedding_id' })
    fetchData()
  }

  async function handleUnassign(guestId) {
    await supabase
      .from('seating_assignments')
      .delete()
      .eq('guest_id', guestId)
      .eq('wedding_id', wedding_id)
    fetchData()
  }

  async function handleDeleteTable(tableId) {
    if (!confirm('Delete this table? All assignments will be removed.')) return
    await supabase.from('seating_tables').delete().eq('id', tableId)
    fetchData()
  }

  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0)
  const totalAssigned = guests.length - unassigned.length

  if (loading) return (
    <div className="text-sm text-muted-foreground py-12 text-center">Loading seating plan...</div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold">Seating Plan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalAssigned} of {guests.length} guests seated · {tables.length} tables · {totalSeats} total seats
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total guests', value: guests.length },
          { label: 'Seated', value: totalAssigned },
          { label: 'Unassigned', value: unassigned.length },
          { label: 'Tables', value: tables.length },
        ].map(s => (
          <div key={s.label} className="bg-secondary/30 rounded-md p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-medium mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Unassigned guests ── */}
        <div className="border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Unassigned ({unassigned.length})
          </h2>

          {unassigned.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">All guests are seated!</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {unassigned.map(guest => (
                <div key={guest.id} className="flex items-center justify-between gap-2 p-2 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{guest.full_name}</p>
                    <p className="text-xs text-muted-foreground">{guest.group_tag || guest.side || ''}</p>
                  </div>
                  <select
                    defaultValue=""
                    onChange={e => handleAssign(guest.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-border rounded-md bg-background focus:outline-none flex-shrink-0 max-w-[120px]"
                  >
                    <option value="" disabled>Assign...</option>
                    {tables.map(t => (
                      <option
                        key={t.id}
                        value={t.id}
                        disabled={t.guests.length >= t.capacity}
                      >
                        {t.name} ({t.guests.length}/{t.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Tables ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Add table form */}
          <form onSubmit={handleAddTable} className="flex gap-2">
            <input
              value={newTableName}
              onChange={e => setNewTableName(e.target.value)}
              placeholder="Table name (e.g. Table 1, Family)"
              className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="number"
              value={newTableCapacity}
              onChange={e => setNewTableCapacity(e.target.value)}
              min={1}
              max={30}
              className="w-20 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Seats"
            />
            <button
              type="submit"
              disabled={addingTable}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              + Add Table
            </button>
          </form>

          {/* Tables grid */}
          {tables.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              No tables yet. Add your first table above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tables.map(table => {
                const occupancy = table.guests.length / table.capacity
                const isFull = table.guests.length >= table.capacity

                return (
                  <div key={table.id} className="border border-border rounded-xl p-4 space-y-3">
                    {/* Table header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">{table.name}</h3>
                        <p className={`text-xs mt-0.5 ${isFull ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {table.guests.length}/{table.capacity} seats
                          {isFull && ' · Full'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Capacity bar */}
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occupancy >= 1 ? 'bg-red-400' :
                          occupancy >= 0.8 ? 'bg-amber-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${Math.min(occupancy * 100, 100)}%` }}
                      />
                    </div>

                    {/* Guests at table */}
                    <div className="space-y-1.5">
                      {table.guests.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No guests assigned yet</p>
                      ) : (
                        table.guests.map(guest => (
                          <div key={guest.id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-medium flex-shrink-0">
                                {guest.full_name[0]}
                              </div>
                              <p className="text-xs truncate">{guest.full_name}</p>
                            </div>
                            <button
                              onClick={() => handleUnassign(guest.id)}
                              className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Empty seat indicators */}
                    {table.guests.length < table.capacity && (
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: table.capacity - table.guests.length }).map((_, i) => (
                          <div key={i} className="w-5 h-5 rounded-full border border-dashed border-border" />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}