// app/dashboard/[weddingId]/checkin/guest/[guestId]/page.jsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function GuestSelfCheckinPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'#FAF6EF', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'#BFA054', fontFamily:'Georgia, serif' }}>Loading...</p>
      </div>
    }>
      <GuestCheckin />
    </Suspense>
  )
}

function GuestCheckin() {
  const { weddingId, guestId } = useParams()
  const searchParams = useSearchParams()
  const functionId = searchParams.get('function')

  const [guest, setGuest] = useState(null)
  const [functionName, setFunctionName] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkedIn, setCheckedIn] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)

  useEffect(() => {
    async function load() {
      if (!guestId) return

      const [
        { data: guestData, error: guestError },
        { data: fnData },
        { data: existing }
      ] = await Promise.all([
        supabase.from('guests').select('id, full_name, group_tag, side').eq('id', guestId).single(),
        functionId ? supabase.from('wedding_functions').select('name').eq('id', functionId).single() : { data: null },
        functionId ? supabase.from('checkin_log').select('id').eq('guest_id', guestId).eq('function_id', functionId).maybeSingle() : { data: null },
      ])

      if (guestError || !guestData) {
        setError('Guest not found')
        setLoading(false)
        return
      }

      setGuest(guestData)
      if (fnData) setFunctionName(fnData.name)
      if (existing) setAlreadyCheckedIn(true)
      setLoading(false)
    }
    load()
  }, [guestId, functionId])

  async function handleCheckIn() {
    if (!functionId) { setError('No function specified'); return }
    setChecking(true)
    const { error: err } = await supabase.from('checkin_log').insert({
      guest_id: guestId,
      function_id: functionId,
      method: 'qr',
    })
    setChecking(false)
    if (err) { setError(err.message); return }
    setCheckedIn(true)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'#BFA054', fontFamily:'Georgia, serif' }}>Loading...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#9A2143', fontFamily:'Georgia, serif', fontSize:'1.2rem' }}>Something went wrong</p>
        <p style={{ color:'#6B6B6B', fontSize:'0.85rem', marginTop:'0.5rem' }}>{error}</p>
      </div>
    </div>
  )

  if (checkedIn || alreadyCheckedIn) return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ textAlign:'center', maxWidth:'340px' }}>
        <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'#BFA054', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', fontSize:'2.2rem', color:'#FAF6EF' }}>
          ✓
        </div>
        <h1 style={{ fontFamily:'Georgia, serif', fontSize:'2rem', color:'#1B2B4B', fontWeight:400, marginBottom:'0.5rem' }}>
          Welcome{alreadyCheckedIn ? ' back' : ''}!
        </h1>
        <p style={{ fontFamily:'Georgia, serif', fontSize:'1.2rem', color:'#9A2143', marginBottom:'1rem' }}>
          {guest?.full_name}
        </p>
        {functionName && (
          <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E8D5A3', padding:'0.75rem 1.25rem', marginBottom:'1rem' }}>
            <p style={{ color:'#BFA054', fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.2rem' }}>Function</p>
            <p style={{ fontFamily:'Georgia, serif', color:'#1B2B4B', fontSize:'1rem' }}>{functionName}</p>
          </div>
        )}
        <p style={{ color:'#6B6B6B', fontSize:'0.85rem', lineHeight:1.6 }}>
          {alreadyCheckedIn
            ? 'You have already checked in. Enjoy the celebration!'
            : 'Your arrival has been recorded. Enjoy the celebration!'}
        </p>
        <p style={{ color:'#BFA054', fontSize:'1.2rem', marginTop:'1.5rem', letterSpacing:'0.2em' }}>✦ ✦ ✦</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ textAlign:'center', maxWidth:'340px', width:'100%' }}>

        <p style={{ color:'#BFA054', fontSize:'1.5rem', marginBottom:'1.5rem', letterSpacing:'0.2em' }}>✦ ✦ ✦</p>

        <p style={{ color:'#6B6B6B', fontSize:'0.72rem', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'0.5rem' }}>
          Welcome to the celebration
        </p>

        {functionName && (
          <p style={{ fontFamily:'Georgia, serif', color:'#9A2143', fontSize:'1rem', marginBottom:'1.5rem' }}>
            {functionName}
          </p>
        )}

        <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #E8D5A3', padding:'2rem 1.5rem', marginBottom:'1.5rem' }}>
          <div style={{
            width:'64px', height:'64px', borderRadius:'50%', background:'#9A2143',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 1rem', fontFamily:'Georgia, serif',
            fontSize:'1.6rem', color:'#FAF6EF'
          }}>
            {guest?.full_name?.[0] || '?'}
          </div>
          <h1 style={{ fontFamily:'Georgia, serif', fontSize:'1.6rem', color:'#1B2B4B', fontWeight:400, marginBottom:'0.25rem' }}>
            {guest?.full_name}
          </h1>
          {guest?.group_tag && (
            <p style={{ color:'#BFA054', fontSize:'0.8rem', letterSpacing:'0.08em', marginTop:'0.25rem' }}>
              {guest.group_tag}
            </p>
          )}
        </div>

        <button
          onClick={handleCheckIn}
          disabled={checking}
          style={{
            width:'100%', padding:'1.1rem',
            background: checking ? '#aaa' : '#9A2143',
            color:'#FAF6EF', border:'none', borderRadius:'12px',
            fontFamily:'Georgia, serif', fontSize:'1.1rem',
            cursor: checking ? 'not-allowed' : 'pointer',
            letterSpacing:'0.05em', transition:'background 0.2s',
          }}
        >
          {checking ? 'Checking in...' : "I've Arrived ✓"}
        </button>

        <p style={{ color:'#aaa', fontSize:'0.72rem', marginTop:'1rem', lineHeight:1.6 }}>
          Tap the button above to confirm your arrival
        </p>
      </div>
    </div>
  )
}