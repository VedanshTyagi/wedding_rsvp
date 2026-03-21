import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) return NextResponse.json({ error: "No prompt" }, { status: 400 });

    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "STABILITY_API_KEY not set in .env.local" }, { status: 500 });
    }

    const fullPrompt = `${prompt}, wedding invitation card, portrait format, highly detailed, professional quality, 4k`;

    console.log("Calling Stability AI...");

    const res = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        text_prompts: [
          { text: fullPrompt, weight: 1 },
          { text: "blurry, low quality, text, watermark, signature, ugly", weight: -1 },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30,
      }),
    });

    console.log("Status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("Stability error:", text.slice(0, 500));
      return NextResponse.json({ error: `Stability AI error: ${res.status} — ${text.slice(0, 200)}` }, { status: 500 });
    }

    const data = await res.json();
    const base64 = data.artifacts?.[0]?.base64;

    if (!base64) {
      return NextResponse.json({ error: "No image returned from Stability AI" }, { status: 500 });
    }

    return NextResponse.json({ image: `data:image/png;base64,${base64}` });

  } catch (error) {
    console.error("Image route error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
