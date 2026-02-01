'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const CLONE_KEY = 'arfeen_umrah_group_clone_draft_v1';

type UmrahGroupFlight = {
  id: string;
  flight_no: string | null;
  dep_date: string | null;
  dep_time: string | null;
  arr_date: string | null;
  arr_time: string | null;
  from_terminal: string | null;
  to_terminal: string | null;
  baggage: string | null;
  meal: string | null;
};

type UmrahGroup = {
  id: string;
  airline: string | null;
  sector_from: string | null;
  sector_to: string | null;
  cabin_class: string | null;
  type: string | null;
  group_name: string | null;
  group_code: string | null;
  days: number | null;
  seats: number | null;
  show_seats: boolean | null;

  buying_currency: string | null;
  buying_adult: number | null;
  buying_child: number | null;
  buying_infant: number | null;

  selling_currency_b2b: string | null;
  selling_adult_b2b: number | null;
  selling_child_b2b: number | null;
  selling_infant_b2b: number | null;

  selling_currency_b2c: string | null;
  selling_adult_b2c: number | null;
  selling_child_b2c: number | null;
  selling_infant_b2c: number | null;

  pnr: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  internal_status: string | null;

  created_at: string;
  umrah_group_flights?: UmrahGroupFlight[];
};

export default function UmrahGroupsListPage() {
  const [groups, setGroups] = useState<UmrahGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/umrah-groups');
        const json = await res.json();
        setGroups(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleNew = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CLONE_KEY);
    }
    router.push('/umrah-groups/new');
  };

  const handleClone = (g: UmrahGroup) => {
    if (typeof window === 'undefined') return;

    const firstFlight = g.umrah_group_flights && g.umrah_group_flights[0];

    const payload = {
      airlineId: g.airline || '',
      sectorFrom: g.sector_from || '',
      sectorTo: g.sector_to || '',
      cabinClass: g.cabin_class || '',
      type: g.type || 'Umrah',
      groupName: (g.group_name || '') + ' (Copy)',
      groupCode: '',
      days: g.days ?? '',
      seats: g.seats ?? '',
      showSeats: g.show_seats ?? true,

      flightNo: firstFlight?.flight_no || '',
      depDate: firstFlight?.dep_date || '',
      depTime: firstFlight?.dep_time || '',
      arrDate: firstFlight?.arr_date || '',
      arrTime: firstFlight?.arr_time || '',
      fromTerminal: firstFlight?.from_terminal || '',
      toTerminal: firstFlight?.to_terminal || '',
      baggage: firstFlight?.baggage || '',
      meal: firstFlight?.meal || '',

      buyingCurrency: g.buying_currency || '',
      buyingAdult: g.buying_adult != null ? String(g.buying_adult) : '',
      buyingChild: g.buying_child != null ? String(g.buying_child) : '',
      buyingInfant: g.buying_infant != null ? String(g.buying_infant) : '',

      sellingCurrencyB2B: g.selling_currency_b2b || '',
      sellingAdultB2B: g.selling_adult_b2b != null ? String(g.selling_adult_b2b) : '',
      sellingChildB2B: g.selling_child_b2b != null ? String(g.selling_child_b2b) : '',
      sellingInfantB2B: g.selling_infant_b2b != null ? String(g.selling_infant_b2b) : '',

      sellingCurrencyB2C: g.selling_currency_b2c || '',
      sellingAdultB2C: g.selling_adult_b2c != null ? String(g.selling_adult_b2c) : '',
      sellingChildB2C: g.selling_child_b2c != null ? String(g.selling_child_b2c) : '',
      sellingInfantB2C: g.selling_infant_b2c != null ? String(g.selling_infant_b2c) : '',

      pnr: g.pnr || '',
      contactPhone: g.contact_phone || '',
      contactEmail: g.contact_email || '',
      internalStatus: g.internal_status || 'Public',
    };

    window.localStorage.setItem(CLONE_KEY, JSON.stringify(payload));
    router.push('/umrah-groups/new');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Umrah Groups</h1>
        <button
          onClick={handleNew}
          className="px-4 py-2 rounded-md bg-green-600 text-white text-sm"
        >
          New Group
        </button>
      </div>

      <div className="border rounded-md">
        <div className="border-b px-4 py-2 font-semibold text-sm bg-gray-50">
          All Groups
        </div>
        <div className="p-0">
          {loading ? (
            <p className="text-sm text-gray-500 px-4 py-3">Loading...</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-gray-500 px-4 py-3">No groups found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Group</th>
                    <th className="px-3 py-2 text-left">Airline / Sector</th>
                    <th className="px-3 py-2 text-left">Seats</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => {
                    const firstFlight =
                      g.umrah_group_flights && g.umrah_group_flights[0];

                    return (
                      <tr
                        key={g.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="font-medium">
                            {g.group_name || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {g.group_code || ''}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div>
                            {g.airline || '-'}{' '}
                            {g.sector_from && g.sector_to
                              ? `(${g.sector_from} → ${g.sector_to})`
                              : ''}
                          </div>
                          {firstFlight?.dep_date && (
                            <div className="text-xs text-gray-500">
                              {firstFlight.dep_date}{' '}
                              {firstFlight.dep_time || ''}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top">
                          {g.seats ?? '-'}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs">
                            {g.internal_status || 'Public'}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="text-xs text-gray-500">
                            {g.created_at
                              ? new Date(g.created_at).toLocaleDateString()
                              : '-'}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleClone(g)}
                            className="px-3 py-1 border rounded-md text-xs bg-white"
                          >
                            Clone
                          </button>
                          {/* future: Edit button yahan add kar sakte ho */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
