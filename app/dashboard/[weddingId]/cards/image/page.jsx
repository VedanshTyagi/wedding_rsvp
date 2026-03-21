"use client";

import { useState, use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ImageCardPage({ params }) {
  const { weddingId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId = searchParams.get("guestId");
  const fnIds   = searchParams.get("fnIds")?.split(",").filter(Boolean) ?? [];
  const supabase = createClient();

  const [prompt,     setPrompt]     = useState("");
  const [generating, setGenerating] = useState(false);
  const [finalCard,  setFinalCard]  = useState(null);
  const [error,      setError]      = useState("");
  const [wedding,    setWedding]    = useState({});
  const [guest,      setGuest]      = useState(null);
  const [guestFns,   setGuestFns]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  const PRESETS = [
    "Rajasthani floral border art only, pink lotus corner flowers, teal and gold color scheme, ornate Mughal arch frame, Ganesha motif at top center, decorative border only no text",
    "Royal Indian wedding border, deep crimson background with gold peacock feather corners, marigold flower frame, ivory inner border, no text",
    "South Indian wedding border art, banana leaf and mango leaf corner decorations, green gold palette, temple gopuram arch frame top, no text",
    "Mughal garden wedding frame, midnight blue with silver arabesque corner borders, white rose motifs, elegant arch frame, no text",
    "Punjabi wedding border, bright fuchsia pink with phulkari geometric embroidery corners, yellow marigold frame, no text",
    "Luxury black wedding frame, pure black background, thin gold geometric corner borders, art deco style, single lotus corner accents, no text",
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: w } = await supabase.from("weddings").select("*").eq("id", weddingId).single();
        setWedding(w ?? {});
        if (guestId) {
          const { data: g } = await supabase
            .from("guests").select("id, full_name, phone, email")
            .eq("id", guestId).single();
          setGuest(g);
        }
        let ids = fnIds;
        if (ids.length === 0 && guestId) {
          const { data: inv } = await supabase
            .from("guest_function_invites").select("function_id").eq("guest_id", guestId);
          ids = (inv ?? []).map(i => i.function_id);
        }
        if (ids.length > 0) {
          const { data: fns } = await supabase
            .from("wedding_functions")
            .select("id, name, function_date, start_time, venue_detail")
            .in("id", ids);
          setGuestFns(fns ?? []);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [weddingId, guestId]);

  async function generate() {
    if (!prompt.trim()) { setError("Please enter a prompt."); return; }
    setGenerating(true); setError(""); setFinalCard(null);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const card = await buildCard(data.image);
      setFinalCard(card);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function buildCard(bgDataUrl) {
    return new Promise((resolve) => {
      // Use a taller canvas so content fits comfortably
      const W = 1024;
      const H = 1400;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.onload = () => {
        // Draw AI background stretched to fill
        ctx.drawImage(img, 0, 0, W, H);

        // Panel — 60px padding on sides, 80px top/bottom
        const PAD_X = 60;
        const PAD_Y = 80;
        const panelX = PAD_X;
        const panelY = PAD_Y;
        const panelW = W - PAD_X * 2;
        const panelH = H - PAD_Y * 2;
        const cx = W / 2;

        // 50% white panel
        ctx.fillStyle = "rgba(255,255,255,0.50)";
        roundRect(ctx, panelX, panelY, panelW, panelH, 20);
        ctx.fill();

        // Gold outer border
        ctx.strokeStyle = "rgba(180,140,30,0.65)";
        ctx.lineWidth = 2.5;
        roundRect(ctx, panelX, panelY, panelW, panelH, 20);
        ctx.stroke();

        // Gold inner border
        ctx.strokeStyle = "rgba(180,140,30,0.35)";
        ctx.lineWidth = 1;
        roundRect(ctx, panelX + 12, panelY + 12, panelW - 24, panelH - 24, 14);
        ctx.stroke();

        // ── Fixed font sizes — large and clear ────────────────────────────
        const FS_SHLOKA   = 22;
        const FS_INVITE   = 18;
        const FS_NAME     = 64;
        const FS_WEDS     = 26;
        const FS_FAMILY   = 18;
        const FS_FN_NAME  = 22;
        const FS_FN_DETAIL= 20;
        const FS_VENUE    = 20;

        // ── Fixed line gaps ────────────────────────────────────────────────
        const G_XS  = 24;  // tiny gap
        const G_S   = 30;  // small gap
        const G_M   = 38;  // medium gap
        const G_L   = 50;  // large gap (after names)

        ctx.textAlign = "center";
        let y = panelY + 60;

        // Shloka
        ctx.font = `italic ${FS_SHLOKA}px Georgia, serif`;
        ctx.fillStyle = "rgba(100,65,5,0.9)";
        ctx.fillText("ॐ गणेशाय नमः", cx, y);
        y += G_S;

        goldDivider(ctx, cx, y, 120);
        y += G_S;

        // Invite lines
        ctx.font = `${FS_INVITE}px Georgia, serif`;
        ctx.fillStyle = "#444";
        ctx.fillText("You Are Cordially Invited To The", cx, y);
        y += G_XS;

        ctx.font = `bold ${FS_INVITE}px Georgia, serif`;
        ctx.fillStyle = "#333";
        ctx.fillText("WEDDING CEREMONY OF", cx, y);
        y += G_M;

        // Bride name
        const bride = wedding.bride_name || "Bride";
        const groom = wedding.groom_name || "Groom";

        ctx.font = `bold ${FS_NAME}px Georgia, serif`;
        ctx.fillStyle = "#111";
        ctx.fillText(bride, cx, y);
        y += G_S;

        // Weds
        ctx.font = `italic ${FS_WEDS}px Georgia, serif`;
        ctx.fillStyle = "rgba(130,90,5,0.95)";
        ctx.fillText("weds", cx, y);
        y += G_S;

        // Groom name
        ctx.font = `bold ${FS_NAME}px Georgia, serif`;
        ctx.fillStyle = "#111";
        ctx.fillText(groom, cx, y);
        y += G_L;

        goldDivider(ctx, cx, y, 140);
        y += G_S;

        // Families
        if (wedding.bride_family || wedding.groom_family) {
          ctx.font = `${FS_FAMILY}px Georgia, serif`;
          ctx.fillStyle = "#555";
          if (wedding.bride_family) {
            ctx.fillText(wedding.bride_family, cx, y);
            y += G_XS;
          }
          if (wedding.groom_family) {
            ctx.fillText(wedding.groom_family, cx, y);
            y += G_XS;
          }
          y += 10;
        }

        // Functions — each with clear spacing
        for (let i = 0; i < guestFns.length; i++) {
          const fn = guestFns[i];

          // Function name
          ctx.font = `bold ${FS_FN_NAME}px Georgia, serif`;
          ctx.fillStyle = "rgba(110,70,0,1)";
          ctx.fillText(`❧  ${fn.name.toUpperCase()}  ❧`, cx, y);
          y += G_XS;

          if (fn.function_date) {
            ctx.font = `bold ${FS_FN_DETAIL}px Georgia, serif`;
            ctx.fillStyle = "#222";
            ctx.fillText(fn.function_date, cx, y);
            y += G_XS;
          }

          if (fn.start_time) {
            ctx.font = `${FS_FN_DETAIL}px Georgia, serif`;
            ctx.fillStyle = "#444";
            ctx.fillText(fn.start_time, cx, y);
            y += G_XS;
          }

          if (fn.venue_detail) {
            ctx.font = `${FS_FN_DETAIL - 2}px Georgia, serif`;
            ctx.fillStyle = "#555";
            // Truncate if too long
            let vd = fn.venue_detail;
            const maxW = panelW - 100;
            while (ctx.measureText(vd).width > maxW && vd.length > 8) {
              vd = vd.slice(0, -4) + "…";
            }
            ctx.fillText(vd, cx, y);
            y += G_XS;
          }

          // Divider between functions
          if (i < guestFns.length - 1) {
            y += 8;
            ctx.strokeStyle = "rgba(180,140,30,0.3)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - 80, y); ctx.lineTo(cx + 80, y);
            ctx.stroke();
            y += G_S;
          } else {
            y += 10;
          }
        }

        // Main venue
        if (wedding.venue) {
          goldDivider(ctx, cx, y, 110);
          y += G_S;
          ctx.font = `bold ${FS_VENUE}px Georgia, serif`;
          ctx.fillStyle = "#222";
          const vLine = `📍  ${wedding.venue}${wedding.city ? ", " + wedding.city : ""}`;
          ctx.fillText(vLine, cx, y);
          y += G_XS;
        }

        // Dress code
        if (wedding.dress_code) {
          ctx.font = `italic ${FS_VENUE - 2}px Georgia, serif`;
          ctx.fillStyle = "#666";
          ctx.fillText(`Dress Code: ${wedding.dress_code}`, cx, y);
          y += G_XS;
        }

        // Bottom ornament — always at bottom of panel
        goldDivider(ctx, cx, panelY + panelH - 36, 120);
        ctx.font = `20px Georgia, serif`;
        ctx.fillStyle = "rgba(160,120,20,0.7)";
        ctx.fillText("❋  ✦  ❋", cx, panelY + panelH - 14);

        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
      img.src = bgDataUrl;
    });
  }

  function goldDivider(ctx, cx, y, hw) {
    ctx.strokeStyle = "rgba(180,140,30,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - hw, y); ctx.lineTo(cx + hw, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(180,140,30,0.6)";
    ctx.beginPath();
    ctx.moveTo(cx, y - 5); ctx.lineTo(cx + 5, y);
    ctx.lineTo(cx, y + 5); ctx.lineTo(cx - 5, y);
    ctx.closePath(); ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function download() {
    if (!finalCard) return;
    const a = document.createElement("a");
    a.href = finalCard;
    a.download = `wedding-card-${Date.now()}.jpg`;
    a.click();
  }

  function shareWhatsApp() {
    download();
    const bride = wedding.bride_name || "Bride";
    const groom = wedding.groom_name || "Groom";
    const msg = `🙏 You're invited to the wedding of *${bride}* & *${groom}*! 🎊\n\nFind your personalised invitation card attached.\n\nWith love & blessings 🌸`;
    let phone = guest?.phone?.replace(/[^\d]/g, "") ?? "";
    if (phone.length === 10) phone = "91" + phone;
    setTimeout(() => {
      window.open(`https://wa.me/${phone || ""}?text=${encodeURIComponent(msg)}`, "_blank");
    }, 600);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">

      {/* LEFT */}
      <div className="w-full lg:w-96 bg-white border-r border-gray-100 p-6 flex flex-col gap-5 overflow-y-auto">

        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <div>
          <h2 className="text-base font-bold text-gray-900">AI Image Card Generator</h2>
          <p className="text-xs text-gray-400 mt-1">
            AI generates decorative border art. Wedding details appear in a 50% transparent panel with large clear text and proper spacing.
          </p>
          {guest && (
            <p className="text-xs text-indigo-600 mt-2 font-semibold">
              For: {guest.full_name}
              {guestFns.length > 0 && ` · ${guestFns.map(f => f.name).join(", ")}`}
            </p>
          )}
        </div>

        {/* What will appear */}
        {!loading && (wedding.bride_name || wedding.groom_name) && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-amber-700">Will appear on card:</p>
            <p className="text-xs text-amber-800 font-semibold">{wedding.bride_name} weds {wedding.groom_name}</p>
            {wedding.bride_family && <p className="text-xs text-amber-700">{wedding.bride_family}</p>}
            {wedding.groom_family && <p className="text-xs text-amber-700">{wedding.groom_family}</p>}
            {guestFns.map(fn => (
              <p key={fn.id} className="text-xs text-amber-700">
                ❧ {fn.name}{fn.function_date ? ` · ${fn.function_date}` : ""}{fn.start_time ? ` · ${fn.start_time}` : ""}
                {fn.venue_detail ? ` · ${fn.venue_detail}` : ""}
              </p>
            ))}
            {wedding.venue && <p className="text-xs text-amber-700">📍 {wedding.venue}{wedding.city ? `, ${wedding.city}` : ""}</p>}
            {wedding.dress_code && <p className="text-xs text-amber-600">👗 Dress Code: {wedding.dress_code}</p>}
          </div>
        )}

        {/* Presets */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Border Style Presets</p>
          <div className="flex flex-col gap-1.5">
            {PRESETS.map((p, i) => (
              <button key={i} onClick={() => setPrompt(p)}
                className={`text-xs px-3 py-2 border rounded-lg text-left transition
                  ${prompt === p ? "border-amber-400 bg-amber-50 text-amber-800" : "border-gray-200 hover:border-amber-300 text-gray-600"}`}>
                {p.split(",")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Describe the border/background art</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
            placeholder="e.g. Rajasthani floral corner decorations, pink lotus flowers, teal and gold, ornate arch frame borders only"
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"/>
          <p className="text-xs text-gray-400">Describe border/corner art only. Text is added automatically.</p>
        </div>

        <button onClick={generate} disabled={generating || !prompt.trim()}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400
            disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2">
          {generating ? (
            <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>Generating…</>
          ) : "✨ Generate Card"}
        </button>

        {error && (
          <div className="text-xs text-rose-600 bg-rose-50 rounded-xl px-3 py-2 border border-rose-100">⚠ {error}</div>
        )}

        {finalCard && !generating && (
          <div className="space-y-2">
            <button onClick={download}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition">
              ⬇ Download Card
            </button>
            <button onClick={shareWhatsApp}
              className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-xl transition">
              💬 Download + Open WhatsApp
            </button>
            <button onClick={generate} disabled={generating}
              className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-xl transition">
              🔄 Regenerate
            </button>
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-100">
        {generating ? (
          <div className="text-center space-y-5">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 border-4 border-amber-200 rounded-full"/>
              <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin absolute inset-0"/>
            </div>
            <p className="text-gray-700 font-semibold">Generating your card…</p>
            <p className="text-gray-400 text-sm">Usually takes 10–20 seconds</p>
          </div>
        ) : finalCard ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Your Card</p>
            <img src={finalCard} alt="Wedding card" className="max-w-sm w-full rounded-2xl shadow-2xl"/>
            <p className="text-xs text-gray-400 text-center">AI border art · Large clear text · Proper spacing</p>
          </div>
        ) : (
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-6xl">🎨</div>
            <p className="text-gray-700 font-semibold">AI Border + Clean Text Panel</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              AI generates decorative border art. Your wedding details appear in a 50% transparent panel with large text and proper spacing between every element.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
