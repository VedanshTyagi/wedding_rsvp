'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RSVPTracker({ weddingId, initialData }) {
  const [rsvps, setRsvps] = useState(initialData)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`rsvp-${weddingId}`)
      .on('postgres_changes', {
        event:  '*',           // INSERT, UPDATE, DELETE
        schema: 'public',
        table:  'rsvp_responses'
      }, (payload) => {
        // Update only the changed row in state
        setRsvps(prev => {
          const idx = prev.findIndex(r => r.id === payload.new.id)
          if (idx === -1) return [...prev, payload.new]
          const next = [...prev]
          next[idx] = payload.new
          return next
        })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)   // cleanup on unmount
  }, [weddingId])

  // Derive counts from state
  const confirmed = rsvps.filter(r => r.status === 'confirmed').length
  const pending   = rsvps.filter(r => r.status === 'pending').length

  return <div>{/* render your tracker UI */}</div>
}