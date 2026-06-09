"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BadgeCheck,
  Coins,
  Crown,
  Gift,
  Loader2,
  Medal,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  UserRound,
  Wallet,
} from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

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

type MergedReward = RewardRow & {
  balance: number;
  credit_score: number;
  tier: string;
  status: string;
  next_milestone: string;
};

function getTier(coins: number) {
  if (coins >= 5000) return "Diamond";
  if (coins >= 3000) return "Platinum";
  if (coins >= 1500) return "Gold";
  if (coins >= 700) return "Silver";
  return "Starter";
}

function getStatus(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Healthy";
  if (score >= 55) return "Watch";
  return "Risk";
}

function getNextMilestone(coins: number) {
  if (coins < 700) return "Silver at 700 coins";
  if (coins < 1500) return "Gold at 1,500 coins";
  if (coins < 3000) return "Platinum at 3,000 coins";
  if (coins < 5000) return "Diamond at 5,000 coins";
  return "Top Elite Partner";
}

export default function AgentRewardsPage() {
  const supabase = supabaseClient;

  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (!supabase) {
          setRewards([]);
          setScores([]);
          return;
        }

        const [{ data: rewardsData }, { data: scoresData }] = await Promise.all([
          supabase
            .from("acc_agent_rewards_summary")
            .select("*"),
          supabase
            .from("acc_agent_credit_score_view")
            .select("*"),
        ]);

        setRewards((rewardsData || []) as RewardRow[]);
        setScores((scoresData || []) as ScoreRow[]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [supabase]);

  const merged = useMemo<MergedReward[]>(() => {
    return rewards.map((reward) => {
      const score = scores.find((item) => item.agent_id === reward.agent_id);

      return {
        ...reward,
        balance: score?.balance ?? 0,
        credit_score: score?.credit_score ?? 0,
        tier: getTier(reward.total_coins),
        status: getStatus(score?.credit_score ?? 0),
        next_milestone: getNextMilestone(reward.total_coins),
      };
    });
  }, [rewards, scores]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return merged;

    return merged.filter((item) =>
      [
        item.agent_id,
        item.tier,
        item.status,
        item.next_milestone,
        String(item.total_bookings),
        String(item.total_coins),
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [merged, query]);

  const totalCoins = merged.reduce((sum, item) => sum + Number(item.total_coins || 0), 0);
  const totalBookings = merged.reduce(
    (sum, item) => sum + Number(item.total_bookings || 0),
    0
  );
  const averageScore =
    merged.length > 0
      ? merged.reduce((sum, item) => sum + Number(item.credit_score || 0), 0) /
        merged.length
      : 0;
  const topAgents = merged.filter((item) => item.tier === "Diamond" || item.tier === "Platinum")
    .length;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
          <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-950 p-7 text-white">
            <div className="absolute right-8 top-8 hidden rounded-full bg-white/10 p-8 blur-sm lg:block">
              <Trophy size={86} />
            </div>

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-blue-50 ring-1 ring-white/20">
                  <Sparkles size={14} />
                  Agent Loyalty Intelligence
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">
                  Agent Rewards & Credit Score
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100">
                  Agent booking performance, reward coins, ledger discipline,
                  credit score, tier movement, and next milestone tracking in one
                  professional command view.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-blue-100">Reward Engine</p>
                  <p className="mt-1 text-lg font-bold">Active</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-blue-100">Credit Logic</p>
                  <p className="mt-1 text-lg font-bold">Live</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Total Reward Coins",
              value: totalCoins.toLocaleString(),
              icon: Coins,
              note: "Coins earned from approved bookings",
            },
            {
              title: "Total Bookings",
              value: totalBookings.toLocaleString(),
              icon: Target,
              note: "Reward-linked agent bookings",
            },
            {
              title: "Average Credit Score",
              value: averageScore.toFixed(1),
              icon: ShieldCheck,
              note: "Based on balance and discipline",
            },
            {
              title: "Elite Agents",
              value: topAgents.toLocaleString(),
              icon: Crown,
              note: "Platinum and Diamond partners",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.title}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">
                      {item.value}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                    <Icon size={23} />
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  {item.note}
                </p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Rewards Leaderboard
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Agent-wise reward tier, credit score, balance, and milestone
                  tracking.
                </p>
              </div>

              <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:w-80">
                <Search size={18} className="text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search agent, tier, score..."
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3 text-right">Bookings</th>
                    <th className="px-4 py-3 text-right">Coins</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                          <Loader2 size={18} className="animate-spin" />
                          Loading reward intelligence...
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filtered.map((row) => (
                      <tr key={row.agent_id} className="hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-blue-50 p-2 text-blue-700">
                              <UserRound size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-950">
                                {row.agent_id}
                              </p>
                              <p className="text-xs text-slate-500">
                                {row.next_milestone}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right font-semibold text-slate-700">
                          {Number(row.total_bookings || 0).toLocaleString()}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                            <Coins size={14} />
                            {Number(row.total_coins || 0).toLocaleString()}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                            <Medal size={14} />
                            {row.tier}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right font-semibold text-slate-700">
                          {Number(row.balance || 0).toLocaleString()}
                        </td>

                        <td className="px-4 py-4 text-right font-bold text-blue-700">
                          {Number(row.credit_score || 0).toFixed(0)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                              row.status === "Excellent"
                                ? "bg-emerald-50 text-emerald-700"
                                : row.status === "Healthy"
                                  ? "bg-blue-50 text-blue-700"
                                  : row.status === "Watch"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            <BadgeCheck size={14} />
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="mx-auto max-w-sm">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <Search size={22} />
                          </div>
                          <h3 className="mt-3 font-semibold text-slate-900">
                            No reward data found
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            No agent matched your current search or reward data
                            is not available yet.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                  <Gift size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Reward Tiers
                  </h2>
                  <p className="text-sm text-slate-500">
                    Coins-based loyalty levels
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  ["Diamond", "5,000+ coins", "Elite benefits"],
                  ["Platinum", "3,000+ coins", "Priority service"],
                  ["Gold", "1,500+ coins", "Bonus incentives"],
                  ["Silver", "700+ coins", "Growth rewards"],
                  ["Starter", "0+ coins", "Basic level"],
                ].map(([tier, coins, benefit]) => (
                  <div
                    key={tier}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{tier}</p>
                      <p className="text-xs text-slate-500">{benefit}</p>
                    </div>
                    <p className="text-xs font-bold text-slate-600">{coins}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <TrendingUp size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Smart Rules
                  </h2>
                  <p className="text-sm text-slate-500">
                    Future automation logic
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    Booking Volume Bonus
                  </p>
                  <p className="mt-1 text-xs leading-5">
                    High booking agents can receive automatic extra coins.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    Payment Discipline Bonus
                  </p>
                  <p className="mt-1 text-xs leading-5">
                    Fast-paying agents can receive better tier movement.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    Cancellation Penalty
                  </p>
                  <p className="mt-1 text-xs leading-5">
                    Frequent cancellations can reduce reward eligibility.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-3">
                  <Star size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">AI Upgrade Ready</h2>
                  <p className="text-sm text-blue-100">
                    Next version can include agent DNA, fraud signals, reward
                    prediction, and automatic incentive recommendations.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}