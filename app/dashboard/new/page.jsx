'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CITIES = [
  'Udaipur', 'Jaipur', 'Mumbai', 'Delhi', 'Bengaluru',
  'Goa', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
  'Ahmedabad', 'Chandigarh', 'Shimla', 'Other'
]

const FUNCTIONS = [
  'Mehendi', 'Haldi', 'Sangeet',
  'Baraat', 'Pheras', 'Reception'
]

export default function NewWeddingPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // Wedding details
  const [coupleNames, setCoupleNames]   = useState('')
  const [venue, setVenue]               = useState('')
  const [city, setCity]                 = useState('')
  const [startDate, setStartDate]       = useState('')
  const [endDate, setEndDate]           = useState('')
  const [guestCount, setGuestCount]     = useState('')

  // Functions/events — each has a name, date, time, venue detail
  const [functions, setFunctions] = useState([
    { name: 'Reception', date: '', time: '', venue_detail: '' }
  ])

  function addFunction() {
    setFunctions(prev => [
      ...prev,
      { name: 'Mehendi', date: '', time: '', venue_detail: '' }
    ])
  }

  function removeFunction(index) {
    setFunctions(prev => prev.filter((_, i) => i !== index))
  }

  function updateFunction(index, field, value) {
    setFunctions(prev => prev.map((fn, i) =>
      i === index ? { ...fn, [field]: value } : fn
    ))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Get the logged-in user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setLoading(false); return }

    // 1. Insert the wedding row
    const { data: wedding, error: wErr } = await supabase
      .from('weddings')
      .insert({
        planner_id:      user.id,
        couple_names:    coupleNames,
        venue:           venue,
        city:            city,
        start_date:      startDate || null,
        end_date:        endDate   || null,
        guest_count_est: guestCount ? parseInt(guestCount) : 0
      })
      .select()
      .single()

    if (wErr) {
      setError(wErr.message)
      setLoading(false)
      return
    }

    // 2. Insert each function row linked to this wedding
    const fnRows = functions
      .filter(fn => fn.name.trim() !== '')
      .map(fn => ({
        wedding_id:   wedding.id,
        name:         fn.name,
        function_date: fn.date  || null,
        start_time:   fn.time   || null,
        venue_detail: fn.venue_detail || null
      }))

    if (fnRows.length > 0) {
      const { error: fnErr } = await supabase
        .from('wedding_functions')
        .insert(fnRows)

      if (fnErr) {
        setError(fnErr.message)
        setLoading(false)
        return
      }
    }

    // 3. Redirect to the new wedding's profile page
    router.push(`/dashboard/${wedding.id}`)
  }

  return (
    <div className="max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard"
          className="text-gray-400 hover:text-gray-600 text-sm">
          ← Dashboard
        </Link>
        <span className="text-gray-200">/</span>
        <span className="text-sm text-gray-600">New wedding</span>
      </div>

      <h1 className="text-2xl font-semibold mb-1">Create a wedding</h1>
      <p className="text-sm text-gray-500 mb-8">
        Fill in the details and add the ceremony functions.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">

        {/* ── Section 1: Wedding details ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
            Wedding details
          </h2>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">
              Couple names <span className="text-red-400">*</span>
            </label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              placeholder="e.g. Priya Sharma & Arjun Kapoor"
              value={coupleNames}
              onChange={e => setCoupleNames(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Venue name</label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              placeholder="e.g. Taj Lake Palace"
              value={venue}
              onChange={e => setVenue(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">City</label>
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white"
                value={city}
                onChange={e => setCity(e.target.value)}
              >
                <option value="">Select city</option>
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">
                Estimated guest count
              </label>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                type="number"
                placeholder="e.g. 350"
                min="0"
                value={guestCount}
                onChange={e => setGuestCount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Start date</label>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">End date</label>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Section 2: Functions ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
              Ceremony functions
            </h2>
            <button
              type="button"
              onClick={addFunction}
              className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400 transition-colors"
            >
              + Add function
            </button>
          </div>

          {functions.map((fn, index) => (
            <div key={index}
              className="border border-gray-100 rounded-lg p-4 flex flex-col gap-3 bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                  Function {index + 1}
                </span>
                {functions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFunction(index)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Function name
                  </label>
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-gray-400"
                    value={fn.name}
                    onChange={e => updateFunction(index, 'name', e.target.value)}
                  >
                    {FUNCTIONS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium">Date</label>
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-gray-400"
                    type="date"
                    value={fn.date}
                    onChange={e => updateFunction(index, 'date', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium">Start time</label>
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-gray-400"
                    type="time"
                    value={fn.time}
                    onChange={e => updateFunction(index, 'time', e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Venue / hall
                  </label>
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-gray-400"
                    placeholder="e.g. Poolside Lawn"
                    value={fn.venue_detail}
                    onChange={e => updateFunction(index, 'venue_detail', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-700 transition-colors"
          >
            {loading ? 'Creating...' : 'Create wedding'}
          </button>
          <Link href="/dashboard"
            className="px-6 py-2.5 rounded-lg text-sm text-gray-500 border border-gray-200 hover:border-gray-400 transition-colors"
          >
            Cancel
          </Link>
        </div>

      </form>
    </div>
  )
}