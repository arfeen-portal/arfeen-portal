"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type RewardRow = {
  agent_id: string;
  total_bookings: number;
  total_coins: number;
};

type ScoreRow = {
  agent_id: string;
  balance: number;
  credit_score: number;
};

export default function AgentRewardsPage() {
  const supabase = createClient();

  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [{ data: rData }, { data: sData }] = await Promise.all([
        supabase.from("acc_agent_rewards_summary").select("*"),
        supabase.from("acc_agent_credit_score_view").select("*"),
      ]);

      setRewards((rData || []) as RewardRow[]);
      setScores((sData || []) as ScoreRow[]);
      setLoading(false);
    };

    load();
  }, [supabase]);

  const merged = rewards.map((r) => {
    const s = scores.find((x) => x.agent_id === r.agent_id);
    return {
      ...r,
      balance: s?.balance ?? 0,
      credit_score: s?.credit_score ?? 0,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Agent Rewards &amp; Credit Score</h1>
          <p className="text-sm text-gray-500">
            Coins from <code>acc_agent_rewards</code> + score from{" "}
            <code>acc_agent_credit_score_view</code>.
          </p>
        </div>
        {loading && (
          <span className="text-xs text-gray-400">Loading…</span>
        )}
      </div>

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Agent ID</th>
              <th className="px-3 py-2 text-right font-semibold">Total Bookings</th>
              <th className="px-3 py-2 text-right font-semibold">Total Coins</th>
              <th className="px-3 py-2 text-right font-semibold">Ledger Balance</th>
              <th className="px-3 py-2 text-right font-semibold">Credit Score</th>
            </tr>
          </thead>
          <tbody>
            {merged.map((r) => (
              <tr key={r.agent_id} className="border-t">
                <td className="px-3 py-2">{r.agent_id}</td>
                <td className="px-3 py-2 text-right">
                  {r.total_bookings}
                </td>
                <td className="px-3 py-2 text-right">
                  {r.total_coins}
                </td>
                <td className="px-3 py-2 text-right">
                  {r.balance.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {r.credit_score}
                </td>
              </tr>
            ))}
            {!loading && merged.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-xs text-gray-400"
                >
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Credit score rule abhi simple hai (aging buckets → penalty). Baad me
        hum isme booking volume, cancellation ratio, payment behaviour bhi add
        kar sakte hain.
      </p>
    </div>
  );
}
