"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  Building2,
  CalendarDays,
  CheckCircle2,
  Flame,
  Lock,
  Plane,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Ticket,
  Trash2,
  Unlock,
} from "lucide-react";

type Status = "draft" | "published" | "locked" | "closed";
type GroupType = "umrah_group" | "one_way_group";

type FlightLeg = {
  flight_no: string;
  dep_date: string;
  dep_time: string;
  from_city: string;
  to_city: string;
  class_code: string;
  arr_date: string;
  arr_time: string;
  baggage: string;
  terminal: string;
  notes: string;
};

type SupplierRow = {
  id: string;
  name: string;
  code?: string;
  ledger_account_id?: string;
  source_table?: string;
};

type GroupForm = {
  id?: string;
  group_name: string;
  group_code: string;
  airline: string;
  airline_name?: string;
  supplier_id: string;
  supplier_name: string;
  supplier_code: string;
  supplier_ledger_account_id: string;
  supplier_payable_amount: number;
  supplier_payment_status: string;
  group_type: GroupType;
  status: Status;
  from_city: string;
  to_city: string;
  departure_date: string;
  return_date: string;
  total_seats: number;
  reserved_seats: number;
  pnr: string;
  flight_schedule: FlightLeg[];
  buying_currency: string;
  selling_currency: string;
  exchange_rate_to_pkr: number;
  target_margin_percent: number;
  buying_price_per_seat: number;
  b2b_selling_price_per_seat: number;
  b2c_selling_price_per_seat: number;
  adult_buying_price_per_seat: number;
  adult_b2b_selling_price_per_seat: number;
  adult_b2c_selling_price_per_seat: number;
  child_buying_price_per_seat: number;
  child_b2b_selling_price_per_seat: number;
  child_b2c_selling_price_per_seat: number;
  infant_buying_price_per_seat: number;
  infant_b2b_selling_price_per_seat: number;
  infant_b2c_selling_price_per_seat: number;
  pnr_text: string;
  is_locked: boolean;
};

type GroupRow = Partial<GroupForm> & {
  available_seats?: number;
  risk_status?: string;
};

type FieldErrors = Partial<Record<keyof GroupForm | "general", string>>;

const DEFAULT_AIRLINES = [
  "Saudi Airlines",
  "PIA",
  "Airblue",
  "Serene Air",
  "Flynas",
  "Emirates",
  "Qatar Airways",
  "Air Arabia",
  "Fly Jinnah",
  "Jazeera Airways",
  "Gulf Air",
  "Etihad Airways",
  "Turkish Airlines",
  "Oman Air",
];

const ADD_NEW_AIRLINE = "__add_new_airline__";

const blankLeg: FlightLeg = {
  flight_no: "",
  dep_date: "",
  dep_time: "",
  from_city: "",
  to_city: "",
  class_code: "Y",
  arr_date: "",
  arr_time: "",
  baggage: "",
  terminal: "",
  notes: "",
};

const emptyForm: GroupForm = {
  group_name: "LAHORE-JEDDAH GROUP",
  group_code: "",
  airline: "Saudi Airlines",
  airline_name: "Saudi Airlines",
  supplier_id: "",
  supplier_name: "",
  supplier_code: "",
  supplier_ledger_account_id: "",
  supplier_payable_amount: 0,
  supplier_payment_status: "unpaid",
  group_type: "umrah_group",
  status: "draft",
  from_city: "Lahore",
  to_city: "Jeddah",
  departure_date: "",
  return_date: "",
  total_seats: 50,
  reserved_seats: 0,
  pnr: "",
  flight_schedule: [{ ...blankLeg }],
  buying_currency: "PKR",
  selling_currency: "PKR",
  exchange_rate_to_pkr: 1,
  target_margin_percent: 5,
  buying_price_per_seat: 0,
  b2b_selling_price_per_seat: 0,
  b2c_selling_price_per_seat: 0,
  adult_buying_price_per_seat: 0,
  adult_b2b_selling_price_per_seat: 0,
  adult_b2c_selling_price_per_seat: 0,
  child_buying_price_per_seat: 0,
  child_b2b_selling_price_per_seat: 0,
  child_b2c_selling_price_per_seat: 0,
  infant_buying_price_per_seat: 0,
  infant_b2b_selling_price_per_seat: 0,
  infant_b2c_selling_price_per_seat: 0,
  pnr_text: "",
  is_locked: false,
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown): string {
  return `PKR ${Math.round(toNumber(value)).toLocaleString()}`;
}

function isBeforeDate(value: string, minValue: string): boolean {
  return Boolean(value && minValue && value < minValue);
}

function labelGroupType(value?: string): string {
  return value === "one_way_group" ? "One Way Group" : "Umrah Group";
}

function labelStatus(value?: string): string {
  if (value === "published") return "Published";
  if (value === "locked") return "Locked";
  if (value === "closed") return "Closed";
  return "Draft";
}

async function readJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: `API returned non-JSON response. Status: ${res.status}. ${text.slice(0, 180)}`,
    };
  }
}

function detectFieldErrors(message: string): FieldErrors {
  const lower = message.toLowerCase();

  if (
    lower.includes("duplicate key") ||
    lower.includes("group_code") ||
    lower.includes("umrah_airline_groups_group_code_key")
  ) {
    return {
      group_code: "This group code already exists. Please enter a unique code.",
      general: "Duplicate group code detected.",
    };
  }

  if (lower.includes("pnr")) {
    return {
      pnr: "PNR value looks duplicated or invalid.",
      general: message,
    };
  }

  return { general: message };
}

function syncLegWithMainFields(
  leg: FlightLeg,
  form: Pick<GroupForm, "departure_date" | "from_city" | "to_city">
): FlightLeg {
  const depDate = leg.dep_date || form.departure_date;
  const safeArrDate =
    leg.arr_date && depDate && leg.arr_date < depDate ? depDate : leg.arr_date || depDate;

  return {
    ...leg,
    dep_date: depDate,
    arr_date: safeArrDate,
    from_city: leg.from_city || form.from_city,
    to_city: leg.to_city || form.to_city,
  };
}

export default function AdminUmrahGroupsPage() {
  const [form, setForm] = useState<GroupForm>(emptyForm);
  const [rows, setRows] = useState<GroupRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [airlines, setAirlines] = useState<string[]>(DEFAULT_AIRLINES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const calc = useMemo(() => {
    const totalSeats = Math.max(0, toNumber(form.total_seats));
    const reservedSeats = Math.max(0, toNumber(form.reserved_seats));
    const availableSeats = Math.max(totalSeats - reservedSeats, 0);
    const margin = Math.max(0, toNumber(form.target_margin_percent));

    const adultBuying = Math.max(0, toNumber(form.adult_buying_price_per_seat));
    const adultB2B = Math.max(0, toNumber(form.adult_b2b_selling_price_per_seat));
    const adultB2C = Math.max(0, toNumber(form.adult_b2c_selling_price_per_seat));

    const childBuying = Math.max(0, toNumber(form.child_buying_price_per_seat));
    const childB2B = Math.max(0, toNumber(form.child_b2b_selling_price_per_seat));
    const childB2C = Math.max(0, toNumber(form.child_b2c_selling_price_per_seat));

    const infantBuying = Math.max(0, toNumber(form.infant_buying_price_per_seat));
    const infantB2B = Math.max(0, toNumber(form.infant_b2b_selling_price_per_seat));
    const infantB2C = Math.max(0, toNumber(form.infant_b2c_selling_price_per_seat));

    const adultAiB2B = Math.round(adultBuying + adultBuying * (margin / 100));
    const adultAiB2C = Math.round(adultAiB2B + adultAiB2B * 0.08);

    const adultProfitB2B = adultB2B - adultBuying;
    const adultProfitB2C = adultB2C - adultBuying;
    const childProfitB2B = childB2B - childBuying;
    const childProfitB2C = childB2C - childBuying;
    const infantProfitB2B = infantB2B - infantBuying;
    const infantProfitB2C = infantB2C - infantBuying;

    const supplierPayable = adultBuying * totalSeats;
    const leak = adultBuying > 0 && adultB2B > 0 && adultB2B < adultAiB2B;

    const risk =
      adultBuying <= 0
        ? "Adult Buying Missing"
        : totalSeats <= 0
          ? "Seats Missing"
          : reservedSeats > totalSeats
            ? "Seat Count Error"
            : availableSeats <= 0
              ? "Sold Out"
              : leak
                ? "Margin Leak"
                : "Normal";

    return {
      totalSeats,
      reservedSeats,
      availableSeats,
      adultAiB2B,
      adultAiB2C,
      adultProfitB2B,
      adultProfitB2C,
      childProfitB2B,
      childProfitB2C,
      infantProfitB2B,
      infantProfitB2C,
      totalProfitB2B: adultProfitB2B * reservedSeats,
      totalProfitB2C: adultProfitB2C * reservedSeats,
      supplierPayable,
      leak,
      risk,
    };
  }, [form]);

  async function loadGroups(): Promise<void> {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("admin", "1");
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("group_type", typeFilter);

      const res = await fetch(`/api/umrah/groups?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await readJsonSafe(res);
      setRows(res.ok && json.ok && Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.error("LOAD GROUPS ERROR:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSuppliers(): Promise<void> {
    setSupplierLoading(true);
    try {
      const res = await fetch("/api/umrah/groups?suppliers=1", {
        cache: "no-store",
      });

      const json = await readJsonSafe(res);
      setSuppliers(res.ok && json.ok && Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.error("LOAD SUPPLIERS ERROR:", error);
      setSuppliers([]);
    } finally {
      setSupplierLoading(false);
    }
  }

  useEffect(() => {
    void loadGroups();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    void loadSuppliers();
  }, []);

  function clearFieldError(field: keyof GroupForm): void {
    setErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function setTextField(field: keyof GroupForm, value: string): void {
    clearFieldError(field);

    setForm((previous) => {
      const next = { ...previous, [field]: value } as GroupForm;

      if (field === "airline") {
        next.airline_name = value;
      }

      if (field === "group_type" && value === "one_way_group") {
        next.return_date = "";
      }

      if (field === "departure_date") {
        if (next.return_date && isBeforeDate(next.return_date, value)) {
          next.return_date = "";
        }

        next.flight_schedule = previous.flight_schedule.map((leg) =>
          syncLegWithMainFields(
            {
              ...leg,
              dep_date: value,
              arr_date: leg.arr_date && leg.arr_date < value ? value : leg.arr_date || value,
            },
            {
              departure_date: value,
              from_city: previous.from_city,
              to_city: previous.to_city,
            }
          )
        );
      }

      if (field === "from_city") {
        next.flight_schedule = previous.flight_schedule.map((leg) => ({
          ...leg,
          from_city: value,
        }));
      }

      if (field === "to_city") {
        next.flight_schedule = previous.flight_schedule.map((leg) => ({
          ...leg,
          to_city: value,
        }));
      }

      return next;
    });
  }

  function setNumberField(field: keyof GroupForm, value: string): void {
    clearFieldError(field);
    const numberValue = Math.max(0, toNumber(value));

    setForm((previous) => {
      const next = { ...previous, [field]: numberValue } as GroupForm;

      if (field === "adult_buying_price_per_seat") {
        next.buying_price_per_seat = numberValue;
      }

      if (field === "adult_b2b_selling_price_per_seat") {
        next.b2b_selling_price_per_seat = numberValue;
      }

      if (field === "adult_b2c_selling_price_per_seat") {
        next.b2c_selling_price_per_seat = numberValue;
      }

      return next;
    });
  }

  function handleAirlineChange(value: string): void {
    if (value === ADD_NEW_AIRLINE) {
      const name = window.prompt("Enter new airline name");
      const cleanName = name?.trim();

      if (!cleanName) return;

      setAirlines((previous) =>
        previous.includes(cleanName) ? previous : [...previous, cleanName]
      );

      setTextField("airline", cleanName);
      return;
    }

    setTextField("airline", value);
  }

  function selectSupplier(id: string): void {
    const supplier = suppliers.find((item) => item.id === id);

    setForm((previous) => ({
      ...previous,
      supplier_id: supplier?.id || "",
      supplier_name: supplier?.name || "",
      supplier_code: supplier?.code || "",
      supplier_ledger_account_id: supplier?.ledger_account_id || supplier?.id || "",
      supplier_payable_amount: calc.supplierPayable,
    }));
  }

  function updateLeg(index: number, field: keyof FlightLeg, value: string): void {
    setForm((previous) => ({
      ...previous,
      flight_schedule: previous.flight_schedule.map((leg, legIndex) => {
        if (legIndex !== index) return leg;

        const updated = { ...leg, [field]: value } as FlightLeg;

        if (field === "dep_date") {
          if (updated.arr_date && value && updated.arr_date < value) {
            updated.arr_date = value;
          }
        }

        if (field === "arr_date") {
          const minDate = updated.dep_date || previous.departure_date;
          if (minDate && value < minDate) {
            updated.arr_date = minDate;
          }
        }

        return syncLegWithMainFields(updated, previous);
      }),
    }));
  }

  function addLeg(): void {
    setForm((previous) => ({
      ...previous,
      flight_schedule: [
        ...previous.flight_schedule,
        syncLegWithMainFields({ ...blankLeg }, previous),
      ],
    }));
  }

  function removeLeg(index: number): void {
    setForm((previous) => ({
      ...previous,
      flight_schedule:
        previous.flight_schedule.length <= 1
          ? [syncLegWithMainFields({ ...blankLeg }, previous)]
          : previous.flight_schedule.filter((_leg, legIndex) => legIndex !== index),
    }));
  }

  function parsePNR(): void {
    const text = String(form.pnr_text || "");
    const flightMatches = text.match(/[A-Z]{2,3}\s?\d{2,4}/gi) || [];
    const timeMatches = text.match(/\b\d{1,2}[:.]\d{2}\b/g) || [];

    const detectedLegs =
      flightMatches.length > 0
        ? flightMatches.map((flight, index) =>
            syncLegWithMainFields(
              {
                ...blankLeg,
                flight_no: flight.toUpperCase().replace(/\s+/g, " "),
                dep_time: timeMatches[index] || "",
              },
              form
            )
          )
        : form.flight_schedule;

    setForm((previous) => ({
      ...previous,
      pnr: flightMatches[0]?.toUpperCase() || previous.pnr,
      flight_schedule: detectedLegs,
    }));
  }

  function editGroup(row: GroupRow): void {
    setErrors({});

    const airlineName = String(row.airline || row.airline_name || "Saudi Airlines");

    if (airlineName && !airlines.includes(airlineName)) {
      setAirlines((previous) => [...previous, airlineName]);
    }

    const nextForm: GroupForm = {
      ...emptyForm,
      ...row,
      id: row.id,
      group_name: String(row.group_name || ""),
      group_code: String(row.group_code || ""),
      airline: airlineName,
      airline_name: airlineName,
      supplier_id: String(row.supplier_id || ""),
      supplier_name: String(row.supplier_name || ""),
      supplier_code: String(row.supplier_code || ""),
      supplier_ledger_account_id: String(row.supplier_ledger_account_id || ""),
      supplier_payable_amount: toNumber(row.supplier_payable_amount),
      supplier_payment_status: String(row.supplier_payment_status || "unpaid"),
      group_type: row.group_type === "one_way_group" ? "one_way_group" : "umrah_group",
      status:
        row.status === "published" || row.status === "locked" || row.status === "closed"
          ? row.status
          : "draft",
      from_city: String(row.from_city || ""),
      to_city: String(row.to_city || ""),
      departure_date: String(row.departure_date || ""),
      return_date: String(row.return_date || ""),
      total_seats: toNumber(row.total_seats),
      reserved_seats: toNumber(row.reserved_seats),
      pnr: String(row.pnr || ""),
      flight_schedule:
        Array.isArray(row.flight_schedule) && row.flight_schedule.length > 0
          ? (row.flight_schedule as FlightLeg[])
          : [{ ...blankLeg }],
      buying_currency: String(row.buying_currency || "PKR"),
      selling_currency: String(row.selling_currency || "PKR"),
      exchange_rate_to_pkr: toNumber(row.exchange_rate_to_pkr) || 1,
      target_margin_percent: toNumber(row.target_margin_percent) || 5,
      buying_price_per_seat: toNumber(row.buying_price_per_seat),
      b2b_selling_price_per_seat: toNumber(row.b2b_selling_price_per_seat),
      b2c_selling_price_per_seat: toNumber(row.b2c_selling_price_per_seat),
      adult_buying_price_per_seat: toNumber(
        row.adult_buying_price_per_seat || row.buying_price_per_seat
      ),
      adult_b2b_selling_price_per_seat: toNumber(
        row.adult_b2b_selling_price_per_seat || row.b2b_selling_price_per_seat
      ),
      adult_b2c_selling_price_per_seat: toNumber(
        row.adult_b2c_selling_price_per_seat || row.b2c_selling_price_per_seat
      ),
      child_buying_price_per_seat: toNumber(row.child_buying_price_per_seat),
      child_b2b_selling_price_per_seat: toNumber(row.child_b2b_selling_price_per_seat),
      child_b2c_selling_price_per_seat: toNumber(row.child_b2c_selling_price_per_seat),
      infant_buying_price_per_seat: toNumber(row.infant_buying_price_per_seat),
      infant_b2b_selling_price_per_seat: toNumber(row.infant_b2b_selling_price_per_seat),
      infant_b2c_selling_price_per_seat: toNumber(row.infant_b2c_selling_price_per_seat),
      pnr_text: String(row.pnr_text || ""),
      is_locked: Boolean(row.is_locked || row.status === "locked"),
    };

    nextForm.flight_schedule = nextForm.flight_schedule.map((leg) =>
      syncLegWithMainFields(leg, nextForm)
    );

    setForm(nextForm);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateBeforeSave(): boolean {
    const nextErrors: FieldErrors = {};

    if (!form.group_name.trim()) nextErrors.group_name = "Group name is required.";
    if (!form.group_code.trim()) nextErrors.group_code = "Group code is required.";
    if (!form.airline.trim()) nextErrors.airline = "Airline is required.";
    if (!form.from_city.trim()) nextErrors.from_city = "From city is required.";
    if (!form.to_city.trim()) nextErrors.to_city = "To city is required.";
    if (!form.departure_date) nextErrors.departure_date = "Departure date is required.";

    if (
      form.group_type === "umrah_group" &&
      form.return_date &&
      isBeforeDate(form.return_date, form.departure_date)
    ) {
      nextErrors.return_date = "Return date cannot be before departure date.";
    }

    if (toNumber(form.total_seats) <= 0) {
      nextErrors.total_seats = "Total seats must be greater than 0.";
    }

    if (toNumber(form.reserved_seats) > toNumber(form.total_seats)) {
      nextErrors.reserved_seats = "Reserved seats cannot be greater than total seats.";
    }

    if (Object.keys(nextErrors).length > 0) {
      nextErrors.general = "Please fix the red highlighted fields.";
      setErrors(nextErrors);
      return false;
    }

    setErrors({});
    return true;
  }

  async function saveGroup(nextStatus: Status = form.status, nextLocked?: boolean): Promise<void> {
    if (!validateBeforeSave()) return;

    setSaving(true);
    setErrors({});

    try {
      const finalLocked =
        typeof nextLocked === "boolean" ? nextLocked : nextStatus === "locked";

      const syncedSchedule = form.flight_schedule.map((leg) =>
        syncLegWithMainFields(leg, form)
      );

      const payload: GroupForm & Record<string, unknown> = {
        ...form,
        airline_name: form.airline,
        status: nextStatus,
        is_locked: finalLocked,
        return_date: form.group_type === "one_way_group" ? "" : form.return_date,
        flight_schedule: syncedSchedule,
        supplier_payable_amount: form.supplier_payable_amount || calc.supplierPayable,
        available_seats: calc.availableSeats,
        buying_price_per_seat: form.adult_buying_price_per_seat,
        b2b_selling_price_per_seat: form.adult_b2b_selling_price_per_seat,
        b2c_selling_price_per_seat: form.adult_b2c_selling_price_per_seat,
        ai_suggested_b2b_price: calc.adultAiB2B,
        ai_suggested_b2c_price: calc.adultAiB2C,
        profit_per_seat_b2b: calc.adultProfitB2B,
        profit_per_seat_b2c: calc.adultProfitB2C,
        total_profit_b2b: calc.totalProfitB2B,
        total_profit_b2c: calc.totalProfitB2C,
        pricing_breakdown_json: {
          adult: {
            buying: form.adult_buying_price_per_seat,
            b2b: form.adult_b2b_selling_price_per_seat,
            b2c: form.adult_b2c_selling_price_per_seat,
          },
          child: {
            buying: form.child_buying_price_per_seat,
            b2b: form.child_b2b_selling_price_per_seat,
            b2c: form.child_b2c_selling_price_per_seat,
          },
          infant: {
            buying: form.infant_buying_price_per_seat,
            b2b: form.infant_b2b_selling_price_per_seat,
            b2c: form.infant_b2c_selling_price_per_seat,
          },
        },
        parsed_pnr_json: {
          source: "admin_form",
          parsed_at: new Date().toISOString(),
        },
      };

      const res = await fetch("/api/umrah/groups", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await readJsonSafe(res);

      if (!res.ok || !json.ok) {
        const message = String(json.error || json.message || "Failed to save group.");
        setErrors(detectFieldErrors(message));
        return;
      }

      alert(
        nextStatus === "published"
          ? "Group published successfully."
          : nextStatus === "locked"
            ? "Group locked successfully."
            : nextStatus === "closed"
              ? "Group closed successfully."
              : "Draft saved successfully."
      );

      setForm(emptyForm);
      await loadGroups();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Group save failed.";
      setErrors(detectFieldErrors(message));
      console.error("GROUP SAVE ERROR:", error);
    } finally {
      setSaving(false);
    }
  }

  const filteredRows = rows.filter((row) => {
    const query = search.toLowerCase();
    const airline = String(row.airline || row.airline_name || "");

    return (
      !query ||
      String(row.group_name || "").toLowerCase().includes(query) ||
      String(row.group_code || "").toLowerCase().includes(query) ||
      airline.toLowerCase().includes(query) ||
      String(row.supplier_name || "").toLowerCase().includes(query) ||
      String(row.from_city || "").toLowerCase().includes(query) ||
      String(row.to_city || "").toLowerCase().includes(query)
    );
  });

  const publishedCount = rows.filter((row) => row.status === "published").length;
  const draftCount = rows.filter((row) => row.status === "draft").length;
  const lockedCount = rows.filter((row) => row.status === "locked").length;

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            Admin Control
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Umrah Airline Group Admin
          </h1>
          <p className="text-sm text-slate-500">
            Create, price, supplier-link, publish, lock and monitor airline groups.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(emptyForm);
            setErrors({});
          }}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
        >
          New Group
        </button>
      </div>

      {errors.general && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
          {errors.general}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard title="Total Groups" value={rows.length} icon={<Ticket />} />
        <SummaryCard title="Published" value={publishedCount} icon={<CheckCircle2 />} />
        <SummaryCard title="Draft" value={draftCount} icon={<CalendarDays />} />
        <SummaryCard title="Locked" value={lockedCount} icon={<Lock />} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <Card title="Basic Airline Group Information" icon={<Plane />}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Field label="Group Name" value={form.group_name} error={errors.group_name} disabled={form.is_locked} onChange={(value) => setTextField("group_name", value)} />
              <Field label="Group Code / PNR Ref" value={form.group_code} error={errors.group_code} disabled={form.is_locked} onChange={(value) => setTextField("group_code", value)} />

              <Select
                label="Airline"
                value={form.airline}
                error={errors.airline}
                disabled={form.is_locked}
                onChange={handleAirlineChange}
                options={[...airlines, [ADD_NEW_AIRLINE, "+ Add New Airline"]]}
              />

              <Select
                label="Group Type"
                value={form.group_type}
                disabled={form.is_locked}
                onChange={(value) => setTextField("group_type", value)}
                options={[
                  ["umrah_group", "Umrah Group"],
                  ["one_way_group", "One Way Group"],
                ]}
              />

              <Field label="From City" value={form.from_city} error={errors.from_city} disabled={form.is_locked} onChange={(value) => setTextField("from_city", value)} />
              <Field label="To City" value={form.to_city} error={errors.to_city} disabled={form.is_locked} onChange={(value) => setTextField("to_city", value)} />
              <Field label="Departure Date" type="date" value={form.departure_date} error={errors.departure_date} disabled={form.is_locked} onChange={(value) => setTextField("departure_date", value)} />

              <DateField
                label="Return Date"
                value={form.return_date}
                min={form.departure_date}
                error={errors.return_date}
                disabled={form.group_type === "one_way_group" || form.is_locked}
                onChange={(value) => setTextField("return_date", value)}
              />

              <Field label="Total Seats" type="number" value={form.total_seats} error={errors.total_seats} disabled={form.is_locked} onChange={(value) => setNumberField("total_seats", value)} />
              <Field label="Reserved Seats" type="number" value={form.reserved_seats} error={errors.reserved_seats} disabled={form.is_locked} onChange={(value) => setNumberField("reserved_seats", value)} />
              <Field label="PNR" value={form.pnr} error={errors.pnr} disabled={form.is_locked} onChange={(value) => setTextField("pnr", value)} />
              <Field label="Available Seats" type="number" value={calc.availableSeats} disabled onChange={() => undefined} />
            </div>
          </Card>

          <Card title="Supplier / Airline Payable Ledger Link" icon={<Building2 />}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">
                  Select Supplier
                </span>
                <select
                  value={form.supplier_id}
                  disabled={form.is_locked || supplierLoading}
                  onChange={(event) => selectSupplier(event.target.value)}
                  className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                >
                  <option value="">
                    {supplierLoading ? "Loading suppliers..." : "Select supplier from accounts"}
                  </option>
                  {suppliers.map((supplier) => (
                    <option key={`${supplier.source_table || "supplier"}-${supplier.id}`} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {form.supplier_name && (
                  <p className="mt-2 text-xs font-bold text-emerald-700">
                    Auto-linked: {form.supplier_name}
                    {form.supplier_code ? ` • ${form.supplier_code}` : ""}
                  </p>
                )}
              </label>

              <Field label="Supplier Payable" type="number" value={form.supplier_payable_amount || calc.supplierPayable} disabled={form.is_locked} onChange={(value) => setNumberField("supplier_payable_amount", value)} />
              <Select label="Payment Status" value={form.supplier_payment_status} disabled={form.is_locked} onChange={(value) => setTextField("supplier_payment_status", value)} options={[["unpaid", "Unpaid"], ["partial", "Partial"], ["paid", "Paid"]]} />
              <Field label="Auto Payable Estimate" type="number" value={calc.supplierPayable} disabled onChange={() => undefined} />
            </div>
          </Card>

          <Card title="One-Click PNR Schedule Parser" icon={<BrainCircuit />}>
            <textarea
              value={form.pnr_text}
              disabled={form.is_locked}
              onChange={(event) => setTextField("pnr_text", event.target.value)}
              placeholder="Paste PNR / schedule text."
              className="min-h-28 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
            />
            <button
              type="button"
              disabled={form.is_locked}
              onClick={parsePNR}
              className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Parse PNR & Auto Fill Schedule
            </button>
          </Card>

          <Card title="Flight Schedule Matrix" icon={<Plane />}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <Th>Flight</Th>
                    <Th>Dep Date</Th>
                    <Th>Dep Time</Th>
                    <Th>From</Th>
                    <Th>To</Th>
                    <Th>Class</Th>
                    <Th>Arr Date</Th>
                    <Th>Arr Time</Th>
                    <Th>Baggage</Th>
                    <Th>Terminal</Th>
                    <Th>Remove</Th>
                  </tr>
                </thead>

                <tbody>
                  {form.flight_schedule.map((leg, index) => (
                    <tr key={index} className="border-b">
                      <MatrixInput value={leg.flight_no} disabled={form.is_locked} onChange={(value) => updateLeg(index, "flight_no", value.toUpperCase())} />
                      <MatrixInput type="date" value={leg.dep_date || form.departure_date} disabled={form.is_locked} onChange={(value) => updateLeg(index, "dep_date", value)} />
                      <MatrixInput type="time" value={leg.dep_time} disabled={form.is_locked} onChange={(value) => updateLeg(index, "dep_time", value)} />
                      <MatrixInput value={leg.from_city || form.from_city} disabled={form.is_locked} onChange={(value) => updateLeg(index, "from_city", value)} />
                      <MatrixInput value={leg.to_city || form.to_city} disabled={form.is_locked} onChange={(value) => updateLeg(index, "to_city", value)} />
                      <MatrixInput value={leg.class_code} disabled={form.is_locked} onChange={(value) => updateLeg(index, "class_code", value)} />
                      <MatrixInput type="date" min={leg.dep_date || form.departure_date} value={leg.arr_date || leg.dep_date || form.departure_date} disabled={form.is_locked} onChange={(value) => updateLeg(index, "arr_date", value)} />
                      <MatrixInput type="time" value={leg.arr_time} disabled={form.is_locked} onChange={(value) => updateLeg(index, "arr_time", value)} />
                      <MatrixInput value={leg.baggage} disabled={form.is_locked} onChange={(value) => updateLeg(index, "baggage", value)} />
                      <MatrixInput value={leg.terminal} disabled={form.is_locked} onChange={(value) => updateLeg(index, "terminal", value)} />

                      <td className="px-3 py-3">
                        <button
                          type="button"
                          disabled={form.is_locked}
                          onClick={() => removeLeg(index)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              disabled={form.is_locked}
              onClick={addLeg}
              className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Flight Segment
            </button>
          </Card>

          <Card title="Passenger Pricing - Adult / Child / Infant" icon={<Flame />}>
            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Select label="Buying Currency" value={form.buying_currency} disabled={form.is_locked} onChange={(value) => setTextField("buying_currency", value)} options={["PKR", "SAR", "USD", "AED"]} />
              <Select label="Selling Currency" value={form.selling_currency} disabled={form.is_locked} onChange={(value) => setTextField("selling_currency", value)} options={["PKR", "SAR", "USD", "AED"]} />
              <Field label="Exchange Rate to PKR" type="number" value={form.exchange_rate_to_pkr} disabled={form.is_locked} onChange={(value) => setNumberField("exchange_rate_to_pkr", value)} />
              <Field label="Target Margin %" type="number" value={form.target_margin_percent} disabled={form.is_locked} onChange={(value) => setNumberField("target_margin_percent", value)} />
            </div>

            <div className="space-y-4">
              <PricingRow title="Adult Rate" buying={form.adult_buying_price_per_seat} b2b={form.adult_b2b_selling_price_per_seat} b2c={form.adult_b2c_selling_price_per_seat} profitB2B={calc.adultProfitB2B} profitB2C={calc.adultProfitB2C} disabled={form.is_locked} onBuying={(value) => setNumberField("adult_buying_price_per_seat", value)} onB2B={(value) => setNumberField("adult_b2b_selling_price_per_seat", value)} onB2C={(value) => setNumberField("adult_b2c_selling_price_per_seat", value)} />
              <PricingRow title="Child Rate" buying={form.child_buying_price_per_seat} b2b={form.child_b2b_selling_price_per_seat} b2c={form.child_b2c_selling_price_per_seat} profitB2B={calc.childProfitB2B} profitB2C={calc.childProfitB2C} disabled={form.is_locked} onBuying={(value) => setNumberField("child_buying_price_per_seat", value)} onB2B={(value) => setNumberField("child_b2b_selling_price_per_seat", value)} onB2C={(value) => setNumberField("child_b2c_selling_price_per_seat", value)} />
              <PricingRow title="Infant Rate" buying={form.infant_buying_price_per_seat} b2b={form.infant_b2b_selling_price_per_seat} b2c={form.infant_b2c_selling_price_per_seat} profitB2B={calc.infantProfitB2B} profitB2C={calc.infantProfitB2C} disabled={form.is_locked} onBuying={(value) => setNumberField("infant_buying_price_per_seat", value)} onB2B={(value) => setNumberField("infant_b2b_selling_price_per_seat", value)} onB2C={(value) => setNumberField("infant_b2c_selling_price_per_seat", value)} />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <button type="button" disabled={saving} onClick={() => saveGroup("draft", false)} className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50">
              <Save className="h-4 w-4" /> Save Draft
            </button>

            <button type="button" disabled={saving || form.is_locked} onClick={() => saveGroup("published", false)} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50">
              <CheckCircle2 className="h-4 w-4" /> Publish Group
            </button>

            <button type="button" disabled={saving} onClick={() => saveGroup(form.is_locked ? "draft" : "locked", !form.is_locked)} className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-white hover:bg-amber-600 disabled:opacity-50">
              {form.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {form.is_locked ? "Unlock Group" : "Lock Group"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => {
                const ok = window.confirm("Are you sure you want to close this group?");
                if (!ok) return;
                void saveGroup("closed", false);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-4 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50"
            >
              Close Group
            </button>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <section className="rounded-2xl bg-[#17256b] p-6 text-white shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-black">
              <BrainCircuit className="h-5 w-5 text-yellow-300" />
              AI Admin Intelligence
            </h2>

            <Info label="Risk Status" value={calc.risk} />
            <Info label="Supplier" value={form.supplier_name || "Not Selected"} />
            <Info label="Supplier Payable" value={money(form.supplier_payable_amount || calc.supplierPayable)} />
            <Info label="Available Seats" value={calc.availableSeats} />
            <Info label="Adult AI B2B" value={money(calc.adultAiB2B)} />
            <Info label="Adult AI B2C" value={money(calc.adultAiB2C)} />
            <Info label="Adult B2B Profit / Seat" value={money(calc.adultProfitB2B)} />
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">
              Profit Leak Detector
            </h2>
            <div className={`rounded-xl p-4 ${calc.leak ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              <div className="flex items-center gap-2">
                {calc.leak ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                <p className="text-sm font-black">
                  {calc.leak ? "Adult B2B margin leak detected." : "Adult B2B margin is acceptable."}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <h2 className="text-lg font-black text-slate-950">Admin Airline Groups</h2>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search group, airline, supplier..." className="w-72 text-sm outline-none" />
            </div>

            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-xl border px-4 py-3 text-sm font-bold outline-none">
              <option value="all">All Types</option>
              <option value="umrah_group">Umrah Group</option>
              <option value="one_way_group">One Way Group</option>
            </select>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border px-4 py-3 text-sm font-bold outline-none">
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="locked">Locked</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-left text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <Th>Group</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>Airline</Th>
                <Th>Supplier</Th>
                <Th>Route</Th>
                <Th>Departure</Th>
                <Th>Return</Th>
                <Th>Seats</Th>
                <Th>Adult B2B</Th>
                <Th>Adult B2C</Th>
                <Th>Risk</Th>
                <Th>Action</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} className="p-6 text-center text-slate-500">
                    Loading groups...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-6 text-center text-slate-500">
                    No group found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <tr key={row.id || index} className="border-b">
                    <Td>{row.group_name || "-"}</Td>
                    <Td>{labelGroupType(row.group_type)}</Td>
                    <Td><StatusBadge status={row.status} /></Td>
                    <Td>{row.airline || row.airline_name || "-"}</Td>
                    <Td>{row.supplier_name || "-"}</Td>
                    <Td>{row.from_city || "-"} → {row.to_city || "-"}</Td>
                    <Td>{row.departure_date || "-"}</Td>
                    <Td>{row.return_date || "-"}</Td>
                    <Td>{row.reserved_seats || 0}/{row.total_seats || 0}</Td>
                    <Td>{money(row.adult_b2b_selling_price_per_seat || row.b2b_selling_price_per_seat)}</Td>
                    <Td>{money(row.adult_b2c_selling_price_per_seat || row.b2c_selling_price_per_seat)}</Td>
                    <Td>{row.risk_status || "normal"}</Td>
                    <Td>
                      <button type="button" onClick={() => editGroup(row)} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">
                        Edit
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactElement<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-950">
        {React.cloneElement(icon, { className: "h-5 w-5 text-blue-600" })}
        {title}
      </h2>
      {children}
    </section>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactElement<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
        {React.cloneElement(icon, { className: "h-5 w-5 text-blue-600" })}
      </div>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  error,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className={`mb-1 block text-xs font-black uppercase ${error ? "text-red-600" : "text-slate-500"}`}>
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border px-3 py-3 text-sm outline-none disabled:bg-slate-100 ${
          error ? "border-red-500 bg-red-50 text-red-900 ring-2 ring-red-100" : "focus:border-blue-500"
        }`}
      />
      {error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}
    </label>
  );
}

function DateField({
  label,
  value,
  min,
  onChange,
  disabled = false,
  error,
}: {
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className={`mb-1 block text-xs font-black uppercase ${error ? "text-red-600" : "text-slate-500"}`}>
        {label}
      </span>
      <input
        type="date"
        value={value || ""}
        min={min || undefined}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border px-3 py-3 text-sm outline-none disabled:bg-slate-100 ${
          error ? "border-red-500 bg-red-50 text-red-900 ring-2 ring-red-100" : "focus:border-blue-500"
        }`}
      />
      {error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}
    </label>
  );
}

type SelectOption = string | [string, string];

function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className={`mb-1 block text-xs font-black uppercase ${error ? "text-red-600" : "text-slate-500"}`}>
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border px-3 py-3 text-sm outline-none disabled:bg-slate-100 ${
          error ? "border-red-500 bg-red-50 text-red-900 ring-2 ring-red-100" : "focus:border-blue-500"
        }`}
      >
        {options.map((option) => {
          const optionValue = Array.isArray(option) ? option[0] : option;
          const optionLabel = Array.isArray(option) ? option[1] : option;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      {error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}
    </label>
  );
}

function MatrixInput({
  value,
  onChange,
  type = "text",
  disabled = false,
  min,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  min?: string;
}) {
  return (
    <td className="px-3 py-3">
      <input
        type={type}
        value={value || ""}
        min={min || undefined}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-24 rounded-lg border px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 disabled:bg-slate-100"
      />
    </td>
  );
}

function PricingRow({
  title,
  buying,
  b2b,
  b2c,
  profitB2B,
  profitB2C,
  disabled,
  onBuying,
  onB2B,
  onB2C,
}: {
  title: string;
  buying: number;
  b2b: number;
  b2c: number;
  profitB2B: number;
  profitB2C: number;
  disabled?: boolean;
  onBuying: (value: string) => void;
  onB2B: (value: string) => void;
  onB2C: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <h3 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-slate-700">
        {title}
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Field label="Buying / Seat" type="number" value={buying} disabled={disabled} onChange={onBuying} />
        <Field label="B2B Selling / Seat" type="number" value={b2b} disabled={disabled} onChange={onB2B} />
        <Field label="B2C Selling / Seat" type="number" value={b2c} disabled={disabled} onChange={onB2C} />
        <Field label="Profit B2B" type="number" value={profitB2B} disabled onChange={() => undefined} />
        <Field label="Profit B2C" type="number" value={profitB2C} disabled onChange={() => undefined} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const value = status || "draft";

  const className =
    value === "published"
      ? "bg-emerald-50 text-emerald-700"
      : value === "locked"
        ? "bg-amber-50 text-amber-700"
        : value === "closed"
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {labelStatus(value)}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
      <span className="text-xs font-bold text-blue-100">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-black uppercase">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 font-semibold text-slate-700">{children}</td>;
}