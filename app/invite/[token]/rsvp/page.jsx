'use client'
import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

// ── Suspense wrapper — this is the default export Next.js renders ──
export default function RSVPPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'100vh',background:'#0f0a0d',display:'flex',
        alignItems:'center',justifyContent:'center'}}>
        <p style={{color:'rgba(200,180,140,0.4)',fontSize:'0.8rem',
          letterSpacing:'0.1em',fontFamily:'sans-serif'}}>Loading...</p>
      </div>
    }>
      <RSVPForm />
    </Suspense>
  )
}

// ── Actual form — uses useSearchParams safely inside Suspense ──
function RSVPForm() {
  const params          = useParams()
  const searchParams    = useSearchParams()
  const token           = params.token
  const initialResponse = searchParams.get('response')

  const [guest, setGuest]           = useState(null)
  const [functions, setFunctions]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState(null)
  const [dietary, setDietary]       = useState('vegetarian')
  const [plusOne, setPlusOne]       = useState(false)
  const [children, setChildren]     = useState(0)
  const [responses, setResponses]   = useState({})

  useEffect(() => {
  async function fetchGuest() {
    try {
      const res  = await fetch(`/api/invite/guest?token=${token}`)
      const data = await res.json()
      if (data.error) { setError('Invite not found'); setLoading(false); return }

      setGuest(data.guest)
      setDietary(data.guest.dietary_pref || 'vegetarian')

      const fns = (data.guest.guest_function_invites || [])
        .map(gfi => gfi.wedding_functions)
        .filter(Boolean)
        .sort((a, b) => new Date(a.function_date) - new Date(b.function_date))

      setFunctions(fns)

      const defaultStatus = initialResponse === 'no' ? 'declined' : 'confirmed'
      const initial = {}
      fns.forEach(fn => { initial[fn.id] = defaultStatus })
      setResponses(initial)
      setLoading(false)

      // If they clicked "Unable to attend", auto-submit immediately
      if (initialResponse === 'no' && fns.length > 0) {
        const declinedRows = fns.map(fn => ({ function_id: fn.id, status: 'declined' }))
        const submitRes = await fetch('/api/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            dietary: data.guest.dietary_pref || 'vegetarian',
            plus_one: false,
            children_count: 0,
            responses: declinedRows
          })
        })
        const submitData = await submitRes.json()
        if (submitData.success) setDone(true)
      }

    } catch (e) {
      setError('Something went wrong loading your invite')
    } finally {
      setLoading(false)
    }
  }
  if (token) fetchGuest()
  }, [token, initialResponse])

  function toggleFunction(id) {
    setResponses(prev => ({
      ...prev,
      [id]: prev[id] === 'confirmed' ? 'declined' : 'confirmed'
    }))
  }

  async function handleSubmit(e) {
    
    e.preventDefault()
    console.log('submit fired')        // add this
  console.log('token:', token)       // add this
  console.log('responses:', responses)
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/rsvp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          dietary,
          plus_one:       plusOne,
          children_count: children,
          responses: Object.entries(responses).map(([function_id, status]) => ({
            function_id, status
          }))
        })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setDone(true)
    } catch (e) {
      setError('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──
if (loading) return (
  <div style={{minHeight:'100vh',background:'#0f0a0d',display:'flex',
    alignItems:'center',justifyContent:'center'}}>
    <p style={{color:'rgba(200,180,140,0.4)',fontSize:'0.8rem',
      letterSpacing:'0.1em',fontFamily:'sans-serif'}}>Loading...</p>
  </div>
)

  // ── Success ──
// ── Success ──
  if (done) return (
  <div style={{minHeight:'100vh',background:'#0f0a0d',display:'flex',
    alignItems:'center',justifyContent:'center',padding:'2rem'}}>
    <div style={{textAlign:'center',maxWidth:'360px'}}>
      <div style={{fontSize:'2rem',color:'#c9a84c',marginBottom:'1rem'}}>
        {initialResponse === 'no' ? '✦' : '✓'}
      </div>
      <h2 style={{color:'#f5ecd7',fontFamily:'Georgia,serif',fontSize:'1.6rem',
        fontWeight:'400',marginBottom:'0.75rem'}}>
        {initialResponse === 'no'
          ? 'We\'ll miss you'
          : `Thank you, ${guest?.full_name?.split(' ')[0]}`}
      </h2>
      <p style={{color:'rgba(200,180,140,0.55)',fontSize:'0.82rem',
        lineHeight:'1.7',fontFamily:'sans-serif'}}>
        {initialResponse === 'no'
          ? 'Thank you for letting us know. You\'ll be in our thoughts on this special day.'
          : 'Your response has been recorded. We look forward to celebrating with you.'}
      </p>
      <a href={`/invite/${token}`}
        style={{display:'inline-block',marginTop:'1.5rem',
          color:'rgba(200,180,140,0.35)',fontSize:'0.72rem',
          letterSpacing:'0.08em',textDecoration:'none',
          textTransform:'uppercase',fontFamily:'sans-serif'}}>
        ← Back to invite
      </a>
    </div>
  </div>
  )

  // ── Form ──
  return (
    <>
      <style>{`
        .rsvp-root{min-height:100vh;background:#0f0a0d;padding:2.5rem 1.25rem;font-family:sans-serif}
        .rsvp-card{max-width:400px;margin:0 auto}
        .rsvp-back{color:rgba(200,180,140,0.35);font-size:0.72rem;letter-spacing:.07em;
          text-decoration:none;display:inline-block;margin-bottom:2rem;transition:color .15s}
        .rsvp-back:hover{color:rgba(200,180,140,0.7)}
        .rsvp-title{color:#f5ecd7;font-family:Georgia,serif;font-size:1.7rem;
          font-weight:400;margin-bottom:0.2rem}
        .rsvp-sub{color:rgba(200,180,140,0.45);font-size:0.72rem;letter-spacing:.1em;
          text-transform:uppercase;margin-bottom:2rem}
        .rsvp-section{margin-bottom:1.75rem}
        .rsvp-lbl{color:rgba(200,180,140,0.55);font-size:0.68rem;letter-spacing:.12em;
          text-transform:uppercase;margin-bottom:.6rem;display:block}
        .fn-btn{width:100%;padding:.7rem 1rem;border-radius:8px;cursor:pointer;
          display:flex;justify-content:space-between;align-items:center;
          margin-bottom:.4rem;font-size:.85rem;font-family:Georgia,serif;
          transition:all .15s;background:transparent;border:1px solid}
        .fn-btn.yes{border-color:rgba(201,168,76,.55);color:#e8d5a3}
        .fn-btn.no{border-color:rgba(255,255,255,.08);color:rgba(200,180,140,.3)}
        .fn-status{font-size:.68rem;font-family:sans-serif}
        .fn-btn.yes .fn-status{color:rgba(201,168,76,.7)}
        .fn-btn.no  .fn-status{color:rgba(200,180,140,.25)}
        .rsvp-select{width:100%;padding:.65rem .9rem;
          background:rgba(255,255,255,.04);border:1px solid rgba(201,168,76,.2);
          border-radius:8px;color:#e8d5a3;font-size:.85rem;outline:none}
        .rsvp-select option{background:#1a1014}
        .toggle-row{display:flex;align-items:center;justify-content:space-between;
          padding:.75rem 0;border-bottom:1px solid rgba(255,255,255,.05)}
        .toggle-row:last-child{border-bottom:none}
        .toggle-lbl{color:rgba(200,180,140,.65);font-size:.82rem}
        .sw{width:40px;height:22px;border-radius:11px;cursor:pointer;border:none;
          position:relative;transition:background .2s;flex-shrink:0}
        .sw.on{background:#c9a84c}.sw.off{background:rgba(255,255,255,.1)}
        .sw-knob{position:absolute;top:3px;width:16px;height:16px;border-radius:50%;
          background:#fff;transition:left .2s;pointer-events:none}
        .sw.on .sw-knob{left:21px}.sw.off .sw-knob{left:3px}
        .cnt-row{display:flex;align-items:center;gap:.75rem}
        .cnt-btn{width:28px;height:28px;border-radius:50%;
          border:1px solid rgba(201,168,76,.3);background:transparent;
          color:#c9a84c;font-size:1.1rem;cursor:pointer;line-height:1;
          display:flex;align-items:center;justify-content:center}
        .cnt-val{color:#e8d5a3;font-size:.9rem;min-width:20px;text-align:center}
        .rsvp-submit{width:100%;padding:.9rem;background:#c9a84c;color:#0f0a0d;
          border:none;border-radius:8px;font-size:.82rem;font-weight:700;
          letter-spacing:.1em;text-transform:uppercase;cursor:pointer;
          margin-top:1rem;transition:background .2s}
        .rsvp-submit:hover:not(:disabled){background:#b8962e}
        .rsvp-submit:disabled{opacity:.5;cursor:not-allowed}
        .rsvp-err{color:#f87171;font-size:.78rem;margin-top:.75rem;text-align:center}
      `}</style>

      <div className="rsvp-root">
        <div className="rsvp-card">

          <a href={`/invite/${token}`} className="rsvp-back">← Back</a>

          <h1 className="rsvp-title">Your RSVP</h1>
          <p className="rsvp-sub">
            {guest?.weddings?.couple_names || 'Wedding'}
          </p>

          <form onSubmit={handleSubmit}>

            {/* Functions */}
            <div className="rsvp-section">
              <span className="rsvp-lbl">Functions you are attending</span>
              {functions.length === 0 && (
                <p style={{color:'rgba(200,180,140,0.3)',fontSize:'0.8rem'}}>
                  No functions found for this invite.
                </p>
              )}
              {functions.map(fn => (
                <button key={fn.id} type="button"
                  className={`fn-btn ${responses[fn.id] === 'confirmed' ? 'yes' : 'no'}`}
                  onClick={() => toggleFunction(fn.id)}>
                  <span>{fn.name}</span>
                  <span className="fn-status">
                    {responses[fn.id] === 'confirmed' ? '✓ Attending' : '✕ Not attending'}
                  </span>
                </button>
              ))}
            </div>

            {/* Dietary */}
            <div className="rsvp-section">
              <span className="rsvp-lbl">Dietary preference</span>
              <select className="rsvp-select"
                value={dietary} onChange={e => setDietary(e.target.value)}>
                <option value="vegetarian">Vegetarian</option>
                <option value="non_veg">Non-Vegetarian</option>
                <option value="jain">Jain</option>
                <option value="vegan">Vegan</option>
              </select>
            </div>

            {/* Plus one + children */}
            <div className="rsvp-section">
              <span className="rsvp-lbl">Additional guests</span>
              <div className="toggle-row">
                <span className="toggle-lbl">Bringing a plus-one?</span>
                <button type="button"
                  className={`sw ${plusOne ? 'on' : 'off'}`}
                  onClick={() => setPlusOne(p => !p)}>
                  <span className="sw-knob" />
                </button>
              </div>
              <div className="toggle-row">
                <span className="toggle-lbl">Children attending</span>
                <div className="cnt-row">
                  <button type="button" className="cnt-btn"
                    onClick={() => setChildren(c => Math.max(0, c - 1))}>−</button>
                  <span className="cnt-val">{children}</span>
                  <button type="button" className="cnt-btn"
                    onClick={() => setChildren(c => c + 1)}>+</button>
                </div>
              </div>
            </div>

            {error && <p className="rsvp-err">{error}</p>}

            <button type="submit" className="rsvp-submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Confirm RSVP'}
            </button>

          </form>
        </div>
      </div>
    </>
  )
}