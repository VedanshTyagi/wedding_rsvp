import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const FN_COLORS = {
  Mehendi:   'bg-green-50  text-green-700  border-green-200',
  Haldi:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  Sangeet:   'bg-purple-50 text-purple-700 border-purple-200',
  Baraat:    'bg-orange-50 text-orange-700 border-orange-200',
  Pheras:    'bg-red-50    text-red-700    border-red-200',
  Reception: 'bg-amber-50  text-amber-700  border-amber-200',
}

export default async function WeddingProfilePage({ params }) {
  const { weddingId } = await params
  const supabase = await createClient()

  // Fetch wedding + its functions in one query
  const { data: wedding, error } = await supabase
    .from('weddings')
    .select(`
      id, couple_names, venue, city,
      start_date, end_date, guest_count_est,
      wedding_functions (
        id, name, function_date,
        start_time, venue_detail
      )
    `)
    .eq('id', weddingId)
    .single()

  if (error || !wedding) notFound()

  // Sort functions by date
  const functions = [...(wedding.wedding_functions || [])]
    .sort((a, b) => new Date(a.function_date) - new Date(b.function_date))

  return (
    <div className="max-w-3xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/dashboard"
          className="text-gray-400 hover:text-gray-600">
          Dashboard
        </Link>
        <span className="text-gray-200">/</span>
        <span className="text-gray-600">{wedding.couple_names}</span>
      </div>

      {/* Hero header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {wedding.couple_names}
            </h1>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              {wedding.venue && <span>{wedding.venue}</span>}
              {wedding.city  && <span>· {wedding.city}</span>}
            </div>
          </div>
          <Link
            href={`/dashboard/${weddingId}/guests`}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Manage guests →
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-400 mb-1">Start date</div>
            <div className="text-sm font-medium">
              {wedding.start_date
                ? new Date(wedding.start_date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">End date</div>
            <div className="text-sm font-medium">
              {wedding.end_date
                ? new Date(wedding.end_date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Est. guests</div>
            <div className="text-sm font-medium">
              {wedding.guest_count_est || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Functions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
            Ceremony functions
          </h2>
          <span className="text-xs text-gray-400">
            {functions.length} function{functions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {functions.length === 0 ? (
          <p className="text-sm text-gray-400">
            No functions added yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {functions.map(fn => (
              <div key={fn.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50"
              >
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border
                  ${FN_COLORS[fn.name] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {fn.name}
                </span>
                <div className="flex gap-4 text-sm text-gray-500">
                  {fn.function_date && (
                    <span>
                      {new Date(fn.function_date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short'
                      })}
                    </span>
                  )}
                  {fn.start_time && (
                    <span>
                      {fn.start_time.slice(0, 5)}
                    </span>
                  )}
                  {fn.venue_detail && (
                    <span>· {fn.venue_detail}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Guests',        desc: 'Add & manage guest list',    href: 'guests' },
          { label: 'RSVP Tracker',  desc: 'Live response dashboard',    href: 'rsvp' },
          { label: 'Invite Templates', desc: 'Design invite templates',    href: 'invites/builder' },
          { label: 'Send Invites',     desc: 'Select guests & send',       href: 'invites/send' },
          { label: 'Accommodation', desc: 'Room assignments',           href: 'accommodation' },
          { label: 'Seating',       desc: 'Table plan builder',         href: 'seating' },
          { label: 'Check-in',      desc: 'Day-of guest check-in',      href: 'checkin' },
          { label: 'Analytics',     desc: 'RSVP charts & exports',      href: 'analytics' },
          { label: 'CRM Sync',      desc: 'Integration settings',       href: 'crm' },
        ].map(item => (
          <Link
            key={item.href}
            href={`/dashboard/${weddingId}/${item.href}`}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors"
          >
            <div className="font-medium text-sm">{item.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
          </Link>
        ))}
      </div>

    </div>
  )
}