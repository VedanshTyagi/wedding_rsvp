import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function InvitePage({ params }) {
  const { token } = await params

  // Use service_role — guests have no session so anon key + RLS won't work
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: guest, error } = await supabase
    .from('guests')
    .select(`
      id, full_name,
      weddings ( couple_names, venue, city ),
      guest_function_invites (
        wedding_functions (
          id, name, function_date, start_time, venue_detail
        )
      )
    `)
    .eq('invite_token', token)
    .single()

  if (error || !guest) notFound()

  // Pull functions out and sort by date
  const functions = (guest.guest_function_invites || [])
    .map(gfi => gfi.wedding_functions)
    .filter(Boolean)
    .sort((a, b) => new Date(a.function_date) - new Date(b.function_date))

  const wedding = guest.weddings

  return (
    <>
      {/* Inline styles for the dark animated invite — Tailwind can't do keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1;   }
        }
        .invite-root {
          min-height: 100vh;
          background: #0f0a0d;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          font-family: Georgia, serif;
        }
        .invite-card {
          width: 100%;
          max-width: 400px;
          text-align: center;
          animation: fadeUp 1s ease both;
        }
        .invite-ornament {
          color: #c9a84c;
          font-size: 1.2rem;
          animation: shimmer 3s ease-in-out infinite;
          margin-bottom: 1.5rem;
          letter-spacing: 0.3em;
        }
        .invite-pre {
          color: #c9a84c;
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          opacity: 0.7;
          margin-bottom: 0.75rem;
          font-family: sans-serif;
          animation: fadeUp 1s ease 0.2s both;
        }
        .invite-names {
          color: #f5ecd7;
          font-size: 2.6rem;
          font-weight: 400;
          line-height: 1.1;
          letter-spacing: 0.02em;
          animation: fadeUp 1s ease 0.35s both;
          margin-bottom: 0.5rem;
        }
        .invite-divider {
          width: 60px;
          height: 1px;
          background: #c9a84c;
          margin: 1rem auto;
          opacity: 0.5;
          animation: fadeUp 1s ease 0.5s both;
        }
        .invite-request {
          color: #c9a84c;
          font-size: 0.7rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.8;
          font-family: sans-serif;
          animation: fadeUp 1s ease 0.6s both;
        }
        .invite-guest {
          color: #f5ecd7;
          font-size: 1rem;
          margin-top: 0.4rem;
          opacity: 0.85;
          animation: fadeUp 1s ease 0.7s both;
        }
        .invite-functions {
          margin: 1.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          animation: fadeUp 1s ease 0.8s both;
        }
        .invite-fn {
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 8px;
          padding: 0.6rem 1rem;
          text-align: left;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .invite-fn-name {
          color: #e8d5a3;
          font-size: 0.85rem;
          font-family: Georgia, serif;
        }
        .invite-fn-date {
          color: rgba(200,180,140,0.6);
          font-size: 0.7rem;
          font-family: sans-serif;
          letter-spacing: 0.05em;
        }
        .invite-venue {
          color: rgba(200,180,140,0.5);
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-family: sans-serif;
          margin-bottom: 2rem;
          animation: fadeUp 1s ease 0.9s both;
        }
        .invite-btn-yes {
          display: block;
          width: 100%;
          padding: 0.85rem;
          background: #c9a84c;
          color: #0f0a0d;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          font-family: sans-serif;
          margin-bottom: 0.6rem;
          animation: fadeUp 1s ease 1s both;
          transition: background 0.2s;
        }
        .invite-btn-yes:hover { background: #b8962e; }
        .invite-btn-no {
          display: block;
          width: 100%;
          padding: 0.75rem;
          border: 1px solid rgba(201,168,76,0.25);
          color: rgba(200,180,140,0.5);
          border-radius: 8px;
          font-size: 0.8rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          font-family: sans-serif;
          animation: fadeUp 1s ease 1.1s both;
          transition: border-color 0.2s;
        }
        .invite-btn-no:hover { border-color: rgba(201,168,76,0.5); }
        .invite-deadline {
          color: rgba(200,180,140,0.3);
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: sans-serif;
          margin-top: 1.5rem;
          animation: fadeUp 1s ease 1.2s both;
        }
      `}</style>

      <div className="invite-root">
        <div className="invite-card">

          <div className="invite-ornament">✦ ✦ ✦</div>

          <p className="invite-pre">Together with their families</p>

          <h1 className="invite-names">
            {wedding?.couple_names || 'A Wedding'}
          </h1>

          <div className="invite-divider"></div>

          <p className="invite-request">
            Request the pleasure of your company
          </p>
          <p className="invite-guest">
            Dear {guest.full_name}
          </p>

          {/* Functions list */}
          {functions.length > 0 && (
            <div className="invite-functions">
              {functions.map(fn => (
                <div key={fn.id} className="invite-fn">
                  <span className="invite-fn-name">{fn.name}</span>
                  <span className="invite-fn-date">
                    {fn.function_date
                      ? new Date(fn.function_date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short'
                        })
                      : ''}
                    {fn.start_time ? ` · ${fn.start_time.slice(0,5)}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {wedding?.venue && (
            <p className="invite-venue">
              {wedding.venue}{wedding.city ? `, ${wedding.city}` : ''}
            </p>
          )}

          <Link href={`/invite/${token}/rsvp?response=yes`}
            className="invite-btn-yes">
            ✓   I'll be there
          </Link>

          <Link href={`/invite/${token}/rsvp?response=no`}
            className="invite-btn-no">
            Unable to attend
          </Link>

          <p className="invite-deadline">
            Please respond at your earliest convenience
          </p>

        </div>
      </div>
    </>
  )
}