"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

export default function ImageCardPage({ params }) {
  const { weddingId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId    = searchParams.get("guestId");
  const guestPhone = searchParams.get("phone");

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");

  const PRESETS = [
    "Rajasthani wedding invitation card, pink lotus flowers, teal background, gold Mughal arch panel in center, ornate floral border with green leaves and roses, Ganesha at top, cream inner panel, professional print quality",
    "Royal Indian wedding card, deep crimson red background, gold peacock feather border, ivory center panel with ornate arch, marigold flowers, traditional Rajputana palace style",
    "South Indian wedding invitation, banana leaf and mango leaf border, green and gold palette, temple gopuram arch at top, white jasmine flowers, Kerala traditional style",
    "Mughal garden wedding card, midnight blue background, silver arabesque border, pointed arch center panel, white rose motifs, moonlit garden atmosphere, elegant and regal",
    "Punjabi wedding invitation, bright fuchsia pink background, phulkari geometric embroidery border, yellow marigold flowers, dhol and kalgi motifs, festive and vibrant",
    "Luxury minimal Indian wedding card, pure black background, gold hairline geometric border, art deco style, single lotus in gold, sophisticated and modern",
  ];

  async function generate() {
    if (!prompt.trim()) { setError("Please enter a prompt."); return; }
    setGenerating(true); setError(""); setImage(null);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImage(data.image);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  function download() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `wedding-card-${Date.now()}.jpg`;
    a.click();
  }
  function shareWhatsApp() {
    const msg = `You're invited! 🎊\n\nPlease find your wedding invitation card attached.\n\nWith love & blessings 🌸`;
    const phone = guestPhone?.replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^0/, "91");
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }
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
            Powered by Stability AI — generates a real illustrated invitation image from your prompt
          </p>
        </div>

        {/* Preset prompts */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Inspiration Presets — click to use
          </p>
          <div className="flex flex-col gap-2">
            {PRESETS.map((p, i) => (
              <button key={i}
                onClick={() => setPrompt(p)}
                className={`text-xs px-3 py-2 border rounded-lg text-left transition
                  ${prompt === p
                    ? "border-amber-400 bg-amber-50 text-amber-800"
                    : "border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-600"}`}>
                {p.split(",")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">
            Your prompt <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={6}
            placeholder="Describe exactly what you want — colours, flowers, border style, region, mood…

e.g. South Indian wedding card with banana leaf pillars on sides, pink lotus at top, cream arch panel in center, gold kolam border, green and gold palette"
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm
              focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
          />
          <p className="text-xs text-gray-400 leading-relaxed">
            The more specific your prompt, the better the output. Include: colours, flowers, border style, region, arch type, mood.
          </p>
        </div>

        <button onClick={generate} disabled={generating || !prompt.trim()}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600
            disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
            text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2">
          {generating ? (
            <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>Generating image…</>
          ) : "✨ Generate Card Image"}
        </button>

        {error && (
          <div className="text-xs text-rose-600 bg-rose-50 rounded-xl px-3 py-2 border border-rose-100">
            ⚠ {error}
          </div>
        )}

        {image && !generating && (
          <div className="space-y-2">
            <button onClick={download}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white
                text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2">
              ⬇ Download Card
            </button>
            <button onClick={shareWhatsApp}
              className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white
                text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2">
              💬 Share on WhatsApp
            </button>
            <button onClick={generate} disabled={generating}
              className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50
                text-gray-600 text-xs font-semibold rounded-xl transition">
              🔄 Generate Another Variation
            </button>
          </div>
        )}

      </div>

      {/* RIGHT — Preview */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-100 min-h-screen">
        {generating ? (
          <div className="text-center space-y-5">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 border-4 border-amber-200 rounded-full"/>
              <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin absolute inset-0"/>
            </div>
            <div>
              <p className="text-gray-700 font-semibold">Generating your card…</p>
              <p className="text-gray-400 text-sm mt-1">Stability AI is painting your invitation</p>
              <p className="text-gray-400 text-xs mt-1">Usually takes 5-10 seconds</p>
            </div>
          </div>
        ) : image ? (
          <div className="flex flex-col items-center gap-5">
            <div className="text-center">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Generated Card</p>
              <p className="text-xs text-gray-400 mt-1">Download and use as your invitation background</p>
            </div>
            <img
              src={image}
              alt="Generated wedding card"
              className="max-w-xs w-full rounded-2xl shadow-2xl"
            />
            <p className="text-xs text-gray-400 text-center max-w-xs">
              Not happy? Edit your prompt on the left and click Regenerate for a new variation.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-6xl">🎨</div>
            <p className="text-gray-700 font-semibold">AI Image Card Generator</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              Type exactly what you want — Stability AI will generate a real illustrated wedding invitation card image based purely on your description.
            </p>
            <div className="text-xs text-gray-400 bg-white rounded-xl p-4 text-left space-y-1 border border-gray-100">
              <p className="font-semibold text-gray-600 mb-2">Good prompt example:</p>
              <p className="italic">"Rajasthani wedding invitation, pink lotus flowers, teal background, gold Mughal arch panel, ornate floral border, Ganesha at top, cream inner panel, professional print quality, 9:16 portrait"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}