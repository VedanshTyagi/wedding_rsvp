'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InviteCard({ guest, token, functions, wedding }) {
  const [declined, setDeclined] = useState(false)
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleDecline() {
    setLoading(true)
    await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        responses: functions.map(fn => ({
          function_id: fn.id,
          status: 'declined'
        })),
        dietary: '',
        plus_one: false
      })
    })
    setLoading(false)
    setDeclined(true)
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric',
      month: 'long', year: 'numeric'
    })
  }

  function formatTime(timeStr) {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12  = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  if (declined) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.divider} />
          <p style={styles.tagline}>We'll miss you</p>
          <h1 style={styles.names}>{wedding.couple_names}</h1>
          <div style={styles.divider} />
          <p style={{ ...styles.sub, marginTop: 24 }}>
            Thank you for letting us know, {guest.full_name}.
          </p>
          <p style={{ ...styles.sub, opacity: 0.5 }}>
            Your response has been recorded.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .invite-fade { animation: fadeUp 0.9s ease forwards; opacity: 0; }
        .invite-fade-1 { animation-delay: 0.1s; }
        .invite-fade-2 { animation-delay: 0.35s; }
        .invite-fade-3 { animation-delay: 0.6s; }
        .invite-fade-4 { animation-delay: 0.85s; }
        .invite-fade-5 { animation-delay: 1.1s; }
        .invite-fade-6 { animation-delay: 1.35s; }
        .rsvp-btn:hover  { background: #C9A84C !important; transform: translateY(-1px); }
        .decl-btn:hover  { border-color: rgba(255,255,255,0.3) !important; color: rgba(255,255,255,0.7) !important; }
      `}</style>

      <div style={styles.card}>

        {/* Top decoration */}
        <p className="invite-fade invite-fade-1" style={styles.tagline}>
          You are cordially invited to celebrate
        </p>

        <div className="invite-fade invite-fade-2" style={styles.divider} />

        {/* Couple names — the hero */}
        <h1 className="invite-fade invite-fade-2" style={styles.names}>
          {wedding.couple_names}
        </h1>

        <div className="invite-fade invite-fade-3" style={styles.divider} />

        {/* Guest name */}
        <p className="invite-fade invite-fade-3" style={styles.guestName}>
          Dear {guest.full_name}
        </p>

        {/* Functions list */}
        <div className="invite-fade invite-fade-4" style={styles.fnList}>
          {functions.map((fn, i) => (
            <div key={fn.id} style={styles.fnItem}>
              <span style={styles.fnName}>{fn.name}</span>
              {fn.function_date && (
                <span style={styles.fnDate}>{formatDate(fn.function_date)}</span>
              )}
              {fn.start_time && (
                <span style={styles.fnTime}>{formatTime(fn.start_time)}</span>
              )}
              {fn.venue_detail && (
                <span style={styles.fnVenue}>{fn.venue_detail}</span>
              )}
              {i < functions.length - 1 && <div style={styles.fnDivider} />}
            </div>
          ))}
        </div>

        {/* Venue */}
        {(wedding.venue || wedding.city) && (
          <p className="invite-fade invite-fade-4" style={styles.venue}>
            {[wedding.venue, wedding.city].filter(Boolean).join(', ')}
          </p>
        )}

        {/* CTA buttons */}
        <div className="invite-fade invite-fade-5" style={styles.btnRow}>
          <button
            className="rsvp-btn"
            style={styles.rsvpBtn}
            onClick={() => router.push(`/invite/${token}/rsvp`)}
          >
            I'll be there
          </button>
          <button
            className="decl-btn"
            style={styles.declBtn}
            onClick={handleDecline}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Unable to attend'}
          </button>
        </div>

        {/* Footer */}
        <p className="invite-fade invite-fade-6" style={styles.footer}>
          Kindly respond at your earliest convenience
        </p>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0F0A0D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    maxWidth: 480,
    width: '100%',
    textAlign: 'center',
    padding: '3rem 2rem',
    border: '1px solid rgba(201,168,76,0.2)',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.03)',
  },
  tagline: {
    fontSize: 11,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'rgba(201,168,76,0.7)',
    marginBottom: 16,
  },
  divider: {
    width: 60,
    height: 1,
    background: 'rgba(201,168,76,0.4)',
    margin: '0 auto 20px',
  },
  names: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(2rem, 8vw, 3rem)',
    fontWeight: 300,
    color: '#E8D5A3',
    letterSpacing: '0.04em',
    lineHeight: 1.15,
    marginBottom: 20,
  },
  guestName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '0.06em',
    marginBottom: 28,
  },
  fnList: {
    marginBottom: 24,
  },
  fnItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 4,
  },
  fnName: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 20,
    fontWeight: 400,
    color: '#fff',
    letterSpacing: '0.04em',
  },
  fnDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  fnTime: {
    fontSize: 12,
    color: 'rgba(201,168,76,0.8)',
  },
  fnVenue: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.04em',
  },
  fnDivider: {
    width: 30,
    height: 1,
    background: 'rgba(255,255,255,0.08)',
    margin: '10px auto',
  },
  venue: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: '0.06em',
    marginBottom: 32,
  },
  btnRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '0 1rem',
    marginBottom: 28,
  },
  rsvpBtn: {
    background: 'rgba(201,168,76,0.85)',
    color: '#0F0A0D',
    border: 'none',
    borderRadius: 99,
    padding: '14px 0',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.08em',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'DM Sans', sans-serif",
  },
  declBtn: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.35)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 99,
    padding: '13px 0',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'DM Sans', sans-serif",
  },
  footer: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
}