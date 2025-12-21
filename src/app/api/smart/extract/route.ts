import { NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * Build-safe OpenAI client
 */
function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  return new OpenAI({
    apiKey: key,
  });
}

/**
 * Safely extract plain text from OpenAI response
 */
function extractTextFromOutput(output: any): string {
  if (!Array.isArray(output)) return "";

  for (const item of output) {
    if (item?.type === "message" && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (
          part?.type === "output_text" ||
          typeof part?.text === "string"
        ) {
          return String(part.text ?? "");
        }
      }
    }
  }

  return "";
}

export async function POST(req: Request) {
  const openai = getOpenAI();

  // ✅ build-time safety
  if (!openai) {
    return NextResponse.json(
      { ok: false, error: "OpenAI not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const inputText =
      body?.text ??
      body?.input ??
      body?.prompt ??
      body?.query ??
      null;

    if (!inputText || typeof inputText !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing text in request body" },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: inputText,
      max_output_tokens: 500,
      metadata: {
        purpose: "smart-extract",
      },
    });

    const extractedText = extractTextFromOutput(
      (response as any).output
    );

    return NextResponse.json({
      ok: true,
      data: extractedText || "",
    });
  } catch (err: any) {
    console.error("Smart extract error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
