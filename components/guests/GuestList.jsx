// components/guests/GuestList.jsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DIETARY_LABELS = {
  veg:       { label: 'Veg',     color: 'bg-green-50 text-green-800' },
  'non-veg': { label: 'Non-veg', color: 'bg-red-50 text-red-800' },
  vegan:     { label: 'Vegan',   color: 'bg-teal-50 text-teal-800' },
  jain:      { label: 'Jain',    color: 'bg-amber-50 text-amber-800' },
  other:     { label: 'Other',   color: 'bg-gray-100 text-gray-700' },
}

const SIDE_LABELS = {
  bride: { label: "Bride's", color: 'bg-pink-50 text-pink-800' },
  groom: { label: "Groom's", color: 'bg-blue-50 text-blue-800' },
  both:  { label: 'Both',    color: 'bg-purple-50 text-purple-800' },
  other: { label: 'Other',   color: 'bg-gray-100 text-gray-700' },
}

export default function GuestList({ weddingId, initialGuests }) {
  const supabase = createClient()
  const [guests, setGuests] = useState(initialGuests)
  const [search, setSearch] = useState('')
  const [filterSide, setFilterSide] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleting, setDeleting] = useState(null)

  // Add guest form state
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', side: 'bride',
    group_tag: '', relationship: '', is_outstation: false,
    city_of_origin: '', dietary_preference: 'veg', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('guests')
      .insert({ ...form, wedding_id: weddingId })
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    setGuests(prev => [...prev, data].sort((a, b) => a.full_name.localeCompare(b.full_name)))
    setForm({ full_name: '', phone: '', email: '', side: 'bride', group_tag: '', relationship: '', is_outstation: false, city_of_origin: '', dietary_preference: 'veg', notes: '' })
    setShowAddForm(false)
  }

  async function handleDelete(guestId) {
    if (!confirm('Delete this guest?')) return
    setDeleting(guestId)
    await supabase.from('guests').delete().eq('id', guestId)
    setGuests(prev => prev.filter(g => g.id !== guestId))
    setDeleting(null)
  }

  const filtered = guests.filter(g => {
    const matchSearch = g.full_name.toLowerCase().includes(search.toLowerCase()) ||
      g.phone?.includes(search) || g.email?.toLowerCase().includes(search.toLowerCase())
    const matchSide = filterSide === 'all' || g.side === filterSide
    return matchSearch && matchSide
  })

  const stats = {
    total: guests.length,
    bride: guests.filter(g => g.side === 'bride').length,
    groom: guests.filter(g => g.side === 'groom').length,
    outstation: guests.filter(g => g.is_outstation).length,
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Guests</h1>
          <p className="text-sm text-gray-500 mt-0.5">{stats.total} guests added</p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
          + Add Guest
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total guests',  value: stats.total },
          { label: "Bride's side",  value: stats.bride },
          { label: "Groom's side",  value: stats.groom },
          { label: 'Outstation',    value: stats.outstation },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="text-2xl font-semibold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input type="text" placeholder="Search name, phone, email..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
        <select value={filterSide} onChange={e => setFilterSide(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
          <option value="all">All sides</option>
          <option value="bride">Bride's side</option>
          <option value="groom">Groom's side</option>
          <option value="both">Both</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Add Guest Form */}
      {showAddForm && (
        <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Add new guest</h2>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Full name *</label>
                <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Priya Sharma"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="priya@email.com"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Relationship</label>
                <input value={form.relationship} onChange={e => setForm(p => ({ ...p, relationship: e.target.value }))}
                  placeholder="Maternal Uncle"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Side</label>
                <select value={form.side} onChange={e => setForm(p => ({ ...p, side: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
                  <option value="bride">Bride's side</option>
                  <option value="groom">Groom's side</option>
                  <option value="both">Both</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Group tag</label>
                <input value={form.group_tag} onChange={e => setForm(p => ({ ...p, group_tag: e.target.value }))}
                  placeholder="Family, VIP..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Dietary preference</label>
                <select value={form.dietary_preference} onChange={e => setForm(p => ({ ...p, dietary_preference: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-veg</option>
                  <option value="vegan">Vegan</option>
                  <option value="jain">Jain</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="outstation" checked={form.is_outstation}
                  onChange={e => setForm(p => ({ ...p, is_outstation: e.target.checked }))}
                  className="w-4 h-4" />
                <label htmlFor="outstation" className="text-sm">Outstation guest</label>
              </div>
            </div>
            {form.is_outstation && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">City of origin</label>
                <input value={form.city_of_origin} onChange={e => setForm(p => ({ ...p, city_of_origin: e.target.value }))}
                  placeholder="Mumbai"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Guest'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
          {guests.length === 0 ? 'No guests yet. Add your first guest above.' : 'No guests match your search.'}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Side</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Group</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Diet</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Outstation</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((guest, i) => {
                  const side = SIDE_LABELS[guest.side] || SIDE_LABELS.other
                  const diet = DIETARY_LABELS[guest.dietary_preference]
                  return (
                    <tr key={guest.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{guest.full_name}</p>
                        {guest.relationship && <p className="text-xs text-gray-400">{guest.relationship}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <p>{guest.phone || '—'}</p>
                        <p className="text-xs">{guest.email || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${side.color}`}>{side.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{guest.group_tag || '—'}</td>
                      <td className="px-4 py-3">
                        {diet ? <span className={`px-2 py-0.5 rounded text-xs font-medium ${diet.color}`}>{diet.label}</span> : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {guest.is_outstation
                          ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800">Yes</span>
                          : <span className="text-gray-400">No</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(guest.id)} disabled={deleting === guest.id}
                          className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50 transition-colors disabled:opacity-50">
                          {deleting === guest.id ? '...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}