// app/dashboard/[weddingId]/guests/page.jsx
import { createClient } from '@/lib/supabase/server'
import GuestList from '@/components/guests/GuestList'

export default async function GuestsPage({ params }) {
  const { weddingId } = await params
  const supabase = await createClient()

  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('full_name')

  return <GuestList weddingId={weddingId} initialGuests={guests || []} />
}