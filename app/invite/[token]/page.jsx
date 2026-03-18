import { createClient } from '@supabase/supabase-js'

export default async function InvitePage({ params }) {
  const { token } = await params

  // Service role client — server only, never send to browser
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY   // bypasses RLS
  )

  const { data: guest } = await supabase
    .from('guests')
    .select(`
      id, full_name, wedding_id,
      guest_function_invites (
        wedding_functions ( id, name, function_date, venue_detail )
      ),
      weddings ( couple_names, city )
    `)
    .eq('invite_token', token)
    .single()

  if (!guest) return <div>Invite not found</div>

  return <InviteCard guest={guest} token={token} />
}