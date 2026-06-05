"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type HotelInventory = {
  id: string;
  hotel_name: string;
  supplier_name: string;
  city: string;
  category: string | null;
  sharing_rate: number | null;
  quad_rate: number | null;
  triple_rate: number | null;
  double_rate: number | null;
  currency: string | null;
  start_date: string | null;
  end_date: string | null;
  meal_plan: string | null;
  distance_from_haram: string | null;
};

type VisaInventory = {
  id: string;
  supplier_name: string;
  visa_type: string;
  nationality: string | null;
  cost_rate: number | null;
  currency: string | null;
  start_date: string | null;
  end_date: string | null;
};

type FormState = {
  package_name: string;
  package_code: string;
  package_type: string;
  status: string;

  departure_date: string;
  arrival_date: string;
  total_days: string;
  makkah_nights: string;
  madinah_nights: string;
  total_seats: string;

  airline_name: string;
  flight_number: string;

  makkah_hotel_inventory_id: string;
  madinah_hotel_inventory_id: string;
  visa_inventory_id: string;
  transport_plan_id: string;

  sharing_price: string;
  quad_price: string;
  triple_price: string;
  double_price: string;

  notes: string;
};

const airlineOptions = [
  "Saudi Airlines",
  "PIA",
  "AirSial",
  "Serene Air",
  "Airblue",
  "Flynas",
  "Emirates",
  "Qatar Airways",
  "Etihad Airways",
  "Turkish Airlines",
  "Other",
];

export default function NewUmrahPackagePage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [hotels, setHotels] = useState<HotelInventory[]>([]);
  const [visas, setVisas] = useState<VisaInventory[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

  const [form, setForm] = useState<FormState>({
    package_name: "",
    package_code: "",
    package_type: "group",
    status: "draft",

    departure_date: "",
    arrival_date: "",
    total_days: "0",
    makkah_nights: "0",
    madinah_nights: "0",
    total_seats: "0",

    airline_name: "",
    flight_number: "",

    makkah_hotel_inventory_id: "",
    madinah_hotel_inventory_id: "",
    visa_inventory_id: "",
    transport_plan_id: "",

    sharing_price: "0",
    quad_price: "0",
    triple_price: "0",
    double_price: "0",

    notes: "",
  });

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "departure_date" || key === "arrival_date") {
        const totalDays = calculateDays(
          key === "departure_date" ? value : next.departure_date,
          key === "arrival_date" ? value : next.arrival_date
        );

        next.total_days = String(totalDays);
      }

      if (key === "departure_date" && next.arrival_date && next.arrival_date < value) {
        next.arrival_date = value;
        next.total_days = "1";
      }

      return next;
    });
  };

  const loadInventory = async () => {
    try {
      setLoadingInventory(true);

      const [hotelRes, visaRes] = await Promise.all([
        fetch("/api/umrah/hotels", { cache: "no-store" }),
        fetch("/api/umrah/visa", { cache: "no-store" }),
      ]);

      const hotelJson = await hotelRes.json();
      const visaJson = await visaRes.json();

      if (hotelRes.ok) setHotels(hotelJson.data || []);
      if (visaRes.ok) setVisas(visaJson.data || []);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const makkahHotels = useMemo(() => {
    return hotels.filter((x) => x.city === "Makkah");
  }, [hotels]);

  const madinahHotels = useMemo(() => {
    return hotels.filter((x) => x.city === "Madinah");
  }, [hotels]);

  const selectedMakkahHotel = hotels.find(
    (x) => x.id === form.makkah_hotel_inventory_id
  );

  const selectedMadinahHotel = hotels.find(
    (x) => x.id === form.madinah_hotel_inventory_id
  );

  const selectedVisa = visas.find((x) => x.id === form.visa_inventory_id);

  const hotelCostPreview = useMemo(() => {
    const makkahNights = Number(form.makkah_nights || 0);
    const madinahNights = Number(form.madinah_nights || 0);

    return {
      sharing:
        Number(selectedMakkahHotel?.sharing_rate || 0) * makkahNights +
        Number(selectedMadinahHotel?.sharing_rate || 0) * madinahNights,

      quad:
        Number(selectedMakkahHotel?.quad_rate || 0) * makkahNights +
        Number(selectedMadinahHotel?.quad_rate || 0) * madinahNights,

      triple:
        Number(selectedMakkahHotel?.triple_rate || 0) * makkahNights +
        Number(selectedMadinahHotel?.triple_rate || 0) * madinahNights,

      double:
        Number(selectedMakkahHotel?.double_rate || 0) * makkahNights +
        Number(selectedMadinahHotel?.double_rate || 0) * madinahNights,
    };
  }, [form.makkah_nights, form.madinah_nights, selectedMakkahHotel, selectedMadinahHotel]);

  const visaCost = Number(selectedVisa?.cost_rate || 0);

  const save = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/umrah/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Package save failed");
        return;
      }

      alert("Umrah package saved successfully");
      router.push("/umrah/packages");
    } catch (err: any) {
      alert(err?.message || "Package save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">
            Create Umrah Package
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Attach hotel inventory, visa supplier, airline and room-wise package selling prices.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-4">
          <section className="xl:col-span-3 space-y-6">
            <Card title="Package Details">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Package Name"
                  value={form.package_name}
                  onChange={(v) => update("package_name", v)}
                />

                <Input
                  label="Package Code"
                  value={form.package_code}
                  onChange={(v) => update("package_code", v)}
                />

                <Select
                  label="Package Type"
                  value={form.package_type}
                  options={["group", "private", "custom"]}
                  onChange={(v) => update("package_type", v)}
                />

                <Select
                  label="Status"
                  value={form.status}
                  options={["draft", "live", "paused", "closed"]}
                  onChange={(v) => update("status", v)}
                />

                <Input
                  label="Departure Date"
                  type="date"
                  value={form.departure_date}
                  onChange={(v) => update("departure_date", v)}
                />

                <Input
                  label="Arrival / Return Date"
                  type="date"
                  min={form.departure_date}
                  value={form.arrival_date}
                  onChange={(v) => update("arrival_date", v)}
                />

                <Input
                  label="Total Days"
                  type="number"
                  value={form.total_days}
                  onChange={(v) => update("total_days", v)}
                />

                <Input
                  label="Total Seats"
                  type="number"
                  value={form.total_seats}
                  onChange={(v) => update("total_seats", v)}
                />

                <Input
                  label="Makkah Nights"
                  type="number"
                  value={form.makkah_nights}
                  onChange={(v) => update("makkah_nights", v)}
                />

                <Input
                  label="Madinah Nights"
                  type="number"
                  value={form.madinah_nights}
                  onChange={(v) => update("madinah_nights", v)}
                />
              </div>
            </Card>

            <Card title="Attach Inventory">
              {loadingInventory ? (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                  Loading inventory...
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    label="Makkah Hotel Inventory"
                    value={form.makkah_hotel_inventory_id}
                    options={[
                      { label: "Select Makkah Hotel", value: "" },
                      ...makkahHotels.map((x) => ({
                        label: `${x.hotel_name} — ${x.supplier_name} — ${x.start_date || "-"} to ${x.end_date || "-"}`,
                        value: x.id,
                      })),
                    ]}
                    onChange={(v) => update("makkah_hotel_inventory_id", v)}
                  />

                  <Select
                    label="Madinah Hotel Inventory"
                    value={form.madinah_hotel_inventory_id}
                    options={[
                      { label: "Select Madinah Hotel", value: "" },
                      ...madinahHotels.map((x) => ({
                        label: `${x.hotel_name} — ${x.supplier_name} — ${x.start_date || "-"} to ${x.end_date || "-"}`,
                        value: x.id,
                      })),
                    ]}
                    onChange={(v) => update("madinah_hotel_inventory_id", v)}
                  />

                  <Select
                    label="Visa Inventory"
                    value={form.visa_inventory_id}
                    options={[
                      { label: "Select Visa Supplier", value: "" },
                      ...visas.map((x) => ({
                        label: `${x.visa_type} — ${x.supplier_name} — ${x.cost_rate || 0} ${x.currency || "SAR"}`,
                        value: x.id,
                      })),
                    ]}
                    onChange={(v) => update("visa_inventory_id", v)}
                  />

                  <Input
                    label="Transport Plan ID / Name"
                    value={form.transport_plan_id}
                    onChange={(v) => update("transport_plan_id", v)}
                  />
                </div>
              )}
            </Card>

            <Card title="Airline & Flight">
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Airline"
                  value={form.airline_name}
                  options={[
                    { label: "Select Airline", value: "" },
                    ...airlineOptions.map((x) => ({ label: x, value: x })),
                  ]}
                  onChange={(v) => update("airline_name", v)}
                />

                <Input
                  label="Flight Number / PNR"
                  value={form.flight_number}
                  onChange={(v) => update("flight_number", v)}
                />
              </div>
            </Card>

            <Card title="Room-wise Selling Prices">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Sharing Selling Price"
                  type="number"
                  value={form.sharing_price}
                  onChange={(v) => update("sharing_price", v)}
                />

                <Input
                  label="Quad Selling Price"
                  type="number"
                  value={form.quad_price}
                  onChange={(v) => update("quad_price", v)}
                />

                <Input
                  label="Triple Selling Price"
                  type="number"
                  value={form.triple_price}
                  onChange={(v) => update("triple_price", v)}
                />

                <Input
                  label="Double Selling Price"
                  type="number"
                  value={form.double_price}
                  onChange={(v) => update("double_price", v)}
                />
              </div>
            </Card>

            <Card title="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                className="min-h-32 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Package remarks, inclusions, exclusions, hotel notes..."
              />

              <button
                onClick={save}
                disabled={saving}
                className="mt-5 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Package"}
              </button>
            </Card>
          </section>

          <aside className="xl:col-span-1 space-y-4">
            <div className="sticky top-6 space-y-4">
              <Panel title="Live Cost Preview">
                <MiniStat label="Visa Cost" value={`${visaCost} SAR`} />
                <MiniStat label="Sharing Hotel Cost" value={`${hotelCostPreview.sharing} SAR`} />
                <MiniStat label="Quad Hotel Cost" value={`${hotelCostPreview.quad} SAR`} />
                <MiniStat label="Triple Hotel Cost" value={`${hotelCostPreview.triple} SAR`} />
                <MiniStat label="Double Hotel Cost" value={`${hotelCostPreview.double} SAR`} />
              </Panel>

              <Panel title="Selling Price Preview">
                <MiniStat label="Sharing" value={`${form.sharing_price || 0} SAR`} strong />
                <MiniStat label="Quad" value={`${form.quad_price || 0} SAR`} strong />
                <MiniStat label="Triple" value={`${form.triple_price || 0} SAR`} strong />
                <MiniStat label="Double" value={`${form.double_price || 0} SAR`} strong />
              </Panel>

              <Panel title="Package Summary">
                <p className="text-sm text-slate-500">
                  Days: <b className="text-slate-900">{form.total_days}</b>
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Airline: <b className="text-slate-900">{form.airline_name || "-"}</b>
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Seats: <b className="text-slate-900">{form.total_seats || 0}</b>
                </p>
              </Panel>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function calculateDays(start: string, end: string) {
  if (!start || !end) return 0;

  const startDate = new Date(start);
  const endDate = new Date(end);

  const diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) return 0;

  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
};

function Input({ label, value, onChange, type = "text", min }: InputProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
      />
    </label>
  );
}

type SelectOption = string | { label: string; value: string };

type SelectProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
      >
        {options.map((item) => {
          const option =
            typeof item === "string" ? { label: item, value: item } : item;

          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-bold text-slate-900">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={strong ? "rounded-2xl bg-emerald-50 p-4" : "rounded-2xl bg-slate-50 p-4"}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={strong ? "mt-1 text-xl font-bold text-emerald-800" : "mt-1 text-xl font-bold text-slate-900"}>
        {value}
      </p>
    </div>
  );
}