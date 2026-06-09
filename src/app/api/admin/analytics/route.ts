import { jsonFail, jsonOk, getAdminClientOrFail } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getAdminClientOrFail();
  if (!supabase) return jsonFail("Supabase admin client missing", 500);

  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [logs, anomalies, themes, domains, tests] = await Promise.all([
    supabase.from("system_logs").select("id,level,created_at").gte("created_at", since7),
    supabase.from("ai_log_anomalies").select("id,severity,status,created_at"),
    supabase.from("portal_themes").select("id,is_active"),
    supabase.from("portal_domain_mappings").select("id,status"),
    supabase.from("integration_api_tests").select("id,last_status,last_latency_ms,tested_at"),
  ]);

  if (logs.error) return jsonFail(logs.error.message, 500);
  if (anomalies.error) return jsonFail(anomalies.error.message, 500);
  if (themes.error) return jsonFail(themes.error.message, 500);
  if (domains.error) return jsonFail(domains.error.message, 500);
  if (tests.error) return jsonFail(tests.error.message, 500);

  const logRows = logs.data || [];
  const testRows = tests.data || [];

  return jsonOk({
    stats: {
      logs_7d: logRows.length,
      errors_7d: logRows.filter((x) => ["error", "critical"].includes(String(x.level))).length,
      open_anomalies: (anomalies.data || []).filter((x) => x.status === "open").length,
      active_themes: (themes.data || []).filter((x) => x.is_active).length,
      mapped_domains: domains.data?.length || 0,
      avg_latency_ms:
        testRows.length > 0
          ? Math.round(
              testRows.reduce((s, x) => s + Number(x.last_latency_ms || 0), 0) /
                testRows.length
            )
          : 0,
    },
    recentTests: testRows.slice(0, 10),
    anomalies: anomalies.data || [],
  });
}