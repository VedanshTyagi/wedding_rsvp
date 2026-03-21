'use client'

// app/rsvp/page.jsx
// Public RSVP page — guests land here from their invite link
// URL: /rsvp?token=<invite_token>

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function RSVPPage() {
  const searchParams  = useSearchParams()
  const token         = searchParams.get('token')

  const [step, setStep]         = useState('loading') // loading | form | success | error | already
  const [guest, setGuest]       = useState(null)
  const [functions, setFunctions] = useState([])
  const [responses, setResponses] = useState({}) // { [functionId]: 'confirmed' | 'declined' }
  const [dietary, setDietary]   = useState('')
  const [plusOne, setPlusOne]   = useState(false)
  const [plusOneName, setPlusOneName] = useState('')
  const [children, setChildren] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')

  // ── Load guest info from token ─────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setStep('error'); setError('Invalid invite link.'); return }

    async function load() {
      try {
        const res  = await fetch(`/api/rsvp?token=${token}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.message || 'Invite not found.')
          setStep('error')
          return
        }

        setGuest(data.guest)
        setFunctions(data.functions)
        setDietary(data.guest.dietary_preference || '')
        setPlusOne(data.guest.plus_one || false)
        setPlusOneName(data.guest.plus_one_name || '')
        setChildren(data.guest.children_count || 0)

        // pre-fill existing responses
        const existing = {}
        for (const fn of data.functions) {
          existing[fn.id] = fn.rsvp_status || 'pending'
        }
        setResponses(existing)

        // check if already fully responded
        const allResponded = data.functions.every(
          (fn) => fn.rsvp_status === 'confirmed' || fn.rsvp_status === 'declined'
        )
        setStep(allResponded ? 'already' : 'form')
      } catch (err) {
        setError('Something went wrong. Please try again.')
        setStep('error')
      }
    }

    load()
  }, [token])

  // ── Submit RSVP ────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const unanswered = functions.filter(
      (fn) => !responses[fn.id] || responses[fn.id] === 'pending'
    )
    if (unanswered.length > 0) {
      setError(`Please respond to all functions: ${unanswered.map(f => f.name).join(', ')}`)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/rsvp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          responses,         // { [functionId]: 'confirmed' | 'declined' }
          dietary,
          plus_one:      plusOne,
          plus_one_name: plusOneName,
          children_count: Number(children),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to submit RSVP')
      setStep('success')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const page = {
    minHeight: '100vh',
    background: '#FBF8F2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    fontFamily: 'Georgia, serif',
  }

  const card = {
    background: '#fff',
    border: '1px solid #EDD498',
    borderRadius: 16,
    padding: '2.5rem 2rem',
    maxWidth: 480,
    width: '100%',
  }

  const label = {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#9EA1AB',
    marginBottom: 6,
    display: 'block',
  }

  const input = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #EDD498',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'Georgia, serif',
    color: '#1E2742',
    background: '#FBF8F2',
    boxSizing: 'border-box',
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <div style={page}>
      <p style={{ color: '#BFA054', fontSize: 14, letterSpacing: 2 }}>Loading your invitation…</p>
    </div>
  )

  // ── Error ──────────────────────────────────────────────────────────────────
  if (step === 'error') return (
    <div style={page}>
      <div style={{ ...card, textAlign: 'center' }}>
        <p style={{ color: '#9A2143', fontSize: 18, marginBottom: 8 }}>Something went wrong</p>
        <p style={{ color: '#9EA1AB', fontSize: 14 }}>{error}</p>
      </div>
    </div>
  )

  // ── Already responded ──────────────────────────────────────────────────────
  if (step === 'already') return (
    <div style={page}>
      <div style={{ ...card, textAlign: 'center' }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>✦</p>
        <h1 style={{ fontSize: 24, fontWeight: 400, color: '#1E2742', marginBottom: 8 }}>
          Already responded!
        </h1>
        <p style={{ color: '#9EA1AB', fontSize: 14, lineHeight: 1.6 }}>
          We already have your RSVP, {guest?.full_name}. Thank you!<br/>
          If you need to make changes, please contact the hosts.
        </p>
        <p style={{ color: '#BFA054', fontSize: 20, marginTop: 24, letterSpacing: 4 }}>✦ ✦ ✦</p>
      </div>
    </div>
  )

  // ── Success ────────────────────────────────────────────────────────────────
  if (step === 'success') return (
    <div style={page}>
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: '#BFA054',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem', fontSize: 28, color: '#fff',
        }}>✓</div>
        <h1 style={{ fontSize: 26, fontWeight: 400, color: '#1E2742', marginBottom: 8 }}>
          Thank you, {guest?.full_name}!
        </h1>
        <p style={{ color: '#9EA1AB', fontSize: 14, lineHeight: 1.6 }}>
          Your RSVP has been recorded. We look forward to celebrating with you!
        </p>
        <p style={{ color: '#BFA054', fontSize: 20, marginTop: 24, letterSpacing: 4 }}>✦ ✦ ✦</p>
      </div>
    </div>
  )

  // ── RSVP Form ──────────────────────────────────────────────────────────────
  return (
    <div style={page}>
      <div style={card}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ color: '#BFA054', fontSize: 18, letterSpacing: 4, marginBottom: 8 }}>✦ ✦ ✦</p>
          <h1 style={{ fontSize: 26, fontWeight: 400, color: '#1E2742', marginBottom: 4 }}>
            You're Invited
          </h1>
          <p style={{ color: '#9EA1AB', fontSize: 13 }}>
            Please confirm your attendance, {guest?.full_name}
          </p>
        </div>

        {/* Functions */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={label}>Functions</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {functions.map((fn) => (
              <div key={fn.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', border: '1px solid #EDD498',
                borderRadius: 10, background: '#FBF8F2',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, color: '#1E2742' }}>{fn.name}</p>
                  {fn.function_date && (
                    <p style={{ margin: 0, fontSize: 12, color: '#9EA1AB', marginTop: 2 }}>
                      {new Date(fn.function_date).toLocaleDateString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                      })}
                      {fn.start_time ? ` · ${fn.start_time}` : ''}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['confirmed', 'declined'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setResponses(r => ({ ...r, [fn.id]: status }))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: '1px solid',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: 'Georgia, serif',
                        borderColor: responses[fn.id] === status
                          ? (status === 'confirmed' ? '#2a7a4a' : '#9A2143')
                          : '#EDD498',
                        background: responses[fn.id] === status
                          ? (status === 'confirmed' ? '#f0faf4' : '#fdf0f4')
                          : '#fff',
                        color: responses[fn.id] === status
                          ? (status === 'confirmed' ? '#2a7a4a' : '#9A2143')
                          : '#9EA1AB',
                        fontWeight: responses[fn.id] === status ? 600 : 400,
                      }}
                    >
                      {status === 'confirmed' ? 'Attending' : 'Decline'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dietary */}
        <div style={{ marginBottom: '1.2rem' }}>
          <label style={label}>Dietary preference</label>
          <select value={dietary} onChange={(e) => setDietary(e.target.value)} style={input}>
            <option value="vegetarian">Vegetarian</option>
            <option value="non-vegetarian">Non-vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="jain">Jain</option>
            <option value="gluten-free">Gluten-free</option>
          </select>
        </div>

        {/* Plus one */}
        {guest?.plus_one && (
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={label}>Plus one</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={plusOne}
                onChange={(e) => setPlusOne(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: 14, color: '#1E2742' }}>Bringing a plus one</span>
            </div>
            {plusOne && (
              <input
                type="text"
                value={plusOneName}
                onChange={(e) => setPlusOneName(e.target.value)}
                placeholder="Plus one's name"
                style={input}
              />
            )}
          </div>
        )}

        {/* Children */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={label}>Number of children attending</label>
          <input
            type="number"
            min="0" max="10"
            value={children}
            onChange={(e) => setChildren(e.target.value)}
            style={{ ...input, width: 80 }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: '1rem',
            background: '#fdf0f4', border: '1px solid #f0b6c6',
            fontSize: 13, color: '#9A2143',
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', padding: '14px',
            background: submitting ? '#ccc' : '#9A2143',
            color: '#fff', border: 'none', borderRadius: 10,
            fontFamily: 'Georgia, serif', fontSize: 15,
            cursor: submitting ? 'not-allowed' : 'pointer',
            letterSpacing: 1,
          }}
        >
          {submitting ? 'Submitting…' : 'Confirm RSVP'}
        </button>

      </div>
    </div>
  )
}
