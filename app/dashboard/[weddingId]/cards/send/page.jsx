"use client";

/**
 * FILE: app/dashboard/[weddingId]/cards/send/page.jsx
 *
 * - WhatsApp: downloads card image + opens wa.me with message pre-filled (manual send)
 * - Email: sends automatically via Resend API with card image embedded
 */

import { useState, use, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STYLES = {
  royal:    { nc:"#f5d08a", ac:"rgba(201,150,58,.85)", top:"🪔 ॐ 🪔",         bot:"❋ ✦ ❋",   sub:"— शुभ विवाह —",           and:"weds", border:"rgba(201,150,58,.4)"  },
  floral:   { nc:"#7a1a35", ac:"#c4607a",              top:"🌸 🌺 🌸",         bot:"🌿 ✿ 🌿",  sub:"With Blessings",          and:"&",    border:"rgba(196,96,122,.35)" },
  modern:   { nc:"#2a1f15", ac:"#8a6a4a",              top:"— ✦ —",           bot:"— ✦ —",   sub:"Together Forever",        and:"&",    border:"rgba(138,106,74,.25)" },
  temple:   { nc:"#ffd060", ac:"rgba(232,137,12,.9)",  top:"🔱 ॐ 🔱",         bot:"❁ ✦ ❁",   sub:"— मंगलम् —",             and:"weds", border:"rgba(232,137,12,.45)" },
  south:    { nc:"#90ee90", ac:"rgba(100,200,100,.85)",top:"🌿 ✿ 🌿",         bot:"🍃 ✦ 🍃",  sub:"— శుభ వివాహం —",          and:"&",    border:"rgba(100,200,100,.35)"},
  mughal:   { nc:"#c9b0ff", ac:"rgba(155,114,207,.9)", top:"☽ ✦ ☾",          bot:"◈ ✦ ◈",   sub:"— مبارک ہو —",            and:"weds", border:"rgba(155,114,207,.4)" },
  bengali:  { nc:"#ffcc88", ac:"rgba(220,150,50,.9)",  top:"🐚 শুভ বিবাহ 🐚", bot:"❈ ✦ ❈",   sub:"— আশীর্বাদ —",            and:"ও",    border:"rgba(220,150,50,.4)"  },
  punjabi:  { nc:"#ffd1e8", ac:"rgba(220,80,150,.9)",  top:"🥁 ਸ਼ੁਭ ਵਿਆਹ 🥁", bot:"✿ ❋ ✿",  sub:"— ਵਧਾਈ —",                and:"&",    border:"rgba(220,80,150,.4)"  },
  marathi:  { nc:"#e8b4f8", ac:"rgba(160,80,220,.9)",  top:"🌻 शुभमंगल 🌻",   bot:"❋ ✦ ❋",   sub:"— सावधान —",               and:"व",    border:"rgba(160,80,220,.4)"  },
  kerala:   { nc:"#c8f0c0", ac:"rgba(80,180,100,.9)",  top:"🥥 ✿ 🥥",         bot:"🌴 ✦ 🌴",  sub:"— ശുഭ വിവാഹം —",          and:"&",    border:"rgba(80,180,100,.4)"  },
  bohemian: { nc:"#f5c87a", ac:"rgba(200,160,80,.9)",  top:"✨ boho love ✨",  bot:"~ ✦ ~",   sub:"A Celebration of Love",   and:"&",    border:"rgba(200,160,80,.35)" },
  luxury:   { nc:"#d4af37", ac:"rgba(212,175,55,.9)",  top:"◈ ✦ ◈",          bot:"◈ ✦ ◈",   sub:"An Intimate Celebration", and:"&",    border:"rgba(212,175,55,.45)" },
};

const PALETTES = {
  redgold:    { b1:"#8b1a1a", b2:"#c9963a" },
  rosepink:   { b1:"#d4556a", b2:"#fce4ec" },
  tealgold:   { b1:"#1a6b6b", b2:"#c9963a" },
  marigold:   { b1:"#e8890c", b2:"#3d2000" },
  purplegold: { b1:"#6a0dad", b2:"#c9963a" },
  indigo:     { b1:"#0d0a1f", b2:"#9b72cf" },
  blackgold:  { b1:"#000",    b2:"#c9963a" },
  green:      { b1:"#0a2010", b2:"#3a9a3a" },
  navygold:   { b1:"#003366", b2:"#c9963a" },
  terracotta: { b1:"#6b3a2a", b2:"#e8a87c" },
  ivorygold:  { b1:"#f5f0e8", b2:"#c9963a" },
  mango:      { b1:"#2c4a1e", b2:"#f5d060" },
};

const FONTS = {
  playfair:  "'Playfair Display',serif",
  cinzel:    "'Cinzel',serif",
  dancing:   "'Dancing Script',cursive",
  cormorant: "'Cormorant Garamond',serif",
};

export default function SendCardPage({ params }) {
  const { weddingId } = use(params);
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const supabase      = createClient();
  const cardRef       = useRef(null);

  const guestId      = searchParams.get("guestId");
  const fnIds        = searchParams.get("fnIds")?.split(",").filter(Boolean) ?? [];
  const styleParam   = searchParams.get("style")   ?? "royal";
  const paletteParam = searchParams.get("palette") ?? "redgold";
  const fontParam    = searchParams.get("font")    ?? "playfair";

  const [guest,    setGuest]    = useState(null);
  const [guestFns, setGuestFns] = useState([]);
  const [wedding,  setWedding]  = useState({});
  const [loading,  setLoading]  = useState(true);

  const [sendMethod,   setSendMethod]   = useState("whatsapp");
  const [customMsg,    setCustomMsg]    = useState("");
  const [emailSubject, setEmailSubject] = useState("");

  // Status
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [sendError,  setSendError]  = useState("");
  const [copied,     setCopied]     = useState(false);

  // Card image
  const [cardDataUrl,   setCardDataUrl]   = useState("");
  const [generatingImg, setGeneratingImg] = useState(false);
  const [imgReady,      setImgReady]      = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [gr, wr, fr] = await Promise.all([
          supabase.from("guests").select("id, full_name, phone, email, group_tag").eq("id", guestId).single(),
          supabase.from("weddings").select("*").eq("id", weddingId).single(),
          supabase.from("wedding_functions").select("id, name, function_date, start_time, venue_detail")
            .in("id", fnIds.length > 0 ? fnIds : ["none"]),
        ]);
        setGuest(gr.data);
        setWedding(wr.data ?? {});
        setGuestFns(fr.data ?? []);
        const w = wr.data ?? {};
        setEmailSubject(`You're Invited — ${w.bride_name || "Bride"} & ${w.groom_name || "Groom"}'s Wedding`);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    if (guestId) load();
  }, [guestId, weddingId]);

  // ── Generate card image ────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && guest && cardRef.current) {
      setTimeout(() => generateCardImage(), 300);
    }
  }, [loading, guest]);

  async function generateCardImage() {
    if (!cardRef.current) return;
    setGeneratingImg(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, useCORS: true, backgroundColor: null, logging: false,
      });
      setCardDataUrl(canvas.toDataURL("image/png", 1.0));
      setImgReady(true);
    } catch (e) { console.error("Card image generation failed:", e); }
    finally { setGeneratingImg(false); }
  }

  // ── Build invite message ───────────────────────────────────────────────────
  function buildMessage() {
    const bride = wedding.bride_name  || "Bride";
    const groom = wedding.groom_name  || "Groom";
    const bp    = wedding.bride_family;
    const gp    = wedding.groom_family;

    let msg = `🙏 *Shubh Vivah* 🙏\n\n`;
    if (bp || gp) {
      msg += `${bp || ""}${bp && gp ? " &\n" : ""}${gp || ""}\n`;
      msg += `cordially invite you to the wedding of\n\n`;
    }
    msg += `*${bride}* 🤝 *${groom}*\n\n`;

    for (const fn of guestFns) {
      msg += `📌 *${fn.name}*\n`;
      if (fn.function_date) msg += `   📅 ${fn.function_date}\n`;
      if (fn.start_time)    msg += `   🕐 ${fn.start_time}\n`;
      if (fn.venue_detail)  msg += `   📍 ${fn.venue_detail}\n`;
      msg += "\n";
    }

    if (wedding.venue) msg += `🏛 *Venue:* ${wedding.venue}${wedding.city ? `, ${wedding.city}` : ""}\n`;
    if (wedding.dress_code) msg += `👗 *Dress Code:* ${wedding.dress_code}\n`;
    if (wedding.extra_note) msg += `\n✨ ${wedding.extra_note}\n`;
    msg += `\nWith love & blessings 🌸`;
    if (customMsg) msg += `\n\n${customMsg}`;
    return msg;
  }

  // ── Download card PNG ──────────────────────────────────────────────────────
  function downloadCard() {
    if (!cardDataUrl) return;
    const a = document.createElement("a");
    a.download = `invite-${guest?.full_name?.replace(/\s/g, "")}.png`;
    a.href = cardDataUrl;
    a.click();
  }

  // ── WhatsApp — download image + open wa.me ─────────────────────────────────
  function sendWhatsApp() {
    const rawPhone = guest?.phone?.replace(/[^\d+]/g, "");
    if (!rawPhone) { alert("This guest has no phone number."); return; }

    let phone = rawPhone;
    if (phone.startsWith("0"))  phone = "91" + phone.slice(1);
    if (phone.startsWith("+"))  phone = phone.slice(1);
    if (phone.length === 10)    phone = "91" + phone;

    // Download card image first
    if (imgReady) downloadCard();

    // Open WhatsApp with text pre-filled
    const msg = buildMessage() + "\n\n_(Please find the invitation card image attached)_";
    setTimeout(() => {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      setSent(true);
      setSendError("");
    }, 600);
  }

  // ── Email — send via Resend API ────────────────────────────────────────────
  async function sendEmail() {
    const email = guest?.email;
    if (!email) { alert("This guest has no email address."); return; }

    setSending(true);
    setSendError("");
    setSent(false);

    try {
      const res = await fetch("/api/send-invite-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to:          email,
          subject:     emailSubject,
          guestName:   guest.full_name,
          message:     buildMessage().replace(/\*/g, ""),
          cardDataUrl: imgReady ? cardDataUrl : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");

      setSent(true);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(buildMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch { alert("Could not copy."); }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const S      = STYLES[styleParam]     ?? STYLES.royal;
  const P      = PALETTES[paletteParam] ?? PALETTES.redgold;
  const font   = FONTS[fontParam]       ?? FONTS.playfair;
  const cardBg = `linear-gradient(145deg, ${P.b1}, ${P.b2})`;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <svg className="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div>
          <button type="button" onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back to Card Builder
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Send Invitation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sending to <span className="font-semibold text-gray-700">{guest?.full_name}</span>
          </p>
        </div>

        {/* Success / Error banners */}
        {sent && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <span>✓</span>
            <span>
              {sendMethod === "email"
                ? `Email sent to ${guest?.email}!`
                : `WhatsApp opened for ${guest?.full_name}! Card image downloaded — attach it in WhatsApp before sending.`}
            </span>
          </div>
        )}
        {sendError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
            ⚠ {sendError}
          </div>
        )}

        {/* Hidden card for html2canvas */}
        <div style={{ position: "fixed", top: "-9999px", left: "-9999px", zIndex: -1 }}>
          <div ref={cardRef} style={{
            background: cardBg, borderRadius: "14px", overflow: "hidden",
            position: "relative", width: "480px", minHeight: "360px", fontFamily: font,
          }}>
            <div style={{ position: "absolute", inset: "10px", borderRadius: "10px",
              border: `1px solid ${S.border}`, pointerEvents: "none", zIndex: 1 }}/>
            <div style={{ position: "relative", zIndex: 2, padding: "40px 48px",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "12px", minHeight: "360px", justifyContent: "center" }}>
              <div style={{ color: S.ac, fontSize: "13px", opacity: .8 }}>ॐ गणेशाय नमः</div>
              <div style={{ color: S.ac, fontSize: "20px" }}>{S.top}</div>
              <div style={{ color: S.ac, fontSize: "10px", letterSpacing: "3px",
                textTransform: "uppercase", opacity: .75 }}>{S.sub}</div>
              <div style={{ width: "80px", height: "1px", background: S.border, opacity: .5 }}/>
              {(wedding.bride_family || wedding.groom_family) && (
                <div style={{ color: S.nc, fontSize: "11px", textAlign: "center", opacity: .65, lineHeight: 1.7 }}>
                  {wedding.bride_family && <div>{wedding.bride_family}</div>}
                  {wedding.groom_family && <div>{wedding.groom_family}</div>}
                  <div style={{ fontSize: "10px", opacity: .7, marginTop: "2px" }}>joyfully invite you to celebrate</div>
                </div>
              )}
              <div style={{ color: S.nc, fontFamily: font, fontSize: "28px", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                {wedding.bride_name || "Bride"}
              </div>
              <div style={{ color: S.ac, fontFamily: font, fontSize: "16px", fontStyle: "italic", opacity: .8 }}>{S.and}</div>
              <div style={{ color: S.nc, fontFamily: font, fontSize: "28px", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                {wedding.groom_name || "Groom"}
              </div>
              <div style={{ width: "80px", height: "1px", background: S.border, opacity: .5 }}/>
              {guestFns.map((fn, i) => (
                <div key={fn.id} style={{ textAlign: "center", width: "100%",
                  borderTop: i > 0 ? `1px solid ${S.border}` : "none", paddingTop: i > 0 ? "12px" : 0 }}>
                  <div style={{ color: S.ac, fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", opacity: .8 }}>{fn.name}</div>
                  {fn.function_date && <div style={{ color: S.nc, fontFamily: font, fontSize: "15px", marginTop: "4px" }}>{fn.function_date}</div>}
                  {fn.start_time    && <div style={{ color: S.nc, fontSize: "12px", opacity: .65 }}>{fn.start_time}</div>}
                  {fn.venue_detail  && <div style={{ color: S.nc, fontSize: "11px", opacity: .6, lineHeight: 1.5 }}>{fn.venue_detail}</div>}
                </div>
              ))}
              {wedding.venue && (
                <div style={{ color: S.nc, fontSize: "11px", textAlign: "center", opacity: .6, lineHeight: 1.6 }}>
                  {wedding.venue}{wedding.city ? `, ${wedding.city}` : ""}
                </div>
              )}
              <div style={{ color: S.ac, fontSize: "18px", opacity: .85 }}>{S.bot}</div>
            </div>
          </div>
        </div>

        {/* Card preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">Card Preview</h2>
            <button type="button" onClick={downloadCard} disabled={!imgReady}
              className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600
                disabled:text-gray-400 disabled:bg-gray-100 rounded-lg transition font-medium">
              {generatingImg ? "Generating…" : "⬇ Download Card"}
            </button>
          </div>
          {generatingImg ? (
            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-xl gap-2">
              <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-xs text-gray-400">Rendering card…</span>
            </div>
          ) : imgReady ? (
            <img src={cardDataUrl} alt="Invitation card" className="w-full rounded-xl border border-gray-100 shadow-sm"/>
          ) : (
            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400">Card preview will appear here</p>
            </div>
          )}
        </div>

        {/* Guest info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
          <span className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 text-lg flex items-center justify-center font-bold flex-shrink-0">
            {guest?.full_name?.[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900">{guest?.full_name}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {guest?.phone && (
                <span className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full">📱 {guest.phone}</span>
              )}
              {guest?.email && (
                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">✉️ {guest.email}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {guestFns.map(fn => (
                <span key={fn.id} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">{fn.name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Send method */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-800">Send Method</h2>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setSendMethod("whatsapp"); setSent(false); setSendError(""); }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition
                ${sendMethod === "whatsapp" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
              <span className="text-2xl">💬</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
                <p className="text-xs text-gray-400">{guest?.phone || "No phone saved"}</p>
              </div>
            </button>

            <button type="button" onClick={() => { setSendMethod("email"); setSent(false); setSendError(""); }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition
                ${sendMethod === "email" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
              <span className="text-2xl">✉️</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Email</p>
                <p className="text-xs text-gray-400">{guest?.email || "No email saved"}</p>
              </div>
            </button>
          </div>

          {/* WhatsApp info */}
          {sendMethod === "whatsapp" && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
              <strong>How it works:</strong> Clicking Send downloads the card image to your device, then opens WhatsApp with the message pre-filled. Attach the downloaded image in WhatsApp before pressing send.
            </div>
          )}

          {/* Email info */}
          {sendMethod === "email" && (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                ✉️ Email will be sent automatically with the card image embedded. No manual step needed.
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Email Subject</label>
                <input type="text" value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"/>
              </div>
            </>
          )}

          {/* Personal note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">
              Personal note <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} rows={2}
              placeholder="e.g. Looking forward to celebrating with you!"
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-400 focus:outline-none"/>
          </div>
        </div>

        {/* Message preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">Message Preview</h2>
            <button type="button" onClick={copyText}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition font-medium">
              {copied ? "✓ Copied!" : "Copy Text"}
            </button>
          </div>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-64 overflow-y-auto font-sans">
            {buildMessage()}
          </pre>
        </div>

        {/* Send button */}
        <div className="space-y-3">
          {sendMethod === "whatsapp" ? (
            <button type="button" onClick={sendWhatsApp} disabled={!guest?.phone}
              className="w-full flex items-center justify-center gap-3 py-4 bg-green-500
                hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                text-white font-bold text-base rounded-2xl transition shadow-sm">
              <span className="text-xl">💬</span>
              {imgReady ? "Download Card + Open WhatsApp" : "Open WhatsApp"}
              {!guest?.phone && <span className="text-xs opacity-75">(no phone number)</span>}
            </button>
          ) : (
            <button type="button" onClick={sendEmail}
              disabled={!guest?.email || sending}
              className="w-full flex items-center justify-center gap-3 py-4 bg-blue-500
                hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                text-white font-bold text-base rounded-2xl transition shadow-sm">
              {sending ? (
                <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>Sending Email…</>
              ) : (
                <><span className="text-xl">✉️</span>Send Email Now</>
              )}
              {!guest?.email && <span className="text-xs opacity-75">(no email address)</span>}
            </button>
          )}

          <button type="button" onClick={() => router.push(`/dashboard/${weddingId}/cards`)}
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-sm rounded-2xl transition">
            ← Invite Another Guest
          </button>
        </div>

        {(!guest?.phone && !guest?.email) && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl px-4 py-3">
            ⚠️ This guest has no phone or email saved. Go to the Guest List to add contact details first.
          </div>
        )}

      </div>
    </div>
  );
}
