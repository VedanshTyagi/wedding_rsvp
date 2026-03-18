// app/api/rsvp/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { token, dietary, plus_one, children_count, responses } = await request.json()

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

  // Update guest dietary + plus one
  await supabase
    .from('guests')
    .update({ dietary_pref: dietary, plus_one, children_count })
    .eq('id', guest.id)

  // Upsert one rsvp_responses row per function
  const rows = responses.map(r => ({
    guest_id:          guest.id,
    function_id:       r.function_id,
    status:            r.status,
    dietary_confirmed: dietary,
    plus_one_confirmed: plus_one,
    children_confirmed: children_count,
    responded_at:      new Date().toISOString()
  }))

  const { error } = await supabase
    .from('rsvp_responses')
    .upsert(rows, { onConflict: 'guest_id,function_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}