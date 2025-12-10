'use client';

import { useState } from 'react';

type PlannerPlan = {
  summary: {
    nights: number;
    totalBudget: number;
    perNightBudget: number;
    hotelCategory: string;
    transport: string;
  };
  recommendedHotels: any[];
  transportSuggestion: any;
  ziyaratPlan: any[];
};

export default function PublicAiUmrahPlannerPage() {
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [budget, setBudget] = useState<number | ''>('');
  const [plan, setPlan] = useState<PlannerPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleGenerate() {
    setError(null);
    setPlan(null);
    setSubmitted(false);

    if (!checkin || !checkout || !budget) {
      setError('Please fill dates and budget.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: { checkin, checkout },
          budget: Number(budget),
          cityPreference: 'near_haram',
          groupType: 'family'
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      setPlan(data.plan);
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitLead() {
    if (!plan) return;
    if (!formName || !formPhone) {
      setError('Name and phone required.');
      return;
    }
    setError(null);

    // same booking API but source = 'public_landing'
    await fetch('/api/ai/plan/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan,
        customer: {
          fullName: formName,
          phone: formPhone
        },
        source: 'public_landing'
      })
    });

    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold text-center mb-2">
          AI Umrah Planner – Free Plan in 30 Seconds
        </h1>
        <p className="text-center text-gray-600 text-sm mb-4">
          Dates + budget daalein, system aap ke liye Makkah &amp; Madinah ka
          smart plan banaye ga. Arfeen Travel team aap se WhatsApp par
          contact karegi.
        </p>

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                Check-in date
              </label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1 text-sm"
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Check-out date
              </label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1 text-sm"
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Total budget (SAR)
              </label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm"
                value={budget}
                onChange={(e) =>
                  setBudget(e.target.value ? Number(e.target.value) : '')
                }
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full md:w-auto px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
          >
            {loading ? 'Generating…' : 'Generate Free Plan'}
          </button>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          {plan && (
            <div className="mt-4 space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <div className="text-sm">
                  Nights: <b>{plan.summary.nights}</b> – Estimated total:{' '}
                  <b>{plan.summary.totalBudget} SAR</b>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Ye ek approximate plan hai – final price hotel availability
                  aur flights pe depend karega.
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-sm mb-2">
                    Hotels suggestion
                  </h3>
                  <ul className="space-y-2 text-xs">
                    {plan.recommendedHotels.map((h, i) => (
                      <li key={i} className="border rounded p-2">
                        <div className="font-medium">
                          {h.city} – {h.label}
                        </div>
                        {h.approxPricePerNight && (
                          <div>
                            Approx per night: {h.approxPricePerNight} SAR
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-sm mb-2">
                    Transport &amp; Ziyarat
                  </h3>
                  <p className="text-xs mb-2">
                    Transport: <b>{plan.transportSuggestion.type}</b>
                  </p>
                  <ul className="space-y-2 text-xs">
                    {plan.ziyaratPlan.map((z, i) => (
                      <li key={i} className="border rounded p-2">
                        <div className="font-medium">{z.city}</div>
                        <div>{z.when}</div>
                        <div>{z.note}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                <h3 className="font-semibold text-sm">
                  Get exact quote on WhatsApp
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <input
                    className="border rounded px-2 py-1"
                    placeholder="Full name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1"
                    placeholder="WhatsApp number with country code"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleSubmitLead}
                  className="px-4 py-2 rounded bg-green-600 text-white text-sm"
                >
                  Submit &amp; Get WhatsApp Call
                </button>
                {submitted && (
                  <p className="text-xs text-green-600">
                    Shukriya! Arfeen Travel ki team aap se WhatsApp par contact
                    karegi.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
