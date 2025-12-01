// src/lib/bugLogger.ts
import { createSupabaseServerClient } from "./supabase";

export type BugPayload = {
  severity?: "error" | "warning" | "info";
  source: "client" | "server" | "api" | "edge";
  route?: string;
  message?: string;
  stack?: string;
  meta?: Record<string, any>;
};

export async function logBug(payload: BugPayload) {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("bug_events").insert({
      severity: payload.severity ?? "error",
      source: payload.source,
      route: payload.route ?? "",
      message: payload.message ?? "",
      stack: payload.stack ?? "",
      meta: payload.meta ?? {},
    });
    if (error) console.error("logBug insert failed:", error);
  } catch (e) {
    console.error("logBug failed:", e);
  }
}
