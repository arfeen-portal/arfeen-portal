import { NextResponse } from "next/server";
import OpenAI from "openai";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "OpenAI not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const input =
      body?.text ?? body?.input ?? body?.prompt ?? body?.query ?? null;

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing text in request body" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input,
      max_output_tokens: 500
    });

    let extracted = "";
    const output = (response as any).output;

    if (Array.isArray(output)) {
      for (const item of output) {
        if (item?.type === "message" && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part?.type === "output_text") {
              extracted = String(part.text || "");
              break;
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true, data: extracted });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
