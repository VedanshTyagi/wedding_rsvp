// app/api/invite/guest/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const token = request.nextUrl.searchParams.get('token')
  console.log('Guest API called with token:', token)

  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Get guest by token
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('id, full_name, dietary_pref, wedding_id')
    .eq('invite_token', token)
    .single()

  console.log('Guest result:', guest, 'Error:', guestError)

  if (guestError || !guest) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
  }

  // Get wedding
  const { data: wedding } = await supabase
    .from('weddings')
    .select('couple_names, venue, city')
    .eq('id', guest.wedding_id)
    .single()

  // Get function invites
  const { data: invites, error: inviteError } = await supabase
    .from('guest_function_invites')
    .select(`
      function_id,
      wedding_functions ( id, name, function_date, start_time )
    `)
    .eq('guest_id', guest.id)

  console.log('Invites:', invites, 'Error:', inviteError)

  return NextResponse.json({
    guest: {
      ...guest,
      weddings: wedding,
      guest_function_invites: invites || []
    }
  })
}