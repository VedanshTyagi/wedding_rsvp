// app/api/invite/guest/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: guest, error } = await supabase
    .from('guests')
    .select(`
      id, full_name, dietary_pref,
      weddings ( couple_names ),
      guest_function_invites (
        wedding_functions ( id, name, function_date, start_time )
      )
    `)
    .eq('invite_token', token)
    .single()

  if (error || !guest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ guest })
}