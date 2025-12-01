import { NextRequest, NextResponse } from "next/server";
import { withBugCapture } from "@/lib/withBugCapture";
import { createSupabaseServerClient } from "@/lib/supabase";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini"; // fast + cheap; switch if you prefer

async function suggest(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { bugId } = await req.json();

  // fetch the bug row
  const { data: bug } = await supabase
    .from("bug_events")
    .select("*")
    .eq("id", bugId)
    .single();

  if (!bug) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // call OpenAI
  const prompt = `
You are an expert Next.js + Supabase engineer.
Bug summary:
- Route: ${bug.route}
- Source: ${bug.source}
- Message: ${bug.message}
- Stack (may be partial):
${bug.stack ?? ""}

Task:
1) Explain likely root cause in 2-3 bullets.
2) Provide a minimal code fix in TypeScript for this repo structure (Next.js App Router, Supabase SSR).
3) If it's an import path problem, suggest the exact relative path fix.
Return in JSON with keys "summary" and "code".
  `.trim();

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  const json = await res.json();
  const content =
    json?.choices?.[0]?.message?.content ??
    "No suggestion generated. Check API key/usage.";

  // naive parse: try splitting summary/code
  let suggestion = content;
  let suggestion_code = "";
  const codeMatch = content.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  if (codeMatch) suggestion_code = codeMatch[1];

  await supabase
    .from("bug_events")
    .update({ suggestion, suggestion_code, status: "triaged" })
    .eq("id", bugId);

  return NextResponse.json({ ok: true, suggestion, suggestion_code });
}

export const POST = withBugCapture(suggest, {
  route: "/api/bug-ai-suggest",
  source: "api",
});
