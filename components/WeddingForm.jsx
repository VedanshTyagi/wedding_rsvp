'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function WeddingForm() {
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(formData) {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('weddings').insert({
      planner_id:      user.id,
      couple_names:    formData.get('couple_names'),
      venue:           formData.get('venue'),
      city:            formData.get('city'),
      start_date:      formData.get('start_date'),
      end_date:        formData.get('end_date'),
      guest_count_est: parseInt(formData.get('guest_count'))
    })

    if (!error) router.refresh()   // re-fetches server data
  }

  return <form action={handleSubmit}>{/* your form fields */}</form>
}