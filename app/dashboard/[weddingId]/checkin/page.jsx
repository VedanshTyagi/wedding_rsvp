// app/dashboard/[weddingId]/checkin/page.jsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CheckInPage() {
  const { weddingId } = useParams()
  const supabase = createClient()

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

  // Load functions
  useEffect(() => {
    async function loadFunctions() {
      if (!weddingId) return
      const { data } = await supabase
        .from('wedding_functions')
        .select('id, name, function_date')
        .eq('wedding_id', weddingId)
        .order('function_date')
      setFunctions(data || [])
      if (data?.length > 0) setSelectedFunction(data[0].id)
    }
    loadFunctions()
  }, [weddingId])

  // Load check-in counts + recent arrivals
  const loadStats = useCallback(async () => {
    if (!selectedFunction || !weddingId) return

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

    // Fetch guest details separately to avoid FK join issues
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
        .select('id, full_name, phone, group_tag, dietary_preference')
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
      guest_id:    guest.id,
      function_id: selectedFunction,
      method:      'manual',
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
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-display font-semibold">Guest Check-in</h1>
    <p className="text-sm text-muted-foreground mt-0.5">Day-of arrival tracking</p>
  </div>
  <a href={`/dashboard/${weddingId}/checkin/qr`}
    className="text-sm px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
    QR Codes
  </a>
</div>

      {/* Function selector */}
      <select
        value={selectedFunction}
        onChange={e => setSelectedFunction(e.target.value)}
        className="w-full px-3 py-2.5 text-sm border border-sand rounded-lg bg-white text-[#4a3728] focus:outline-none focus:border-[#c9a96e]"
      >
        <option value="">Select function...</option>
        {functions.map(f => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>

      {/* Live counter */}
      <div className="border border-sand rounded-xl bg-white p-5 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-[#9e8878]">Arrived</p>
            <p className="text-4xl mt-1 text-[#2c1810]">
              {checkedCount}
              <span className="text-lg text-gray-400 font-normal"> / {totalCount}</span>
            </p>
          </div>
          <p className="text-3xl text-[#4a3728]">{percentage}%</p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2c1810] rounded-full transition-all duration-500"
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
          className="w-full px-4 py-3 text-base border border-sand rounded-xl text-[#4a3728] focus:outline-none focus:border-[#c9a96e]"
          autoComplete="off"
        />

        {loading && <p className="text-xs text-gray-400 px-1">Searching...</p>}

        {results.length > 0 && (
          <div className="border border-sand rounded-xl overflow-hidden divide-y divide-[#f0e8df] bg-white">
            {results.map(guest => {
              const isChecked = checkedIn.includes(guest.id)
              return (
                <div key={guest.id}
                  className={`flex items-center justify-between px-4 py-3 transition-colors
                    ${isChecked ? 'bg-[#f6fbf6]' : 'hover:bg-[#fdf5ee]'}`}>
                  <div>
                    <p className="text-sm text-[#2c1810]">{guest.full_name}</p>
                    <p className="text-xs text-[#9e8878]">
                      {guest.phone || ''}{guest.group_tag ? ` · ${guest.group_tag}` : ''}
                    </p>
                  </div>
                  {isChecked ? (
                    <span className="text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full">
                      Checked in
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(guest)}
                      disabled={checkingIn === guest.id}
                      className="text-sm px-4 py-1.5 bg-[#2c1810] text-white rounded-full
                        hover:bg-[#4a3728] transition-colors disabled:opacity-50 active:scale-95">
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
          <h2 className="text-sm text-[#9e8878]">Recent arrivals</h2>
          <div className="border border-sand rounded-xl overflow-hidden divide-y divide-[#f0e8df] bg-white">
            {recentArrivals.map((log, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#fdf5ee] flex items-center justify-center text-[#4a3728] text-xs">
                    {log.guests?.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-[#2c1810]">{log.guests?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-[#9e8878]">{log.guests?.group_tag || ''}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
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
    </div>
  )
}
