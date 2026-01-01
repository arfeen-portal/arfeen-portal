// src/lib/bugLogger.ts
import { createSupabaseServerClient } from "./supabase";
export const dynamic = "force-dynamic";

export type BugPayload = {
  severity?: "error" | "warning" | "info";
  source?: "client" | "server" | "api" | "edge";
  route?: string;
  message: string;
  meta?: any;
};

export async function logBug(payload: BugPayload) {
  try {
    const supabase = createSupabaseServerClient();

    const row = {
      severity: payload.severity ?? "error",
      source: payload.source ?? "server",
      route: payload.route ?? "",
      message: payload.message ?? "",
      meta: payload.meta ?? null,
      created_at: new Date().toISOString(),
    };

    // ✅ Insert expects array in many typed setups; also cast to avoid 'never' issues
    const { error } = await (supabase as any)
      .from("bug_events")
      .insert([row]);

    if (error) {
      console.error("bug_events insert error:", error);
    }
  } catch (e) {
    console.error("logBug failed:", e);
  }
}
