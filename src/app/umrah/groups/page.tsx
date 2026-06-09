"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Filter,
  Grid3X3,
  List,
  Plane,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  X,
} from "lucide-react";

type FlightLeg = {
  flight_no?: string;
  dep_date?: string;
  dep_time?: string;
  from_city?: string;
  to_city?: string;
  class_code?: string;
  arr_date?: string;
  arr_time?: string;
  baggage?: string;
  terminal?: string;
};

type GroupRow = {
  id?: string;
  group_name?: string;
  group_code?: string;
  airline?: string;
  airline_name?: string;
  group_type?: string;
  status?: string;
  from_city?: string;
  to_city?: string;
  departure_date?: string;
  return_date?: string;
  total_seats?: number;
  reserved_seats?: number;
  available_seats?: number;
  pnr?: string;
  flight_schedule?: FlightLeg[];
  b2b_selling_price_per_seat?: number;
  b2c_selling_price_per_seat?: number;
};

type PassengerType = "adult" | "child" | "infant";

type Passenger = {
  type: PassengerType;
  title: string;
  surname: string;
  givenName: string;
  passportNo: string;
  nationality: string;
  dob: string;
  passportExpiry: string;
};

type BookingDraft = {
  adults: number;
  children: number;
  infants: number;
  passengers: Passenger[];
};

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia",
  "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia",
  "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
  "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine",
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan",
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda",
  "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
];

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown): string {
  return `PKR ${Math.round(toNumber(value)).toLocaleString()}`;
}

function getAirline(row: GroupRow): string {
  return String(row.airline || row.airline_name || "Airline");
}

function airlineCode(airline: string): string {
  const key = airline.toLowerCase();
  if (key.includes("saudi") || key.includes("saudia")) return "SV";
  if (key.includes("airblue")) return "PA";
  if (key.includes("emirates")) return "EK";
  if (key.includes("qatar")) return "QR";
  if (key.includes("pia")) return "PK";
  if (key.includes("flynas")) return "XY";
  if (key.includes("serene")) return "ER";
  if (key.includes("air arabia")) return "G9";

  return airline
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function labelGroupType(value?: string): string {
  return value === "one_way_group" ? "One Way" : "Umrah Group";
}

function formatDate(value?: string): string {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function getSchedule(row: GroupRow): FlightLeg[] {
  return Array.isArray(row.flight_schedule) ? row.flight_schedule : [];
}

function getDepartureDate(row: GroupRow): string {
  const schedule = getSchedule(row);
  return schedule[0]?.dep_date || row.departure_date || "";
}

function getReturnDate(row: GroupRow): string {
  if (row.group_type === "one_way_group") return "";
  const schedule = getSchedule(row);
  const lastLeg = schedule.length > 0 ? schedule[schedule.length - 1] : undefined;
  return row.return_date || lastLeg?.dep_date || lastLeg?.arr_date || "";
}

function daysBetweenInclusive(start?: string, end?: string): number {
  if (!start || !end) return 0;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;

  const startUtc = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endUtc = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const diff = Math.round((endUtc - startUtc) / (24 * 60 * 60 * 1000));

  return diff >= 0 ? diff + 1 : 0;
}

function getDurationBadge(row: GroupRow): string {
  if (row.group_type === "one_way_group") return "O/W";
  const days = daysBetweenInclusive(getDepartureDate(row), getReturnDate(row));
  return days > 0 ? `${days}D` : "-";
}

function sectorKey(row: GroupRow): string {
  const from = row.from_city || "-";
  const to = row.to_city || "-";
  return row.group_type === "one_way_group" ? `${from} → ${to}` : `${from} → ${to} → ${from}`;
}

function firstScheduleDate(row: GroupRow): string {
  return getDepartureDate(row);
}

function isAgentUser(): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get("role") || params.get("user_type");
  const agentParam = params.get("agent");

  const storedRole =
    localStorage.getItem("role") ||
    localStorage.getItem("user_role") ||
    localStorage.getItem("arfeen_role") ||
    "";

  return agentParam === "1" || roleParam === "agent" || storedRole.toLowerCase().includes("agent");
}

function getAgencyProfile() {
  if (typeof window === "undefined") return { name: "Travel Agency", logo: "" };

  return {
    name:
      localStorage.getItem("agency_name") ||
      localStorage.getItem("agent_agency_name") ||
      localStorage.getItem("company_name") ||
      "Travel Agency",
    logo:
      localStorage.getItem("agency_logo") ||
      localStorage.getItem("agent_agency_logo") ||
      localStorage.getItem("company_logo") ||
      "",
  };
}

function makePassengers(adults: number, children: number, infants: number): Passenger[] {
  const list: Passenger[] = [];

  for (let i = 0; i < adults; i++) {
    list.push({ type: "adult", title: "MR", surname: "", givenName: "", passportNo: "", nationality: "", dob: "", passportExpiry: "" });
  }

  for (let i = 0; i < children; i++) {
    list.push({ type: "child", title: "MSTR", surname: "", givenName: "", passportNo: "", nationality: "", dob: "", passportExpiry: "" });
  }

  for (let i = 0; i < infants; i++) {
    list.push({ type: "infant", title: "INF", surname: "", givenName: "", passportNo: "", nationality: "", dob: "", passportExpiry: "" });
  }

  return list;
}

function FlightScheduleMini({ schedule }: { schedule: FlightLeg[] }) {
  if (schedule.length === 0) {
    return <span>Schedule not attached</span>;
  }

  return (
    <div className="space-y-1">
      {schedule.map((leg, index) => (
        <p key={index} className="text-sm font-black text-slate-800">
          {leg.flight_no || "-"} • {leg.from_city || "-"} → {leg.to_city || "-"} • DEP {leg.dep_time || "-"} • ARR {leg.arr_time || "-"}
        </p>
      ))}
    </div>
  );
}

export default function UmrahGroupsPage() {
  const [rows, setRows] = useState<GroupRow[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [airlineFilter, setAirlineFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState<"cards" | "compact">("compact");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupRow | null>(null);
  const [agency, setAgency] = useState({ name: "Travel Agency", logo: "" });

  const [booking, setBooking] = useState<BookingDraft>({
    adults: 1,
    children: 0,
    infants: 0,
    passengers: makePassengers(1, 0, 0),
  });

  const pageSize = viewMode === "cards" ? 8 : 14;

  useEffect(() => {
    setAgentMode(isAgentUser());
    setAgency(getAgencyProfile());
  }, []);

  async function loadGroups(): Promise<void> {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("group_type", typeFilter);

      const res = await fetch(`/api/umrah/groups?${params.toString()}`, {
        cache: "no-store",
      });

      const text = await res.text();
      const json = JSON.parse(text) as { data?: GroupRow[] };

      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.error("GROUP LOAD ERROR:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGroups();
  }, [typeFilter]);

  const airlines = useMemo(() => {
    return Array.from(new Set(rows.map((row) => getAirline(row)).filter(Boolean))).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.toLowerCase();

    const result = rows.filter((row) => {
      const airline = getAirline(row);

      const searchOk =
        !query ||
        String(row.group_name || "").toLowerCase().includes(query) ||
        String(row.group_code || "").toLowerCase().includes(query) ||
        airline.toLowerCase().includes(query) ||
        String(row.pnr || "").toLowerCase().includes(query) ||
        String(row.from_city || "").toLowerCase().includes(query) ||
        String(row.to_city || "").toLowerCase().includes(query) ||
        sectorKey(row).toLowerCase().includes(query) ||
        formatDate(firstScheduleDate(row)).toLowerCase().includes(query);

      const airlineOk = airlineFilter === "all" || airline === airlineFilter;

      return searchOk && airlineOk;
    });

    result.sort((a, b) => {
      if (sortBy === "price_low") {
        const af = agentMode ? a.b2b_selling_price_per_seat : a.b2c_selling_price_per_seat;
        const bf = agentMode ? b.b2b_selling_price_per_seat : b.b2c_selling_price_per_seat;
        return toNumber(af) - toNumber(bf);
      }

      if (sortBy === "seats_high") return toNumber(b.available_seats) - toNumber(a.available_seats);

      return String(firstScheduleDate(a)).localeCompare(String(firstScheduleDate(b)));
    });

    return result;
  }, [rows, search, airlineFilter, sortBy, agentMode]);

  const groupedSections = useMemo(() => {
    const map = new Map<string, GroupRow[]>();

    filteredRows.forEach((row) => {
      const airline = getAirline(row);
      const code = airlineCode(airline);
      const sector = sectorKey(row);
      const key = `${code}__${airline}__${sector}`;

      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(row);
    });

    return Array.from(map.entries()).map(([key, groupRows]) => {
      const [code, airline, sector] = key.split("__");

      const sortedRows = [...groupRows].sort((a, b) =>
        String(firstScheduleDate(a)).localeCompare(String(firstScheduleDate(b)))
      );

      const availableSeats = sortedRows.reduce((sum, row) => sum + toNumber(row.available_seats), 0);

      const minFare = Math.min(
        ...sortedRows.map((row) =>
          toNumber(agentMode ? row.b2b_selling_price_per_seat : row.b2c_selling_price_per_seat)
        )
      );

      return {
        key,
        code,
        airline,
        sector,
        rows: sortedRows,
        availableSeats,
        minFare: Number.isFinite(minFare) ? minFare : 0,
      };
    });
  }, [filteredRows, agentMode]);

  const stats = useMemo(() => {
    return {
      airlineSectorGroups: groupedSections.length,
      liveGroups: filteredRows.length,
      availableSeats: filteredRows.reduce((sum, row) => sum + toNumber(row.available_seats), 0),
      airlines: new Set(filteredRows.map((row) => getAirline(row))).size,
    };
  }, [filteredRows, groupedSections.length]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, airlineFilter, sortBy, viewMode]);

  const totalPages = Math.max(1, Math.ceil(groupedSections.length / pageSize));

  const pagedSections = useMemo(() => {
    const start = (page - 1) * pageSize;
    return groupedSections.slice(start, start + pageSize);
  }, [groupedSections, page, pageSize]);

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setAirlineFilter("all");
    setSortBy("date");
  }

  function openBooking(row: GroupRow) {
    setSelectedGroup(row);
    setBooking({
      adults: 1,
      children: 0,
      infants: 0,
      passengers: makePassengers(1, 0, 0),
    });
  }

  function updateCounts(field: "adults" | "children" | "infants", value: string) {
    const nextValue = Math.max(0, toNumber(value));

    setBooking((previous) => {
      const next = { ...previous, [field]: nextValue };
      return {
        ...next,
        passengers: makePassengers(next.adults, next.children, next.infants),
      };
    });
  }

  function updatePassenger(index: number, field: keyof Passenger, value: string) {
    setBooking((previous) => ({
      ...previous,
      passengers: previous.passengers.map((passenger, passengerIndex) =>
        passengerIndex === index ? { ...passenger, [field]: value } : passenger
      ),
    }));
  }

  function printBooking() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-[#eef3fb] px-4 py-6 md:px-8 print:bg-white print:p-0">
      <div className="print:hidden">
        <div className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#071022] via-[#101b4d] to-[#17256b] p-6 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-yellow-300">
                <Sparkles className="h-4 w-4" />
                Arfeen Travel Live Airline Inventory
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">Umrah Airline Groups</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-blue-100">
                Same airline + same sector groups are separated with date-wise selection and booking print slip.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs font-black uppercase text-blue-100">Viewing Mode</p>
              <p className="mt-1 flex items-center gap-2 text-lg font-black">
                {agentMode ? <Crown className="h-5 w-5 text-yellow-300" /> : <Users className="h-5 w-5 text-yellow-300" />}
                {agentMode ? "Registered Agent Fare" : "Public Fare"}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard title="Airline Sector Boards" value={stats.airlineSectorGroups} icon={<Ticket />} />
          <SummaryCard title="Live Groups" value={stats.liveGroups} icon={<Plane />} />
          <SummaryCard title="Available Seats" value={stats.availableSeats} icon={<ShieldCheck />} />
          <SummaryCard title="Airlines" value={stats.airlines} icon={<Users />} />
        </div>

        <section className="sticky top-3 z-20 mb-6 rounded-3xl border bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
            <div className="flex items-center gap-3 rounded-2xl border bg-slate-50 px-4 py-3 xl:col-span-5">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search date, sector, airline, group, PNR, city..."
                className="w-full bg-transparent text-sm font-semibold outline-none"
              />
            </div>

            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-2xl border bg-slate-50 px-4 py-3 text-sm font-black outline-none xl:col-span-2">
              <option value="all">All Groups</option>
              <option value="umrah_group">Umrah Group</option>
              <option value="one_way_group">One Way</option>
            </select>

            <select value={airlineFilter} onChange={(event) => setAirlineFilter(event.target.value)} className="rounded-2xl border bg-slate-50 px-4 py-3 text-sm font-black outline-none xl:col-span-2">
              <option value="all">All Airlines</option>
              {airlines.map((airline) => (
                <option key={airline} value={airline}>
                  {airlineCode(airline)} - {airline}
                </option>
              ))}
            </select>

            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-2xl border bg-slate-50 px-4 py-3 text-sm font-black outline-none xl:col-span-2">
              <option value="date">Date Wise</option>
              <option value="price_low">Lowest Fare</option>
              <option value="seats_high">Most Seats</option>
            </select>

            <div className="flex items-center justify-end gap-2 xl:col-span-1">
              <button type="button" onClick={() => setViewMode("cards")} className={`rounded-xl px-3 py-3 text-xs font-black ${viewMode === "cards" ? "bg-[#17256b] text-white" : "bg-slate-100 text-slate-600"}`}>
                <Grid3X3 className="h-4 w-4" />
              </button>

              <button type="button" onClick={() => setViewMode("compact")} className={`rounded-xl px-3 py-3 text-xs font-black ${viewMode === "compact" ? "bg-[#17256b] text-white" : "bg-slate-100 text-slate-600"}`}>
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-black text-slate-500">
              <Filter className="h-4 w-4" />
              Showing {pagedSections.length} airline-sector boards from {groupedSections.length}
              {(search || typeFilter !== "all" || airlineFilter !== "all") && (
                <button type="button" onClick={clearFilters} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">
                  <X className="h-3 w-3" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-3xl border bg-white p-10 text-center text-sm font-black text-slate-500">
            Loading live groups...
          </div>
        ) : groupedSections.length === 0 ? (
          <div className="rounded-3xl border bg-white p-10 text-center text-sm font-black text-slate-500">
            No published group found.
          </div>
        ) : (
          <div className="space-y-6">
            {pagedSections.map((section) => (
              <AirlineSectorSection
                key={section.key}
                code={section.code}
                airline={section.airline}
                sector={section.sector}
                rows={section.rows}
                availableSeats={section.availableSeats}
                minFare={section.minFare}
                agentMode={agentMode}
                compact={viewMode === "compact"}
                onBook={openBooking}
              />
            ))}
          </div>
        )}

        {groupedSections.length > pageSize && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
              Page {page} / {totalPages}
            </span>

            <button type="button" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-40">
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {selectedGroup && (
        <BookingModal
          group={selectedGroup}
          agency={agency}
          booking={booking}
          agentMode={agentMode}
          onClose={() => setSelectedGroup(null)}
          onCountChange={updateCounts}
          onPassengerChange={updatePassenger}
          onPrint={printBooking}
        />
      )}
    </div>
  );
}

function AirlineSectorSection({
  code,
  airline,
  sector,
  rows,
  availableSeats,
  minFare,
  agentMode,
  compact,
  onBook,
}: {
  code: string;
  airline: string;
  sector: string;
  rows: GroupRow[];
  availableSeats: number;
  minFare: number;
  agentMode: boolean;
  compact: boolean;
  onBook: (row: GroupRow) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border bg-white shadow-lg shadow-slate-200/70">
      <div className="bg-gradient-to-br from-slate-950 via-[#101b4d] to-[#17256b] p-5 text-white">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-black text-[#17256b]">
              {code}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-300">
                {airline} Sector Board
              </p>
              <h2 className="mt-2 text-2xl font-black md:text-3xl">{sector}</h2>
              <p className="mt-1 text-sm font-bold text-blue-100">
                {rows.length} group{rows.length > 1 ? "s" : ""} available under same airline and same sector.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <HeaderMetric label="Seats Left" value={availableSeats} />
            <HeaderMetric label="From Fare" value={money(minFare)} />
          </div>
        </div>
      </div>

      {compact ? (
        <div className="divide-y">
          {rows.map((row, index) => (
            <CompactGroupRow key={row.id || index} row={row} agentMode={agentMode} onBook={onBook} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2 2xl:grid-cols-3">
          {rows.map((row, index) => (
            <SectorGroupCard key={row.id || index} row={row} agentMode={agentMode} onBook={onBook} />
          ))}
        </div>
      )}
    </section>
  );
}

function SectorGroupCard({
  row,
  agentMode,
  onBook,
}: {
  row: GroupRow;
  agentMode: boolean;
  onBook: (row: GroupRow) => void;
}) {
  const airline = getAirline(row);
  const durationBadge = getDurationBadge(row);
  const departureDate = getDepartureDate(row);
  const returnDate = getReturnDate(row);
  const schedule = getSchedule(row);
  const availableSeats = toNumber(row.available_seats);
  const fare = agentMode ? row.b2b_selling_price_per_seat : row.b2c_selling_price_per_seat;
  const soldOut = availableSeats <= 0;
  const isOneWay = row.group_type === "one_way_group";

  return (
    <div className="overflow-hidden rounded-3xl border bg-slate-50 shadow-sm">
      <div className="flex items-start justify-between gap-4 bg-white p-5">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">
              {labelGroupType(row.group_type)}
            </span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-black ${soldOut ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              {soldOut ? "Sold Out" : "Available"}
            </span>
          </div>

          <h3 className="truncate text-lg font-black text-slate-950">
            {row.group_name || "Umrah Airline Group"}
          </h3>

          <p className="mt-1 text-xs font-bold text-slate-500">
            {airline} • {labelGroupType(row.group_type)} • PNR {row.pnr || "-"}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-black uppercase text-slate-400">Rate</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{money(fare)}</p>
          <p className="text-xs font-bold text-slate-500">Per Seat</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-y p-5 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-500">
            {isOneWay ? "Trip Type" : "Days"}
          </p>
          <p className="mt-2 text-3xl font-black text-blue-700">{durationBadge}</p>

          <p className="mt-4 text-xs font-black uppercase text-slate-500">Date</p>
          <p className="mt-2 text-sm font-black text-slate-950">DEP {formatDate(departureDate)}</p>
          {!isOneWay && (
            <p className="mt-1 text-sm font-black text-slate-950">RET {formatDate(returnDate)}</p>
          )}

          <p className="mt-4 text-xs font-black uppercase text-slate-500">Available Seats</p>
          <p className="mt-1 text-2xl font-black text-blue-700">{availableSeats}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm md:col-span-2">
          <p className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
            <Plane className="h-4 w-4 text-blue-600" />
            Flight Schedule
          </p>

          {schedule.length === 0 ? (
            <p className="rounded-xl border border-dashed p-3 text-sm font-bold text-slate-500">
              Schedule not attached.
            </p>
          ) : (
            <div className="space-y-2">
              {schedule.map((leg, index) => (
                <div key={index} className="rounded-xl border bg-slate-50 px-4 py-3">
                  <p className="text-sm font-black text-slate-950">
                    {leg.flight_no || "-"} • {leg.from_city || "-"} → {leg.to_city || "-"}
                  </p>
                  <p className="mt-1 text-xs font-black text-slate-600">
                    DEP {leg.dep_time || "-"} • ARR {leg.arr_time || "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end bg-white p-5">
        <button type="button" disabled={soldOut} onClick={() => onBook(row)} className="rounded-2xl bg-[#17256b] px-6 py-3 text-sm font-black text-white shadow-md hover:bg-[#101b4d] disabled:bg-slate-300">
          {soldOut ? "Sold Out" : "Book Now"}
        </button>
      </div>
    </div>
  );
}

function CompactGroupRow({
  row,
  agentMode,
  onBook,
}: {
  row: GroupRow;
  agentMode: boolean;
  onBook: (row: GroupRow) => void;
}) {
  const airline = getAirline(row);
  const durationBadge = getDurationBadge(row);
  const departureDate = getDepartureDate(row);
  const returnDate = getReturnDate(row);
  const schedule = getSchedule(row);
  const availableSeats = toNumber(row.available_seats);
  const fare = agentMode ? row.b2b_selling_price_per_seat : row.b2c_selling_price_per_seat;
  const soldOut = availableSeats <= 0;
  const isOneWay = row.group_type === "one_way_group";

  return (
    <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-12 xl:items-center">
      <div className="flex items-center gap-3 xl:col-span-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-[#17256b]">
          {durationBadge}
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-black text-slate-950">{row.group_name || "Umrah Airline Group"}</p>
          <p className="text-xs font-bold text-slate-500">
            {airline} • {labelGroupType(row.group_type)} • PNR {row.pnr || "-"}
          </p>
        </div>
      </div>

      <div className="xl:col-span-2">
        <p className="text-xs font-black uppercase text-slate-400">Date</p>
        <p className="text-sm font-black text-slate-900">DEP {formatDate(departureDate)}</p>
        {!isOneWay && (
          <p className="text-sm font-black text-slate-900">RET {formatDate(returnDate)}</p>
        )}
      </div>

      <div className="xl:col-span-3">
        <p className="text-xs font-black uppercase text-slate-400">Schedule</p>
        <FlightScheduleMini schedule={schedule} />
      </div>

      <div className="xl:col-span-1">
        <p className="text-xs font-black uppercase text-slate-400">Seats</p>
        <p className="text-lg font-black text-blue-700">{availableSeats}</p>
      </div>

      <div className="xl:col-span-2">
        <p className="text-xs font-black uppercase text-slate-400">Rate</p>
        <p className="text-lg font-black text-slate-950">{money(fare)}</p>
      </div>

      <div className="xl:col-span-1">
        <button type="button" disabled={soldOut} onClick={() => onBook(row)} className="w-full rounded-2xl bg-[#17256b] px-4 py-3 text-xs font-black text-white disabled:bg-slate-300">
          {soldOut ? "Sold" : "Book"}
        </button>
      </div>
    </div>
  );
}

function BookingModal({
  group,
  agency,
  booking,
  agentMode,
  onClose,
  onCountChange,
  onPassengerChange,
  onPrint,
}: {
  group: GroupRow;
  agency: { name: string; logo: string };
  booking: BookingDraft;
  agentMode: boolean;
  onClose: () => void;
  onCountChange: (field: "adults" | "children" | "infants", value: string) => void;
  onPassengerChange: (index: number, field: keyof Passenger, value: string) => void;
  onPrint: () => void;
}) {
  const airline = getAirline(group);
  const code = airlineCode(airline);
  const fare = agentMode ? group.b2b_selling_price_per_seat : group.b2c_selling_price_per_seat;
  const totalSeats = booking.adults + booking.children + booking.infants;
  const totalAmount = toNumber(fare) * totalSeats;
  const schedule = getSchedule(group);
  const isOneWay = group.group_type === "one_way_group";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 print:static print:bg-white print:p-0">
      <div className="mx-auto max-w-6xl rounded-[2rem] bg-white shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
        <div className="flex items-center justify-between border-b p-5 print:hidden">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Booking Form</p>
            <h2 className="text-2xl font-black text-slate-950">{group.group_name}</h2>
          </div>

          <button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12 print:block print:p-8">
          <div className="space-y-5 lg:col-span-7 print:hidden">
            <section className="rounded-3xl border p-5">
              <h3 className="mb-4 text-lg font-black text-slate-950">Seat Selection</h3>
              <div className="grid grid-cols-3 gap-3">
                <NumberField label="Adult" value={booking.adults} onChange={(value) => onCountChange("adults", value)} />
                <NumberField label="Child" value={booking.children} onChange={(value) => onCountChange("children", value)} />
                <NumberField label="Infant" value={booking.infants} onChange={(value) => onCountChange("infants", value)} />
              </div>
            </section>

            <section className="rounded-3xl border p-5">
              <h3 className="mb-4 text-lg font-black text-slate-950">Passport Details</h3>
              <div className="space-y-4">
                {booking.passengers.map((passenger, index) => (
                  <div key={index} className="rounded-2xl border bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-black uppercase text-blue-700">
                      Passenger {index + 1} — {passenger.type}
                    </p>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <InputField label="Title" value={passenger.title} onChange={(value) => onPassengerChange(index, "title", value)} />
                      <InputField label="Surname" value={passenger.surname} onChange={(value) => onPassengerChange(index, "surname", value)} />
                      <InputField label="Given Name" value={passenger.givenName} onChange={(value) => onPassengerChange(index, "givenName", value)} />
                      <InputField label="Passport No" value={passenger.passportNo} onChange={(value) => onPassengerChange(index, "passportNo", value)} />
                      <CountrySelectField label="Nationality" value={passenger.nationality} onChange={(value) => onPassengerChange(index, "nationality", value)} />
                      <InputField label="Date of Birth" type="date" value={passenger.dob} onChange={(value) => onPassengerChange(index, "dob", value)} />
                      <InputField label="Passport Expiry" type="date" value={passenger.passportExpiry} onChange={(value) => onPassengerChange(index, "passportExpiry", value)} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <button type="button" onClick={onPrint} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17256b] px-6 py-4 text-sm font-black text-white">
              <Printer className="h-4 w-4" />
              Print White Label Ticket Slip
            </button>
          </div>

          <div className="lg:col-span-5">
            <div id="ticket-print" className="rounded-3xl border bg-white p-6 print:border-none print:p-0">
              <div className="mb-6 flex items-center justify-between border-b pb-5">
                <div className="flex items-center gap-4">
                  {agency.logo ? (
                    <img src={agency.logo} alt={agency.name} className="h-14 w-14 rounded-2xl object-contain" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#17256b] text-lg font-black text-white">
                      {agency.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-black text-slate-950">{agency.name}</h3>
                    <p className="text-xs font-bold text-slate-500">White Label Airline Group Booking Slip</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-black uppercase text-slate-400">Ref</p>
                  <p className="text-sm font-black text-slate-950">{group.group_code || group.pnr || "DRAFT"}</p>
                </div>
              </div>

              <div className="rounded-3xl bg-[#101b4d] p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">{airline} — {code}</p>
                <h4 className="mt-2 text-2xl font-black">{group.group_name}</h4>
                <p className="mt-1 text-sm font-bold text-blue-100">{sectorKey(group)}</p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <PrintInfo label="Departure" value={formatDate(getDepartureDate(group))} />
                {!isOneWay && <PrintInfo label="Return" value={formatDate(getReturnDate(group))} />}
                <PrintInfo label="PNR" value={group.pnr || "-"} />
                <PrintInfo label="Passengers" value={totalSeats} />
                <PrintInfo label="Per Seat" value={money(fare)} />
                <PrintInfo label="Total Amount" value={money(totalAmount)} />
                <PrintInfo label="Available Seats" value={toNumber(group.available_seats)} />
              </div>

              <div className="mt-5">
                <h4 className="mb-2 text-sm font-black text-slate-950">Flight Schedule</h4>
                <div className="space-y-2">
                  {schedule.length === 0 ? (
                    <p className="rounded-2xl border bg-slate-50 p-3 text-xs font-bold text-slate-600">Schedule not attached.</p>
                  ) : (
                    schedule.map((leg, index) => (
                      <div key={index} className="rounded-2xl border bg-slate-50 p-3">
                        <p className="text-sm font-black text-slate-950">
                          {leg.flight_no || "-"} • {leg.from_city || "-"} → {leg.to_city || "-"}
                        </p>
                        <p className="text-xs font-bold text-slate-600">
                          DEP {leg.dep_time || "-"} • ARR {leg.arr_time || "-"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5">
                <h4 className="mb-2 text-sm font-black text-slate-950">Passenger Passport Details</h4>
                <div className="overflow-hidden rounded-2xl border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-white">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Surname</th>
                        <th className="p-2">Given Name</th>
                        <th className="p-2">Passport</th>
                        <th className="p-2">Nationality</th>
                      </tr>
                    </thead>

                    <tbody>
                      {booking.passengers.map((passenger, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 font-bold">{index + 1}</td>
                          <td className="p-2 font-bold uppercase">{passenger.type}</td>
                          <td className="p-2 font-bold">{passenger.surname || "-"}</td>
                          <td className="p-2 font-bold">{passenger.title} {passenger.givenName || "-"}</td>
                          <td className="p-2 font-bold">{passenger.passportNo || "-"}</td>
                          <td className="p-2 font-bold">{passenger.nationality || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="mt-5 rounded-2xl bg-yellow-50 p-4 text-xs font-bold text-slate-700">
                This is a booking request slip. Final confirmation depends on airline/group controller approval and seat blocking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-black uppercase text-slate-500">{label}</span>
      <input type="number" min={0} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border px-4 py-3 text-sm font-black outline-none focus:border-blue-500" />
    </label>
  );
}

function InputField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-black uppercase text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-blue-500" />
    </label>
  );
}

function CountrySelectField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-black uppercase text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-blue-500"
      >
        <option value="">Select Country</option>
        {COUNTRIES.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactElement<{ className?: string }> }) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase text-slate-500">{title}</p>
        {React.cloneElement(icon, { className: "h-5 w-5 text-blue-600" })}
      </div>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
      <p className="text-[10px] font-black uppercase text-blue-100">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function PrintInfo({ label, value }: { label: string | number; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
