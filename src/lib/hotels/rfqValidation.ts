export const ROOM_TYPE_OPTIONS = [
  "Single",
  "Double",
  "Triple",
  "Quad",
  "Quint",
  "Hexa",
  "Junior Suite",
  "Executive Suite",
  "Family Suite",
  "Two Bedroom Suite",
  "Three Bedroom Suite",
  "Connecting Rooms",
  "Apartment 1 Bedroom",
  "Apartment 2 Bedroom",
  "Apartment 3 Bedroom",
] as const;

export type RoomTypeOption = (typeof ROOM_TYPE_OPTIONS)[number];

export const ROOM_CAPACITY: Record<string, number> = {
  Single: 1,
  Double: 2,
  Triple: 3,
  Quad: 4,
  Quint: 5,
  Hexa: 6,
  "Junior Suite": 2,
  "Executive Suite": 2,
  "Family Suite": 4,
  "Two Bedroom Suite": 4,
  "Three Bedroom Suite": 6,
  "Connecting Rooms": 4,
  "Apartment 1 Bedroom": 2,
  "Apartment 2 Bedroom": 4,
  "Apartment 3 Bedroom": 6,
  Sharing: 1,
};

export type DateValidationResult =
  | { ok: true; nights: number }
  | { ok: false; error: string };

export type RoomValidationResult =
  | { ok: true; roomCapacity: number; maxPax: number }
  | { ok: false; error: string };

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim())) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function todayUtcDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function validateStayDates(checkIn: string, checkOut: string): DateValidationResult {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);

  if (!start || !end) {
    return { ok: false, error: "Check-in and check-out must be valid dates (YYYY-MM-DD)." };
  }

  const today = todayUtcDate();

  if (start < today) {
    return { ok: false, error: "Check-in must be today or a future date." };
  }

  if (end <= start) {
    return { ok: false, error: "Check-out must be after check-in." };
  }

  const nights = Math.round((end.getTime() - start.getTime()) / 86400000);

  if (nights < 1) {
    return { ok: false, error: "At least 1 night is required." };
  }

  return { ok: true, nights };
}

export function getRoomCapacity(roomType: string): number | null {
  return ROOM_CAPACITY[roomType] ?? null;
}

export function validateRoomCapacity(
  roomType: string,
  rooms: number,
  pax: number
): RoomValidationResult {
  const roomCapacity = getRoomCapacity(roomType);

  if (!roomCapacity) {
    return { ok: false, error: "Please select a valid room / unit type." };
  }

  const safeRooms = Math.max(1, Math.floor(rooms));
  const safePax = Math.max(1, Math.floor(pax));
  const maxPax = safeRooms * roomCapacity;

  if (safePax > maxPax) {
    return {
      ok: false,
      error: `${safeRooms} ${roomType} unit(s) allow maximum ${maxPax} guest(s). Increase rooms/units or choose a larger room type.`,
    };
  }

  return { ok: true, roomCapacity, maxPax };
}

export function validateHotelDemandInput(input: {
  check_in: string;
  check_out: string;
  room_type: string;
  rooms: number;
  pax: number;
  guest_name?: string;
  hotel?: string;
}) {
  if (!String(input.guest_name || "").trim()) {
    return { ok: false as const, error: "Guest name is required." };
  }

  if (!String(input.hotel || "").trim()) {
    return { ok: false as const, error: "Hotel is required." };
  }

  const dateResult = validateStayDates(input.check_in, input.check_out);
  if (!dateResult.ok) {
    return dateResult;
  }

  const roomResult = validateRoomCapacity(input.room_type, input.rooms, input.pax);
  if (!roomResult.ok) {
    return roomResult;
  }

  return {
    ok: true as const,
    nights: dateResult.nights,
    roomCapacity: roomResult.roomCapacity,
  };
}

export function formatStayDates(checkIn: string, checkOut: string, nights?: number | null) {
  let computedNights = nights ?? null;

  if (computedNights == null) {
    const validation = validateStayDates(checkIn, checkOut);
    if (validation.ok) {
      computedNights = validation.nights;
    }
  }

  return {
    checkIn,
    checkOut,
    nights: computedNights,
    lines: [
      `Check-in: ${checkIn}`,
      `Check-out: ${checkOut}`,
      `Nights: ${computedNights ?? "—"}`,
    ],
  };
}

export function getAgentQuotationLabel(item: {
  status?: string | null;
  quote_status?: string | null;
  final_offer_sar?: number | null;
  final_selling_rate?: number | null;
}) {
  const offer = item.final_offer_sar ?? item.final_selling_rate;
  const quoteReady =
    offer &&
    (item.quote_status === "quotation_sent" ||
      item.quote_status === "quote_ready" ||
      item.status === "quoted" ||
      item.status === "confirmed");

  if (quoteReady) {
    return `${offer} SAR`;
  }

  if (item.status === "rfq_pending" || item.quote_status === "awaiting_supplier") {
    return "Awaiting supplier quote";
  }

  return "Quotation pending";
}
