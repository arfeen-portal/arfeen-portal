"use client";

import { useEffect, useState } from "react";
import { Brain, Sparkles } from "lucide-react";

export default function KhurakiAiLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  async function load() {
    const data = await fetch("/api/hotels/khuraki/ai-logs", {
      cache: "no-store",
    }).then((r) => r.json());

    if (data.ok) setLogs(data.logs || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-6">
          <h1 className="text-3xl font-black">Khuraki AI Logs</h1>
          <p className="mt-2 text-slate-300">
            System ke AI alerts, risks, recommendations aur action-required logs.
          </p>
        </div>

        <div className="space-y-3">
          {logs.map((l) => (
            <div key={l.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex gap-3">
                {l.action_required ? <Sparkles className="text-amber-300" /> : <Brain className="text-emerald-300" />}
                <div>
                  <div className="font-bold">{l.title}</div>
                  <div className="text-sm text-slate-400">{l.log_type} · Score {l.score || 0}</div>
                  <p className="mt-2 text-slate-300">{l.detail}</p>
                </div>
              </div>
            </div>
          ))}

          {!logs.length && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-slate-400">
              No AI logs found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}