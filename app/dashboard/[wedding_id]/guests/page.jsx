const { data: guests } = await supabase
  .from('guests')
  .select(`
    id, full_name, phone, email, group_tag,
    dietary_pref, is_outstation, travel_city,
    guest_function_invites ( function_id ),
    rsvp_responses ( status, function_id )
  `)
  .eq('wedding_id', weddingId)
  .order('full_name')

  async function addGuest(guestData, functionIds) {
  // 1. Insert the guest row
  const { data: guest, error } = await supabase
    .from('guests')
    .insert({ wedding_id: weddingId, ...guestData })
    .select()
    .single()

  if (error || !guest) return

  // 2. Insert function invites — one row per function
  const invites = functionIds.map(fid => ({
    guest_id: guest.id,
    function_id: fid
  }))
  await supabase.from('guest_function_invites').insert(invites)

  // 3. Also seed pending RSVP rows for each function
  const rsvpRows = functionIds.map(fid => ({
    guest_id: guest.id, function_id: fid, status: 'pending'
  }))
  await supabase.from('rsvp_responses').insert(rsvpRows)
}

import Papa from 'papaparse'

async function handleCSVUpload(file) {
  Papa.parse(file, {
    header: true,        // first row = column names
    skipEmptyLines: true,
    complete: async ({ data }) => {
      const rows = data.map(row => ({
        wedding_id:   weddingId,
        full_name:    row['Name'],
        phone:        row['Phone'],
        email:        row['Email'],
        group_tag:    row['Group']?.toLowerCase() || 'general',
        dietary_pref: row['Dietary']?.toLowerCase() || 'vegetarian',
        is_outstation: row['Outstation'] === 'Yes'
      }))
      await supabase.from('guests').insert(rows)
      router.refresh()
    }
  })
}

const { data: rsvpSummary } = await supabase
  .from('rsvp_responses')
  .select(`
    status,
    wedding_functions ( id, name, function_date )
  `)
  .in('function_id', functionIds)  // array of function IDs for this wedding

// Group by function in JS:
const summary = rsvpSummary.reduce((acc, row) => {
  const fn = row.wedding_functions.name
  if (!acc[fn]) acc[fn] = { confirmed:0, pending:0, declined:0 }
  acc[fn][row.status]++
  return acc
}, {})