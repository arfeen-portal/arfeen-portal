'use client';

import { useEffect, useState } from 'react';

type Agent = {
  id: string;
  name: string;
  email: string | null;
};

type Rule = {
  id?: number;
  agent_id: string;
  markup_percent: number;
  min_margin: number;
  max_discount_percent: number;
};

export default function AgentPricingRulesPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [rules, setRules] = useState<Record<string, Rule>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const agentsRes = await fetch('/api/admin/agents-simple'); // TODO: agar aapka agents list API alag hai to change karein
        const agentsData = await agentsRes.json();
        if (!agentsData.success) throw new Error(agentsData.error || 'Failed');
        setAgents(agentsData.agents);

        const rulesRes = await fetch('/api/admin/agent-pricing-rules');
        const rulesData = await rulesRes.json();
        if (!rulesData.success) throw new Error(rulesData.error || 'Failed');

        const map: Record<string, Rule> = {};
        for (const r of rulesData.rules) {
          map[r.agent_id] = r;
        }
        setRules(map);
      } catch (e: any) {
        setError(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/agent-pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: Object.values(rules) })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      setMessage('Rules saved successfully.');
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setSaving(false);
    }
  }

  function updateRule(agentId: string, patch: Partial<Rule>) {
    setRules((prev) => {
      const existing =
        prev[agentId] ||
        ({
          agent_id: agentId,
          markup_percent: 0,
          min_margin: 0,
          max_discount_percent: 20
        } as Rule);
      return {
        ...prev,
        [agentId]: { ...existing, ...patch }
      };
    });
  }

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold">
        Agent-wise Pricing Rules (Smart)
      </h1>
      <p className="text-sm text-gray-500">
        Yahan se har agent ke liye markup / min margin / max discount define
        karein, jise pricing AI automatically apply karega.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}

      <div className="bg-white rounded-lg p-4 shadow-sm overflow-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-2">Agent</th>
              <th className="text-left py-2 pr-2">Markup %</th>
              <th className="text-left py-2 pr-2">Min Margin (SAR)</th>
              <th className="text-left py-2 pr-2">Max Discount %</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => {
              const r = rules[a.id] || {
                agent_id: a.id,
                markup_percent: 0,
                min_margin: 0,
                max_discount_percent: 20
              };
              return (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-1 pr-2">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-gray-500">{a.email}</div>
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-24"
                      value={r.markup_percent}
                      onChange={(e) =>
                        updateRule(a.id, {
                          markup_percent: Number(e.target.value || 0)
                        })
                      }
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-24"
                      value={r.min_margin}
                      onChange={(e) =>
                        updateRule(a.id, {
                          min_margin: Number(e.target.value || 0)
                        })
                      }
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-24"
                      value={r.max_discount_percent}
                      onChange={(e) =>
                        updateRule(a.id, {
                          max_discount_percent: Number(
                            e.target.value || 0
                          )
                        })
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Rules'}
          </button>
        </div>
      </div>
    </div>
  );
}
