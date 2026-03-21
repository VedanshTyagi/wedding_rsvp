"use client";

/**
 * FILE: app/dashboard/[weddingId]/cards/bulk/page.jsx
 *
 * Bulk card sender:
 * 1. Pick a card style + describe prompt
 * 2. Select guests
 * 3. Click Generate — Pollinations AI generates a card image for each guest
 * 4. After generation — send via WhatsApp or Email
 */

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STYLE_PROMPTS = {
  royal:   "royal Rajasthani Indian wedding invitation, deep crimson red background, gold peacock feather border, ivory Mughal scalloped arch center panel, ornate gold details, professional print quality, portrait, no text",
  floral:  "floral pastel Indian wedding invitation, soft blush pink background, pink lotus and rose flower border, gold vine leaves, cream center arch panel, watercolor botanical style, portrait, no text",
  modern:  "modern minimal Indian wedding invitation, ivory white background, thin gold geometric border, single gold lotus at top, clean elegant typography space, art deco style, portrait, no text",
  temple:  "South Indian temple wedding invitation, dark maroon background, gold temple gopuram arch at top, intricate kolam rangoli border, lotus flowers, brass lamp motif, portrait, no text",
  south:   "Kerala South Indian wedding invitation, dark green background, banana leaf pillars on both sides, pink lotus flowers at top, gold kolam dot border, cream arch center panel, portrait, no text",
  mughal:  "Mughal garden Indian wedding invitation, midnight blue background, gold silver arabesque floral border, pointed Mughal arch ivory center panel, white rose flowers, regal atmosphere, portrait, no text",
  bengali: "Bengali traditional wedding invitation, rich red and cream background, white alpona rangoli floral border, conch shell shankha motif, gold details, auspicious symbols, portrait, no text",
  punjabi: "Punjabi vibrant wedding invitation, bright fuchsia pink background, phulkari geometric embroidery border, yellow marigold flowers, gold frame, festive joyful colors, portrait, no text",
  luxury:  "black luxury Indian wedding invitation, pure black background, thin gold hairline double border, single gold lotus flower, art deco minimal style, sophisticated elegant, portrait, no text",
};

const STYLES = [
  { key:"royal",   label:"👑 Royal Rajasthani" },
  { key:"floral",  label:"🌸 Floral Pastel"    },
  { key:"modern",  label:"◻ Modern Minimal"    },
  { key:"temple",  label:"🏛 Temple Gold"       },
  { key:"south",   label:"🌿 South Indian"      },
  { key:"mughal",  label:"🕌 Mughal Garden"     },
  { key:"bengali", label:"🐚 Bengali"           },
  { key:"punjabi", label:"🥁 Punjabi Dhol"      },
  { key:"luxury",  label:"💎 Black Luxury"      },
];

export default function BulkCardPage({ params }) {
  const { weddingId } = use(params);
  const router   = useRouter();
  const supabase = createClient();

  const [wedding,  setWedding]  = useState({});
  const [guests,   setGuests]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Style
  const [curStyle,     setCurStyle]     = useState("royal");
  const [customPrompt, setCustomPrompt] = useState("");

  // Guest selection
  const [selected, setSelected] = useState([]);
  const [search,   setSearch]   = useState("");

  // Generation state
  const [generating,  setGenerating]  = useState(false);
  const [genProgress, setGenProgress] = useState({ done:0, total:0, current:"" });
  const [genDone,     setGenDone]     = useState(false);
  const [genError,    setGenError]    = useState("");

  // Generated cards: { guestId: { name, phone, email, imageUrl, functions } }
  const [generatedCards, setGeneratedCards] = useState({});

  // Send state
  const [sendMode,   setSendMode]   = useState("whatsapp");
  const [sending,    setSending]    = useState(false);
  const [sendProgress, setSendProgress] = useState({ done:0, total:0, current:"" });
  const [sendResult, setSendResult] = useState(null);
  const [sendError,  setSendError]  = useState("");

  // ── Load data ──────────────────────────────────────────────────────────────
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

  // ── Generate card image via Pollinations AI ────────────────────────────────
  async function generateImageForGuest(guest) {
    const fnList = guest.invited_functions.map(fn => fn.name).join(", ") || "Wedding Ceremony";
    const base   = customPrompt.trim() || STYLE_PROMPTS[curStyle];
    const prompt = `${base}, for ${wedding.bride_name || "Bride"} and ${wedding.groom_name || "Groom"} wedding, functions: ${fnList}, venue: ${wedding.venue || ""} ${wedding.city || ""}`;

    // Call backend API — returns base64 image, not a URL
    const res = await fetch("/api/ai/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // Returns data:image/jpeg;base64,... — a real image, not a URL
    return data.image;
  }

  // ── Generate all cards ─────────────────────────────────────────────────────
  async function handleGenerate() {
    const guestsToGen = guests.filter(g => selected.includes(g.id));
    if (guestsToGen.length === 0) return;

    setGenerating(true);
    setGenDone(false);
    setGenError("");
    setGeneratedCards({});
    setGenProgress({ done:0, total:guestsToGen.length, current:"" });

    const cards = {};

    for (let i = 0; i < guestsToGen.length; i++) {
      const guest = guestsToGen[i];
      setGenProgress({ done:i, total:guestsToGen.length, current:guest.full_name });

      try {
        const imageUrl = await generateImageForGuest(guest);
        cards[guest.id] = {
          name:      guest.full_name,
          phone:     guest.phone,
          email:     guest.email,
          imageUrl,
          functions: guest.invited_functions,
        };
      } catch (e) {
        console.error(`Failed for ${guest.full_name}:`, e.message);
        cards[guest.id] = {
          name:      guest.full_name,
          phone:     guest.phone,
          email:     guest.email,
          imageUrl:  null,
          error:     e.message,
          functions: guest.invited_functions,
        };
      }

      setGeneratedCards({ ...cards });
    }

    setGenProgress({ done:guestsToGen.length, total:guestsToGen.length, current:"" });
    setGenerating(false);
    setGenDone(true);
  }

  // ── Build WhatsApp message ─────────────────────────────────────────────────
  function buildWAMessage(card) {
    const bride = wedding.bride_name || "Bride";
    const groom = wedding.groom_name || "Groom";
    let msg = `🙏 *You're Invited!* 🙏\n\n`;
    if (wedding.bride_family || wedding.groom_family) {
      msg += `${wedding.bride_family || ""} ${wedding.bride_family && wedding.groom_family ? "& " : ""}${wedding.groom_family || ""}\n`;
      msg += `joyfully invite you to celebrate\n\n`;
    }
    msg += `*${bride}* 🤝 *${groom}*\n\n`;
    for (const fn of card.functions) {
      msg += `📌 *${fn.name}*\n`;
      if (fn.function_date) msg += `   📅 ${fn.function_date}\n`;
      if (fn.start_time)    msg += `   🕐 ${fn.start_time}\n`;
      if (fn.venue_detail)  msg += `   📍 ${fn.venue_detail}\n`;
      msg += "\n";
    }
    if (wedding.venue) msg += `🏛 ${wedding.venue}${wedding.city ? `, ${wedding.city}` : ""}\n`;
    msg += `\nWith love & blessings 🌸\n_(Please find your invitation card in the image above)_`;
    return msg;
  }

  // ── Send all via WhatsApp or Email ─────────────────────────────────────────
  async function handleSend() {
    const cards = Object.values(generatedCards).filter(c => c.imageUrl);
    if (cards.length === 0) return;

    setSending(true);
    setSendError("");
    setSendResult(null);
    setSendProgress({ done:0, total:cards.length, current:"" });

    let sent = 0, failed = 0, errors = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      setSendProgress({ done:i, total:cards.length, current:card.name });

      try {
        if (sendMode === "whatsapp") {
          if (!card.phone) {
            errors.push({ name:card.name, reason:"No phone number" });
            failed++; continue;
          }

          // Download image
          // Download image first
          const a = document.createElement("a");
          a.href = card.imageUrl;
          a.download = `invite-${card.name.replace(/\s/g,"")}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          await new Promise(r => setTimeout(r, 1000));

          // Open WhatsApp with message only (user manually attaches downloaded image)
          let phone = card.phone.replace(/[^\d+]/g,"").replace(/^\+/,"");
          if (phone.startsWith("0"))  phone = "91" + phone.slice(1);
          if (phone.length === 10)    phone = "91" + phone;

          const msg = buildWAMessage(card) + "\n\n📎 *Please attach the invitation card image that just downloaded to your device.*";
          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
          await new Promise(r => setTimeout(r, 2000));
          sent++;

        } else {
          // Email
          if (!card.email) {
            errors.push({ name:card.name, reason:"No email address" });
            failed++; continue;
          }

          const bride = wedding.bride_name || "Bride";
          const groom = wedding.groom_name || "Groom";

          const res = await fetch("/api/send-invite-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to:        card.email,
              subject:   `You're Invited — ${bride} & ${groom}'s Wedding`,
              guestName: card.name,
              message:   buildWAMessage(card).replace(/\*/g,""),
              cardImageUrl: card.imageUrl,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Email failed");
          sent++;
        }

      } catch (e) {
        errors.push({ name:card.name, reason:e.message });
        failed++;
      }
    }

    setSendProgress({ done:cards.length, total:cards.length, current:"" });
    setSendResult({ sent, failed, errors });
    setSending(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <svg className="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );

  const successCount = Object.values(generatedCards).filter(c => c.imageUrl).length;
  const failCount    = Object.values(generatedCards).filter(c => c.error).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Card Sender</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              AI generates a unique illustrated card per guest → send via WhatsApp or Email
            </p>
          </div>
        </div>

        {/* ── STEP 1: Style + Prompt ── */}
        {!genDone && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              Card Style
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {STYLES.map(s => (
                <button key={s.key} onClick={() => setCurStyle(s.key)}
                  className={`text-xs py-2.5 px-2 rounded-xl border transition text-center
                    ${curStyle === s.key
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold"
                      : "border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">
                Custom prompt (optional — overrides style)
              </label>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                rows={3}
                placeholder="e.g. Rajasthani style, teal background, pink lotus flowers, gold Mughal arch, cream center panel, no text…"
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                  focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-400">
                Leave empty to use the selected style's default prompt
              </p>
            </div>
          </section>
        )}

        {/* ── STEP 2: Select Guests ── */}
        {!genDone && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                Select Guests
                <span className="text-gray-400 font-normal text-xs">({selected.length} selected)</span>
              </h2>
              <button onClick={toggleAll}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                {selected.length === filteredGuests.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search guests…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                focus:ring-2 focus:ring-indigo-400 focus:outline-none"/>

            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-72 overflow-y-auto">
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
          </section>
        )}

        {/* ── STEP 3: Generate button ── */}
        {!genDone && (
          <section>
            {generating ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <p className="text-sm font-bold text-gray-800">
                  Generating cards… {genProgress.done}/{genProgress.total}
                </p>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width:`${genProgress.total > 0 ? (genProgress.done/genProgress.total)*100 : 0}%` }}/>
                </div>
                {genProgress.current && (
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <svg className="animate-spin h-3 w-3 text-indigo-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Generating card for {genProgress.current}…
                  </p>
                )}
                {/* Show cards as they generate */}
                {Object.keys(generatedCards).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                    {Object.entries(generatedCards).map(([id, card]) => (
                      <div key={id} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                        {card.imageUrl
                          ? <img src={card.imageUrl} alt={card.name} className="w-full aspect-[3/4] object-cover"/>
                          : <div className="w-full aspect-[3/4] bg-rose-50 flex items-center justify-center">
                              <p className="text-xs text-rose-400 px-2 text-center">Failed</p>
                            </div>
                        }
                        <p className="text-xs text-gray-600 text-center py-1.5 px-2 truncate">{card.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleGenerate} disabled={selected.length === 0}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700
                  disabled:bg-gray-300 disabled:cursor-not-allowed
                  text-white font-bold text-base rounded-2xl transition
                  flex items-center justify-center gap-2 shadow-sm">
                ✨ Generate AI Cards for {selected.length} Guest{selected.length !== 1 ? "s" : ""}
              </button>
            )}

            {genError && (
              <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                ⚠ {genError}
              </div>
            )}
          </section>
        )}

        {/* ── STEP 4: Generated cards + Send ── */}
        {genDone && (
          <section className="space-y-6">

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-gray-900">
                  ✓ {successCount} cards generated
                  {failCount > 0 && <span className="text-rose-500 ml-2">· {failCount} failed</span>}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Now choose how to send them</p>
              </div>
              <button onClick={() => { setGenDone(false); setGeneratedCards({}); setSendResult(null); }}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition">
                ← Start Over
              </button>
            </div>

            {/* Generated card grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(generatedCards).map(([id, card]) => (
                <div key={id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.name} className="w-full aspect-[3/4] object-cover"/>
                  ) : (
                    <div className="w-full aspect-[3/4] bg-rose-50 flex flex-col items-center justify-center gap-1 p-3">
                      <span className="text-2xl">⚠️</span>
                      <p className="text-xs text-rose-400 text-center">Generation failed</p>
                    </div>
                  )}
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-gray-800 truncate">{card.name}</p>
                    <p className="text-xs text-gray-400 truncate">{card.email || card.phone || "No contact"}</p>
                    {card.imageUrl && (
                      <a href={card.imageUrl} download={`invite-${card.name.replace(/\s/g,"")}.jpg`}
                        target="_blank" rel="noreferrer"
                        className="text-xs text-indigo-600 hover:underline">
                        ⬇ Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Send method */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-800">Send Cards</h2>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setSendMode("whatsapp")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition
                    ${sendMode === "whatsapp" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className="text-2xl">💬</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
                    <p className="text-xs text-gray-400">Opens one tab per guest</p>
                  </div>
                </button>
                <button onClick={() => setSendMode("email")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition
                    ${sendMode === "email" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className="text-2xl">✉️</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Email</p>
                    <p className="text-xs text-gray-400">Sends automatically</p>
                  </div>
                </button>
              </div>

              {sendMode === "whatsapp" && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                  Card image will download per guest. WhatsApp opens for each — attach the downloaded image before sending.
                  <br/>Allow popups in your browser for this to work.
                </div>
              )}

              {/* Progress while sending */}
              {sending && (
                <div className="space-y-2">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width:`${sendProgress.total > 0 ? (sendProgress.done/sendProgress.total)*100 : 0}%` }}/>
                  </div>
                  <p className="text-xs text-gray-500">
                    {sendProgress.done}/{sendProgress.total} sent
                    {sendProgress.current && ` — ${sendProgress.current}`}
                  </p>
                </div>
              )}

              {/* Result */}
              {sendResult && (
                <div className={`rounded-xl px-4 py-3 space-y-1
                  ${sendResult.failed === 0 ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-100"}`}>
                  <p className="text-sm font-bold text-gray-800">
                    ✓ {sendResult.sent} sent · {sendResult.failed} failed
                  </p>
                  {sendResult.errors?.map((e,i) => (
                    <p key={i} className="text-xs text-rose-600">• {e.name}: {e.reason}</p>
                  ))}
                </div>
              )}

              {sendError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                  ⚠ {sendError}
                </div>
              )}

              <button onClick={handleSend}
                disabled={sending || successCount === 0}
                className={`w-full flex items-center justify-center gap-2 py-4
                  font-bold text-base rounded-2xl transition shadow-sm text-white
                  ${sendMode === "whatsapp"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-blue-600 hover:bg-blue-700"}
                  disabled:bg-gray-300 disabled:cursor-not-allowed`}>
                {sending ? (
                  <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>Sending {sendProgress.done}/{sendProgress.total}…</>
                ) : sendMode === "whatsapp" ? (
                  <>💬 Send via WhatsApp to {successCount} Guest{successCount !== 1 ? "s" : ""}</>
                ) : (
                  <>✉️ Send via Email to {successCount} Guest{successCount !== 1 ? "s" : ""}</>
                )}
              </button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
