'use client';

import React, { useEffect, useState } from 'react';

type AgentRow = {
  id: string;
  name: string;
  parent_agent_id: string | null;
  level: number;
  default_commission: number;
  is_active: boolean;
  parent?: { id: string; name: string } | null;
};

export default function AgentsHierarchyPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AgentRow | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/agents/hierarchy/list');
      const json = await res.json();
      setAgents(json.items || []);
      setLoading(false);
    };
    load();
  }, []);

  const startEdit = (a: AgentRow) => setEditing({ ...a });

  const handleChange = (field: keyof AgentRow, value: any) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  };

  const save = async () => {
    if (!editing) return;
    const res = await fetch('/api/agents/hierarchy/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || 'Update failed');
      return;
    }
    const saved = json.agent as AgentRow;
    setAgents((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Multi-Agent Hierarchy</h1>
        <p className="text-sm text-muted-foreground">
          Master agent → sub-agent → sub-sub agent structure with default commission.
        </p>
      </div>

      {editing && (
        <div className="border rounded-xl bg-white p-4 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Edit agent: {editing.name}</div>
            <button
              onClick={() => setEditing(null)}
              className="text-muted-foreground"
            >
              Close
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="block mb-1">Level (1=master,2=sub,...)</label>
              <input
                type="number"
                className="border rounded-md w-full px-2 py-1"
                value={editing.level}
                onChange={(e) =>
                  handleChange('level', Number(e.target.value || 1))
                }
              />
            </div>
            <div>
              <label className="block mb-1">Default commission (%)</label>
              <input
                type="number"
                step="0.01"
                className="border rounded-md w-full px-2 py-1"
                value={editing.default_commission}
                onChange={(e) =>
                  handleChange(
                    'default_commission',
                    Number(e.target.value || 0)
                  )
                }
              />
            </div>
            <div>
              <label className="block mb-1">Parent agent ID</label>
              <input
                className="border rounded-md w-full px-2 py-1"
                value={editing.parent_agent_id || ''}
                onChange={(e) =>
                  handleChange(
                    'parent_agent_id',
                    e.target.value ? e.target.value : null
                  )
                }
              />
              <div className="text-[10px] text-muted-foreground mt-1">
                Future: dropdown of agents. Abhi ke liye raw ID.
              </div>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <label className="text-xs">Active</label>
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
              />
            </div>
          </div>

          <button
            onClick={save}
            className="rounded-md bg-black text-white text-xs font-semibold px-4 py-2"
          >
            Save
          </button>
        </div>
      )}

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="border-b px-4 py-3 text-sm font-semibold">Agents</div>
        {loading ? (
          <div className="p-4 text-sm">Loading...</div>
        ) : agents.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No agents yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Name</Th>
                  <Th>Level</Th>
                  <Th>Parent</Th>
                  <Th>Default commission</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-t">
                    <Td>{a.name}</Td>
                    <Td>{a.level}</Td>
                    <Td>{a.parent?.name || '—'}</Td>
                    <Td>{a.default_commission}%</Td>
                    <Td>{a.is_active ? 'Active' : 'Blocked'}</Td>
                    <Td>
                      <button
                        onClick={() => startEdit(a)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 whitespace-nowrap">{children}</td>;
}
