"use client";

import { useEffect, useState } from "react";

export default function WhatsAppEnginePage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [templateKey, setTemplateKey] = useState("booking_confirmed");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/automation/whatsapp-engine")
      .then((res) => res.json())
      .then((json) => setTemplates(json.templates || []));
  }, []);

  async function sendMessage() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/admin/automation/whatsapp-engine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient_phone: phone,
        template_key: templateKey,
        variables: {
          customer_name: customerName,
          pickup_city: "Makkah",
          dropoff_city: "Madinah",
          pickup_time: "Today 08:00 PM",
          driver_name: "Test Driver",
          driver_phone: "966500000000",
          vehicle_type: "GMC",
        },
      }),
    });

    const json = await res.json();
    setResult(json);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-emerald-900 to-slate-950 p-8 text-white shadow">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-200">
            Admin Automation
          </p>
          <h1 className="mt-2 text-3xl font-bold">Auto WhatsApp Engine</h1>
          <p className="mt-2 max-w-3xl text-emerald-100">
            Trigger-based WhatsApp templates. Abhi message queued hota hai; baad mein WhatsApp Cloud API connect ho sakti hai.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900">Send Test Message</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="923001234567"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              />

              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              />

              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 md:col-span-2"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.template_key}>
                    {template.title} — {template.trigger_event}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={sendMessage}
              disabled={loading || !phone}
              className="mt-5 rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? "Queuing..." : "Queue WhatsApp Message"}
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Supported Triggers</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>booking_confirmed</p>
              <p>driver_assigned</p>
              <p>payment_pending</p>
              <p>voucher_created</p>
            </div>
          </div>
        </section>

        {result && (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Message Result</h2>
            <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm">
              <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </section>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Templates</h2>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Key</th>
                  <th className="p-3">Trigger</th>
                  <th className="p-3">Active</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-t">
                    <td className="p-3 font-semibold">{template.title}</td>
                    <td className="p-3">{template.template_key}</td>
                    <td className="p-3">{template.trigger_event}</td>
                    <td className="p-3">{template.is_active ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}