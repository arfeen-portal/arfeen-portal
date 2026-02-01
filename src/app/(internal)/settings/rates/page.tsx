'use client';

import React, { useEffect, useState } from 'react';

type RateRule = {
  id?: number;
  product_type: string;
  product_id: string | null;
  from_city_id: string | null;
  to_city_id: string | null;
  valid_from: string;
  valid_to: string | null;
  base_price: number;
  weekend_multiplier: number;
  peak_multiplier: number;
  min_pax: number;
  max_pax: number | null;
  agent_markup_percent: number;
  notes: string | null;
};

const emptyRule: RateRule = {
  product_type: 'transport',
  product_id: null,
  from_city_id: null,
  to_city_id: null,
  valid_from: new Date().toISOString().slice(0, 10),
  valid_to: null,
  base_price: 0,
  weekend_multiplier: 1,
  peak_multiplier: 1,
  min_pax: 1,
  max_pax: null,
  agent_markup_percent: 0,
  notes: null,
};

export default function RateSettingsPage() {
  const [rules, setRules] = useState<RateRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RateRule | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/settings/rates/list');
      const json = await res.json();
      setRules(json.items || []);
      setLoading(false);
    };
    load();
  }, []);

  const startNew = () => setEditing({ ...emptyRule });

  const startEdit = (r: RateRule) => setEditing({ ...r });

  const handleChange = (field: keyof RateRule, value: any) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await fetch('/api/settings/rates/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      alert(json.error || 'Save failed');
      return;
    }
    const saved = json.rule as RateRule;
    setRules((prev) => {
      const existing = prev.find((p) => p.id === saved.id);
      if (existing) {
        return prev.map((p) => (p.id === saved.id ? saved : p));
      }
      return [saved, ...prev];
    });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Rate Engine – Transport</h1>
          <p className="text-sm text-muted-foreground">
            Central rate rules for all transport bookings.
          </p>
        </div>
        <button
          onClick={startNew}
          className="rounded-md bg-black text-white text-xs font-semibold px-4 py-2"
        >
          New Rule
        </button>
      </div>

      {/* Form */}
      {editing && (
        <div className="border rounded-xl bg-white shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {editing.id ? 'Edit Rule' : 'New Rule'}
            </h2>
            <button
              onClick={() => setEditing(null)}
              className="text-xs text-muted-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block mb-1">Base price (SAR)</label>
              <input
                type="number"
                className="border rounded-md w-full px-2 py-1"
                value={editing.base_price}
                onChange={(e) =>
                  handleChange('base_price', Number(e.target.value || 0))
                }
              />
            </div>
            <div>
              <label className="block mb-1">Weekend multiplier</label>
              <input
                type="number"
                step="0.01"
                className="border rounded-md w-full px-2 py-1"
                value={editing.weekend_multiplier}
                onChange={(e) =>
                  handleChange('weekend_multiplier', Number(e.target.value || 1))
                }
              />
            </div>
            <div>
              <label className="block mb-1">Peak multiplier</label>
              <input
                type="number"
                step="0.01"
                className="border rounded-md w-full px-2 py-1"
                value={editing.peak_multiplier}
                onChange={(e) =>
                  handleChange('peak_multiplier', Number(e.target.value || 1))
                }
              />
            </div>
            <div>
              <label className="block mb-1">Min pax</label>
              <input
                type="number"
                className="border rounded-md w-full px-2 py-1"
                value={editing.min_pax}
                onChange={(e) =>
                  handleChange('min_pax', Number(e.target.value || 1))
                }
              />
            </div>
            <div>
              <label className="block mb-1">Max pax</label>
              <input
                type="number"
                className="border rounded-md w-full px-2 py-1"
                value={editing.max_pax ?? ''}
                onChange={(e) =>
                  handleChange(
                    'max_pax',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              />
            </div>
            <div>
              <label className="block mb-1">Agent markup (%)</label>
              <input
                type="number"
                step="0.01"
                className="border rounded-md w-full px-2 py-1"
                value={editing.agent_markup_percent}
                onChange={(e) =>
                  handleChange(
                    'agent_markup_percent',
                    Number(e.target.value || 0)
                  )
                }
              />
            </div>
            <div>
              <label className="block mb-1">Valid from</label>
              <input
                type="date"
                className="border rounded-md w-full px-2 py-1"
                value={editing.valid_from}
                onChange={(e) =>
                  handleChange('valid_from', e.target.value || emptyRule.valid_from)
                }
              />
            </div>
            <div>
              <label className="block mb-1">Valid to</label>
              <input
                type="date"
                className="border rounded-md w-full px-2 py-1"
                value={editing.valid_to || ''}
                onChange={(e) =>
                  handleChange('valid_to', e.target.value || null)
                }
              />
            </div>
            <div className="md:col-span-3">
              <label className="block mb-1">Notes</label>
              <textarea
                className="border rounded-md w-full px-2 py-1"
                rows={2}
                value={editing.notes || ''}
                onChange={(e) =>
                  handleChange('notes', e.target.value || null)
                }
              />
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-black text-white text-xs font-semibold px-4 py-2"
          >
            {saving ? 'Saving...' : 'Save Rule'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="border-b px-4 py-3 text-sm font-semibold">Rules</div>
        {loading ? (
          <div className="p-4 text-sm">Loading...</div>
        ) : rules.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No rate rules yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <Th>ID</Th>
                  <Th>Base</Th>
                  <Th>Weekend</Th>
                  <Th>Peak</Th>
                  <Th>Min/Max pax</Th>
                  <Th>Agent markup</Th>
                  <Th>Valid</Th>
                  <Th>Notes</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-t">
                    <Td>{r.id}</Td>
                    <Td>{r.base_price}</Td>
                    <Td>{r.weekend_multiplier}</Td>
                    <Td>{r.peak_multiplier}</Td>
                    <Td>
                      {r.min_pax} / {r.max_pax || '∞'}
                    </Td>
                    <Td>{r.agent_markup_percent}%</Td>
                    <Td>
                      {r.valid_from} → {r.valid_to || 'open'}
                    </Td>
                    <Td className="max-w-xs truncate">
                      {r.notes || '—'}
                    </Td>
                    <Td>
                      <button
                        onClick={() => startEdit(r)}
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

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide ${
        className || ''
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-3 py-2 whitespace-nowrap ${className || ''}`}>{children}</td>
  );
}
