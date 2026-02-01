'use client';

import React, { useEffect, useMemo, useState } from 'react';

type GroupFormValues = {
  // STEP 1 – basic
  airlineId: string;
  sectorFrom: string;
  sectorTo: string;
  cabinClass: string;
  type: string;
  groupName: string;
  groupCode: string;
  days: string;
  seats: string;
  showSeats: boolean;

  // STEP 2 – flight
  flightNo: string;
  depDate: string;
  depTime: string;
  arrDate: string;
  arrTime: string;
  fromTerminal: string;
  toTerminal: string;
  baggage: string;
  meal: string;

  // STEP 3 – currency & prices
  buyingCurrency: string;
  buyingAdult: string;
  buyingChild: string;
  buyingInfant: string;

  sellingCurrencyB2B: string;
  sellingAdultB2B: string;
  sellingChildB2B: string;
  sellingInfantB2B: string;

  sellingCurrencyB2C: string;
  sellingAdultB2C: string;
  sellingChildB2C: string;
  sellingInfantB2C: string;

  pnr: string;
  contactPhone: string;
  contactEmail: string;
  internalStatus: string;
};

const STORAGE_KEY = 'arfeen_umrah_group_defaults_v1';
const CLONE_KEY = 'arfeen_umrah_group_clone_draft_v1';

type DefaultKey = `${string}_${string}_${string}_${string}`;

type StoredDefaults = Partial<GroupFormValues> & {
  key: DefaultKey;
  updatedAt: string;
};

const emptyForm: GroupFormValues = {
  airlineId: '',
  sectorFrom: '',
  sectorTo: '',
  cabinClass: '',
  type: 'Umrah',
  groupName: '',
  groupCode: '',
  days: '',
  seats: '',
  showSeats: true,

  flightNo: '',
  depDate: '',
  depTime: '',
  arrDate: '',
  arrTime: '',
  fromTerminal: '',
  toTerminal: '',
  baggage: '',
  meal: '',

  buyingCurrency: '',
  buyingAdult: '',
  buyingChild: '',
  buyingInfant: '',

  sellingCurrencyB2B: '',
  sellingAdultB2B: '',
  sellingChildB2B: '',
  sellingInfantB2B: '',

  sellingCurrencyB2C: '',
  sellingAdultB2C: '',
  sellingChildB2C: '',
  sellingInfantB2C: '',

  pnr: '',
  contactPhone: '',
  contactEmail: '',
  internalStatus: 'Public',
};

// ---------- defaults helpers ----------

function makeKey(v: GroupFormValues): DefaultKey {
  return `${v.airlineId || 'na'}_${v.sectorFrom || 'na'}_${v.sectorTo || 'na'}_${v.cabinClass || 'na'}`;
}

function loadDefaultsFor(v: GroupFormValues): StoredDefaults | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDefaults[];
    const key = makeKey(v);
    return parsed.find((x) => x.key === key) || null;
  } catch {
    return null;
  }
}

function saveDefaultsFrom(v: GroupFormValues) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as StoredDefaults[]) : [];
    const key = makeKey(v);
    const filtered = existing.filter((x) => x.key !== key);

    const toStore: StoredDefaults = {
      key,
      updatedAt: new Date().toISOString(),
      airlineId: v.airlineId,
      sectorFrom: v.sectorFrom,
      sectorTo: v.sectorTo,
      cabinClass: v.cabinClass,
      flightNo: v.flightNo,
      depTime: v.depTime,
      arrTime: v.arrTime,
      fromTerminal: v.fromTerminal,
      toTerminal: v.toTerminal,
      baggage: v.baggage,
      meal: v.meal,
      buyingCurrency: v.buyingCurrency,
      buyingAdult: v.buyingAdult,
      buyingChild: v.buyingChild,
      buyingInfant: v.buyingInfant,
      sellingCurrencyB2B: v.sellingCurrencyB2B,
      sellingAdultB2B: v.sellingAdultB2B,
      sellingChildB2B: v.sellingChildB2B,
      sellingInfantB2B: v.sellingInfantB2B,
      sellingCurrencyB2C: v.sellingCurrencyB2C,
      sellingAdultB2C: v.sellingAdultB2C,
      sellingChildB2C: v.sellingChildB2C,
      sellingInfantB2C: v.sellingInfantB2C,
    };

    const updated = [...filtered, toStore];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export default function NewUmrahGroupPage() {
  const [form, setForm] = useState<GroupFormValues>(emptyForm);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);

  // CLONE data load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(CLONE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<GroupFormValues>;
      setForm({ ...emptyForm, ...parsed });
      window.localStorage.removeItem(CLONE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // airline / sector / class change par defaults
  const keyDeps = useMemo(
    () => ({
      airlineId: form.airlineId,
      sectorFrom: form.sectorFrom,
      sectorTo: form.sectorTo,
      cabinClass: form.cabinClass,
    }),
    [form.airlineId, form.sectorFrom, form.sectorTo, form.cabinClass],
  );

  useEffect(() => {
    if (
      !keyDeps.airlineId ||
      !keyDeps.sectorFrom ||
      !keyDeps.sectorTo ||
      !keyDeps.cabinClass
    ) {
      setDefaultsLoaded(false);
      return;
    }

    const stored = loadDefaultsFor({
      ...emptyForm,
      ...form,
      airlineId: keyDeps.airlineId,
      sectorFrom: keyDeps.sectorFrom,
      sectorTo: keyDeps.sectorTo,
      cabinClass: keyDeps.cabinClass,
    });

    if (stored && !defaultsLoaded) {
      const f: (keyof StoredDefaults)[] = [
        'flightNo',
        'depTime',
        'arrTime',
        'fromTerminal',
        'toTerminal',
        'baggage',
        'meal',
        'buyingCurrency',
        'buyingAdult',
        'buyingChild',
        'buyingInfant',
        'sellingCurrencyB2B',
        'sellingAdultB2B',
        'sellingChildB2B',
        'sellingInfantB2B',
        'sellingCurrencyB2C',
        'sellingAdultB2C',
        'sellingChildB2C',
        'sellingInfantB2C',
      ];
      const copy: GroupFormValues = { ...form };
      f.forEach((field) => {
        if (stored[field]) {
          // @ts-ignore
          copy[field] = stored[field] as any;
        }
      });
      setForm(copy);
      setDefaultsLoaded(true);
    }
  }, [keyDeps, defaultsLoaded, form]);

  const manualLoadDefaults = () => {
    const stored = loadDefaultsFor(form);
    if (!stored) return;
    const f: (keyof StoredDefaults)[] = [
      'flightNo',
      'depTime',
      'arrTime',
      'fromTerminal',
      'toTerminal',
      'baggage',
      'meal',
      'buyingCurrency',
      'buyingAdult',
      'buyingChild',
      'buyingInfant',
      'sellingCurrencyB2B',
      'sellingAdultB2B',
      'sellingChildB2B',
      'sellingInfantB2B',
      'sellingCurrencyB2C',
      'sellingAdultB2C',
      'sellingChildB2C',
      'sellingInfantB2C',
    ];
    setForm((prev) => {
      const copy = { ...prev };
      f.forEach((field) => {
        if (stored[field]) {
          // @ts-ignore
          copy[field] = stored[field] as any;
        }
      });
      return copy;
    });
  };

  const handleChange =
    (field: keyof GroupFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const nextStep = () => setStep((s) => (s === 3 ? 3 : ((s + 1) as 1 | 2 | 3)));
  const prevStep = () => setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3)));

  const totalAdultProfit = useMemo(() => {
    const buy = parseFloat(form.buyingAdult || '0');
    const sell = parseFloat(form.sellingAdultB2C || '0');
    if (!buy || !sell) return '';
    return (sell - buy).toFixed(0);
  }, [form.buyingAdult, form.sellingAdultB2C]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    saveDefaultsFrom(form);

    try {
      const res = await fetch('/api/umrah-groups', {
        method: 'POST',
        body: JSON.stringify(form),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const j = await res.json();
        alert('Error: ' + (j.error || 'Failed to save group'));
      } else {
        alert('Group saved successfully');
      }
    } catch (err) {
      console.error(err);
      alert('Group saved locally. API error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasDefaults = !!loadDefaultsFor(form);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Umrah Group</h1>
        <p className="text-xs text-gray-500">
          Smart group creation with auto-remember settings
        </p>
      </div>

      {/* Stepper */}
      <div className="flex gap-2">
        {[
          { id: 1 as 1, label: 'Basic Info' },
          { id: 2 as 2, label: 'Flight & Timing' },
          { id: 3 as 3, label: 'Prices & Seats' },
        ].map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={
              'flex-1 py-2 rounded-full text-sm border ' +
              (step === s.id
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-gray-100 text-gray-600')
            }
          >
            {s.id}. {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="border rounded-md p-4">
            <h2 className="font-semibold mb-3">
              Step 1 – Basic Group Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.type}
                  onChange={handleChange('type')}
                >
                  <option value="Umrah">Umrah</option>
                  <option value="Visit">Visit</option>
                  <option value="Tour">Tour</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Airline
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="e.g. SV"
                  value={form.airlineId}
                  onChange={handleChange('airlineId')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Group Name
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="Ramzan Special"
                  value={form.groupName}
                  onChange={handleChange('groupName')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Group Code
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="ARF-UMR-001"
                  value={form.groupCode}
                  onChange={handleChange('groupCode')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Sector From
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="KHI/JED"
                  value={form.sectorFrom}
                  onChange={handleChange('sectorFrom')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Sector To
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="JED/KHI"
                  value={form.sectorTo}
                  onChange={handleChange('sectorTo')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="Economy / Business"
                  value={form.cabinClass}
                  onChange={handleChange('cabinClass')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  No. of days
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.days}
                  onChange={handleChange('days')}
                />
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Seats
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded-md px-2 py-1 text-sm"
                    value={form.seats}
                    onChange={handleChange('seats')}
                  />
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.showSeats}
                    onChange={handleChange('showSeats')}
                  />
                  <span className="text-xs">Show seat wise?</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Step 2 – Flight & Timing</h2>
              {hasDefaults && (
                <button
                  type="button"
                  onClick={manualLoadDefaults}
                  className="px-3 py-1 border rounded-md text-xs bg-white"
                >
                  Load Last Settings
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Flight #
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="SV 700"
                  value={form.flightNo}
                  onChange={handleChange('flightNo')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Departure Date
                </label>
                <input
                  type="date"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.depDate}
                  onChange={handleChange('depDate')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Departure Time
                </label>
                <input
                  type="time"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.depTime}
                  onChange={handleChange('depTime')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Arrival Date
                </label>
                <input
                  type="date"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.arrDate}
                  onChange={handleChange('arrDate')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Arrival Time
                </label>
                <input
                  type="time"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.arrTime}
                  onChange={handleChange('arrTime')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  From Terminal
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="T1"
                  value={form.fromTerminal}
                  onChange={handleChange('fromTerminal')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  To Terminal
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="T1"
                  value={form.toTerminal}
                  onChange={handleChange('toTerminal')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Baggage
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="40kg + 7kg hand"
                  value={form.baggage}
                  onChange={handleChange('baggage')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Meal
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="Yes / No"
                  value={form.meal}
                  onChange={handleChange('meal')}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="border rounded-md p-4 space-y-6">
            <h2 className="font-semibold mb-2">
              Step 3 – Prices, Contacts & Status
            </h2>

            {/* Buying */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Buying Currency
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="SAR"
                  value={form.buyingCurrency}
                  onChange={handleChange('buyingCurrency')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Buying Adult
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.buyingAdult}
                  onChange={handleChange('buyingAdult')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Buying Child
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.buyingChild}
                  onChange={handleChange('buyingChild')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Buying Infant
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.buyingInfant}
                  onChange={handleChange('buyingInfant')}
                />
              </div>
            </div>

            {/* Selling B2B */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Selling Currency B2B
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="SAR"
                  value={form.sellingCurrencyB2B}
                  onChange={handleChange('sellingCurrencyB2B')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Selling Adult B2B
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.sellingAdultB2B}
                  onChange={handleChange('sellingAdultB2B')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Selling Child B2B
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.sellingChildB2B}
                  onChange={handleChange('sellingChildB2B')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Selling Infant B2B
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.sellingInfantB2B}
                  onChange={handleChange('sellingInfantB2B')}
                />
              </div>
            </div>

            {/* Selling B2C */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Selling Currency B2C
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="SAR"
                  value={form.sellingCurrencyB2C}
                  onChange={handleChange('sellingCurrencyB2C')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Selling Adult B2C
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.sellingAdultB2C}
                  onChange={handleChange('sellingAdultB2C')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Selling Child B2C
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.sellingChildB2C}
                  onChange={handleChange('sellingChildB2C')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Selling Infant B2C
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.sellingInfantB2C}
                  onChange={handleChange('sellingInfantB2C')}
                />
              </div>
            </div>

            {totalAdultProfit && (
              <p className="text-xs text-gray-600">
                Approx adult profit (B2C): {totalAdultProfit} per seat
              </p>
            )}

            {/* Contact & status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">PNR</label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="Optional PNR"
                  value={form.pnr}
                  onChange={handleChange('pnr')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact Phone
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="+966..."
                  value={form.contactPhone}
                  onChange={handleChange('contactPhone')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact Email
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="group@arfeentravel.com"
                  value={form.contactEmail}
                  onChange={handleChange('contactEmail')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Internal Status
                </label>
                <select
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={form.internalStatus}
                  onChange={handleChange('internalStatus')}
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bottom buttons */}
        <div className="flex items-center justify-between border rounded-md p-3 bg-gray-50">
          <div className="space-x-2">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="px-3 py-2 rounded-md border text-sm bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={nextStep}
              disabled={step === 3}
              className="px-3 py-2 rounded-md border text-sm bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-green-600 text-white text-sm disabled:opacity-50"
          >
            Save Group
          </button>
        </div>
      </form>
    </div>
  );
}
