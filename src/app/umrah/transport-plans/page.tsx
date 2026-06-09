"use client";

import { useEffect, useState } from "react";

export default function UmrahTransportPlansPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/umrah/inventory?type=transport")
      .then((res) => res.json())
      .then((json) => setItems(json.inventory || []));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold">Transport Plans</h1>
      <p className="mb-6 text-slate-500">Package-wise routing, vehicle costing and reusable transport inventory.</p>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((t) => (
          <div key={t.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">{t.title}</h2>
            <p className="text-sm text-slate-500">{t.city} • {t.category}</p>

            <div className="mt-4">
              <p className="text-sm text-slate-500">Supplier</p>
              <b>{t.supplier_name || "Own Fleet"}</b>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Cost</p>
                <b>{t.cost_price} {t.currency}</b>
              </div>
              <div>
                <p className="text-slate-500">Sale</p>
                <b>{t.sale_price} {t.currency}</b>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}