import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: weddings, error } = await supabase
    .from('weddings')
    .select('id, couple_names, city, start_date, end_date, guest_count_est')
    .order('start_date', { ascending: true })

  if (error) console.error(error)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Your active weddings</p>
        </div>
        <Link
          href="/dashboard/new"
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          + New wedding
        </Link>
      </div>

      {/* Wedding list */}
      {weddings && weddings.length > 0 ? (
        <div className="grid gap-4">
          {weddings.map(w => (
            <Link
              key={w.id}
              href={`/dashboard/${w.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-400 transition-colors block"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg">{w.couple_names}</div>
                  <div className="text-sm text-gray-500 mt-1 flex gap-3">
                    {w.city && <span>{w.city}</span>}
                    {w.start_date && <span>{w.start_date}</span>}
                    {w.guest_count_est > 0 && (
                      <span>{w.guest_count_est} guests</span>
                    )}
                  </div>
                </div>
                <span className="text-gray-300 text-lg">→</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">No weddings yet</p>
          <Link
            href="/dashboard/new"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm inline-block"
          >
            Create your first wedding
          </Link>
        </div>
      )}
    </div>
  )
}