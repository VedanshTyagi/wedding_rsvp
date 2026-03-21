"use client";

/**
 * FILE: app/dashboard/[weddingId]/cards/bulk/page.jsx
 * ROUTE: /dashboard/[weddingId]/cards/bulk
 *
 * Bulk card sender:
 * 1. Pick style, palette, font (same card design for all)
 * 2. Select guests
 * 3. Send Email (automatic via Resend, card image embedded, each guest gets only their functions)
 * 4. Send WhatsApp (opens wa.me one by one with message pre-filled)
 */

import { useState, use, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ── Style configs ──────────────────────────────────────────────────────────────
const STYLES = {
  royal:    { nc:"#f5d08a", ac:"rgba(201,150,58,.85)", top:"🪔 ॐ 🪔",         bot:"❋ ✦ ❋",   sub:"— शुभ विवाह —",           and:"weds", border:"rgba(201,150,58,.4)",  label:"Royal Rajasthani" },
  floral:   { nc:"#7a1a35", ac:"#c4607a",              top:"🌸 🌺 🌸",         bot:"🌿 ✿ 🌿",  sub:"With Blessings",          and:"&",    border:"rgba(196,96,122,.35)", label:"Floral Pastel"    },
  modern:   { nc:"#2a1f15", ac:"#8a6a4a",              top:"— ✦ —",           bot:"— ✦ —",   sub:"Together Forever",        and:"&",    border:"rgba(138,106,74,.25)", label:"Modern Minimal"   },
  temple:   { nc:"#ffd060", ac:"rgba(232,137,12,.9)",  top:"🔱 ॐ 🔱",         bot:"❁ ✦ ❁",   sub:"— मंगलम् —",             and:"weds", border:"rgba(232,137,12,.45)", label:"Temple Gold"      },
  south:    { nc:"#90ee90", ac:"rgba(100,200,100,.85)",top:"🌿 ✿ 🌿",         bot:"🍃 ✦ 🍃",  sub:"— శుభ వివాహం —",          and:"&",    border:"rgba(100,200,100,.35)",label:"South Indian"     },
  mughal:   { nc:"#c9b0ff", ac:"rgba(155,114,207,.9)", top:"☽ ✦ ☾",          bot:"◈ ✦ ◈",   sub:"— مبارک ہو —",            and:"weds", border:"rgba(155,114,207,.4)", label:"Mughal Garden"    },
  bengali:  { nc:"#ffcc88", ac:"rgba(220,150,50,.9)",  top:"🐚 শুভ বিবাহ 🐚", bot:"❈ ✦ ❈",   sub:"— আশীর্বাদ —",            and:"ও",    border:"rgba(220,150,50,.4)",  label:"Bengali"          },
  punjabi:  { nc:"#ffd1e8", ac:"rgba(220,80,150,.9)",  top:"🥁 ਸ਼ੁਭ ਵਿਆਹ 🥁", bot:"✿ ❋ ✿",  sub:"— ਵਧਾਈ —",                and:"&",    border:"rgba(220,80,150,.4)",  label:"Punjabi Dhol"     },
  luxury:   { nc:"#d4af37", ac:"rgba(212,175,55,.9)",  top:"◈ ✦ ◈",          bot:"◈ ✦ ◈",   sub:"An Intimate Celebration", and:"&",    border:"rgba(212,175,55,.45)", label:"Black Luxury"     },
};

const PALETTES = {
  redgold:    { b1:"#8b1a1a", b2:"#c9963a", label:"Red Gold"    },
  rosepink:   { b1:"#d4556a", b2:"#fce4ec", label:"Rose Pink"   },
  tealgold:   { b1:"#1a6b6b", b2:"#c9963a", label:"Teal Gold"   },
  marigold:   { b1:"#e8890c", b2:"#3d2000", label:"Marigold"    },
  blackgold:  { b1:"#000",    b2:"#c9963a", label:"Black Gold"  },
  green:      { b1:"#0a2010", b2:"#3a9a3a", label:"Green"       },
  navygold:   { b1:"#003366", b2:"#c9963a", label:"Navy Gold"   },
  luxury:     { b1:"#050505", b2:"#0f0f0f", label:"Pure Black"  },
};

const FONTS = {
  playfair:  { label:"Playfair",  value:"'Playfair Display',serif"     },
  cinzel:    { label:"Cinzel",    value:"'Cinzel',serif"               },
  dancing:   { label:"Dancing",   value:"'Dancing Script',cursive"     },
  cormorant: { label:"Cormorant", value:"'Cormorant Garamond',serif"   },
};

// ── Mini card renderer component ───────────────────────────────────────────────
function CardRenderer({ style, palette, font, wedding, guestFns, innerRef, scale = 1 }) {
  const S = STYLES[style]   ?? STYLES.royal;
  const P = PALETTES[palette] ?? PALETTES.redgold;
  const F = FONTS[font]?.value ?? FONTS.playfair.value;
  const bg = `linear-gradient(145deg, ${P.b1}, ${P.b2})`;

  return (
    <div ref={innerRef} style={{
      background: bg, borderRadius: "14px", overflow: "hidden",
      position: "relative", width: `${480 * scale}px`, minHeight: `${360 * scale}px`,
      fontFamily: F,
    }}>
      <div style={{
        position: "absolute", inset: `${10 * scale}px`, borderRadius: `${10 * scale}px`,
        border: `1px solid ${S.border}`, pointerEvents: "none", zIndex: 1,
      }}/>
      <div style={{
        position: "relative", zIndex: 2,
        padding: `${40 * scale}px ${48 * scale}px`,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: `${12 * scale}px`, minHeight: `${360 * scale}px`, justifyContent: "center",
      }}>
        <div style={{ color: S.ac, fontSize: `${13 * scale}px`, opacity: .8 }}>ॐ गणेशाय नमः</div>
        <div style={{ color: S.ac, fontSize: `${20 * scale}px` }}>{S.top}</div>
        <div style={{ color: S.ac, fontSize: `${10 * scale}px`, letterSpacing: "3px", textTransform: "uppercase", opacity: .75 }}>{S.sub}</div>
        <div style={{ width: `${80 * scale}px`, height: "1px", background: S.border, opacity: .5 }}/>

        {(wedding.bride_family || wedding.groom_family) && (
          <div style={{ color: S.nc, fontSize: `${11 * scale}px`, textAlign: "center", opacity: .65, lineHeight: 1.7 }}>
            {wedding.bride_family && <div>{wedding.bride_family}</div>}
            {wedding.groom_family && <div>{wedding.groom_family}</div>}
            <div style={{ fontSize: `${10 * scale}px`, opacity: .7, marginTop: `${2 * scale}px` }}>joyfully invite you to celebrate</div>
          </div>
        )}

        <div style={{ color: S.nc, fontFamily: F, fontSize: `${28 * scale}px`, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
          {wedding.bride_name || "Bride"}
        </div>
        <div style={{ color: S.ac, fontFamily: F, fontSize: `${16 * scale}px`, fontStyle: "italic", opacity: .8 }}>{S.and}</div>
        <div style={{ color: S.nc, fontFamily: F, fontSize: `${28 * scale}px`, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
          {wedding.groom_name || "Groom"}
        </div>

        <div style={{ width: `${80 * scale}px`, height: "1px", background: S.border, opacity: .5 }}/>

        {guestFns.map((fn, i) => (
          <div key={fn.id} style={{
            textAlign: "center", width: "100%",
            borderTop: i > 0 ? `1px solid ${S.border}` : "none",
            paddingTop: i > 0 ? `${12 * scale}px` : 0,
          }}>
            <div style={{ color: S.ac, fontSize: `${10 * scale}px`, letterSpacing: "3px", textTransform: "uppercase", opacity: .8 }}>{fn.name}</div>
            {fn.function_date && <div style={{ color: S.nc, fontFamily: F, fontSize: `${15 * scale}px`, marginTop: `${4 * scale}px` }}>{fn.function_date}</div>}
            {fn.start_time    && <div style={{ color: S.nc, fontSize: `${12 * scale}px`, opacity: .65 }}>{fn.start_time}</div>}
            {fn.venue_detail  && <div style={{ color: S.nc, fontSize: `${11 * scale}px`, opacity: .6, lineHeight: 1.5 }}>{fn.venue_detail}</div>}
          </div>
        ))}

        {wedding.venue && (
          <div style={{ color: S.nc, fontSize: `${11 * scale}px`, textAlign: "center", opacity: .6, lineHeight: 1.6 }}>
            {wedding.venue}{wedding.city ? `, ${wedding.city}` : ""}
          </div>
        )}
        <div style={{ color: S.ac, fontSize: `${18 * scale}px`, opacity: .85 }}>{S.bot}</div>
      </div>
    </div>
  );
}

export default function BulkCardPage({ params }) {
  const { weddingId } = use(params);
  const router   = useRouter();
  const supabase = createClient();

  const [wedding,  setWedding]  = useState({});
  const [guests,   setGuests]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Style picks
  const [curStyle,   setCurStyle]   = useState("royal");
  const [curPalette, setCurPalette] = useState("redgold");
  const [curFont,    setCurFont]    = useState("playfair");

  // Guest selection
  const [selected,   setSelected]   = useState([]);
  const [search,     setSearch]     = useState("");

  // Send state
  const [sending,    setSending]    = useState(false);
  const [sendMode,   setSendMode]   = useState("email"); // "email" | "whatsapp"
  const [progress,   setProgress]   = useState({ done: 0, total: 0, current: "" });
  const [result,     setResult]     = useState(null);
  const [sendError,  setSendError]  = useState("");

  // Hidden card ref for html2canvas
  const hiddenCardRef = useRef(null);
  const [renderFns,  setRenderFns]  = useState([]); // functions shown in hidden card

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: w } = await supabase.from("weddings").select("*").eq("id", weddingId).single();
        setWedding(w ?? {});

        const { data: guestRows } = await supabase
          .from("guests").select("id, full_name, phone, email, group_tag")
          .eq("wedding_id", weddingId).order("full_name");

        const guestIds = (guestRows ?? []).map(g => g.id);
        let invites = [];
        if (guestIds.length > 0) {
          const { data: inv } = await supabase
            .from("guest_function_invites").select("guest_id, function_id")
            .in("guest_id", guestIds);
          invites = inv ?? [];
        }

        const fnIds = [...new Set(invites.map(i => i.function_id))];
        let fnMap = {};
        if (fnIds.length > 0) {
          const { data: fns } = await supabase
            .from("wedding_functions").select("id, name, function_date, start_time, venue_detail")
            .in("id", fnIds);
          for (const fn of (fns ?? [])) fnMap[fn.id] = fn;
        }

        const invMap = {};
        for (const inv of invites) {
          if (!invMap[inv.guest_id]) invMap[inv.guest_id] = [];
          if (fnMap[inv.function_id]) invMap[inv.guest_id].push(fnMap[inv.function_id]);
        }

        setGuests((guestRows ?? []).map(g => ({
          ...g,
          invited_functions: invMap[g.id] ?? [],
        })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [weddingId]);

  const filteredGuests = guests.filter(g =>
    !search || g.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  function toggleGuest(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleAll() {
    setSelected(selected.length === filteredGuests.length ? [] : filteredGuests.map(g => g.id));
  }

  // ── Generate card image for a guest using html2canvas ──────────────────────
  async function generateCardForGuest(guest) {
    // Set functions for this guest in the hidden card
    setRenderFns(guest.invited_functions);
    // Wait for re-render
    await new Promise(r => setTimeout(r, 400));
    if (!hiddenCardRef.current) return null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(hiddenCardRef.current, {
        scale: 2, useCORS: true, backgroundColor: null, logging: false,
      });
      return canvas.toDataURL("image/png", 1.0);
    } catch (e) {
      console.error("Canvas error:", e);
      return null;
    }
  }

  // ── Build WhatsApp message for a guest ─────────────────────────────────────
  function buildWAMessage(guest) {
    const bride = wedding.bride_name  || "Bride";
    const groom = wedding.groom_name  || "Groom";
    let msg = `🙏 *Shubh Vivah* 🙏\n\n`;
    if (wedding.bride_family || wedding.groom_family) {
      msg += `${wedding.bride_family || ""}${wedding.bride_family && wedding.groom_family ? " &\n" : ""}${wedding.groom_family || ""}\n`;
      msg += `cordially invite you to the wedding of\n\n`;
    }
    msg += `*${bride}* 🤝 *${groom}*\n\n`;
    for (const fn of guest.invited_functions) {
      msg += `📌 *${fn.name}*\n`;
      if (fn.function_date) msg += `   📅 ${fn.function_date}\n`;
      if (fn.start_time)    msg += `   🕐 ${fn.start_time}\n`;
      if (fn.venue_detail)  msg += `   📍 ${fn.venue_detail}\n`;
      msg += "\n";
    }
    if (wedding.venue)      msg += `🏛 *Venue:* ${wedding.venue}${wedding.city ? `, ${wedding.city}` : ""}\n`;
    if (wedding.dress_code) msg += `👗 *Dress Code:* ${wedding.dress_code}\n`;
    msg += `\nWith love & blessings 🌸`;
    return msg;
  }

  // ── SEND ───────────────────────────────────────────────────────────────────
  async function handleSend() {
    const guestsToSend = guests.filter(g => selected.includes(g.id));
    if (guestsToSend.length === 0) return;

    setSending(true);
    setSendError("");
    setResult(null);
    setProgress({ done: 0, total: guestsToSend.length, current: "" });

    let sent = 0, failed = 0, errors = [];

    for (let i = 0; i < guestsToSend.length; i++) {
      const guest = guestsToSend[i];
      setProgress({ done: i, total: guestsToSend.length, current: guest.full_name });

      try {
        // Generate card image for this guest (with their functions)
        const cardDataUrl = await generateCardForGuest(guest);

        if (sendMode === "email") {
          if (!guest.email) {
            errors.push({ guest: guest.full_name, reason: "No email address" });
            failed++;
            continue;
          }

          const bride = wedding.bride_name || "Bride";
          const groom = wedding.groom_name || "Groom";

          const res = await fetch("/api/send-invite-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to:          guest.email,
              subject:     `You're Invited — ${bride} & ${groom}'s Wedding`,
              guestName:   guest.full_name,
              message:     buildWAMessage(guest).replace(/\*/g, ""),
              cardDataUrl: cardDataUrl,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Send failed");
          sent++;

        } else {
          // WhatsApp — download card + open wa.me
          if (!guest.phone) {
            errors.push({ guest: guest.full_name, reason: "No phone number" });
            failed++;
            continue;
          }

          // Download card image
          if (cardDataUrl) {
            const a = document.createElement("a");
            a.download = `invite-${guest.full_name.replace(/\s/g, "")}.png`;
            a.href = cardDataUrl;
            a.click();
            await new Promise(r => setTimeout(r, 300));
          }

          // Open WhatsApp
          let phone = guest.phone.replace(/[^\d+]/g, "");
          if (phone.startsWith("0"))  phone = "91" + phone.slice(1);
          if (phone.startsWith("+"))  phone = phone.slice(1);
          if (phone.length === 10)    phone = "91" + phone;

          const msg = buildWAMessage(guest) + "\n\n_(Card image is downloading — please attach it)_";
          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
          await new Promise(r => setTimeout(r, 1500)); // gap between guests
          sent++;
        }

      } catch (err) {
        errors.push({ guest: guest.full_name, reason: err.message });
        failed++;
      }
    }

    setProgress({ done: guestsToSend.length, total: guestsToSend.length, current: "" });
    setResult({ sent, failed, errors });
    setSending(false);
    setSelected([]);
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <svg className="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );

  const S = STYLES[curStyle] ?? STYLES.royal;
  const P = PALETTES[curPalette] ?? PALETTES.redgold;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hidden card for html2canvas */}
      <div style={{ position: "fixed", top: "-9999px", left: "-9999px", zIndex: -1 }}>
        <CardRenderer
          style={curStyle} palette={curPalette} font={curFont}
          wedding={wedding} guestFns={renderFns}
          innerRef={hiddenCardRef}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <div>
            <h1 className="text-2xl text-[#2c1810]">Bulk Card Sender</h1>
            <p className="text-sm text-[#9e8878] mt-1">Design one card style → send to all selected guests with their own functions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT: Style + Guest selection */}
          <div className="space-y-5">

            {/* Style picker */}
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-4">
              <h2 className="text-sm text-[#2c1810]">Card Style</h2>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(STYLES).map(([key, s]) => (
                  <button key={key} type="button" onClick={() => setCurStyle(key)}
                    className={`text-xs py-2 px-1 rounded-lg border transition text-center
                      ${curStyle === key ? "border-[#2c1810] bg-[#fdf5ee] text-[#2c1810]" : "border-sand text-[#6f5a4a] hover:border-[#c9a96e]"}`}>
                    {s.label.split(" ")[0]}
                  </button>
                ))}
              </div>

              <h2 className="text-sm text-[#2c1810]">Palette</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PALETTES).map(([key, p]) => (
                  <button key={key} type="button" onClick={() => setCurPalette(key)} title={p.label}
                    className={`w-8 h-8 rounded-full border-2 transition
                      ${curPalette === key ? "border-gray-900 scale-125" : "border-transparent hover:scale-110"}`}
                    style={{ background: `linear-gradient(135deg, ${p.b1}, ${p.b2})` }}/>
                ))}
              </div>

              <h2 className="text-sm text-[#2c1810]">Font</h2>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(FONTS).map(([key, f]) => (
                  <button key={key} type="button" onClick={() => setCurFont(key)}
                    style={{ fontFamily: f.value }}
                    className={`py-2 text-sm rounded-lg border transition
                      ${curFont === key ? "border-[#2c1810] bg-[#fdf5ee] text-[#2c1810]" : "border-sand text-[#6f5a4a] hover:border-[#c9a96e]"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Send method */}
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-3">
              <h2 className="text-sm text-[#2c1810]">Send Method</h2>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setSendMode("email")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition
                    ${sendMode === "email" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className="text-2xl">✉️</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Email</p>
                    <p className="text-xs text-gray-400">Sends automatically</p>
                  </div>
                </button>
                <button type="button" onClick={() => setSendMode("whatsapp")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition
                    ${sendMode === "whatsapp" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className="text-2xl">💬</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
                    <p className="text-xs text-gray-400">Opens one by one</p>
                  </div>
                </button>
              </div>
              {sendMode === "whatsapp" && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  WhatsApp will open one tab per guest. Card image downloads automatically — attach it before sending.
                </p>
              )}
            </div>

            {/* Guest list */}
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800">
                  Select Guests <span className="text-gray-400 font-normal">({selected.length} selected)</span>
                </h2>
                <button type="button" onClick={toggleAll}
                  className="text-xs px-3 py-1.5 border border-sand rounded-lg text-[#6f5a4a] hover:bg-[#fdf5ee] transition">
                  {selected.length === filteredGuests.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search guests…"
                className="w-full px-3 py-2 border border-sand rounded-lg text-sm text-[#4a3728] focus:outline-none focus:border-[#c9a96e]"/>

              <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {filteredGuests.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">No guests found.</p>
                ) : filteredGuests.map(guest => (
                  <div key={guest.id} onClick={() => toggleGuest(guest.id)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition
                      ${selected.includes(guest.id) ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition
                      ${selected.includes(guest.id) ? "border-indigo-600 bg-indigo-600" : "border-gray-300"}`}>
                      {selected.includes(guest.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{guest.full_name}</p>
                      <p className="text-xs text-gray-400">{[guest.email, guest.phone].filter(Boolean).join(" · ")}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {guest.invited_functions.length === 0
                          ? <span className="text-xs text-rose-400">No functions assigned</span>
                          : guest.invited_functions.map(fn => (
                              <span key={fn.id} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                                {fn.name}
                              </span>
                            ))
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Preview + Send */}
          <div className="space-y-5">

            {/* Card preview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-800">Card Preview</h2>
              <p className="text-xs text-gray-400">
                This is how the card looks. Each guest's email will show only their own functions.
              </p>
              <div className="flex justify-center overflow-hidden rounded-xl">
                <div style={{ transform: "scale(0.6)", transformOrigin: "top center", marginBottom: "-80px" }}>
                  <CardRenderer
                    style={curStyle} palette={curPalette} font={curFont}
                    wedding={wedding}
                    guestFns={guests[0]?.invited_functions ?? []}
                  />
                </div>
              </div>
            </div>

            {/* Progress */}
            {sending && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-sm font-bold text-gray-800">Sending…</p>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}/>
                </div>
                <p className="text-xs text-gray-500">
                  {progress.done} of {progress.total} done
                  {progress.current && ` — sending to ${progress.current}`}
                </p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <div className={`rounded-xl px-4 py-3 ${result.failed === 0 ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                  <p className="text-sm font-bold text-gray-800">
                    ✓ {result.sent} sent &nbsp;·&nbsp; {result.failed} failed
                  </p>
                </div>
                {result.errors?.length > 0 && (
                  <div className="space-y-1">
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-xs text-rose-600">• {e.guest}: {e.reason}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sendError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                ⚠ {sendError}
              </div>
            )}

            {/* Send button */}
            <button type="button" onClick={handleSend}
              disabled={selected.length === 0 || sending}
              className={`w-full flex items-center justify-center gap-2 py-4 font-bold text-base
                rounded-2xl transition shadow-sm text-white
                ${sendMode === "email"
                  ? "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                  : "bg-green-500 hover:bg-green-600 disabled:bg-gray-300"}
                disabled:cursor-not-allowed`}>
              {sending ? (
                <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>Sending {progress.done}/{progress.total}…</>
              ) : sendMode === "email" ? (
                <>✉️ Send Email to {selected.length} Guest{selected.length !== 1 ? "s" : ""}</>
              ) : (
                <>💬 Send WhatsApp to {selected.length} Guest{selected.length !== 1 ? "s" : ""}</>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              {sendMode === "email"
                ? "Emails send automatically with the card image embedded."
                : "WhatsApp opens one tab per guest. Allow popups in your browser."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
