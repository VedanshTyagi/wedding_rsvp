import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) return NextResponse.json({ error: "No prompt" }, { status: 400 });

    const seed = Math.round(Date.now() + Math.random() * 9999);
    const url  = `https://enter.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=1024&nologo=true&seed=${seed}&nofeed=true`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/*,*/*",
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Pollinations error:", text.slice(0, 300));
      return NextResponse.json({ error: "Generation failed" }, { status: 500 });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return NextResponse.json({ image: `data:${contentType};base64,${base64}` });

  } catch (error) {
    console.error("Image route error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
