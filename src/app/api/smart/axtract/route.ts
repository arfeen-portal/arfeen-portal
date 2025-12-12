import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Safely extract plain text from Responses API output items
 * (works even if first item is a tool call etc.)
 */
function extractTextFromOutput(output: any[] | undefined): string {
  if (!Array.isArray(output)) return "";

  for (const item of output) {
    // Most common: { type: "message", content: [{ type: "output_text", text: "..." }]}
    if (item?.type === "message" && Array.isArray(item?.content)) {
      const textPart =
        item.content.find((c: any) => c?.type === "output_text" && typeof c?.text === "string") ||
        item.content.find((c: any) => c?.type === "text" && typeof c?.text === "string");

      if (textPart?.text) return String(textPart.text);
    }
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept a few possible keys so frontend break na ho
    const inputText =
      body?.text ??
      body?.input ??
      body?.query ??
      body?.prompt ??
      "";

    if (!inputText || typeof inputText !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' in request body." },
        { status: 400 }
      );
    }

    const result = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are an extraction engine. If user provides unstructured text, extract key fields. " +
            "Return JSON only if it is clearly structured; otherwise return a short clean summary string.",
        },
        { role: "user", content: inputText },
      ],
    });

    // ✅ This is the supported convenience field (no .parsed property)
    const outputText =
      (result as any).output_text ??
      extractTextFromOutput((result as any).output) ??
      "";

    // If AI returned JSON string, parse it; otherwise return plain text
    let data: any = outputText;
    try {
      data = JSON.parse(outputText);
    } catch {
      // keep as string
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error("AI extract error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
