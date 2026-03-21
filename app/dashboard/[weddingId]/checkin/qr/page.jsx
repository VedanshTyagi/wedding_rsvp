// app/dashboard/[weddingId]/checkin/qr/page.jsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function GuestQRCode({ guestId, guestName, weddingId, functionId }) {
  const canvasRef = useRef(null)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const qrValue = `${baseUrl}/dashboard/${weddingId}/checkin/guest/${guestId}?function=${functionId}`

  useEffect(() => {
    if (!canvasRef.current || !functionId) return
    QRCode.toCanvas(canvasRef.current, qrValue, {
      width: 150, margin: 2,
      color: { dark: '#1B2B4B', light: '#FAF6EF' },
    })
  }, [qrValue, functionId])

  async function handleDownload() {
    const url = await QRCode.toDataURL(qrValue, { width: 400, margin: 2 })
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${guestName.replace(/\s+/g, '-').toLowerCase()}.png`
    a.click()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', padding:'12px', border:'1px solid #E8D5A3', borderRadius:'12px', background:'#FAF6EF' }}>
      <canvas ref={canvasRef} style={{ borderRadius:'8px' }} />
      <p style={{ fontSize:'12px', color:'#1B2B4B', fontWeight:500, textAlign:'center', fontFamily:'Georgia, serif' }}>{guestName}</p>
      <button onClick={handleDownload}
        style={{ fontSize:'11px', padding:'4px 12px', border:'1px solid #BFA054', borderRadius:'6px', background:'transparent', color:'#BFA054', cursor:'pointer' }}>
        Download
      </button>
    </div>
  )
}

export default function QRPage() {
  const { weddingId } = useParams()
  const [guests, setGuests] = useState([])
  const [functions, setFunctions] = useState([])
  const [selectedFunction, setSelectedFunction] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!weddingId) return
      const [{ data: guestsData }, { data: fnsData }] = await Promise.all([
        supabase.from('guests').select('id, full_name, phone, group_tag').eq('wedding_id', weddingId).order('full_name'),
        supabase.from('wedding_functions').select('id, name').eq('wedding_id', weddingId).order('function_date'),
      ])
      setGuests(guestsData || [])
      setFunctions(fnsData || [])
      if (fnsData?.length > 0) setSelectedFunction(fnsData[0].id)
      setLoading(false)
    }
    load()
  }, [weddingId])

  const filtered = guests.filter(g =>
    g.full_name.toLowerCase().includes(search.toLowerCase()) ||
    g.phone?.includes(search)
  )

  if (loading) return (
    <div style={{ textAlign:'center', padding:'3rem', color:'#BFA054', fontFamily:'Georgia, serif' }}>Loading...</div>
  )

  return (
    <div style={{ maxWidth:'900px', padding:'1.5rem 0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontFamily:'Georgia, serif', fontSize:'1.6rem', color:'#1B2B4B', fontWeight:400 }}>Guest QR Codes</h1>
          <p style={{ color:'#6B6B6B', fontSize:'0.85rem', marginTop:'0.25rem' }}>Guests scan to self check-in</p>
        </div>
        <a href={`/dashboard/${weddingId}/checkin`}
          style={{ fontSize:'13px', padding:'8px 16px', border:'1px solid #E8D5A3', borderRadius:'8px', color:'#1B2B4B', textDecoration:'none', background:'#fff' }}>
          ← Back to check-in
        </a>
      </div>

      <div style={{ display:'flex', gap:'12px', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <select value={selectedFunction} onChange={e => setSelectedFunction(e.target.value)}
          style={{ padding:'8px 12px', border:'1px solid #E8D5A3', borderRadius:'8px', background:'#FAF6EF', color:'#1B2B4B', fontSize:'14px', outline:'none' }}>
          <option value="">Select function...</option>
          {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search guest..."
          style={{ padding:'8px 12px', border:'1px solid #E8D5A3', borderRadius:'8px', background:'#FAF6EF', color:'#1B2B4B', fontSize:'14px', outline:'none', flex:1, minWidth:'200px' }} />
      </div>

      {!selectedFunction ? (
        <p style={{ color:'#6B6B6B', fontSize:'0.85rem' }}>Select a function to generate QR codes.</p>
      ) : filtered.length === 0 ? (
        <p style={{ color:'#6B6B6B', fontSize:'0.85rem' }}>No guests found.</p>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'16px' }}>
          {filtered.map(guest => (
            <GuestQRCode
              key={guest.id}
              guestId={guest.id}
              guestName={guest.full_name}
              weddingId={weddingId}
              functionId={selectedFunction}
            />
          ))}
        </div>
      )}
    </div>
  )
}