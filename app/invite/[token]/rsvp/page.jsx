'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

export default function RSVPFormPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = params.token
  const initialResponse = searchParams.get('response') // 'yes' or 'no'

  const [guest, setGuest]       = useState(null)
  const [functions, setFunctions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState(null)

  // Form state
  const [dietary, setDietary]   = useState('vegetarian')
  const [plusOne, setPlusOne]   = useState(false)
  const [children, setChildren] = useState(0)
  // responses: { [function_id]: 'confirmed' | 'declined' }
  const [responses, setResponses] = useState({})

  // Fetch guest data on mount
  useEffect(() => {
    async function fetchGuest() {
      const res  = await fetch(`/api/invite/guest?token=${token}`)
      const data = await res.json()
      if (data.error) { setError('Invite not found'); setLoading(false); return }
      setGuest(data.guest)
      setDietary(data.guest.dietary_pref || 'vegetarian')

      const fns = (data.guest.guest_function_invites || [])
        .map(gfi => gfi.wedding_functions)
        .filter(Boolean)

      setFunctions(fns)

      // Pre-set all functions based on initial button tapped
      const defaultStatus = initialResponse === 'yes' ? 'confirmed' : 'declined'
      const initial = {}
      fns.forEach(fn => { initial[fn.id] = defaultStatus })
      setResponses(initial)
      setLoading(false)
    }
    fetchGuest()
  }, [token, initialResponse])

  function toggleFunction(id) {
    setResponses(prev => ({
      ...prev,
      [id]: prev[id] === 'confirmed' ? 'declined' : 'confirmed'
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/rsvp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        dietary,
        plus_one: plusOne,
        children_count: children,
        responses: Object.entries(responses).map(([function_id, status]) => ({
          function_id,
          status
        }))
      })
    })

    const data = await res.json()
    if (data.error) { setError(data.error); setSubmitting(false); return }
    setDone(true)
  }

  // ── Loading state ──
  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0f0a0d',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <p style={{color:'rgba(200,180,140,0.4)',fontSize:'0.8rem',letterSpacing:'0.1em',fontFamily:'sans-serif'}}>Loading...</p>
    </div>
  )

  // ── Success state ──
  if (done) return (
    <div style={{minHeight:'100vh',background:'#0f0a0d',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
      <div style={{textAlign:'center',maxWidth:'360px'}}>
        <div style={{fontSize:'2rem',color:'#c9a84c',marginBottom:'1rem'}}>✦</div>
        <h2 style={{color:'#f5ecd7',fontFamily:'Georgia,serif',fontSize:'1.5rem',fontWeight:'400',marginBottom:'0.5rem'}}>
          Thank you, {guest?.full_name?.split(' ')[0]}
        </h2>
        <p style={{color:'rgba(200,180,140,0.6)',fontSize:'0.8rem',letterSpacing:'0.06em',fontFamily:'sans-serif'}}>
          Your response has been recorded. We look forward to celebrating with you.
        </p>
      </div>
    </div>
  )

  // ── Form ──
  return (
    <>
      <style>{`
        .rsvp-root { min-height:100vh; background:#0f0a0d; padding:2rem 1rem; font-family:sans-serif; }
        .rsvp-card { max-width:400px; margin:0 auto; }
        .rsvp-back { color:rgba(200,180,140,0.4); font-size:0.75rem; letter-spacing:0.06em;
                     text-decoration:none; display:inline-block; margin-bottom:1.5rem; }
        .rsvp-back:hover { color:rgba(200,180,140,0.7); }
        .rsvp-title { color:#f5ecd7; font-family:Georgia,serif; font-size:1.6rem; font-weight:400;
                      margin-bottom:0.25rem; }
        .rsvp-subtitle { color:rgba(200,180,140,0.5); font-size:0.75rem; letter-spacing:0.08em;
                          text-transform:uppercase; margin-bottom:2rem; }
        .rsvp-label { color:rgba(200,180,140,0.6); font-size:0.7rem; letter-spacing:0.1em;
                      text-transform:uppercase; margin-bottom:0.5rem; display:block; }
        .rsvp-section { margin-bottom:1.5rem; }
        .fn-toggle { width:100%; padding:0.7rem 1rem; border-radius:8px; cursor:pointer;
                     display:flex; justify-content:space-between; align-items:center;
                     margin-bottom:0.4rem; border:1px solid; font-size:0.85rem;
                     font-family:Georgia,serif; transition:all 0.15s; background:transparent; }
        .fn-toggle.yes  { border-color:rgba(201,168,76,0.5); color:#e8d5a3; }
        .fn-toggle.no   { border-color:rgba(255,255,255,0.08); color:rgba(200,180,140,0.35); }
        .fn-date { font-size:0.7rem; font-family:sans-serif; opacity:0.6; }
        .rsvp-select { width:100%; padding:0.65rem 0.9rem; background:rgba(255,255,255,0.04);
                        border:1px solid rgba(201,168,76,0.2); border-radius:8px;
                        color:#e8d5a3; font-size:0.85rem; outline:none; }
        .rsvp-select option { background:#1a1014; }
        .toggle-row { display:flex; align-items:center; justify-content:space-between;
                      padding:0.7rem 0; border-bottom:1px solid rgba(255,255,255,0.05); }
        .toggle-row:last-child { border-bottom:none; }
        .toggle-label { color:rgba(200,180,140,0.7); font-size:0.82rem; }
        .toggle-switch { width:40px; height:22px; border-radius:11px; cursor:pointer;
                          border:none; position:relative; transition:background 0.2s; }
        .toggle-switch.on  { background:#c9a84c; }
        .toggle-switch.off { background:rgba(255,255,255,0.1); }
        .toggle-knob { position:absolute; top:3px; width:16px; height:16px; border-radius:50%;
                        background:#fff; transition:left 0.2s; }
        .toggle-switch.on  .toggle-knob { left:21px; }
        .toggle-switch.off .toggle-knob { left:3px; }
        .children-row { display:flex; align-items:center; gap:0.75rem; margin-top:0.75rem; }
        .children-btn { width:28px; height:28px; border-radius:50%; border:1px solid rgba(201,168,76,0.3);
                         background:transparent; color:#c9a84c; font-size:1rem; cursor:pointer; }
        .children-count { color:#e8d5a3; font-size:0.9rem; min-width:20px; text-align:center; }
        .rsvp-submit { width:100%; padding:0.9rem; background:#c9a84c; color:#0f0a0d;
                        border:none; border-radius:8px; font-size:0.85rem; font-weight:600;
                        letter-spacing:0.08em; text-transform:uppercase; cursor:pointer;
                        margin-top:1.5rem; transition:background 0.2s; }
        .rsvp-submit:hover { background:#b8962e; }
        .rsvp-submit:disabled { opacity:0.5; cursor:not-allowed; }
        .rsvp-error { color:#f87171; font-size:0.8rem; margin-top:0.75rem; text-align:center; }
      `}</style>

      <div className="rsvp-root">
        <div className="rsvp-card">

          <a href={`/invite/${token}`} className="rsvp-back">← Back to invite</a>

          <h1 className="rsvp-title">Your RSVP</h1>
          <p className="rsvp-subtitle">{guest?.weddings?.couple_names}</p>

          <form onSubmit={handleSubmit}>

            {/* Functions */}
            <div className="rsvp-section">
              <span className="rsvp-label">Functions you are attending</span>
              {functions.map(fn => (
                <button
                  key={fn.id}
                  type="button"
                  className={`fn-toggle ${responses[fn.id] === 'confirmed' ? 'yes' : 'no'}`}
                  onClick={() => toggleFunction(fn.id)}
                >
                  <span>{fn.name}</span>
                  <span className="fn-date">
                    {responses[fn.id] === 'confirmed' ? '✓ Attending' : '✕ Not attending'}
                  </span>
                </button>
              ))}
            </div>

            {/* Dietary */}
            <div className="rsvp-section">
              <span className="rsvp-label">Dietary preference</span>
              <select className="rsvp-select" value={dietary}
                onChange={e => setDietary(e.target.value)}>
                <option value="vegetarian">Vegetarian</option>
                <option value="non_veg">Non-Vegetarian</option>
                <option value="jain">Jain</option>
                <option value="vegan">Vegan</option>
              </select>
            </div>

            {/* Plus one + children */}
            <div className="rsvp-section">
              <span className="rsvp-label">Guests</span>
              <div className="toggle-row">
                <span className="toggle-label">Bringing a plus-one?</span>
                <button type="button"
                  className={`toggle-switch ${plusOne ? 'on' : 'off'}`}
                  onClick={() => setPlusOne(p => !p)}>
                  <span className="toggle-knob"></span>
                </button>
              </div>
              <div className="toggle-row">
                <span className="toggle-label">Children attending</span>
                <div className="children-row">
                  <button type="button" className="children-btn"
                    onClick={() => setChildren(c => Math.max(0, c - 1))}>−</button>
                  <span className="children-count">{children}</span>
                  <button type="button" className="children-btn"
                    onClick={() => setChildren(c => c + 1)}>+</button>
                </div>
              </div>
            </div>

            {error && <p className="rsvp-error">{error}</p>}

            <button type="submit" className="rsvp-submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Confirm RSVP'}
            </button>

          </form>
        </div>
      </div>
    </>
  )
}