'use client'

export const dynamic = 'force-dynamic'

// app/rsvp/page.jsx
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

// ── Default export: ONLY the Suspense wrapper ──────────────────────────────
export default function RSVPPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: '#FBF8F2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Georgia, serif',
      }}>
        <p style={{ color: '#BFA054', fontSize: 14, letterSpacing: 2 }}>
          Loading your invitation…
        </p>
      </div>
    }>
      <RSVPForm />
    </Suspense>
  )
}

// ── All logic lives here — useSearchParams is safe inside Suspense ─────────
function RSVPForm() {
  const searchParams  = useSearchParams()
  const token         = searchParams.get('token')

  const [step, setStep]               = useState('loading')
  const [guest, setGuest]             = useState(null)
  const [functions, setFunctions]     = useState([])
  const [responses, setResponses]     = useState({})
  const [dietary, setDietary]         = useState('')
  const [plusOne, setPlusOne]         = useState(false)
  const [plusOneName, setPlusOneName] = useState('')
  const [children, setChildren]       = useState(0)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

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

        const existing = {}
        for (const fn of data.functions) {
          existing[fn.id] = fn.rsvp_status || 'pending'
        }
        setResponses(existing)

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
          responses,
          dietary,
          plus_one:       plusOne,
          plus_one_name:  plusOneName,
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

  // ── Shared styles ────────────────────────────────────────────────────────
  const page = {
    minHeight: '100vh', background: '#FBF8F2',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '2rem 1rem',
    fontFamily: 'Georgia, serif',
  }
  const card = {
    background: '#fff', border: '1px solid #EDD498',
    borderRadius: 16, padding: '2.5rem 2rem',
    maxWidth: 480, width: '100%',
  }
  const label = {
    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
    color: '#9EA1AB', marginBottom: 6, display: 'block',
  }
  const input = {
    width: '100%', padding: '10px 12px',
    border: '1px solid #EDD498', borderRadius: 8,
    fontSize: 14, fontFamily: 'Georgia, serif',
    color: '#1E2742', background: '#FBF8F2', boxSizing: 'border-box',
  }

  // ── States ───────────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <div style={page}>
      <p style=
