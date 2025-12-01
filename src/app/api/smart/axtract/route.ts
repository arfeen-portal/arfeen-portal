import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No ticket uploaded" }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await openai.responses.parse({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: "Extract passenger, from, to, flight number, date, time.",
        },
      ],
      files: [new File([buffer], file.name)],
      schema: {
        type: "object",
        properties: {
          passenger: { type: "string" },
          from: { type: "string" },
          to: { type: "string" },
          flight: { type: "string" },
          date: { type: "string" },
          time: { type: "string" },
        },
      },
    });

    return NextResponse.json(result.output[0].parsed);
  } catch (e: any) {
    console.error("AI extract error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
