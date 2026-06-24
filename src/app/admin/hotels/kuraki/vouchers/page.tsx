"use client";

import { useEffect, useState } from "react";
import { Hotel, Phone, Plus, Printer, Search } from "lucide-react";

export default function KhurakiVouchersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    contract_id: "",
    voucher_no: "",
    customer_name: "",
    customer_phone: "",
    whatsapp_phone: "",
    hotel_name: "",
    city: "makkah",
    room_no: "",
    pax: "1",
    check_in_date: "",
    check_out_date: "",
    meal_plan: "full_board",
    special_notes: "",
  });

  async function load(checkoutDue = false) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (checkoutDue) params.set("checkout_due", "1");

    const data = await fetch(`/api/hotels/khuraki/vouchers?${params}`, {
      cache: "no-store",
    }).then((r) => r.json());

    if (data.ok) setRows(data.vouchers || []);
  }

  async function loadContracts() {
    const data = await fetch("/api/hotels/khuraki", {
      cache: "no-store",
    }).then((r) => r.json());

    if (data.ok) setContracts(data.contracts || []);
  }

  async function save() {
    const data = await fetch("/api/hotels/khuraki/vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then((r) => r.json());

    if (data.ok) {
      setOpen(false);
      load();
    } else {
      alert(data.error || "Error");
    }
  }

  async function action(id: string, body: any) {
    await fetch(`/api/hotels/khuraki/vouchers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    load();
  }

  useEffect(() => {
    load();
    loadContracts();
  }, []);

  function isCheckoutDue(row: any) {
    const today = new Date().toISOString().slice(0, 10);
    const status = String(row.status || "");
    const callStatus = String(row.checkout_call_status || "");
    return (
      row.check_out_date <= today &&
      ["checked_in", "checkout_due", "extended"].includes(status) &&
      ["pending", "not_answered"].includes(callStatus)
    );
  }

  function openWhatsApp(row: any) {
    const raw = row.whatsapp_phone || row.customer_phone;
    if (!raw) return;
    const phone = String(raw).replace(/[^\d]/g, "");
    if (!phone) return;
    window.open(`https://wa.me/${phone}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-slate-900 p-6">
          <h1 className="text-3xl font-black">Voucher Check-in / Checkout CRM</h1>
          <p className="mt-2 text-slate-300">
            Umrah guests ka phone number, room, check-in, checkout aur call follow-up yahan manage hoga.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Voucher, customer, phone, hotel..."
              className="w-full rounded-2xl border border-white/10 bg-slate-900 py-3 pl-10 pr-4"
            />
          </div>

          <button onClick={() => load()} className="rounded-2xl border border-white/10 px-5 py-3 font-bold">
            Search
          </button>

          <button onClick={() => load(true)} className="rounded-2xl bg-red-500 px-5 py-3 font-bold">
            Checkout Due
          </button>

          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 font-bold">
            <Printer size={16} /> Print
          </button>

          <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950">
            <Plus size={16} /> Add Voucher
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="bg-white/[0.06] text-sm text-slate-300">
              <tr>
                <th className="p-4">Voucher</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Hotel</th>
                <th className="p-4">Room</th>
                <th className="p-4">Pax</th>
                <th className="p-4">Checkout</th>
                <th className="p-4">Call</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={
                    isCheckoutDue(r)
                      ? "border-t border-red-400/40 bg-red-500/10"
                      : "border-t border-white/10"
                  }
                >
                  <td className="p-4 font-bold">{r.voucher_no}</td>
                  <td className="p-4">{r.customer_name}</td>
                  <td className="p-4">{r.customer_phone || r.whatsapp_phone || "-"}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Hotel size={16} className="text-amber-300" />
                      {r.hotel_name}
                    </div>
                  </td>
                  <td className="p-4">{r.room_no || "-"}</td>
                  <td className="p-4">{r.pax}</td>
                  <td className="p-4">{r.check_out_date}</td>
                  <td className="p-4">
                    <span className={isCheckoutDue(r) ? "rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white" : ""}>
                      {r.checkout_call_status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => action(r.id, { action: "check_in", room_no: r.room_no })}
                        className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300"
                      >
                        Check-in
                      </button>
                      <button
                        onClick={() => action(r.id, { action: "call_update", checkout_call_status: "called" })}
                        className="rounded-xl bg-blue-500/20 px-3 py-2 text-xs font-bold text-blue-300"
                      >
                        <Phone size={13} className="inline" /> Called
                      </button>
                      <button
                        onClick={() => openWhatsApp(r)}
                        disabled={!r.whatsapp_phone && !r.customer_phone}
                        className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300 disabled:opacity-40"
                      >
                        WhatsApp
                      </button>
                      <button
                        onClick={() => action(r.id, { action: "check_out" })}
                        className="rounded-xl bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-300"
                      >
                        Checkout
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!rows.length && (
                <tr>
                  <td colSpan={9} className="p-6 text-slate-400">
                    No voucher found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950 p-6">
              <h2 className="mb-4 text-2xl font-bold">Add Voucher Stay</h2>

              <div className="grid gap-3 md:grid-cols-3">
                {contracts.length ? (
                  <select
                    value={form.contract_id}
                    onChange={(e) => setForm({ ...form, contract_id: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                  >
                    <option value="">Select Contract</option>
                    {contracts.map((contract) => (
                      <option key={contract.id} value={contract.id}>
                        {contract.title} · {contract.city}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    placeholder="Contract ID"
                    value={form.contract_id}
                    onChange={(e) => setForm({ ...form, contract_id: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                  />
                )}
                {[
                  ["voucher_no", "Voucher No"],
                  ["customer_name", "Customer Name"],
                  ["customer_phone", "Customer Phone"],
                  ["whatsapp_phone", "WhatsApp Phone"],
                  ["hotel_name", "Hotel Name"],
                  ["room_no", "Room No"],
                  ["pax", "Pax"],
                  ["check_in_date", "Check-in Date"],
                  ["check_out_date", "Checkout Date"],
                ].map(([key, label]) => (
                  <input
                    key={key}
                    type={key.includes("date") ? "date" : key === "pax" ? "number" : "text"}
                    placeholder={label}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                  />
                ))}

                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                >
                  <option value="makkah">Makkah</option>
                  <option value="madinah">Madinah</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={form.meal_plan}
                  onChange={(e) => setForm({ ...form, meal_plan: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="full_board">Full Board</option>
                </select>
              </div>

              <textarea
                placeholder="Special notes"
                value={form.special_notes}
                onChange={(e) => setForm({ ...form, special_notes: e.target.value })}
                className="mt-3 h-24 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
              />

              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setOpen(false)} className="rounded-2xl border border-white/10 px-5 py-3 font-bold">
                  Cancel
                </button>
                <button onClick={save} className="rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950">
                  Save Voucher
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}