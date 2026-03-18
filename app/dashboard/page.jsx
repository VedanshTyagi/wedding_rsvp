import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: weddings, error } = await supabase
    .from('weddings')
    .select(`
      id, couple_names, city, start_date, end_date, guest_count_est,
      wedding_functions ( id, name, function_date )
    `)
    .order('start_date', { ascending: true })

  if (error) console.error(error)

  return <WeddingList weddings={weddings} />
}