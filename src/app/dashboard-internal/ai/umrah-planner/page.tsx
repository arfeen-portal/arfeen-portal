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

type BookResult = {
  bookingId: number;
  whatsappTemplate: string;
  message: string;
};

export default function AiUmrahPlannerPage() {
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [budget, setBudget] = useState<number | ''>('');
  const [cityPreference, setCityPreference] =
    useState<'near_haram' | 'budget' | 'vip' | ''>('');
  const [groupType, setGroupType] =
    useState<'solo' | 'family' | 'group' | ''>('family');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlannerPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // booking state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [bookLoading, setBookLoading] = useState(false);
  const [bookResult, setBookResult] = useState<BookResult | null>(null);

  async function handleGenerate() {
    setError(null);
    setPlan(null);
    setBookResult(null);

    if (!checkin || !checkout || !budget) {
      setError('Dates aur budget zaroori hain.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'customer',
          dates: { checkin, checkout },
          budget: Number(budget),
          cityPreference: cityPreference || 'near_haram',
          groupType: groupType || 'family'
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed');
      }
      setPlan(data.plan);
    } catch (e: any) {
      setError(e.message || 'Koi error aa gaya');
    } finally {
      setLoading(false);
    }
  }

  async function handleBook() {
    if (!plan) return;
    setError(null);
    setBookResult(null);

    if (!customerName || !customerPhone) {
      setError('Booking ke liye customer name aur phone required hain.');
      return;
    }

    setBookLoading(true);
    try {
      const res = await fetch('/api/ai/plan/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          customer: {
            fullName: customerName,
            phone: customerPhone,
            email: customerEmail || undefined
          },
          source: 'b2c'
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed');
      }

      setBookResult({
        bookingId: data.bookingId,
        whatsappTemplate: data.whatsappTemplate,
        message: data.message
      });
    } catch (e: any) {
      setError(e.message || 'Booking create karte waqt error aa gaya.');
    } finally {
      setBookLoading(false);
    }
  }

  function handleSendWhatsApp() {
    if (!bookResult || !customerPhone) return;
    const msg = encodeURIComponent(bookResult.whatsappTemplate);
    const phone = customerPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold mb-2">AI Umrah Planner</h1>
      <p className="text-sm text-gray-500">
        Dates, budget aur preferences daalein – system aap ke liye best
        combination suggest karega. Neeche se direct booking bhi create ho
        sakti hai.
      </p>

      {/* Step 1: Inputs */}
      <div className="grid gap-4 md:grid-cols-2 bg-white rounded-lg p-4 shadow-sm">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Check-in date</label>
          <input
            type="date"
            className="w-full border rounded px-2 py-1 text-sm"
            value={checkin}
            onChange={(e) => setCheckin(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Check-out date</label>
          <input
            type="date"
            className="w-full border rounded px-2 py-1 text-sm"
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
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

        <div className="space-y-2">
          <label className="block text-sm font-medium">Preference</label>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
            value={cityPreference}
            onChange={(e) => setCityPreference(e.target.value as any)}
          >
            <option value="">Select</option>
            <option value="near_haram">Near Haram / balanced</option>
            <option value="budget">Budget friendly</option>
            <option value="vip">VIP / Luxury</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Group type</label>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
            value={groupType}
            onChange={(e) => setGroupType(e.target.value as any)}
          >
            <option value="solo">Solo</option>
            <option value="family">Family</option>
            <option value="group">Group</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
      >
        {loading ? 'Generating…' : 'Generate Plan'}
      </button>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      {bookResult && (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-green-600">{bookResult.message}</p>
          <div className="flex gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="px-4 py-2 rounded bg-green-600 text-white text-sm"
            >
              📩 Send plan on WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Plan result + booking */}
      {plan && (
        <div className="space-y-4 mt-4">
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
            <h2 className="font-semibold text-lg mb-1">
              Suggested Summary
            </h2>
            <p className="text-sm">
              Nights: <b>{plan.summary.nights}</b> – Total:{' '}
              <b>{plan.summary.totalBudget} SAR</b> – ~ per night:{' '}
              <b>{plan.summary.perNightBudget} SAR</b>
            </p>
            <p className="text-sm">
              Hotel: {plan.summary.hotelCategory} – Transport:{' '}
              {plan.summary.transport}
            </p>

            {/* 🔥 Upsell block */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 text-sm rounded mt-2">
              💡 <b>Upgrade Tip:</b> Sirf{' '}
              <b>
                {Math.ceil((plan.summary.totalBudget || 0) * 0.12)} SAR
              </b>{' '}
              extra se aap <b>4★ near Haram + better transport</b> par switch
              kar sakte hain. Ye option high comfort families / VIP clients ke
              liye best hai.
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-2 text-sm">
                Recommended Hotels (sample)
              </h3>
              <ul className="space-y-2 text-sm">
                {plan.recommendedHotels.map((h, idx) => (
                  <li
                    key={idx}
                    className="border rounded p-2 flex flex-col gap-1"
                  >
                    <div className="font-medium">
                      {h.city} – {h.label}
                    </div>
                    {h.approxPricePerNight && (
                      <div>
                        Approx per night: {h.approxPricePerNight} SAR
                      </div>
                    )}
                    {h.distanceNote && (
                      <div className="text-gray-500 text-xs">
                        {h.distanceNote}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-2 text-sm">
                Transport &amp; Ziyarat
              </h3>
              <p className="text-sm mb-2">
                Transport: <b>{plan.transportSuggestion.type}</b>
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {plan.transportSuggestion.note}
              </p>
              <ul className="space-y-1 text-sm">
                {plan.ziyaratPlan.map((z, idx) => (
                  <li
                    key={idx}
                    className="border rounded p-2 flex flex-col gap-1"
                  >
                    <div className="font-medium">{z.city}</div>
                    <div className="text-xs text-gray-500">{z.when}</div>
                    <div className="text-xs">{z.note}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Customer details + Book button */}
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-sm">
              Customer details (booking ke liye)
            </h3>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-medium">
                  Full name
                </label>
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium">
                  Phone / WhatsApp
                </label>
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium">
                  Email (optional)
                </label>
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded border text-sm"
                onClick={handleGenerate}
                disabled={loading}
              >
                Regenerate Plan
              </button>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white text-sm disabled:opacity-60"
                onClick={handleBook}
                disabled={bookLoading}
              >
                {bookLoading ? 'Creating booking…' : 'Book This Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
