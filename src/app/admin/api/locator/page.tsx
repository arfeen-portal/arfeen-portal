'use client';

import { useState } from 'react';

type Family = {
  id: string;
  family_name: string;
  family_code: string;
};

type Member = {
  id: string;
  member_name: string;
  relation: string | null;
};

type Trip = {
  id: string;
  trip_name: string;
  trip_code: string;
  family_id: string;
};

export default function LocatorHomePage() {
  const [family, setFamily] = useState<Family | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);

  const [status, setStatus] = useState<string | null>(null);

  // Form state
  const [createFamilyName, setCreateFamilyName] = useState('');
  const [createMemberName, setCreateMemberName] = useState('');
  const [createRelation, setCreateRelation] = useState('');

  const [joinFamilyCode, setJoinFamilyCode] = useState('');
  const [joinMemberName, setJoinMemberName] = useState('');
  const [joinRelation, setJoinRelation] = useState('');

  const [tripName, setTripName] = useState('');
  const [tripCodeJoin, setTripCodeJoin] = useState('');

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Creating family...');
    try {
      const res = await fetch('/api/locator/family/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyName: createFamilyName,
          memberName: createMemberName,
          relation: createRelation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      setFamily(data.family);
      setMember(data.member);
      setStatus(
        `Family created. Code: ${data.family.family_code}. Member: ${data.member.member_name}`
      );
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Joining family...');
    try {
      const res = await fetch('/api/locator/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: joinFamilyCode,
          memberName: joinMemberName,
          relation: joinRelation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      setFamily(data.family);
      setMember(data.member);
      setStatus(
        `Joined family ${data.family.family_name}. Member: ${data.member.member_name}`
      );
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family) {
      setStatus('Please create/join family first.');
      return;
    }
    setStatus('Creating trip...');
    try {
      const res = await fetch('/api/locator/trip/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: family.id,
          tripName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      setTrip(data.trip);
      setStatus(
        `Trip created: ${data.trip.trip_name} (Code: ${data.trip.trip_code})`
      );
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleJoinTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) {
      setStatus('Please create/join family first.');
      return;
    }
    setStatus('Joining trip...');
    try {
      const res = await fetch('/api/locator/trip/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripCode: tripCodeJoin,
          familyMemberId: member.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      setTrip(data.trip);
      setStatus(
        `Joined trip: ${data.trip.trip_name} (Code: ${data.trip.trip_code})`
      );
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Arfeen Locator – Family Setup</h1>

      {status && (
        <div className="border rounded p-3 text-sm bg-gray-50 mb-4">
          {status}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Family */}
        <form
          onSubmit={handleCreateFamily}
          className="border rounded p-4 space-y-3"
        >
          <h2 className="font-semibold mb-2">Create Family</h2>
          <input
            className="border rounded w-full p-2 text-sm"
            placeholder="Family name (e.g. Jawad Family)"
            value={createFamilyName}
            onChange={(e) => setCreateFamilyName(e.target.value)}
          />
          <input
            className="border rounded w-full p-2 text-sm"
            placeholder="Your name"
            value={createMemberName}
            onChange={(e) => setCreateMemberName(e.target.value)}
          />
          <input
            className="border rounded w-full p-2 text-sm"
            placeholder="Relation (e.g. Father, Son)"
            value={createRelation}
            onChange={(e) => setCreateRelation(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded"
          >
            Create Family
          </button>
        </form>

        {/* Join Family */}
        <form
          onSubmit={handleJoinFamily}
          className="border rounded p-4 space-y-3"
        >
          <h2 className="font-semibold mb-2">Join Family</h2>
          <input
            className="border rounded w-full p-2 text-sm"
            placeholder="Family code (AF-123456)"
            value={joinFamilyCode}
            onChange={(e) => setJoinFamilyCode(e.target.value)}
          />
          <input
            className="border rounded w-full p-2 text-sm"
            placeholder="Your name"
            value={joinMemberName}
            onChange={(e) => setJoinMemberName(e.target.value)}
          />
          <input
            className="border rounded w-full p-2 text-sm"
            placeholder="Relation (e.g. Mother, Daughter)"
            value={joinRelation}
            onChange={(e) => setJoinRelation(e.target.value)}
          />
          <button
            type="submit"
            className="bg-green-600 text-white text-sm px-4 py-2 rounded"
          >
            Join Family
          </button>
        </form>
      </div>

      {/* Trip section */}
      <div className="border rounded p-4 space-y-4">
        <h2 className="font-semibold mb-2">Trip (Umrah / Ziyarat)</h2>

        <div className="text-sm text-gray-700">
          <div>Family: {family ? family.family_name : 'Not selected'}</div>
          <div>Member: {member ? member.member_name : 'Not selected'}</div>
          <div>
            Trip:{' '}
            {trip
              ? `${trip.trip_name} (Code: ${trip.trip_code})`
              : 'No trip yet'}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <form
            onSubmit={handleCreateTrip}
            className="space-y-3 border rounded p-3"
          >
            <h3 className="font-semibold text-sm">Create Trip</h3>
            <input
              className="border rounded w-full p-2 text-sm"
              placeholder="Trip name (e.g. Umrah Rabi ul Awwal)"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded"
            >
              Create Trip
            </button>
          </form>

          <form
            onSubmit={handleJoinTrip}
            className="space-y-3 border rounded p-3"
          >
            <h3 className="font-semibold text-sm">Join Trip</h3>
            <input
              className="border rounded w-full p-2 text-sm"
              placeholder="Trip code (TRP-123456)"
              value={tripCodeJoin}
              onChange={(e) => setTripCodeJoin(e.target.value)}
            />
            <button
              type="submit"
              className="bg-green-600 text-white text-sm px-4 py-2 rounded"
            >
              Join Trip
            </button>
          </form>
        </div>

        {trip && (
          <a
            href={`/locator/trip/${trip.id}`}
            className="inline-block mt-3 text-sm text-blue-700 underline"
          >
            Open Live Trip View
          </a>
        )}
      </div>
    </div>
  );
}
