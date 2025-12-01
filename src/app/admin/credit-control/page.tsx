"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Candidate = {
  agent_id: string;
  agent_name: string;
  credit_limit: number | null;
  max_days_overdue: number | null;
  total_balance_base: number | null;
  bucket_0_7: number | null;
  bucket_8_15: number | null;
  bucket_16_30: number | null;
  bucket_31_60: number | null;
  bucket_60_plus: number | null;
};

export default function CreditControlPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [blocking, setBlocking] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agent_reminder_candidates")
      .select("*");

    if (error) {
      console.error(error);
      setRows([]);
    } else {
      setRows((data || []) as Candidate[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const sendReminder = async (agent: Candidate, channel: string) => {
    setSendingId(agent.agent_id);
    const agingDays =
      agent.bucket_60_plus
        ? 60
        : agent.bucket_31_60
        ? 45
        : agent.bucket_16_30
        ? 23
        : agent.bucket_8_15
        ? 12
        : agent.bucket_0_7
        ? 5
        : 0;

    await supabase.from("agent_reminders_log").insert({
      agent_id: agent.agent_id,
      channel,
      aging_days: agingDays,
      balance: agent.total_balance_base,
      note: `Reminder via ${channel}`,
    });

    // yahan se tum actual WhatsApp / Email API ko call kar sakte ho
    // e.g. via separate backend function / webhook

    setSendingId(null);
    alert("Reminder logged (WhatsApp/Email send API yahan connect hoga)");
  };

  const runAutoBlocking = async () => {
    setBlocking(true);
    const { error } = await supabase.rpc("acc_process_agent_blocking");
    if (error) {
      console.error(error);
      alert("Error in blocking: " + error.message);
    } else {
      alert("Auto-blocking executed based on credit policy.");
    }
    setBlocking(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between flex-wrap gap-3 items-end">
        <div>
          <h1 className="text-2xl font-semibold">Credit Control &amp; Reminders</h1>
          <p className="text-sm text-gray-500">
            Agents with outstanding balances from{" "}
            <code>agent_reminder_candidates</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-2 text-xs sm:text-sm border rounded"
          >
            Refresh
          </button>
          <button
            onClick={runAutoBlocking}
            disabled={blocking}
            className="px-3 py-2 text-xs sm:text-sm rounded bg-red-600 text-white disabled:opacity-50"
          >
            {blocking ? "Blocking…" : "Run Auto-Blocking"}
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-xs text-gray-400">Loading agents…</p>
      )}

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Agent</th>
              <th className="px-3 py-2 text-right">Balance</th>
              <th className="px-3 py-2 text-right">Limit</th>
              <th className="px-3 py-2 text-right">0–7</th>
              <th className="px-3 py-2 text-right">8–15</th>
              <th className="px-3 py-2 text-right">16–30</th>
              <th className="px-3 py-2 text-right">31–60</th>
              <th className="px-3 py-2 text-right">&gt; 60</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.agent_id} className="border-t">
                <td className="px-3 py-2">
                  {r.agent_name || r.agent_id}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.total_balance_base || 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.credit_limit || 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.bucket_0_7 || 0).toFixed(0)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.bucket_8_15 || 0).toFixed(0)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.bucket_16_30 || 0).toFixed(0)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.bucket_31_60 || 0).toFixed(0)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.bucket_60_plus || 0).toFixed(0)}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => sendReminder(r, "whatsapp")}
                    disabled={sendingId === r.agent_id}
                    className="px-2 py-1 text-[11px] rounded bg-green-600 text-white mr-1 disabled:opacity-50"
                  >
                    WA
                  </button>
                  <button
                    onClick={() => sendReminder(r, "email")}
                    disabled={sendingId === r.agent_id}
                    className="px-2 py-1 text-[11px] rounded bg-blue-600 text-white disabled:opacity-50"
                  >
                    Email
                  </button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-xs text-gray-400"
                >
                  No overdue agents at the moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Actual WhatsApp / Email sending backend se integrate hoga (API),
        yahan sirf logging ho rahi hai.
      </p>
    </div>
  );
}
