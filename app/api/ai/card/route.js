import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) return NextResponse.json({ error: "No prompt" }, { status: 400 });
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: "GROQ_API_KEY missing in .env.local" }, { status: 500 });

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `You are a JSON API. Respond with ONLY a valid JSON object, no markdown, no backticks, no explanation.\n\n${prompt}`,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    console.log("[Groq response]:", JSON.stringify(data).slice(0, 400));

    const text = data.choices?.[0]?.message?.content ?? "";

    if (!text) {
      return NextResponse.json({ error: data.error?.message || "Empty response from Groq" }, { status: 500 });
    }

    return NextResponse.json({ content: [{ type: "text", text }] });

  } catch (error) {
    console.error("[AI card error]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}