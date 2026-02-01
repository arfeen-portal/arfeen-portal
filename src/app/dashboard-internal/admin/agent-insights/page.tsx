"use client";

import { useEffect, useState } from "react";

type Agent = {
  id: string;
  name: string;
};

type Insights = {
  kpi: {
    total_bookings: number;
    confirmed_bookings: number;
    cancelled_bookings: number;
    total_revenue: number;
    total_profit: number;
  };
  conversionRate: number;
  suggestions: string[];
};

export default function AgentInsightsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAgents() {
      const res = await fetch("/api/admin/agents");
      const json = await res.json();
      setAgents(json.items ?? []);
    }
    loadAgents();
  }, []);

  async function loadInsights(agentId: string) {
    setLoading(true);
    setInsights(null);
    const res = await fetch(`/api/ai/agent-insights?agentId=${agentId}`);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const json = await res.json();
    setInsights(json);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          AI-style suggestions & agent insights
        </h1>
        <p className="text-sm text-muted-foreground">
          Select an agent to view KPIs and recommended actions.
        </p>
      </div>

      <div className="flex gap-3 items-center">
        <select
          className="border rounded-md px-2 py-1 text-sm"
          value={selected}
          onChange={(e) => {
            const id = e.target.value;
            setSelected(id);
            if (id) loadInsights(id);
          }}
        >
          <option value="">Select agent…</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {loading && (
          <span className="text-xs text-muted-foreground">Loading…</span>
        )}
      </div>

      {insights && (
        <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
          <div className="border rounded-2xl p-4 text-sm space-y-2">
            <div className="font-medium mb-2">KPIs</div>
            <div>Total bookings: {insights.kpi.total_bookings}</div>
            <div>Confirmed: {insights.kpi.confirmed_bookings}</div>
            <div>Cancelled: {insights.kpi.cancelled_bookings}</div>
            <div>
              Conversion: {insights.conversionRate.toFixed(1)}
              %
            </div>
            <div>
              Revenue: SAR {insights.kpi.total_revenue?.toLocaleString()}
            </div>
            <div>
              Profit: SAR {insights.kpi.total_profit?.toLocaleString()}
            </div>
          </div>
          <div className="border rounded-2xl p-4 text-sm space-y-2">
            <div className="font-medium mb-2">Suggestions</div>
            {insights.suggestions.length === 0 && (
              <div className="text-xs text-muted-foreground">
                No special suggestions. This agent is performing normally.
              </div>
            )}
            {insights.suggestions.map((s, i) => (
              <div
                key={i}
                className="border rounded-xl px-3 py-2 bg-muted/40 text-xs"
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
