import { jsonFail, jsonOk, getAdminClientOrFail } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getAdminClientOrFail();
  if (!supabase) return jsonFail("Supabase admin client missing", 500);

  const { data, error } = await supabase
    .from("ai_log_anomalies")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return jsonFail(error.message, 500);
  return jsonOk({ anomalies: data || [] });
}

export async function POST() {
  const supabase = getAdminClientOrFail();
  if (!supabase) return jsonFail("Supabase admin client missing", 500);

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();

  const { data: logs, error } = await supabase
    .from("system_logs")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return jsonFail(error.message, 500);

  const errorLogs = (logs || []).filter((l) =>
    ["error", "critical", "warning"].includes(String(l.level).toLowerCase())
  );

  const grouped = new Map<string, any[]>();

  for (const log of errorLogs) {
    const key = `${log.source || "unknown"}:${log.event || "unknown"}`;
    grouped.set(key, [...(grouped.get(key) || []), log]);
  }

  const anomalies = Array.from(grouped.entries())
    .filter(([, items]) => items.length >= 3)
    .map(([key, items]) => ({
      tenant_id: items[0]?.tenant_id || null,
      severity: items.length > 10 ? "high" : "medium",
      anomaly_type: "repeated_error_pattern",
      title: `Repeated issue detected: ${key}`,
      description: `${items.length} similar logs found in the last 24 hours.`,
      score: Math.min(100, items.length * 10),
      related_log_ids: items.map((x) => x.id),
      metadata: {
        source: items[0]?.source,
        event: items[0]?.event,
        sample_message: items[0]?.message,
      },
      status: "open",
    }));

  if (anomalies.length) {
    await supabase.from("ai_log_anomalies").insert(anomalies);
  }

  return jsonOk({ created: anomalies.length, anomalies });
}