"use client";

/**
 * FILE: app/dashboard/[weddingId]/cards/manual/page.jsx
 * ROUTE: /dashboard/[weddingId]/cards/manual?guestId=xxx&fnIds=fn1,fn2
 *
 * Full manual card builder.
 * - Pre-loads guest name + only their assigned functions
 * - 12 styles, 12 palettes, 4 fonts
 * - Fine-tune sliders: name size, padding, border, opacity, letter spacing
 * - Motif toggles: shloka, parents, time, diya, dots, rsvp, dress code
 * - Custom text overrides for every card element
 * - Live preview updates on every change
 * - Export: PNG, PDF, WhatsApp 1080x1080
 * - Send: redirects to /cards/send with card data
 */

import { useState, use, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── STYLE CONFIGS ────────────────────────────────────────────────────────────
const STYLES = {
  royal:    { bg:"linear-gradient(145deg,#3d0b0b,#1a0505)", nc:"#f5d08a", ac:"rgba(201,150,58,.85)", top:"🪔 ॐ 🪔",          bot:"❋ ✦ ❋",    sub:"— शुभ विवाह —",          and:"weds",  border:"rgba(201,150,58,.4)",   label:"Royal Rajasthani" },
  floral:   { bg:"linear-gradient(145deg,#fdf0f5,#fff8f0)", nc:"#7a1a35", ac:"#c4607a",              top:"🌸 🌺 🌸",          bot:"🌿 ✿ 🌿",   sub:"With Blessings",         and:"&",     border:"rgba(196,96,122,.35)",  label:"Floral Pastel"    },
  modern:   { bg:"linear-gradient(145deg,#f9f5ef,#fffdf8)", nc:"#2a1f15", ac:"#8a6a4a",              top:"— ✦ —",            bot:"— ✦ —",    sub:"Together Forever",       and:"&",     border:"rgba(138,106,74,.25)",  label:"Modern Minimal"   },
  temple:   { bg:"linear-gradient(145deg,#1a1200,#2d1f00)", nc:"#ffd060", ac:"rgba(232,137,12,.9)",  top:"🔱 ॐ 🔱",          bot:"❁ ✦ ❁",    sub:"— मंगलम् —",            and:"weds",  border:"rgba(232,137,12,.45)",  label:"Temple Gold"      },
  south:    { bg:"linear-gradient(145deg,#0a1f0a,#051505)", nc:"#90ee90", ac:"rgba(100,200,100,.85)",top:"🌿 ✿ 🌿",          bot:"🍃 ✦ 🍃",   sub:"— శుభ వివాహం —",         and:"&",     border:"rgba(100,200,100,.35)", label:"South Indian"     },
  mughal:   { bg:"linear-gradient(145deg,#0d0a1f,#1a1035)", nc:"#c9b0ff", ac:"rgba(155,114,207,.9)", top:"☽ ✦ ☾",           bot:"◈ ✦ ◈",    sub:"— مبارک ہو —",           and:"weds",  border:"rgba(155,114,207,.4)",  label:"Mughal Garden"    },
  bengali:  { bg:"linear-gradient(145deg,#1a0a00,#3d1500)", nc:"#ffcc88", ac:"rgba(220,150,50,.9)",  top:"🐚 শুভ বিবাহ 🐚",  bot:"❈ ✦ ❈",    sub:"— আশীর্বাদ —",           and:"ও",     border:"rgba(220,150,50,.4)",   label:"Bengali"          },
  punjabi:  { bg:"linear-gradient(145deg,#4a0a2a,#1a0010)", nc:"#ffd1e8", ac:"rgba(220,80,150,.9)",  top:"🥁 ਸ਼ੁਭ ਵਿਆਹ 🥁",  bot:"✿ ❋ ✿",   sub:"— ਵਧਾਈ —",               and:"&",     border:"rgba(220,80,150,.4)",   label:"Punjabi Dhol"     },
  marathi:  { bg:"linear-gradient(145deg,#1a0020,#35003a)", nc:"#e8b4f8", ac:"rgba(160,80,220,.9)",  top:"🌻 शुभमंगल 🌻",    bot:"❋ ✦ ❋",    sub:"— सावधान —",              and:"व",     border:"rgba(160,80,220,.4)",   label:"Marathi Paithani" },
  kerala:   { bg:"linear-gradient(145deg,#001a10,#003520)", nc:"#c8f0c0", ac:"rgba(80,180,100,.9)",  top:"🥥 ✿ 🥥",          bot:"🌴 ✦ 🌴",   sub:"— ശുഭ വിവാഹം —",         and:"&",     border:"rgba(80,180,100,.4)",   label:"Kerala Onam"      },
  bohemian: { bg:"linear-gradient(145deg,#1a1000,#2d1a0a)", nc:"#f5c87a", ac:"rgba(200,160,80,.9)",  top:"✨ boho love ✨",   bot:"~ ✦ ~",    sub:"A Celebration of Love",  and:"&",     border:"rgba(200,160,80,.35)",  label:"Boho Fusion"      },
  luxury:   { bg:"linear-gradient(145deg,#050505,#0f0f0f)", nc:"#d4af37", ac:"rgba(212,175,55,.9)",  top:"◈ ✦ ◈",           bot:"◈ ✦ ◈",    sub:"An Intimate Celebration", and:"&",    border:"rgba(212,175,55,.45)",  label:"Black Luxury"     },
};

const PALETTES = {
  redgold:     { nc:"#f5d08a", ac:"rgba(201,150,58,.85)", b1:"#8b1a1a", b2:"#c9963a" },
  rosepink:    { nc:"#7a1a35", ac:"#c4607a",              b1:"#d4556a", b2:"#fce4ec" },
  tealgold:    { nc:"#e0f0f0", ac:"rgba(201,150,58,.85)", b1:"#1a6b6b", b2:"#c9963a" },
  marigold:    { nc:"#fff0b0", ac:"rgba(232,137,12,.9)",  b1:"#e8890c", b2:"#3d2000" },
  purplegold:  { nc:"#e8c8ff", ac:"rgba(201,150,58,.85)", b1:"#6a0dad", b2:"#c9963a" },
  indigo:      { nc:"#c9b0ff", ac:"rgba(155,114,207,.9)", b1:"#0d0a1f", b2:"#9b72cf" },
  blackgold:   { nc:"#d4af37", ac:"rgba(212,175,55,.9)",  b1:"#000",    b2:"#c9963a" },
  green:       { nc:"#c8f0c0", ac:"rgba(80,180,100,.9)",  b1:"#0a2010", b2:"#3a9a3a" },
  navygold:    { nc:"#d0e8ff", ac:"rgba(201,150,58,.85)", b1:"#003366", b2:"#c9963a" },
  terracotta:  { nc:"#fff0e0", ac:"rgba(232,140,80,.9)",  b1:"#6b3a2a", b2:"#e8a87c" },
  ivorygold:   { nc:"#2a1f15", ac:"#8a6a4a",              b1:"#f5f0e8", b2:"#c9963a" },
  mango:       { nc:"#fff0a0", ac:"rgba(200,180,50,.9)",  b1:"#2c4a1e", b2:"#f5d060" },
};

const FONTS = {
  playfair:  "'Playfair Display',serif",
  cinzel:    "'Cinzel',serif",
  dancing:   "'Dancing Script',cursive",
  cormorant: "'Cormorant Garamond',serif",
};

export default function ManualCardPage({ params }) {
  const { weddingId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const cardRef = useRef(null);

  const guestId = searchParams.get("guestId");
  const fnIds   = searchParams.get("fnIds")?.split(",").filter(Boolean) ?? [];

  // ── Data ───────────────────────────────────────────────────────────────────
  const [guest, setGuest]         = useState(null);
  const [guestFns, setGuestFns]   = useState([]); // only this guest's functions
  const [wedding, setWedding]     = useState({});
  const [loading, setLoading]     = useState(true);

  // ── Style controls ─────────────────────────────────────────────────────────
  const [curStyle,    setCurStyle]   = useState("royal");
  const [curPalette,  setCurPalette] = useState("redgold");
  const [curFont,     setCurFont]    = useState("playfair");

  // ── Sliders ────────────────────────────────────────────────────────────────
  const [nameSize,      setNameSize]      = useState(30);
  const [cardPadding,   setCardPadding]   = useState(40);
  const [borderWidth,   setBorderWidth]   = useState(1);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineGap,       setLineGap]       = useState(14);

  // ── Motif toggles ──────────────────────────────────────────────────────────
  const [motifs, setMotifs] = useState({
    shloka: true, parents: true, time: true,
    diya: false, dots: false, rsvp: true, dressCode: false,
  });

  // ── Custom text overrides (user can edit any element) ─────────────────────
  const [custom, setCustom] = useState({
    topOrnament: "", subtitle: "", andWord: "", bottomOrnament: "",
    shloka: "ॐ गणेशाय नमः", extraLine: "",
  });

  // ── Export ─────────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  // ── fetchData ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [guestRes, weddingRes, fnsRes] = await Promise.all([
          supabase.from("guests").select("id, full_name, phone, email, group_tag").eq("id", guestId).single(),
          supabase.from("weddings").select("*").eq("id", weddingId).single(),
          supabase.from("wedding_functions").select("id, name, function_date, start_time, venue_detail")
            .in("id", fnIds.length > 0 ? fnIds : ["none"]),
        ]);

        setGuest(guestRes.data);
        setWedding(weddingRes.data ?? {});
        setGuestFns(fnsRes.data ?? []);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (guestId) load();
  }, [guestId, weddingId]);

  // ── Derived card values ────────────────────────────────────────────────────
  const S = STYLES[curStyle];
  const P = PALETTES[curPalette];
  const font = FONTS[curFont];
  const nc = P.nc; const ac = P.ac;
  const cardBg = `linear-gradient(145deg, ${P.b1}, ${P.b2})`;

  const topOrnament    = custom.topOrnament    || S.top;
  const subtitle       = custom.subtitle       || S.sub;
  const andWord        = custom.andWord        || S.and;
  const bottomOrnament = custom.bottomOrnament || S.bot;

  // ── Export functions ───────────────────────────────────────────────────────
  async function doExport(type) {
    if (!cardRef.current) return;
    setExporting(true);
    setExportMsg(`Preparing ${type}…`);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, useCORS: true, backgroundColor: null, logging: false,
      });

      if (type === "png") {
        const a = document.createElement("a");
        a.download = `invite-${guest?.full_name?.replace(/\s/g,"")}.png`;
        a.href = canvas.toDataURL("image/png", 1.0);
        a.click();
        setExportMsg("PNG downloaded!");

      } else if (type === "whatsapp") {
        const off = document.createElement("canvas");
        off.width = 1080; off.height = 1080;
        const ctx = off.getContext("2d");
        ctx.fillStyle = P.b1;
        ctx.fillRect(0, 0, 1080, 1080);
        const cw = canvas.width, ch = canvas.height;
        const scale = Math.min(960 / cw, 960 / ch);
        const dw = cw * scale, dh = ch * scale;
        ctx.drawImage(canvas, (1080 - dw) / 2, (1080 - dh) / 2, dw, dh);
        const a = document.createElement("a");
        a.download = `whatsapp-invite-${guest?.full_name?.replace(/\s/g,"")}.png`;
        a.href = off.toDataURL("image/png", 1.0);
        a.click();
        setExportMsg("WhatsApp image (1080×1080) downloaded!");
      }

    } catch (e) {
      setExportMsg("Export failed: " + e.message);
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(""), 4000);
    }
  }

  // ── Go to Send page ────────────────────────────────────────────────────────
  function goSend() {
    router.push(`/dashboard/${weddingId}/cards/send?guestId=${guestId}&fnIds=${fnIds.join(",")}`);
  }

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
      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* ── LEFT PANEL: Controls ── */}
        <div className="w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-gray-100
          overflow-y-auto flex flex-col gap-6 p-5 lg:min-h-screen">

          {/* Back */}
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back to Guest List
          </button>

          <div>
            <h2 className="text-base text-[#2c1810]">Manual Card Builder</h2>
            <p className="text-xs text-[#9e8878] mt-1">
              Card for: <span className="font-semibold text-gray-600">{guest?.full_name}</span>
              <br/>Functions: {guestFns.map(f => f.name).join(", ")}
            </p>
          </div>

          {/* ── Style picker ── */}
          <div>
            <p className="text-xs text-[#9e8878] mb-2">Card Style</p>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(STYLES).map(([key, s]) => (
                <button key={key} onClick={() => setCurStyle(key)}
                  className={`text-xs py-2 px-1 rounded-lg border transition text-center
                    ${curStyle === key
                      ? "border-[#2c1810] bg-[#fdf5ee] text-[#2c1810]"
                      : "border-sand text-[#6f5a4a] hover:border-[#c9a96e]"}`}>
                  {s.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* ── Palette ── */}
          <div>
            <p className="text-xs text-[#9e8878] mb-2">Color Palette</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PALETTES).map(([key, p]) => (
                <button key={key} onClick={() => setCurPalette(key)} title={key}
                  className={`w-7 h-7 rounded-full border-2 transition
                    ${curPalette === key ? "border-gray-900 scale-125" : "border-transparent hover:scale-110"}`}
                  style={{ background: `linear-gradient(135deg, ${p.b1}, ${p.b2})` }}
                />
              ))}
            </div>
          </div>

          {/* ── Font ── */}
          <div>
            <p className="text-xs text-[#9e8878] mb-2">Name Font</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(FONTS).map(([key, fv]) => (
                <button key={key} onClick={() => setCurFont(key)}
                  style={{ fontFamily: fv }}
                  className={`py-2 text-sm rounded-lg border transition
                    ${curFont === key
                      ? "border-[#2c1810] bg-[#fdf5ee] text-[#2c1810]"
                      : "border-sand text-[#6f5a4a] hover:border-[#c9a96e]"}`}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* ── Fine-tune Sliders ── */}
          <div>
            <p className="text-xs text-[#9e8878] mb-2">Fine-tune</p>
            <div className="space-y-3">
              {[
                ["Name Size",      nameSize,      setNameSize,      18, 48],
                ["Card Padding",   cardPadding,   setCardPadding,   20, 70],
                ["Border Width",   borderWidth,   setBorderWidth,   0,  4 ],
                ["Letter Spacing", letterSpacing, setLetterSpacing, 0,  8 ],
                ["Line Gap",       lineGap,       setLineGap,       6,  28],
              ].map(([label, val, setter, min, max]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
                  <input type="range" min={min} max={max} value={val} step="1"
                    onChange={e => setter(+e.target.value)}
                    className="flex-1 accent-indigo-600"/>
                  <span className="text-xs font-mono text-gray-600 w-6 text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Motif Toggles ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Show / Hide Elements</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(motifs).map(([key, val]) => (
                <button key={key}
                  onClick={() => setMotifs(m => ({ ...m, [key]: !m[key] }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition capitalize
                    ${val
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-400"}`}>
                  {key.replace(/([A-Z])/g, " $1")}
                </button>
              ))}
            </div>
          </div>

          {/* ── Custom Text Overrides ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Text</p>
            <div className="space-y-2">
              {[
                ["topOrnament",    "Top Ornament",   "default from style"],
                ["subtitle",       "Sub-title",      "default from style"],
                ["andWord",        "Joining Word",   "weds / & / ও"],
                ["bottomOrnament", "Bottom Ornament","default from style"],
                ["shloka",         "Shloka/Blessing","ॐ गणेशाय नमः"],
                ["extraLine",      "Extra Line",     "Any note at bottom"],
              ].map(([key, label, ph]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{label}</label>
                  <input type="text" value={custom[key]}
                    onChange={e => setCustom(c => ({ ...c, [key]: e.target.value }))}
                    placeholder={ph}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs
                      focus:ring-1 focus:ring-indigo-400 focus:outline-none"/>
                </div>
              ))}
            </div>
          </div>

          {/* ── Export buttons ── */}
          <div className="space-y-2 pb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Export & Send</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => doExport("png")} disabled={exporting}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300
                  text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5">
                🖼 Download PNG
              </button>
              <button onClick={() => doExport("whatsapp")} disabled={exporting}
                className="py-2.5 px-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300
                  text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5">
                💬 WhatsApp
              </button>
            </div>
            <button onClick={goSend}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs
                font-semibold rounded-xl transition flex items-center justify-center gap-2">
              📨 Send to {guest?.full_name?.split(" ")[0]}
            </button>
            {exportMsg && (
              <p className="text-xs text-center text-indigo-600 bg-indigo-50 rounded-lg py-2 px-3">
                {exportMsg}
              </p>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Card Preview ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 bg-gray-100">

          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Live Preview</p>
            <p className="text-xs text-gray-400 mt-1">Updates instantly as you change controls</p>
          </div>

          {/* THE CARD */}
          <div ref={cardRef}
            style={{
              background: cardBg,
              borderRadius: "14px",
              overflow: "hidden",
              position: "relative",
              width: "100%",
              maxWidth: "560px",
              minHeight: "400px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}>

            {/* Border ornament */}
            <div style={{
              position:"absolute", inset:"10px", borderRadius:"10px",
              border: `${borderWidth}px solid ${S.border}`,
              pointerEvents:"none", zIndex:1,
            }}/>

            {/* Content */}
            <div style={{
              position:"relative", zIndex:2,
              padding: `${cardPadding}px ${cardPadding + 8}px`,
              display:"flex", flexDirection:"column",
              alignItems:"center", gap:`${lineGap}px`,
              minHeight:"400px", justifyContent:"center",
            }}>

              {/* Shloka */}
              {motifs.shloka && (custom.shloka || "ॐ गणेशाय नमः") && (
                <div style={{ color:ac, fontSize:"13px", textAlign:"center",
                  opacity:.8, letterSpacing:`${letterSpacing*0.5}px` }}>
                  {custom.shloka || "ॐ गणेशाय नमः"}
                </div>
              )}

              {/* Top ornament */}
              <div style={{ color:ac, fontSize:"22px", textAlign:"center" }}>{topOrnament}</div>

              {/* Subtitle */}
              <div style={{ color:ac, fontSize:"11px", letterSpacing:`${letterSpacing + 3}px`,
                textTransform:"uppercase", textAlign:"center", opacity:.75 }}>
                {subtitle}
              </div>

              {/* Divider */}
              <div style={{ width:"90px", height:"1px", background:S.border, opacity:.5 }}/>

              {/* Parents */}
              {motifs.parents && (wedding.bride_family || wedding.groom_family) && (
                <div style={{ color:nc, fontSize:"11px", textAlign:"center", opacity:.65, lineHeight:1.7 }}>
                  {wedding.bride_family && <div>{wedding.bride_family}</div>}
                  {wedding.groom_family && <div>{wedding.groom_family}</div>}
                  <div style={{ fontSize:"10px", opacity:.7, marginTop:"2px" }}>
                    joyfully invite you to celebrate
                  </div>
                </div>
              )}

              {/* Names */}
              <div style={{ color:nc, fontFamily:font, fontSize:`${nameSize}px`,
                fontWeight:700, textAlign:"center", lineHeight:1.2,
                letterSpacing:`${letterSpacing}px` }}>
                {wedding.bride_name || "Bride"}
              </div>
              <div style={{ color:ac, fontFamily:font, fontSize:"18px",
                fontStyle:"italic", textAlign:"center", opacity:.8 }}>
                {andWord}
              </div>
              <div style={{ color:nc, fontFamily:font, fontSize:`${nameSize}px`,
                fontWeight:700, textAlign:"center", lineHeight:1.2,
                letterSpacing:`${letterSpacing}px` }}>
                {wedding.groom_name || "Groom"}
              </div>

              {/* Divider */}
              <div style={{ width:"90px", height:"1px", background:S.border, opacity:.5 }}/>

              {/* Functions — ONLY this guest's functions */}
              {guestFns.map((fn, i) => (
                <div key={fn.id} style={{ textAlign:"center",
                  borderTop: i > 0 ? `1px solid ${S.border}` : "none",
                  paddingTop: i > 0 ? `${lineGap}px` : 0,
                  width:"100%" }}>
                  <div style={{ color:ac, fontSize:"11px", letterSpacing:"3px",
                    textTransform:"uppercase", opacity:.8 }}>
                    {fn.name}
                  </div>
                  {fn.function_date && (
                    <div style={{ color:nc, fontFamily:font, fontSize:"16px", marginTop:"4px" }}>
                      {fn.function_date}
                    </div>
                  )}
                  {motifs.time && fn.start_time && (
                    <div style={{ color:nc, fontSize:"12px", opacity:.65 }}>{fn.start_time}</div>
                  )}
                  {fn.venue_detail && (
                    <div style={{ color:nc, fontSize:"11px", opacity:.6, lineHeight:1.6 }}>
                      {fn.venue_detail}
                    </div>
                  )}
                </div>
              ))}

              {/* Venue */}
              {wedding.venue && (
                <div style={{ color:nc, fontSize:"11px", textAlign:"center",
                  opacity:.6, lineHeight:1.6 }}>
                  {wedding.venue}
                  {wedding.city && `, ${wedding.city}`}
                </div>
              )}

              {/* Dress code */}
              {motifs.dressCode && wedding.dress_code && (
                <div style={{ color:ac, fontSize:"10px", textAlign:"center",
                  opacity:.7, letterSpacing:"1px" }}>
                  Dress Code: {wedding.dress_code}
                </div>
              )}

              {/* Extra line */}
              {custom.extraLine && (
                <div style={{ color:ac, fontSize:"11px", textAlign:"center",
                  opacity:.7, fontStyle:"italic" }}>
                  {custom.extraLine}
                </div>
              )}

              {/* Bottom ornament */}
              <div style={{ color:ac, fontSize:"19px", textAlign:"center", opacity:.85 }}>
                {bottomOrnament}
              </div>

              {/* Diya row */}
              {motifs.diya && (
                <div style={{ fontSize:"14px", textAlign:"center",
                  letterSpacing:"5px", color:ac }}>
                  🪔 🪔 🪔 🪔 🪔
                </div>
              )}
            </div>
          </div>

          {/* Guest info strip */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="px-3 py-1.5 bg-white rounded-full border border-gray-200">
              {guest?.full_name}
            </span>
            {guest?.phone && (
              <span className="px-3 py-1.5 bg-white rounded-full border border-gray-200">
                {guest.phone}
              </span>
            )}
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
              {guestFns.length} function{guestFns.length !== 1 ? "s" : ""}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
