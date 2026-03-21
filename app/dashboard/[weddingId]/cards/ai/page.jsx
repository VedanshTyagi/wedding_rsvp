"use client";

import { useState, use, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── CARD THEMES ──────────────────────────────────────────────────────────────
const THEMES = {
  rajasthani: {
    label: "Rajasthani Floral",
    bg: "#1a6b6b",
    panel: "#fdf6e3",
    panelBorder: "#c9963a",
    textDark: "#2c1810",
    textGold: "#c9963a",
    textMuted: "#5a3a2a",
    accentFlower: "#e8556a",
    accentLeaf: "#c9963a",
    font: "'Cinzel', serif",
    bodyFont: "'Cormorant Garamond', serif",
    archStyle: "scallop",
  },
  royal: {
    label: "Royal Crimson",
    bg: "#3d0b0b",
    panel: "#fdf0e0",
    panelBorder: "#c9963a",
    textDark: "#2c1810",
    textGold: "#c9963a",
    textMuted: "#5a3a2a",
    accentFlower: "#c9963a",
    accentLeaf: "#8b1a1a",
    font: "'Playfair Display', serif",
    bodyFont: "'Cormorant Garamond', serif",
    archStyle: "pointed",
  },
  mughal: {
    label: "Mughal Garden",
    bg: "#0d1a35",
    panel: "#f0f4ff",
    panelBorder: "#9b72cf",
    textDark: "#0d1a35",
    textGold: "#9b72cf",
    textMuted: "#3a4a6a",
    accentFlower: "#9b72cf",
    accentLeaf: "#c9963a",
    font: "'Cinzel', serif",
    bodyFont: "'Cormorant Garamond', serif",
    archStyle: "pointed",
  },
  south: {
    label: "South Indian",
    bg: "#0a1f0a",
    panel: "#fffdf0",
    panelBorder: "#c9963a",
    textDark: "#1a1200",
    textGold: "#c9963a",
    textMuted: "#3a4a2a",
    accentFlower: "#e8890c",
    accentLeaf: "#2d6a2d",
    font: "'Cormorant Garamond', serif",
    bodyFont: "'Cormorant Garamond', serif",
    archStyle: "round",
  },
  punjabi: {
    label: "Punjabi Festive",
    bg: "#4a0a2a",
    panel: "#fff5f8",
    panelBorder: "#e8556a",
    textDark: "#2c0a18",
    textGold: "#e8556a",
    textMuted: "#6a2a3a",
    accentFlower: "#ffd1e8",
    accentLeaf: "#c9963a",
    font: "'Playfair Display', serif",
    bodyFont: "'Cormorant Garamond', serif",
    archStyle: "scallop",
  },
  luxury: {
    label: "Black Luxury",
    bg: "#0a0a0a",
    panel: "#1a1a1a",
    panelBorder: "#d4af37",
    textDark: "#f5f0e0",
    textGold: "#d4af37",
    textMuted: "#a09070",
    accentFlower: "#d4af37",
    accentLeaf: "#d4af37",
    font: "'Cinzel', serif",
    bodyFont: "'Cormorant Garamond', serif",
    archStyle: "pointed",
  },
  floral: {
    label: "Pastel Floral",
    bg: "#f5e6f0",
    panel: "#fff8fc",
    panelBorder: "#d4607a",
    textDark: "#3a1020",
    textGold: "#d4607a",
    textMuted: "#7a4a5a",
    accentFlower: "#d4607a",
    accentLeaf: "#6a9a5a",
    font: "'Playfair Display', serif",
    bodyFont: "'Cormorant Garamond', serif",
    archStyle: "scallop",
  },
  marigold: {
    label: "Marigold Sunset",
    bg: "#3d2000",
    panel: "#fff8e8",
    panelBorder: "#e8890c",
    textDark: "#2c1400",
    textGold: "#e8890c",
    textMuted: "#5a3a10",
    accentFlower: "#e85a0c",
    accentLeaf: "#c9963a",
    font: "'Cormorant Garamond', serif",
    bodyFont: "'Cormorant Garamond', serif",
    archStyle: "round",
  },
};

// ─── SVG CARD RENDERER ────────────────────────────────────────────────────────
function WeddingCard({ theme, data, custom, motifs, nameSize, lineGap }) {
  const T = THEMES[theme] || THEMES.rajasthani;
  const W = 560, H = 780;
  const archTop = 80, archLeft = 55, archRight = W - 55;
  const archWidth = archRight - archLeft;
  const archHeight = H - archTop - 40;
  const panelPad = 40;

  // Arch path based on style
  function archPath() {
    const x = archLeft, y = archTop, w = archWidth, h = archHeight;
    const cx = x + w / 2;

    if (T.archStyle === "scallop") {
      const scallops = 7;
      const sw = w / scallops;
      const sr = sw / 2;
      let d = `M${x},${y + h} L${x},${y + 60}`;
      // Left side scallops going up
      d += ` Q${x},${y + 20} ${cx - 10},${y + 5}`;
      // Top scalloped arch
      for (let i = 0; i < scallops; i++) {
        const sx = x + i * sw;
        d += ` Q${sx + sr / 2},${y - sr * 0.6} ${sx + sr},${y}`;
        if (i < scallops - 1) d += ` Q${sx + sr * 1.5},${y - sr * 0.6}`;
      }
      d += ` Q${archRight},${y + 20} ${archRight},${y + 60} L${archRight},${y + h} Z`;
      return d;
    }

    if (T.archStyle === "pointed") {
      return `M${x},${y+h} L${x},${y+80} Q${x},${y+20} ${cx},${y} Q${archRight},${y+20} ${archRight},${y+80} L${archRight},${y+h} Z`;
    }

    // round
    return `M${x},${y+h} L${x},${y+80} Q${x},${y} ${cx},${y} Q${archRight},${y} ${archRight},${y+80} L${archRight},${y+h} Z`;
  }

  // Scallop border path (slightly larger)
  function archBorderPath() {
    const bx = archLeft - 6, by = archTop - 6;
    const bw = archWidth + 12, bh = archHeight + 6;
    const cx = archLeft + archWidth / 2;

    if (T.archStyle === "scallop") {
      const scallops = 7;
      const sw = bw / scallops;
      const sr = sw / 2;
      let d = `M${bx},${by + bh} L${bx},${by + 60}`;
      d += ` Q${bx},${by + 14} ${cx - 10},${by - 2}`;
      for (let i = 0; i < scallops; i++) {
        const sx = bx + i * sw;
        d += ` Q${sx + sr / 2},${by - sr * 0.7} ${sx + sr},${by}`;
        if (i < scallops - 1) d += ` Q${sx + sr * 1.5},${by - sr * 0.7}`;
      }
      d += ` Q${bx + bw},${by + 14} ${bx + bw},${by + 60} L${bx + bw},${by + bh} Z`;
      return d;
    }

    if (T.archStyle === "pointed") {
      return `M${bx},${by+bh} L${bx},${by+80} Q${bx},${by+8} ${cx},${by-4} Q${bx+bw},${by+8} ${bx+bw},${by+80} L${bx+bw},${by+bh} Z`;
    }

    return `M${bx},${by+bh} L${bx},${by+80} Q${bx},${by-4} ${cx},${by-4} Q${bx+bw},${by-4} ${bx+bw},${by+80} L${bx+bw},${by+bh} Z`;
  }

  const cx = W / 2;
  const contentTop = archTop + 90;
  const fn = T.font;
  const bf = T.bodyFont;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", maxWidth: "560px", borderRadius: "14px", display: "block", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="cardClip"><rect x="0" y="0" width={W} height={H} rx="14"/></clipPath>
        <clipPath id="archClip"><path d={archPath()}/></clipPath>
      </defs>

      <g clipPath="url(#cardClip)">

        {/* Background */}
        <rect x="0" y="0" width={W} height={H} fill={T.bg}/>

        {/* ── FLORAL BACKGROUND DECORATIONS ── */}

        {/* Large lotus top-left */}
        <g transform="translate(30, 30)" opacity="0.9">
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => (
            <path key={i}
              d={`M0,0 Q${22*Math.cos((a-15)*Math.PI/180)},${22*Math.sin((a-15)*Math.PI/180)} ${38*Math.cos(a*Math.PI/180)},${38*Math.sin(a*Math.PI/180)} Q${22*Math.cos((a+15)*Math.PI/180)},${22*Math.sin((a+15)*Math.PI/180)} 0,0`}
              fill={i%3===0 ? T.accentFlower : T.accentLeaf} opacity={i%3===0?0.9:0.5}/>
          ))}
          <circle cx="0" cy="0" r="8" fill={T.accentFlower} opacity="0.8"/>
        </g>

        {/* Leaves top-left */}
        <g opacity="0.7">
          <path d="M0,60 Q40,40 55,10" fill="none" stroke={T.accentLeaf} strokeWidth="2"/>
          <path d="M0,60 Q20,45 20,20" fill={T.accentLeaf} opacity="0.4"/>
          <path d="M55,10 Q35,25 25,50" fill={T.accentLeaf} opacity="0.35"/>
          <path d="M10,100 Q50,70 60,40" fill="none" stroke={T.accentLeaf} strokeWidth="1.5"/>
          <path d="M10,100 Q30,80 35,55" fill={T.accentLeaf} opacity="0.3"/>
          <path d="M-5,140 Q35,110 50,80" fill="none" stroke={T.accentLeaf} strokeWidth="1.2"/>
        </g>

        {/* Large lotus top-right */}
        <g transform={`translate(${W-30}, 30)`} opacity="0.9">
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => (
            <path key={i}
              d={`M0,0 Q${22*Math.cos((a-15)*Math.PI/180)},${22*Math.sin((a-15)*Math.PI/180)} ${38*Math.cos(a*Math.PI/180)},${38*Math.sin(a*Math.PI/180)} Q${22*Math.cos((a+15)*Math.PI/180)},${22*Math.sin((a+15)*Math.PI/180)} 0,0`}
              fill={i%3===0 ? T.accentFlower : T.accentLeaf} opacity={i%3===0?0.9:0.5}/>
          ))}
          <circle cx="0" cy="0" r="8" fill={T.accentFlower} opacity="0.8"/>
        </g>

        {/* Leaves top-right */}
        <g opacity="0.7">
          <path d={`M${W},60 Q${W-40},40 ${W-55},10`} fill="none" stroke={T.accentLeaf} strokeWidth="2"/>
          <path d={`M${W},60 Q${W-20},45 ${W-20},20`} fill={T.accentLeaf} opacity="0.4"/>
          <path d={`M${W-55},10 Q${W-35},25 ${W-25},50`} fill={T.accentLeaf} opacity="0.35"/>
          <path d={`M${W-10},100 Q${W-50},70 ${W-60},40`} fill="none" stroke={T.accentLeaf} strokeWidth="1.5"/>
          <path d={`M${W-10},100 Q${W-30},80 ${W-35},55`} fill={T.accentLeaf} opacity="0.3"/>
          <path d={`M${W+5},140 Q${W-35},110 ${W-50},80`} fill="none" stroke={T.accentLeaf} strokeWidth="1.2"/>
        </g>

        {/* Left side flowers */}
        <g opacity="0.8">
          {[200, 350, 500, 650].map((y,i) => (
            <g key={i} transform={`translate(${i%2===0?15:25}, ${y})`}>
              {[0,72,144,216,288].map((a,j) => (
                <path key={j}
                  d={`M0,0 Q${12*Math.cos((a-20)*Math.PI/180)},${12*Math.sin((a-20)*Math.PI/180)} ${20*Math.cos(a*Math.PI/180)},${20*Math.sin(a*Math.PI/180)} Q${12*Math.cos((a+20)*Math.PI/180)},${12*Math.sin((a+20)*Math.PI/180)} 0,0`}
                  fill={j%2===0 ? T.accentFlower : T.accentLeaf} opacity="0.8"/>
              ))}
              <circle cx="0" cy="0" r="5" fill={T.accentFlower}/>
            </g>
          ))}
        </g>

        {/* Right side flowers */}
        <g opacity="0.8">
          {[200, 350, 500, 650].map((y,i) => (
            <g key={i} transform={`translate(${W-(i%2===0?15:25)}, ${y})`}>
              {[0,72,144,216,288].map((a,j) => (
                <path key={j}
                  d={`M0,0 Q${12*Math.cos((a-20)*Math.PI/180)},${12*Math.sin((a-20)*Math.PI/180)} ${20*Math.cos(a*Math.PI/180)},${20*Math.sin(a*Math.PI/180)} Q${12*Math.cos((a+20)*Math.PI/180)},${12*Math.sin((a+20)*Math.PI/180)} 0,0`}
                  fill={j%2===0 ? T.accentFlower : T.accentLeaf} opacity="0.8"/>
              ))}
              <circle cx="0" cy="0" r="5" fill={T.accentFlower}/>
            </g>
          ))}
        </g>

        {/* Bottom lotus */}
        <g transform={`translate(${cx}, ${H-20})`} opacity="0.7">
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => (
            <path key={i}
              d={`M0,0 Q${18*Math.cos((a-15)*Math.PI/180)},${18*Math.sin((a-15)*Math.PI/180)} ${30*Math.cos(a*Math.PI/180)},${30*Math.sin(a*Math.PI/180)} Q${18*Math.cos((a+15)*Math.PI/180)},${18*Math.sin((a+15)*Math.PI/180)} 0,0`}
              fill={i%2===0 ? T.accentFlower : T.accentLeaf} opacity="0.6"/>
          ))}
        </g>

        {/* ── ARCH PANEL ── */}
        {/* Border shadow */}
        <path d={archBorderPath()} fill={T.panelBorder} opacity="0.5"/>
        {/* Panel fill */}
        <path d={archPath()} fill={T.panel}/>
        {/* Inner border line */}
        <path d={archPath()} fill="none" stroke={T.panelBorder} strokeWidth="2" opacity="0.8"/>

        {/* ── GANESHA at arch top ── */}
        <g transform={`translate(${cx}, ${archTop + 28})`} opacity="0.85">
          {/* Body */}
          <ellipse cx="0" cy="8" rx="14" ry="16" fill="none" stroke={T.textGold} strokeWidth="1.2"/>
          {/* Head */}
          <circle cx="0" cy="-6" r="10" fill="none" stroke={T.textGold} strokeWidth="1.2"/>
          {/* Trunk */}
          <path d="M-4,-2 Q-12,4 -8,14 Q-4,20 0,18" fill="none" stroke={T.textGold} strokeWidth="1.2"/>
          {/* Ears */}
          <ellipse cx="-14" cy="-6" rx="7" ry="9" fill="none" stroke={T.textGold} strokeWidth="1" opacity="0.7"/>
          <ellipse cx="14" cy="-6" rx="7" ry="9" fill="none" stroke={T.textGold} strokeWidth="1" opacity="0.7"/>
          {/* Crown */}
          <path d="M-8,-16 L-5,-22 L0,-18 L5,-22 L8,-16" fill="none" stroke={T.textGold} strokeWidth="1"/>
          {/* Tusk */}
          <path d="M6,-2 Q14,2 12,10" fill="none" stroke={T.textGold} strokeWidth="1.2"/>
          {/* Modak */}
          <circle cx="12" cy="12" r="4" fill="none" stroke={T.textGold} strokeWidth="0.8" opacity="0.7"/>
          {/* Halo */}
          <circle cx="0" cy="-6" r="14" fill="none" stroke={T.textGold} strokeWidth="0.5" opacity="0.4"/>
        </g>

        {/* ── SHLOKA ── */}
        {motifs.shloka && custom.shloka && (
          <text x={cx} y={archTop + 72} textAnchor="middle"
            fontFamily={bf} fontSize="13" fill={T.textGold} letterSpacing="2">
            {custom.shloka}
          </text>
        )}

        {/* Divider line under shloka */}
        <line x1={cx-50} y1={archTop+82} x2={cx+50} y2={archTop+82} stroke={T.panelBorder} strokeWidth="0.8" opacity="0.6"/>

        {/* ── PARENTS ── */}
        {motifs.parents && (data.bride_family || data.groom_family) && (() => {
          let y = archTop + 96;
          return (
            <g>
              {data.bride_family && (
                <text x={cx} y={y} textAnchor="middle" fontFamily={bf} fontSize="11" fill={T.textMuted} opacity="0.8">
                  {data.bride_family}
                </text>
              )}
              {data.groom_family && (
                <text x={cx} y={y+14} textAnchor="middle" fontFamily={bf} fontSize="11" fill={T.textMuted} opacity="0.8">
                  {data.groom_family}
                </text>
              )}
              <text x={cx} y={y+(data.bride_family&&data.groom_family?28:14)} textAnchor="middle"
                fontFamily={bf} fontSize="10" fill={T.textMuted} opacity="0.6" letterSpacing="1">
                joyfully invite you to celebrate
              </text>
            </g>
          );
        })()}

        {/* ── COUPLE NAMES ── */}
        {(() => {
          const hasParents = motifs.parents && (data.bride_family || data.groom_family);
          const namesY = hasParents ? archTop + 148 : archTop + 110;
          return (
            <g>
              <text x={cx} y={namesY} textAnchor="middle"
                fontFamily={fn} fontSize={nameSize} fill={T.textDark} fontWeight="bold" letterSpacing="2">
                {data.bride_name || "Bride"}
              </text>
              <text x={cx} y={namesY+20} textAnchor="middle"
                fontFamily={bf} fontSize="14" fill={T.textGold} fontStyle="italic">
                {custom.andWord || "weds"}
              </text>
              <text x={cx} y={namesY+20+nameSize} textAnchor="middle"
                fontFamily={fn} fontSize={nameSize} fill={T.textDark} fontWeight="bold" letterSpacing="2">
                {data.groom_name || "Groom"}
              </text>
            </g>
          );
        })()}

        {/* ── DECORATIVE DIVIDER ── */}
        {(() => {
          const hasParents = motifs.parents && (data.bride_family || data.groom_family);
          const divY = hasParents ? archTop + 148 + nameSize*2 + 35 : archTop + 110 + nameSize*2 + 35;
          return (
            <g>
              <line x1={cx-60} y1={divY} x2={cx-15} y2={divY} stroke={T.panelBorder} strokeWidth="0.8" opacity="0.6"/>
              <path d={`M${cx-8},${divY-5} L${cx},${divY+5} L${cx+8},${divY-5}`} fill="none" stroke={T.panelBorder} strokeWidth="1" opacity="0.7"/>
              <line x1={cx+15} y1={divY} x2={cx+60} y2={divY} stroke={T.panelBorder} strokeWidth="0.8" opacity="0.6"/>
            </g>
          );
        })()}

        {/* ── FUNCTIONS ── */}
        {(() => {
          const hasParents = motifs.parents && (data.bride_family || data.groom_family);
          let y = hasParents ? archTop + 148 + nameSize*2 + 55 : archTop + 110 + nameSize*2 + 55;
          return data.functions.map((fn, i) => {
            const blockY = y + i * (lineGap * 5 + 20);
            return (
              <g key={i}>
                {i > 0 && (
                  <g>
                    <circle cx={cx} cy={blockY - 10} r="2" fill={T.panelBorder} opacity="0.5"/>
                    <line x1={cx-30} y1={blockY-10} x2={cx-8} y2={blockY-10} stroke={T.panelBorder} strokeWidth="0.5" opacity="0.4"/>
                    <line x1={cx+8} y1={blockY-10} x2={cx+30} y2={blockY-10} stroke={T.panelBorder} strokeWidth="0.5" opacity="0.4"/>
                  </g>
                )}
                <text x={cx} y={blockY+8} textAnchor="middle"
                  fontFamily={fn} fontSize="18" fill={T.textDark} fontWeight="bold" letterSpacing="4">
                  {(fn.name||"").toUpperCase()}
                </text>
                {fn.function_date && (
                  <text x={cx} y={blockY+26} textAnchor="middle"
                    fontFamily={bf} fontSize="11" fill={T.textMuted} letterSpacing="1.5">
                    {fn.function_date?.toUpperCase()}
                  </text>
                )}
                {motifs.time && fn.start_time && (
                  <text x={cx} y={blockY+40} textAnchor="middle"
                    fontFamily={bf} fontSize="11" fill={T.textMuted} letterSpacing="1">
                    {fn.start_time?.toUpperCase()}
                  </text>
                )}
              </g>
            );
          });
        })()}

        {/* ── VENUE ── */}
        {data.venue && (() => {
          const hasParents = motifs.parents && (data.bride_family || data.groom_family);
          const fnCount = data.functions.length;
          const venueY = hasParents
            ? archTop + 148 + nameSize*2 + 55 + fnCount * (lineGap*5+20) + 10
            : archTop + 110 + nameSize*2 + 55 + fnCount * (lineGap*5+20) + 10;
          return (
            <g>
              <line x1={cx-40} y1={venueY} x2={cx+40} y2={venueY} stroke={T.panelBorder} strokeWidth="0.6" opacity="0.4"/>
              <text x={cx} y={venueY+14} textAnchor="middle"
                fontFamily={bf} fontSize="10" fill={T.textMuted} letterSpacing="2">
                AT
              </text>
              <text x={cx} y={venueY+28} textAnchor="middle"
                fontFamily={fn} fontSize="13" fill={T.textDark} letterSpacing="1" fontWeight="bold">
                {data.venue?.toUpperCase()}
              </text>
              {data.city && (
                <text x={cx} y={venueY+42} textAnchor="middle"
                  fontFamily={bf} fontSize="11" fill={T.textMuted}>
                  {data.city}
                </text>
              )}
            </g>
          );
        })()}

        {/* ── EXTRA LINE ── */}
        {custom.extraLine && (
          <text x={cx} y={H - 60} textAnchor="middle"
            fontFamily={bf} fontSize="11" fill={T.textGold} fontStyle="italic" opacity="0.8">
            {custom.extraLine}
          </text>
        )}

        {/* ── BOTTOM ORNAMENT ── */}
        <text x={cx} y={H - 35} textAnchor="middle" fontSize="16" fill={T.textGold} opacity="0.7">
          {custom.bottomOrnament || "❋ ✦ ❋"}
        </text>

      </g>
    </svg>
  );
}

// ─── STYLE → THEME MAP ────────────────────────────────────────────────────────
const STYLE_TO_THEME = {
  royal: "royal", floral: "floral", modern: "floral",
  temple: "marigold", south: "south", mughal: "mughal",
  bengali: "marigold", punjabi: "punjabi", luxury: "luxury",
  rajasthani: "rajasthani",
};

export default function AICardPage({ params }) {
  const { weddingId } = use(params);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();
  const cardRef      = useRef(null);

  const guestId = searchParams.get("guestId");
  const fnIds   = searchParams.get("fnIds")?.split(",").filter(Boolean) ?? [];

  const [guest,    setGuest]    = useState(null);
  const [guestFns, setGuestFns] = useState([]);
  const [wedding,  setWedding]  = useState({});
  const [loading,  setLoading]  = useState(true);

  const [vision,     setVision]     = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiDone,     setAiDone]     = useState(false);
  const [aiVision,   setAiVision]   = useState("");
  const [aiError,    setAiError]    = useState("");

  const [curTheme,    setCurTheme]    = useState("rajasthani");
  const [nameSize,    setNameSize]    = useState(22);
  const [lineGap,     setLineGap]     = useState(14);
  const [motifs, setMotifs] = useState({
    shloka:true, parents:true, time:true, diya:false,
  });
  const [custom, setCustom] = useState({
    andWord:"weds", bottomOrnament:"❋ ✦ ❋",
    shloka:"|| श्री गणेशाय नमः ||", extraLine:"",
  });

  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  useEffect(() => {
    async function load() {
      if (!guestId || !weddingId) return;
      try {
        setLoading(true);
        const [gr, wr, fr] = await Promise.all([
          supabase.from("guests").select("id, full_name, phone, email, group_tag").eq("id", guestId).single(),
          supabase.from("weddings").select("*").eq("id", weddingId).single(),
          supabase.from("wedding_functions").select("id, name, function_date, start_time, venue_detail")
            .in("id", fnIds.length > 0 ? fnIds : ["none"]),
        ]);
        if (gr.data) setGuest(gr.data);
        if (wr.data) setWedding(wr.data);
        if (fr.data) setGuestFns(fr.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [guestId, weddingId]);

  async function generateWithAI() {
    if (!vision.trim()) { setAiError("Please describe your card vision first."); return; }
    setGenerating(true); setAiError(""); setAiVision(""); setAiDone(false);

    const fnList = guestFns.map(fn =>
      `${fn.name}${fn.function_date ? " on "+fn.function_date : ""}${fn.start_time ? " at "+fn.start_time : ""}${fn.venue_detail ? " at "+fn.venue_detail : ""}`
    ).join("; ");

    const prompt = `You are a luxury Indian wedding invitation designer. The couple wants: "${vision.trim()}"

Wedding:
- Bride: ${wedding.bride_name || "Bride"} (Family: ${wedding.bride_family || "N/A"})
- Groom: ${wedding.groom_name || "Groom"} (Family: ${wedding.groom_family || "N/A"})
- Functions: ${fnList || "Wedding Ceremony"}
- Venue: ${wedding.venue || "N/A"}, ${wedding.city || ""}

Based on "${vision.trim()}", return ONLY this JSON object, no markdown, no backticks:
{
  "theme": "one of: rajasthani/royal/mughal/south/punjabi/luxury/floral/marigold",
  "shloka": "short Sanskrit blessing like: || श्री गणेशाय नमः || or regional equivalent",
  "andWord": "joining word: weds or & or ও or व matching the style",
  "bottomOrnament": "2-3 decorative symbols",
  "extraLine": "one short poetic closing line or empty string",
  "vision": "2 sentences describing how this illustrated card looks — mention the arch, flowers, colours specific to the vision: ${vision.trim()}"
}`;

    try {
      const res = await fetch("/api/ai/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const text = data.content?.[0]?.text ?? "";
      if (!text.trim()) throw new Error("AI returned empty response. Check your API key.");

      const cleaned = text.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI did not return valid JSON. Try again.");

      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.theme && THEMES[parsed.theme]) setCurTheme(parsed.theme);

      setCustom({
        andWord:        parsed.andWord        || "weds",
        bottomOrnament: parsed.bottomOrnament || "❋ ✦ ❋",
        shloka:         parsed.shloka         || "|| श्री गणेशाय नमः ||",
        extraLine:      parsed.extraLine      || "",
      });

      setAiVision(parsed.vision || `Card designed for: ${vision.trim()}`);
      setAiDone(true);

    } catch (e) {
      setAiError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function doExport(type) {
    if (!cardRef.current) return;
    setExporting(true); setExportMsg(`Preparing ${type}…`);
    try {
      // For SVG cards, serialize to canvas using an Image
      const svgEl = cardRef.current.querySelector("svg");
      if (!svgEl) throw new Error("No SVG found");

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const scale = type === "whatsapp" ? 1 : 3;
        const canvas = document.createElement("canvas");
        const W = svgEl.viewBox.baseVal.width * scale;
        const H = svgEl.viewBox.baseVal.height * scale;
        canvas.width  = type === "whatsapp" ? 1080 : W;
        canvas.height = type === "whatsapp" ? 1080 : H;
        const ctx = canvas.getContext("2d");

        if (type === "whatsapp") {
          ctx.fillStyle = THEMES[curTheme]?.bg || "#1a6b6b";
          ctx.fillRect(0, 0, 1080, 1080);
          const sc = Math.min(960 / W, 960 / H);
          ctx.drawImage(img, (1080 - W*sc)/2, (1080 - H*sc)/2, W*sc, H*sc);
        } else {
          ctx.drawImage(img, 0, 0, W, H);
        }

        URL.revokeObjectURL(url);
        const a = document.createElement("a");
        a.download = `invite-${(guest?.full_name||"card").replace(/\s/g,"")}-${type}.png`;
        a.href = canvas.toDataURL("image/png", 1.0);
        a.click();
        setExportMsg(type === "whatsapp" ? "WhatsApp 1080×1080 downloaded!" : "PNG downloaded!");
        setExporting(false);
        setTimeout(() => setExportMsg(""), 4000);
      };
      img.onerror = () => { throw new Error("SVG render failed"); };
      img.src = url;
    } catch(e) {
      setExportMsg("Export failed: "+e.message);
      setExporting(false);
    }
  }

  const cardData = {
    bride_name:   wedding.bride_name   || "Bride",
    groom_name:   wedding.groom_name   || "Groom",
    bride_family: wedding.bride_family || "",
    groom_family: wedding.groom_family || "",
    venue:        wedding.venue        || "",
    city:         wedding.city         || "",
    functions:    guestFns,
  };

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

        {/* LEFT */}
        <div className="w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-gray-100
          overflow-y-auto flex flex-col gap-5 p-5 lg:min-h-screen">

          <button onClick={()=>router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>

          <div>
            <h2 className="text-base font-bold text-gray-900">AI Card Generator</h2>
            <p className="text-xs text-gray-400 mt-1">
              For: <span className="font-semibold text-gray-600">{guest?.full_name||"Guest"}</span>
              <br/>Functions: {guestFns.map(f=>f.name).join(", ")}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">
                Describe your card vision <span className="text-rose-400">*</span>
              </label>
              <textarea value={vision} onChange={e=>setVision(e.target.value)} rows={4}
                placeholder="e.g. Rajasthani teal with pink lotus flowers, gold arch, Ganesha at top, for a Sangeet and Mehndi…"
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                  focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"/>
              <p className="text-xs text-gray-400">Mention colours, region, mood, event type</p>
            </div>
            <button onClick={generateWithAI} disabled={generating||!vision.trim()}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600
                disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
                text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2">
              {generating ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>Generating Card…</>
              ) : aiDone ? "✨ Regenerate" : "✨ Generate with AI"}
            </button>
            {aiError && (
              <div className="text-xs text-rose-600 bg-rose-50 rounded-xl px-3 py-2 border border-rose-100">⚠ {aiError}</div>
            )}
          </div>

          {aiDone && aiVision && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">✦ AI Design Vision</p>
              <p className="text-xs text-amber-800 leading-relaxed">{aiVision}</p>
            </div>
          )}

          {/* Theme picker — always visible */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Card Theme</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(THEMES).map(([key, t]) => (
                <button key={key} onClick={()=>setCurTheme(key)}
                  className={`py-2 px-2 rounded-lg border-2 text-xs transition
                    ${curTheme===key?"border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold":"border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fine tune */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fine-tune</p>
            <div className="space-y-2">
              {[["Name Size",nameSize,setNameSize,14,36],["Line Gap",lineGap,setLineGap,8,28]].map(([label,val,setter,min,max])=>(
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                  <input type="range" min={min} max={max} value={val} step="1"
                    onChange={e=>setter(+e.target.value)} className="flex-1 accent-indigo-600"/>
                  <span className="text-xs text-gray-500 w-5 text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Motifs */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Elements</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(motifs).map(([key,val])=>(
                <button key={key} onClick={()=>setMotifs(m=>({...m,[key]:!m[key]}))}
                  className={`text-xs px-2.5 py-1 rounded-full border transition capitalize
                    ${val?"border-indigo-400 bg-indigo-50 text-indigo-700":"border-gray-200 text-gray-400"}`}>
                  {key.replace(/([A-Z])/g," $1")}
                </button>
              ))}
            </div>
          </div>

          {/* Custom text */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Text</p>
            <div className="space-y-1.5">
              {[["shloka","Shloka"],["andWord","Joining Word"],["extraLine","Extra Line"],["bottomOrnament","Bottom Ornament"]].map(([key,label])=>(
                <div key={key} className="flex flex-col gap-0.5">
                  <label className="text-xs text-gray-400">{label}</label>
                  <input type="text" value={custom[key]}
                    onChange={e=>setCustom(c=>({...c,[key]:e.target.value}))}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-400 focus:outline-none"/>
                </div>
              ))}
            </div>
          </div>

          {/* Export */}
          <div className="space-y-2 pb-6">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={()=>doExport("png")} disabled={exporting}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50">
                🖼 PNG
              </button>
              <button onClick={()=>doExport("whatsapp")} disabled={exporting}
                className="py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50">
                💬 WhatsApp
              </button>
            </div>
            <button onClick={()=>router.push(`/dashboard/${weddingId}/cards/send?guestId=${guestId}&fnIds=${fnIds.join(",")}`)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition">
              📨 Send to {guest?.full_name?.split(" ")[0]||"Guest"}
            </button>
            {exportMsg && <p className="text-xs text-center text-indigo-600 bg-indigo-50 rounded-lg py-2 px-3">{exportMsg}</p>}
          </div>
        </div>

        {/* RIGHT — Card Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 bg-gray-100">
          <div className="text-center">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">
              {aiDone ? "AI Generated Card" : "Live Preview"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {aiDone ? "Customize using controls on the left" : "Choose a theme and generate with AI"}
            </p>
          </div>

          {/* THE CARD */}
          <div ref={cardRef} style={{width:"100%", maxWidth:"520px"}}>
            <WeddingCard
              theme={curTheme}
              data={cardData}
              custom={custom}
              motifs={motifs}
              nameSize={nameSize}
              lineGap={lineGap}
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-gray-500 justify-center">
            <span className="px-3 py-1.5 bg-white rounded-full border border-gray-200">{guest?.full_name}</span>
            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
              {THEMES[curTheme]?.label}
            </span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
              {guestFns.length} function{guestFns.length!==1?"s":""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
