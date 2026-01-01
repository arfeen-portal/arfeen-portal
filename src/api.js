// src/api.js

const API_BASE_URL = 'https://YOUR_PORTAL_DOMAIN.com'; 
// 👆 yahan apny Next.js portal ka real domain ya ngrok URL lagana

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API error');
  }
  return data;
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API error');
  }
  return data;
}

export const locatorApi = {
  createFamily: (familyName, memberName, relation) =>
    apiPost('/api/locator/family/create', {
      familyName,
      memberName,
      relation,
    }),

  joinFamily: (familyCode, memberName, relation) =>
    apiPost('/api/locator/family/join', {
      familyCode,
      memberName,
      relation,
    }),

  createTrip: (familyId, tripName) =>
    apiPost('/api/locator/trip/create', {
      familyId,
      tripName,
    }),

  joinTrip: (tripCode, familyMemberId) =>
    apiPost('/api/locator/trip/join', {
      tripCode,
      familyMemberId,
    }),

  sendLocation: (tripId, familyMemberId, lat, lng, accuracy, battery) =>
    apiPost('/api/locator/location/update', {
      tripId,
      familyMemberId,
      lat,
      lng,
      accuracy,
      battery,
    }),

  listLocations: (tripId) =>
    apiGet(`/api/locator/location/list?tripId=${encodeURIComponent(tripId)}`),

  sendSos: (tripId, familyMemberId, lat, lng, message) =>
    apiPost('/api/locator/sos/create', {
      tripId,
      familyMemberId,
      lat,
      lng,
      message,
    }),
};
