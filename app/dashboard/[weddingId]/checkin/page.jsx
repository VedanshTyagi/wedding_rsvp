// app/dashboard/[weddingId]/checkin/page.jsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CheckInPage() {
  const { weddingId } = useParams()
  const supabase = createClient()

<<<<<<< HEAD
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [functions, setFunctions] = useState([])
  const [selectedFunction, setSelectedFunction] = useState('')
  const [checkedIn, setCheckedIn] = useState([])
  const [recentArrivals, setRecentArrivals] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [checkedCount, setCheckedCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [checkingIn, setCheckingIn] = useState(null)
=======
  const [search,           setSearch]           = useState('')
  const [results,          setResults]          = useState([])
  const [functions,        setFunctions]        = useState([])
  const [selectedFunction, setSelectedFunction] = useState('')
  const [checkedIn,        setCheckedIn]        = useState([])
  const [recentArrivals,   setRecentArrivals]   = useState([])
  const [totalCount,       setTotalCount]       = useState(0)
  const [checkedCount,     setCheckedCount]     = useState(0)
  const [loading,          setLoading]          = useState(false)
  const [checkingIn,       setCheckingIn]       = useState(null)
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1

  // Load functions
  useEffect(() => {
    async function loadFunctions() {
<<<<<<< HEAD
=======
      if (!weddingId) return
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
      const { data } = await supabase
        .from('wedding_functions')
        .select('id, name, function_date')
        .eq('wedding_id', weddingId)
        .order('function_date')
      setFunctions(data || [])
      if (data?.length > 0) setSelectedFunction(data[0].id)
    }
<<<<<<< HEAD
    if (weddingId) loadFunctions()
=======
    loadFunctions()
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
  }, [weddingId])

  // Load check-in counts + recent arrivals
  const loadStats = useCallback(async () => {
<<<<<<< HEAD
    if (!selectedFunction) return
=======
    if (!selectedFunction || !weddingId) return
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1

    const [{ count: total }, { count: checked }, { data: recentLogs }] = await Promise.all([
      supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('wedding_id', weddingId),
      supabase
        .from('checkin_log')
        .select('*', { count: 'exact', head: true })
        .eq('function_id', selectedFunction),
      supabase
        .from('checkin_log')
        .select('guest_id, created_at')
        .eq('function_id', selectedFunction)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

<<<<<<< HEAD
    // fetch guest details separately to avoid FK join issue
=======
    // Fetch guest details separately to avoid FK join issues
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
    let recentWithGuests = []
    if (recentLogs?.length > 0) {
      const guestIds = recentLogs.map(r => r.guest_id).filter(Boolean)
      const { data: guestDetails } = await supabase
        .from('guests')
        .select('id, full_name, group_tag')
        .in('id', guestIds)
      const guestMap = Object.fromEntries((guestDetails || []).map(g => [g.id, g]))
      recentWithGuests = recentLogs.map(r => ({
        ...r,
        guests: guestMap[r.guest_id] || null,
      }))
    }

    setTotalCount(total || 0)
    setCheckedCount(checked || 0)
    setRecentArrivals(recentWithGuests)

    const { data: checkedIds } = await supabase
      .from('checkin_log')
      .select('guest_id')
      .eq('function_id', selectedFunction)
    setCheckedIn((checkedIds || []).map(r => r.guest_id))
  }, [selectedFunction, weddingId])

  useEffect(() => { loadStats() }, [loadStats])

  // Realtime subscription
  useEffect(() => {
    if (!selectedFunction) return
    const channel = supabase
      .channel(`checkin-${selectedFunction}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'checkin_log',
        filter: `function_id=eq.${selectedFunction}`,
      }, () => { loadStats() })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [selectedFunction, loadStats])

  // Search guests
  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('guests')
<<<<<<< HEAD
        .select('id, full_name, phone, group_tag, dietary_pref')
=======
        .select('id, full_name, phone, group_tag, dietary_preference')
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
        .eq('wedding_id', weddingId)
        .or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
        .limit(8)
      setResults(data || [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, weddingId])

  async function handleCheckIn(guest) {
    if (!selectedFunction) return alert('Please select a function first')
    if (checkedIn.includes(guest.id)) return
    setCheckingIn(guest.id)
    await supabase.from('checkin_log').insert({
<<<<<<< HEAD
      guest_id: guest.id,
      function_id: selectedFunction,
      method: 'manual',
=======
      guest_id:    guest.id,
      function_id: selectedFunction,
      method:      'manual',
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
    })
    setCheckingIn(null)
    setSearch('')
    setResults([])
    loadStats()
  }

  const percentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-10">

      {/* Header */}
      <div>
<<<<<<< HEAD
        <h1 className="text-2xl font-display font-semibold">Guest Check-in</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Day-of arrival tracking</p>
=======
        <h1 className="text-2xl font-semibold">Guest Check-in</h1>
        <p className="text-sm text-gray-500 mt-0.5">Day-of arrival tracking</p>
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
      </div>

      {/* Function selector */}
      <select
        value={selectedFunction}
        onChange={e => setSelectedFunction(e.target.value)}
<<<<<<< HEAD
        className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
=======
        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
      >
        <option value="">Select function...</option>
        {functions.map(f => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>

      {/* Live counter */}
<<<<<<< HEAD
      <div className="border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Arrived</p>
            <p className="text-4xl font-display font-semibold mt-1">
              {checkedCount}
              <span className="text-lg text-muted-foreground font-normal"> / {totalCount}</span>
            </p>
          </div>
          <p className="text-3xl font-display font-semibold text-primary">{percentage}%</p>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
=======
      <div className="border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Arrived</p>
            <p className="text-4xl font-semibold mt-1">
              {checkedCount}
              <span className="text-lg text-gray-400 font-normal"> / {totalCount}</span>
            </p>
          </div>
          <p className="text-3xl font-semibold text-gray-700">{percentage}%</p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
<<<<<<< HEAD
          className="w-full px-4 py-3 text-base border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          autoComplete="off"
        />

        {/* Search results */}
        {loading && (
          <p className="text-xs text-muted-foreground px-1">Searching...</p>
        )}
        {results.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
            {results.map(guest => {
              const isChecked = checkedIn.includes(guest.id)
              return (
                <div
                  key={guest.id}
                  className={`flex items-center justify-between px-4 py-3 transition-colors ${
                    isChecked ? 'bg-green-50' : 'hover:bg-muted/30'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{guest.full_name}</p>
                    <p className="text-xs text-muted-foreground">
=======
          className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
          autoComplete="off"
        />

        {loading && <p className="text-xs text-gray-400 px-1">Searching...</p>}

        {results.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {results.map(guest => {
              const isChecked = checkedIn.includes(guest.id)
              return (
                <div key={guest.id}
                  className={`flex items-center justify-between px-4 py-3 transition-colors
                    ${isChecked ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                  <div>
                    <p className="text-sm font-medium">{guest.full_name}</p>
                    <p className="text-xs text-gray-400">
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
                      {guest.phone || ''}{guest.group_tag ? ` · ${guest.group_tag}` : ''}
                    </p>
                  </div>
                  {isChecked ? (
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                      Checked in
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(guest)}
                      disabled={checkingIn === guest.id}
<<<<<<< HEAD
                      className="text-sm px-4 py-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 active:scale-95"
                    >
=======
                      className="text-sm px-4 py-1.5 bg-gray-900 text-white rounded-full
                        hover:bg-gray-700 transition-colors disabled:opacity-50 active:scale-95">
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
                      {checkingIn === guest.id ? '...' : 'Check in'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent arrivals */}
      {recentArrivals.length > 0 && (
        <div className="space-y-2">
<<<<<<< HEAD
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent arrivals</h2>
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
            {recentArrivals.map((log, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
=======
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Recent arrivals</h2>
          <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {recentArrivals.map((log, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-medium">
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
                    {log.guests?.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{log.guests?.full_name || 'Unknown'}</p>
<<<<<<< HEAD
                    <p className="text-xs text-muted-foreground">{log.guests?.group_tag || ''}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
=======
                    <p className="text-xs text-gray-400">{log.guests?.group_tag || ''}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
                  {new Date(log.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
<<<<<<< HEAD
    </div>
  )
}
=======

    </div>
  )
}
>>>>>>> 42b877f20b36d0a141e5fb7c36bc88bb1a1da2e1
