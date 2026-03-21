"use client";

/**
 * FILE: app/dashboard/[weddingId]/cards/ai/page.jsx
 * ROUTE: /dashboard/[weddingId]/cards/ai?guestId=xxx&fnIds=fn1,fn2
 *
 * AI card generator:
 *   1. User describes their vision
 *   2. Claude generates: style, palette, font, shloka, and full card text
 *   3. Card renders immediately with AI choices
 *   4. User can then customize ANY element (same controls as manual)
 *   5. Export / Send
 */

import { useState, use, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STYLES = {
  royal:    { bg:"linear-gradient(145deg,#3d0b0b,#1a0505)", nc:"#f5d08a", ac:"rgba(201,150,58,.85)", top:"🪔 ॐ 🪔",          bot:"❋ ✦ ❋",  sub:"— शुभ विवाह —",          and:"weds", border:"rgba(201,150,58,.4)"   },
  floral:   { bg:"linear-gradient(145deg,#fdf0f5,#fff8f0)", nc:"#7a1a35", ac:"#c4607a",              top:"🌸 🌺 🌸",          bot:"🌿 ✿ 🌿", sub:"With Blessings",         and:"&",    border:"rgba(196,96,122,.35)"  },
  modern:   { bg:"linear-gradient(145deg,#f9f5ef,#fffdf8)", nc:"#2a1f15", ac:"#8a6a4a",              top:"— ✦ —",            bot:"— ✦ —",  sub:"Together Forever",       and:"&",    border:"rgba(138,106,74,.25)"  },
  temple:   { bg:"linear-gradient(145deg,#1a1200,#2d1f00)", nc:"#ffd060", ac:"rgba(232,137,12,.9)",  top:"🔱 ॐ 🔱",          bot:"❁ ✦ ❁",  sub:"— मंगलम् —",            and:"weds", border:"rgba(232,137,12,.45)"  },
  south:    { bg:"linear-gradient(145deg,#0a1f0a,#051505)", nc:"#90ee90", ac:"rgba(100,200,100,.85)",top:"🌿 ✿ 🌿",          bot:"🍃 ✦ 🍃", sub:"— శుభ వివాహం —",         and:"&",    border:"rgba(100,200,100,.35)" },
  mughal:   { bg:"linear-gradient(145deg,#0d0a1f,#1a1035)", nc:"#c9b0ff", ac:"rgba(155,114,207,.9)", top:"☽ ✦ ☾",           bot:"◈ ✦ ◈",  sub:"— مبارک ہو —",           and:"weds", border:"rgba(155,114,207,.4)"  },
  bengali:  { bg:"linear-gradient(145deg,#1a0a00,#3d1500)", nc:"#ffcc88", ac:"rgba(220,150,50,.9)",  top:"🐚 শুভ বিবাহ 🐚",  bot:"❈ ✦ ❈",  sub:"— আশীর্বাদ —",           and:"ও",    border:"rgba(220,150,50,.4)"   },
  punjabi:  { bg:"linear-gradient(145deg,#4a0a2a,#1a0010)", nc:"#ffd1e8", ac:"rgba(220,80,150,.9)",  top:"🥁 ਸ਼ੁਭ ਵਿਆਹ 🥁",  bot:"✿ ❋ ✿", sub:"— ਵਧਾਈ —",               and:"&",    border:"rgba(220,80,150,.4)"   },
  luxury:   { bg:"linear-gradient(145deg,#050505,#0f0f0f)", nc:"#d4af37", ac:"rgba(212,175,55,.9)",  top:"◈ ✦ ◈",           bot:"◈ ✦ ◈",  sub:"An Intimate Celebration", and:"&",   border:"rgba(212,175,55,.45)"  },
};

const PALETTES = {
  redgold:   { nc:"#f5d08a", ac:"rgba(201,150,58,.85)", b1:"#8b1a1a", b2:"#c9963a" },
  rosepink:  { nc:"#7a1a35", ac:"#c4607a",              b1:"#d4556a", b2:"#fce4ec" },
  tealgold:  { nc:"#e0f0f0", ac:"rgba(201,150,58,.85)", b1:"#1a6b6b", b2:"#c9963a" },
  marigold:  { nc:"#fff0b0", ac:"rgba(232,137,12,.9)",  b1:"#e8890c", b2:"#3d2000" },
  blackgold: { nc:"#d4af37", ac:"rgba(212,175,55,.9)",  b1:"#000",    b2:"#c9963a" },
  green:     { nc:"#c8f0c0", ac:"rgba(80,180,100,.9)",  b1:"#0a2010", b2:"#3a9a3a" },
};

const FONTS = {
  playfair:  "'Playfair Display',serif",
  cinzel:    "'Cinzel',serif",
  dancing:   "'Dancing Script',cursive",
  cormorant: "'Cormorant Garamond',serif",
};

export default function AICardPage({ params }) {
  const { weddingId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const cardRef = useRef(null);

  const guestId = searchParams.get("guestId");
  const fnIds   = searchParams.get("fnIds")?.split(",").filter(Boolean) ?? [];

  const [guest,    setGuest]    = useState(null);
  const [guestFns, setGuestFns] = useState([]);
  const [wedding,  setWedding]  = useState({});
  const [loading,  setLoading]  = useState(true);

  // AI generation state
  const [vision,      setVision]      = useState("");
  const [generating,  setGenerating]  = useState(false);
  const [aiDone,      setAiDone]      = useState(false);
  const [aiVision,    setAiVision]    = useState("");
  const [aiError,     setAiError]     = useState("");

  // Card design state (set by AI, editable after)
  const [curStyle,    setCurStyle]    = useState("royal");
  const [curPalette,  setCurPalette]  = useState("redgold");
  const [curFont,     setCurFont]     = useState("playfair");
  const [nameSize,    setNameSize]    = useState(30);
  const [borderWidth, setBorderWidth] = useState(1);
  const [lineGap,     setLineGap]     = useState(14);
  const [custom, setCustom] = useState({
    topOrnament:"", subtitle:"", andWord:"", bottomOrnament:"",
    shloka:"ॐ गणेशाय नमः", extraLine:"",
  });
  const [motifs, setMotifs] = useState({
    shloka:true, parents:true, time:true, diya:false, dressCode:false,
  });

  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

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
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    if (guestId) load();
  }, [guestId, weddingId]);

  // ── AI Generate ────────────────────────────────────────────────────────────
  async function generateWithAI() {
    setGenerating(true);
    setAiError("");
    setAiVision("");

    const fnList = guestFns.map(fn =>
      `${fn.name}${fn.function_date ? " on " + fn.function_date : ""}${fn.start_time ? " at " + fn.start_time : ""}${fn.venue_detail ? " at " + fn.venue_detail : ""}`
    ).join("; ");

    const prompt = `You are a luxury Indian wedding invitation designer. Design a complete invitation card.

Wedding details:
- Bride: ${wedding.bride_name || "Bride"} (${wedding.bride_family || ""})
- Groom: ${wedding.groom_name || "Groom"} (${wedding.groom_family || ""})
- This guest is invited to: ${fnList}
- Venue: ${wedding.venue || ""}, ${wedding.city || ""}
- Owner's vision: ${vision || "traditional and elegant"}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "style": "one of: royal/floral/modern/temple/south/mughal/bengali/punjabi/luxury",
  "palette": "one of: redgold/rosepink/tealgold/marigold/blackgold/green",
  "font": "one of: playfair/cinzel/dancing/cormorant",
  "shloka": "appropriate Sanskrit/regional shloka or blessing (short)",
  "subtitle": "elegant 3-5 word subtitle in appropriate language",
  "topOrnament": "2-3 appropriate emoji/symbols",
  "bottomOrnament": "2-3 appropriate emoji/symbols",
  "andWord": "joining word (weds/&/ও/व/வரும் etc matching style)",
  "extraLine": "one poetic closing line or leave empty",
  "vision": "3 sentences describing this card's design — color palette, motifs, and the feeling"
}`;

    try {
      const res = await fetch("/api/ai/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";

    let parsed;
    try {
      // Extract JSON from response — handles markdown code blocks and extra text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // If JSON fails, use fallback values based on vision text
      parsed = {
        style:          "royal",
        palette:        "redgold",
        font:           "playfair",
        shloka:         "ॐ गणेशाय नमः",
        subtitle:       "— शुभ विवाह —",
        topOrnament:    "🪔 ॐ 🪔",
        bottomOrnament: "❋ ✦ ❋",
        andWord:        "weds",
        extraLine:      "",
        vision:         "A classic Indian wedding invitation in rich red and gold, adorned with traditional motifs.",
      };
    }

      // Apply AI choices
      if (parsed.style    && STYLES[parsed.style])    setCurStyle(parsed.style);
      if (parsed.palette  && PALETTES[parsed.palette]) setCurPalette(parsed.palette);
      if (parsed.font     && FONTS[parsed.font])       setCurFont(parsed.font);

      setCustom({
        topOrnament:    parsed.topOrnament    ?? "",
        subtitle:       parsed.subtitle       ?? "",
        andWord:        parsed.andWord        ?? "",
        bottomOrnament: parsed.bottomOrnament ?? "",
        shloka:         parsed.shloka         ?? "ॐ गणेशाय नमः",
        extraLine:      parsed.extraLine      ?? "",
      });

      setAiVision(parsed.vision ?? "");
      setAiDone(true);

    } catch (e) {
      setAiError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  async function doExport(type) {
    if (!cardRef.current) return;
    setExporting(true);
    setExportMsg(`Preparing ${type}…`);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, { scale:3, useCORS:true, backgroundColor:null, logging:false });

      if (type === "png") {
        const a = document.createElement("a");
        a.download = `ai-invite-${guest?.full_name?.replace(/\s/g,"")}.png`;
        a.href = canvas.toDataURL("image/png", 1.0); a.click();
        setExportMsg("PNG downloaded!");

      } else if (type === "whatsapp") {
        const off = document.createElement("canvas");
        off.width = off.height = 1080;
        const ctx = off.getContext("2d");
        const P = PALETTES[curPalette];
        ctx.fillStyle = P.b1; ctx.fillRect(0,0,1080,1080);
        const sc = Math.min(960/canvas.width, 960/canvas.height);
        ctx.drawImage(canvas, (1080-canvas.width*sc)/2, (1080-canvas.height*sc)/2, canvas.width*sc, canvas.height*sc);
        const a = document.createElement("a");
        a.download = `whatsapp-${guest?.full_name?.replace(/\s/g,"")}.png`;
        a.href = off.toDataURL("image/png",1.0); a.click();
        setExportMsg("WhatsApp image downloaded!");
      }
    } catch (e) { setExportMsg("Export failed: " + e.message); }
    finally { setExporting(false); setTimeout(() => setExportMsg(""), 4000); }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const S = STYLES[curStyle]; const P = PALETTES[curPalette];
  const font = FONTS[curFont];
  const nc = P.nc; const ac = P.ac;
  const cardBg = `linear-gradient(145deg, ${P.b1}, ${P.b2})`;
  const topOrnament    = custom.topOrnament    || S.top;
  const subtitle       = custom.subtitle       || S.sub;
  const andWord        = custom.andWord        || S.and;
  const bottomOrnament = custom.bottomOrnament || S.bot;

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

        {/* LEFT: Controls */}
        <div className="w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-gray-100
          overflow-y-auto flex flex-col gap-5 p-5 lg:min-h-screen">

          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>

          <div>
            <h2 className="text-base font-bold text-gray-900">AI Card Generator</h2>
            <p className="text-xs text-gray-400 mt-1">
              For: <span className="font-semibold text-gray-600">{guest?.full_name}</span>
              <br/>Functions: {guestFns.map(f => f.name).join(", ")}
            </p>
          </div>

          {/* Vision input */}
          {!aiDone && (
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Describe your card vision</label>
                <textarea
                  value={vision}
                  onChange={e => setVision(e.target.value)}
                  rows={4}
                  placeholder="e.g. Traditional Punjabi feel, bright pinks and gold, Gurbani shloka at top, festive and joyful for a Sangeet night…"
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                    focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
                />
              </div>
              <button
                onClick={generateWithAI}
                disabled={generating}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300
                  text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2">
                {generating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Generating Card…
                  </>
                ) : "✨ Generate with AI"}
              </button>
              {aiError && (
                <p className="text-xs text-rose-500 bg-rose-50 rounded-lg px-3 py-2">{aiError}</p>
              )}
            </div>
          )}

          {/* AI Vision result */}
          {aiDone && aiVision && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-amber-700">✦ AI Design Vision</p>
              <p className="text-xs text-amber-800 leading-relaxed">{aiVision}</p>
              <button onClick={() => { setAiDone(false); setAiVision(""); }}
                className="text-xs text-amber-600 underline">
                Regenerate
              </button>
            </div>
          )}

          {/* POST-AI CUSTOMIZATION (same as manual, shown after generation) */}
          {aiDone && (
            <>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Customize Further
                </p>

                {/* Style */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1.5">Style</p>
                  <div className="grid grid-cols-3 gap-1">
                    {Object.entries(STYLES).map(([key, s]) => (
                      <button key={key} onClick={() => setCurStyle(key)}
                        className={`text-xs py-1.5 px-1 rounded-lg border transition
                          ${curStyle === key
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Palette */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1.5">Palette</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PALETTES).map(([key, p]) => (
                      <button key={key} onClick={() => setCurPalette(key)} title={key}
                        className={`w-7 h-7 rounded-full border-2 transition
                          ${curPalette === key ? "border-gray-900 scale-125" : "border-transparent hover:scale-110"}`}
                        style={{ background: `linear-gradient(135deg,${p.b1},${p.b2})` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Font */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1.5">Font</p>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(FONTS).map(([key, fv]) => (
                      <button key={key} onClick={() => setCurFont(key)}
                        style={{ fontFamily: fv }}
                        className={`py-1.5 text-xs rounded-lg border transition
                          ${curFont === key
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 text-gray-500"}`}>
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-2 mb-3">
                  {[
                    ["Name Size",    nameSize,    setNameSize,    18, 48],
                    ["Border",       borderWidth, setBorderWidth,  0,  4],
                    ["Line Gap",     lineGap,     setLineGap,      6, 28],
                  ].map(([label, val, setter, min, max]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                      <input type="range" min={min} max={max} value={val} step="1"
                        onChange={e => setter(+e.target.value)}
                        className="flex-1 accent-indigo-600"/>
                      <span className="text-xs text-gray-500 w-5 text-right">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Motifs */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1.5">Elements</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(motifs).map(([key, val]) => (
                      <button key={key}
                        onClick={() => setMotifs(m => ({ ...m, [key]: !m[key] }))}
                        className={`text-xs px-2.5 py-1 rounded-full border transition capitalize
                          ${val ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-400"}`}>
                        {key.replace(/([A-Z])/g, " $1")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom text */}
                <div className="space-y-1.5">
                  {[
                    ["shloka", "Shloka"], ["subtitle", "Subtitle"],
                    ["andWord", "Joining Word"], ["extraLine", "Extra Line"],
                  ].map(([key, label]) => (
                    <div key={key} className="flex flex-col gap-0.5">
                      <label className="text-xs text-gray-400">{label}</label>
                      <input type="text" value={custom[key]}
                        onChange={e => setCustom(c => ({ ...c, [key]: e.target.value }))}
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs
                          focus:ring-1 focus:ring-indigo-400 focus:outline-none"/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export */}
              <div className="space-y-2 pb-6">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => doExport("png")} disabled={exporting}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs
                      font-semibold rounded-xl transition">
                    🖼 PNG
                  </button>
                  <button onClick={() => doExport("whatsapp")} disabled={exporting}
                    className="py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs
                      font-semibold rounded-xl transition">
                    💬 WhatsApp
                  </button>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/${weddingId}/cards/send?guestId=${guestId}&fnIds=${fnIds.join(",")}`)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs
                    font-semibold rounded-xl transition">
                  📨 Send to {guest?.full_name?.split(" ")[0]}
                </button>
                {exportMsg && (
                  <p className="text-xs text-center text-indigo-600 bg-indigo-50 rounded-lg py-2">{exportMsg}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Card preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 bg-gray-100">

          {!aiDone ? (
            <div className="text-center space-y-3 max-w-sm">
              <div className="text-5xl">✨</div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Describe your vision on the left and click <strong>Generate with AI</strong>.
                Claude will pick the perfect style, palette, font, shloka, and all text for your card.
              </p>
              <p className="text-xs text-gray-400">
                The card will only include functions {guest?.full_name} is invited to.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">AI Generated Card</p>
                <p className="text-xs text-gray-400 mt-1">Customize anything using controls on the left</p>
              </div>

              {/* CARD */}
              <div ref={cardRef}
                style={{
                  background: cardBg, borderRadius:"14px", overflow:"hidden",
                  position:"relative", width:"100%", maxWidth:"560px", minHeight:"400px",
                  boxShadow:"0 20px 60px rgba(0,0,0,0.3)",
                }}>
                <div style={{ position:"absolute", inset:"10px", borderRadius:"10px",
                  border:`${borderWidth}px solid ${S.border}`, pointerEvents:"none", zIndex:1 }}/>
                <div style={{ position:"relative", zIndex:2,
                  padding:`40px 48px`, display:"flex", flexDirection:"column",
                  alignItems:"center", gap:`${lineGap}px`, minHeight:"400px", justifyContent:"center" }}>

                  {motifs.shloka && custom.shloka && (
                    <div style={{ color:ac, fontSize:"13px", textAlign:"center", opacity:.8 }}>
                      {custom.shloka}
                    </div>
                  )}
                  <div style={{ color:ac, fontSize:"22px", textAlign:"center" }}>{topOrnament}</div>
                  <div style={{ color:ac, fontSize:"11px", letterSpacing:"3px",
                    textTransform:"uppercase", textAlign:"center", opacity:.75 }}>
                    {subtitle}
                  </div>
                  <div style={{ width:"80px", height:"1px", background:S.border, opacity:.5 }}/>

                  {motifs.parents && (wedding.bride_family || wedding.groom_family) && (
                    <div style={{ color:nc, fontSize:"11px", textAlign:"center", opacity:.65, lineHeight:1.7 }}>
                      {wedding.bride_family && <div>{wedding.bride_family}</div>}
                      {wedding.groom_family && <div>{wedding.groom_family}</div>}
                    </div>
                  )}

                  <div style={{ color:nc, fontFamily:font, fontSize:`${nameSize}px`, fontWeight:700, textAlign:"center", lineHeight:1.2 }}>
                    {wedding.bride_name || "Bride"}
                  </div>
                  <div style={{ color:ac, fontFamily:font, fontSize:"18px", fontStyle:"italic", opacity:.8 }}>
                    {andWord}
                  </div>
                  <div style={{ color:nc, fontFamily:font, fontSize:`${nameSize}px`, fontWeight:700, textAlign:"center", lineHeight:1.2 }}>
                    {wedding.groom_name || "Groom"}
                  </div>

                  <div style={{ width:"80px", height:"1px", background:S.border, opacity:.5 }}/>

                  {guestFns.map((fn, i) => (
                    <div key={fn.id} style={{ textAlign:"center", width:"100%",
                      borderTop: i > 0 ? `1px solid ${S.border}` : "none",
                      paddingTop: i > 0 ? `${lineGap}px` : 0 }}>
                      <div style={{ color:ac, fontSize:"11px", letterSpacing:"3px", textTransform:"uppercase", opacity:.8 }}>
                        {fn.name}
                      </div>
                      {fn.function_date && (
                        <div style={{ color:nc, fontFamily:font, fontSize:"16px", marginTop:"4px" }}>{fn.function_date}</div>
                      )}
                      {motifs.time && fn.start_time && (
                        <div style={{ color:nc, fontSize:"12px", opacity:.65 }}>{fn.start_time}</div>
                      )}
                      {fn.venue_detail && (
                        <div style={{ color:nc, fontSize:"11px", opacity:.6, lineHeight:1.6 }}>{fn.venue_detail}</div>
                      )}
                    </div>
                  ))}

                  {wedding.venue && (
                    <div style={{ color:nc, fontSize:"11px", textAlign:"center", opacity:.6, lineHeight:1.6 }}>
                      {wedding.venue}{wedding.city ? `, ${wedding.city}` : ""}
                    </div>
                  )}

                  {custom.extraLine && (
                    <div style={{ color:ac, fontSize:"11px", textAlign:"center", opacity:.7, fontStyle:"italic" }}>
                      {custom.extraLine}
                    </div>
                  )}

                  <div style={{ color:ac, fontSize:"19px", textAlign:"center", opacity:.85 }}>
                    {bottomOrnament}
                  </div>

                  {motifs.diya && (
                    <div style={{ fontSize:"14px", textAlign:"center", letterSpacing:"5px", color:ac }}>
                      🪔 🪔 🪔 🪔 🪔
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500 justify-center">
                <span className="px-3 py-1.5 bg-white rounded-full border border-gray-200">{guest?.full_name}</span>
                <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                  AI: {curStyle} + {curPalette}
                </span>
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                  {guestFns.length} function{guestFns.length !== 1 ? "s" : ""}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
