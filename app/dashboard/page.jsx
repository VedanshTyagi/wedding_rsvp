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
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-[#e8ddd0] bg-[linear-gradient(135deg,#fffdf9_0%,#fdf5ee_100%)] px-8 py-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#f3dfc8]/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#edd498]/30 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="mb-3 text-sm text-[#9e8878]">Wedding planner</p>
            <h1 className="text-[34px] leading-tight text-[#2c1810]">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-base text-[#6f5a4a]">
              A calm overview of every wedding you are actively managing.
            </p>
          </div>

          <Link
            href="/dashboard/new"
            className="rounded-lg border border-crimson bg-crimson px-5 py-3 text-sm text-white transition-opacity hover:opacity-90"
          >
            Create new wedding
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl text-[#2c1810]">Active weddings</h2>
          <p className="mt-1 text-sm text-[#9e8878]">
            {weddings?.length ?? 0} wedding{weddings?.length === 1 ? '' : 's'} currently in progress
          </p>
        </div>

        {weddings && weddings.length > 0 && (
          <div className="rounded-full border border-[#e8ddd0] bg-white px-4 py-2 text-sm text-[#6f5a4a]">
            Sorted by start date
          </div>
        )}
      </div>

      {weddings && weddings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {weddings.map((w) => (
            <Link
              key={w.id}
              href={`/dashboard/${w.id}`}
              className="group block overflow-hidden rounded-[24px] border border-sand bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[#c9a96e] hover:bg-[#fffdf9] hover:shadow-[0_18px_50px_rgba(74,55,40,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl leading-tight text-[#2c1810]">{w.couple_names}</div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#9e8878]">
                    {w.city && <span>{w.city}</span>}
                    {w.start_date && <span>{w.start_date}</span>}
                    {w.guest_count_est > 0 && <span>{w.guest_count_est} guests</span>}
                  </div>
                </div>
                <span className="text-xl text-[#c9a96e] transition-transform group-hover:translate-x-1">→</span>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#f0e8df] pt-4 text-sm text-[#6f5a4a]">
                <span>Open wedding dashboard</span>
                <span className="rounded-full bg-[#fdf5ee] px-3 py-1 text-[#4a3728]">
                  View details
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-sand bg-white p-12 text-center">
          <p className="mb-4 text-base text-[#6f5a4a]">No weddings yet</p>
          <Link
            href="/dashboard/new"
            className="inline-block rounded-lg border border-crimson bg-crimson px-5 py-3 text-sm text-white transition-opacity hover:opacity-90"
          >
            Create your first wedding
          </Link>
        </div>
      )}
    </div>
  )
}
