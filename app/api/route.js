import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('RSVP received:', JSON.stringify(body, null, 2))

    const { token, dietary, plus_one, children_count, responses } = body

    if (!token) {
      console.log('ERROR: no token')
      return NextResponse.json({ error: 'No token provided' }, { status: 400 })
    }

    if (!responses || responses.length === 0) {
      console.log('ERROR: no responses array')
      return NextResponse.json({ error: 'No responses provided' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Step 1: find guest by token
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id')
      .eq('invite_token', token)
      .single()

    console.log('Guest lookup:', guest, guestError)

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Invalid token — guest not found' }, { status: 404 })
    }

    // Step 2: update guest dietary + plus one
    const { error: updateError } = await supabase
      .from('guests')
      .update({
        dietary_pref:   dietary,
        plus_one:       plus_one,
        children_count: children_count
      })
      .eq('id', guest.id)

    console.log('Guest update error:', updateError)

    // Step 3: upsert rsvp_responses
    const rows = responses.map(r => ({
      guest_id:           guest.id,
      function_id:        r.function_id,
      status:             r.status,
      dietary_confirmed:  dietary,
      plus_one_confirmed: plus_one,
      children_confirmed: children_count,
      responded_at:       new Date().toISOString()
    }))

    console.log('Upserting rows:', JSON.stringify(rows, null, 2))

    const { data: upsertData, error: upsertError } = await supabase
      .from('rsvp_responses')
      .upsert(rows, { onConflict: 'guest_id,function_id' })
      .select()

    console.log('Upsert result:', upsertData, upsertError)

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, inserted: rows.length })

  } catch (err) {
    console.log('CAUGHT ERROR:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}