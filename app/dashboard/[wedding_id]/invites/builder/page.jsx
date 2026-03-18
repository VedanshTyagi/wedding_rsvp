// app/dashboard/[weddingId]/invites/builder/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const THEMES = [
  {
    id: 'royal',
    name: 'Royal Burgundy',
    bg: '#2D0A16',
    accent: '#C9A84C',
    text: '#FAF7F2',
    border: '#C9A84C',
    font: 'Georgia, serif',
  },
  {
    id: 'garden',
    name: 'Garden Blush',
    bg: '#FDF6F0',
    accent: '#B5634A',
    text: '#2C1810',
    border: '#D4956A',
    font: 'Georgia, serif',
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    bg: '#0A1628',
    accent: '#7B9ED9',
    text: '#E8F0FB',
    border: '#7B9ED9',
    font: 'Georgia, serif',
  },
  {
    id: 'ivory',
    name: 'Ivory Minimal',
    bg: '#FAFAF7',
    accent: '#4A4A45',
    text: '#1C1C1A',
    border: '#C8C8C0',
    font: 'Georgia, serif',
  },
]

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
]

export default function InviteBuilderPage({ params }) {
  const { wedding_id } = params
  const weddingId = wedding_id
  const supabase = createClient()

  const [theme, setTheme] = useState(THEMES[0])
  const [language, setLanguage] = useState('en')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [functions, setFunctions] = useState([])
  const [selectedFunction, setSelectedFunction] = useState('')

  const [content, setContent] = useState({
    headline: 'Together with their families',
    couple_names: '',
    venue: '',
    city: '',
    date: '',
    time: '',
    rsvp_note: 'Kindly respond by',
    rsvp_deadline: '',
    footer_note: 'We joyfully invite you to celebrate with us',
  })

  useEffect(() => {
    async function load() {
      const { data: wedding } = await supabase
        .from('weddings')
        .select('couple_names, venue, city, start_date')
        .eq('id', weddingId)
        .single()

      if (wedding) {
        setContent(prev => ({
          ...prev,
          couple_names: wedding.couple_names || '',
          venue: wedding.venue || '',
          city: wedding.city || '',
          date: wedding.start_date || '',
        }))
      }

      const { data: fns } = await supabase
        .from('wedding_functions')
        .select('id, name, function_date')
        .eq('wedding_id', weddingId)
        .order('function_date')

      setFunctions(fns || [])
    }
    load()
  }, [weddingId])

  function handleContentChange(e) {
    const { name, value } = e.target
    setContent(prev => ({ ...prev, [name]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('invite_templates').insert({
      wedding_id: weddingId,
      function_id: selectedFunction || null,
      name: `${theme.name} — ${content.couple_names || 'Invite'}`,
      template_type: 'static',
      is_default: false,
      content_json: {
        theme: theme.id,
        language,
        content,
      },
    })
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-screen">

      {/* ── LEFT PANEL: Controls ── */}
      <div className="w-full lg:w-96 space-y-6 flex-shrink-0">

        <div>
          <h1 className="text-2xl font-display font-semibold">Invite Builder</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Design your digital wedding invite</p>
        </div>

        {/* Function selector */}
        <div className="border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-medium">Function</h2>
          <select
            value={selectedFunction}
            onChange={e => setSelectedFunction(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">General invite (all functions)</option>
            {functions.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Theme picker */}
        <div className="border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-medium">Theme</h2>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t)}
                className={`relative rounded-lg p-3 text-left border-2 transition-all ${
                  theme.id === t.id ? 'border-primary' : 'border-border'
                }`}
                style={{ background: t.bg }}
              >
                <div
                  className="w-full h-6 rounded mb-2"
                  style={{ background: t.accent, opacity: 0.8 }}
                />
                <p className="text-xs font-medium" style={{ color: t.text }}>{t.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-medium">Language</h2>
          <div className="flex gap-2">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`flex-1 py-1.5 text-sm rounded-md border transition-colors ${
                  language === l.code
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content fields */}
        <div className="border border-border rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-medium">Content</h2>

          {[
            { label: 'Headline text', name: 'headline', placeholder: 'Together with their families' },
            { label: 'Couple names', name: 'couple_names', placeholder: 'Priya & Arjun' },
            { label: 'Venue', name: 'venue', placeholder: 'The Leela Palace' },
            { label: 'City', name: 'city', placeholder: 'Udaipur' },
            { label: 'Date', name: 'date', placeholder: '14th February 2026', type: 'date' },
            { label: 'Time', name: 'time', placeholder: '7:00 PM onwards', type: 'time' },
            { label: 'RSVP deadline', name: 'rsvp_deadline', placeholder: '1st February', type: 'date' },
            { label: 'Footer note', name: 'footer_note', placeholder: 'We joyfully invite you...' },
          ].map(f => (
            <div key={f.name}>
              <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
              <input
                type={f.type || 'text'}
                name={f.name}
                value={content[f.name] || ''}
                onChange={handleContentChange}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Template'}
        </button>
      </div>

      {/* ── RIGHT PANEL: Live Preview ── */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">Live preview</p>
          <div className="flex gap-2 text-xs text-muted-foreground border border-border rounded-md overflow-hidden">
            <span className="px-3 py-1 bg-muted">Desktop</span>
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-border overflow-hidden flex items-center justify-center bg-muted/20 p-4 min-h-[600px]">
          <InvitePreview theme={theme} content={content} language={language} />
        </div>
      </div>
    </div>
  )
}

// ── Live Preview Component ──
function InvitePreview({ theme, content, language }) {
  const t = theme

  const labels = {
    en: {
      with_family: content.headline || 'Together with their families',
      invite_you: 'invite you to the wedding celebration of',
      venue_label: 'Venue',
      date_label: 'Date & Time',
      rsvp: content.rsvp_note || 'Kindly respond by',
      footer: content.footer_note || 'We joyfully invite you to celebrate with us',
    },
    hi: {
      with_family: 'अपने परिवार के साथ',
      invite_you: 'आपको विवाह समारोह में आमंत्रित करते हैं',
      venue_label: 'स्थान',
      date_label: 'तारीख और समय',
      rsvp: 'कृपया इस तारीख तक उत्तर दें',
      footer: 'हम आपको अपने साथ उत्सव मनाने के लिए सहर्ष आमंत्रित करते हैं',
    },
  }

  const l = labels[language] || labels.en

  return (
    <div
      style={{
        background: t.bg,
        border: `2px solid ${t.border}`,
        borderRadius: '12px',
        padding: '48px 40px',
        maxWidth: '420px',
        width: '100%',
        fontFamily: t.font,
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* Corner ornaments */}
      <div style={{ position: 'absolute', top: 12, left: 12, color: t.accent, fontSize: 20, opacity: 0.6 }}>✦</div>
      <div style={{ position: 'absolute', top: 12, right: 12, color: t.accent, fontSize: 20, opacity: 0.6 }}>✦</div>
      <div style={{ position: 'absolute', bottom: 12, left: 12, color: t.accent, fontSize: 20, opacity: 0.6 }}>✦</div>
      <div style={{ position: 'absolute', bottom: 12, right: 12, color: t.accent, fontSize: 20, opacity: 0.6 }}>✦</div>

      {/* Top divider */}
      <div style={{ height: 1, background: t.accent, opacity: 0.4, marginBottom: 28 }} />

      {/* Headline */}
      <p style={{ color: t.accent, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
        {l.with_family}
      </p>

      {/* Invite text */}
      <p style={{ color: t.text, fontSize: 13, opacity: 0.7, marginBottom: 20 }}>
        {l.invite_you}
      </p>

      {/* Couple names */}
      <h1 style={{ color: t.accent, fontSize: 32, fontWeight: 'normal', letterSpacing: '0.04em', lineHeight: 1.3, marginBottom: 24 }}>
        {content.couple_names || 'Priya & Arjun'}
      </h1>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 1, background: t.accent, opacity: 0.3 }} />
        <span style={{ color: t.accent, fontSize: 16 }}>❧</span>
        <div style={{ flex: 1, height: 1, background: t.accent, opacity: 0.3 }} />
      </div>

      {/* Venue */}
      {(content.venue || content.city) && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: t.accent, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
            {l.venue_label}
          </p>
          <p style={{ color: t.text, fontSize: 15, fontWeight: 'normal' }}>
            {content.venue || '—'}
          </p>
          {content.city && (
            <p style={{ color: t.text, fontSize: 13, opacity: 0.7 }}>{content.city}</p>
          )}
        </div>
      )}

      {/* Date & Time */}
      {(content.date || content.time) && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: t.accent, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
            {l.date_label}
          </p>
          <p style={{ color: t.text, fontSize: 15 }}>
            {content.date ? new Date(content.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          </p>
          {content.time && (
            <p style={{ color: t.text, fontSize: 13, opacity: 0.7 }}>{content.time}</p>
          )}
        </div>
      )}

      {/* RSVP deadline */}
      {content.rsvp_deadline && (
        <div style={{
          border: `1px solid ${t.accent}`,
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 24,
          opacity: 0.85,
        }}>
          <p style={{ color: t.text, fontSize: 12 }}>
            {l.rsvp} {new Date(content.rsvp_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
          </p>
        </div>
      )}

      {/* Bottom divider */}
      <div style={{ height: 1, background: t.accent, opacity: 0.4, marginBottom: 20 }} />

      {/* Footer */}
      <p style={{ color: t.text, fontSize: 12, opacity: 0.6, fontStyle: 'italic', lineHeight: 1.6 }}>
        {l.footer}
      </p>
    </div>
  )
}