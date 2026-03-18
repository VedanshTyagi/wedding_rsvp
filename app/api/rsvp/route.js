import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { token, responses, dietary, plus_one } = await request.json()
  // responses = [{ function_id, status: 'confirmed'|'declined' }]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Get guest from token
  const { data: guest } = await supabase
    .from('guests')
    .select('id')
    .eq('invite_token', token)
    .single()

  if (!guest) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  // Upsert one row per function — updates if exists, inserts if not
  const upsertRows = responses.map(r => ({
    guest_id:          guest.id,
    function_id:       r.function_id,
    status:            r.status,
    dietary_confirmed: dietary,
    plus_one_confirmed: plus_one,
    responded_at:      new Date().toISOString()
  }))

  const { error } = await supabase
    .from('rsvp_responses')
    .upsert(upsertRows, { onConflict: 'guest_id,function_id' })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

const { data } = await supabase
  .from('rsvp_responses')
  .select('status, wedding_functions(name)')
  .in('function_id', functionIds)

// Shape for Recharts BarChart:
const chartData = Object.entries(
  data.reduce((acc, r) => {
    const fn = r.wedding_functions.name
    if (!acc[fn]) acc[fn] = { name:fn, confirmed:0, pending:0, declined:0 }
    acc[fn][r.status]++
    return acc
  }, {})
).map(([,v]) => v)
// → [{ name:'Mehendi', confirmed:142, pending:28, declined:10 }, ...]

const { data: guests } = await supabase
  .from('guests')
  .select('is_outstation, travel_city')
  .eq('wedding_id', weddingId)

const outstation = guests.filter(g => g.is_outstation)
const local      = guests.filter(g => !g.is_outstation)

// Top cities from outstation guests:
const cityCounts = outstation.reduce((acc, g) => {
  if (g.travel_city) acc[g.travel_city] = (acc[g.travel_city]||0)+1
  return acc
}, {})

const cutoff = new Date()
cutoff.setDate(cutoff.getDate() - 7)  // 7 days ago

const { data: overdue } = await supabase
  .from('rsvp_responses')
  .select('guest_id, guests(full_name, phone), function_id')
  .eq('status', 'pending')
  .lt('reminder_sent_at', cutoff.toISOString())  // or IS NULL
  .order('reminder_sent_at', { ascending: true, nullsFirst: true })

  import * as XLSX from 'xlsx'

const rows = confirmedGuests.map(g => ({
  'Guest Name': g.full_name,
  'Function':   g.function_name,
  'Dietary':    g.dietary_confirmed || g.dietary_pref,
  'Plus One':   g.plus_one_confirmed ? 'Yes' : 'No',
  'Group':      g.group_tag
}))

const ws = XLSX.utils.json_to_sheet(rows)
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'F&B Headcount')
const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

return new Response(buf, {
  headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="fb-headcount.xlsx"`
  }
})

// Search by name or phone
const { data: matches } = await supabase
  .from('guests')
  .select('id, full_name, phone, group_tag, seating_assignments(seating_tables(table_name))')
  .eq('wedding_id', weddingId)
  .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
  .limit(5)

// Check in — insert into checkin_log
async function checkIn(guestId, functionId) {
  await supabase.from('checkin_log').upsert({
    guest_id:    guestId,
    function_id: functionId,
    method:      'manual',
    checked_in_at: new Date().toISOString()
  }, { onConflict: 'guest_id,function_id' })
}