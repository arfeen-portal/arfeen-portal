// src/app/api/bug-ai-suggest/route.ts
import { NextRequest, NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, context } = body as {
      description: string;
      context?: string;
    };

    if (!description) {
      return NextResponse.json(
        { error: "Missing bug description" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const prompt =
      `You are a senior Next.js + Supabase engineer helping debug a portal.\n\n` +
      `Bug description:\n${description}\n\n` +
      (context ? `Extra context:\n${context}\n\n` : "") +
      `Return:\n- Likely cause\n- Files/areas to check\n- Step-by-step fix\n- Any safety/performance notes.\n`;

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI error:", text);
      return NextResponse.json(
        { error: "OpenAI API error" },
        { status: 500 }
      );
    }

    const json = await response.json();
    const message = json.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ suggestion: message });
  } catch (error) {
    console.error("bug-ai-suggest error", error);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
