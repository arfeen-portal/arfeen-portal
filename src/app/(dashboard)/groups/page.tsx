"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type GroupRow = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  total_members: number;
  completion_percent: number;
  score: number;
  status: "Upcoming" | "In Progress" | "Completed";
};

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "Upcoming", label: "Upcoming" },
  { key: "In Progress", label: "In Progress" },
  { key: "Completed", label: "Completed" },
];

function statusColor(status: GroupRow["status"]) {
  switch (status) {
    case "Upcoming":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "In Progress":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
}

export default function GroupsListPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cloningId, setCloningId] = useState<string | null>(null);

  const loadGroups = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/groups/list?${params.toString()}`, {
        signal,
      });
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (e) {
      if ((e as any).name !== "AbortError") {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadGroups(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleClone = async (g: GroupRow) => {
    if (cloningId) return;

    // Simple prompts (later aap modal bana sakte ho)
    const defaultName = `${g.name} (Copy)`;
    const name = window.prompt("New group name:", defaultName) || defaultName;

    const startDefault = g.start_date || "";
    const endDefault = g.end_date || "";

    const startDate =
      window.prompt(
        "Start date (YYYY-MM-DD) – optional:",
        startDefault
      ) || "";
    const endDate =
      window.prompt("End date (YYYY-MM-DD) – optional:", endDefault) || "";

    try {
      setCloningId(g.id);
      const res = await fetch("/api/groups/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_group_id: g.id,
          name,
          start_date: startDate || null,
          end_date: endDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to clone group.");
        setCloningId(null);
        return;
      }

      // Direct new dashboard
      router.push(`/groups/${data.id}`);
    } catch (e) {
      console.error(e);
      alert("Unexpected error while cloning group.");
      setCloningId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-[#001B4D] to-[#12377A] p-5 text-white shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Ziyarat Groups</h1>
            <p className="mt-1 text-xs text-blue-100">
              Yahan se tamam groups ka status, completion % aur dashboard
              access control karen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <button
              onClick={() => router.push("/groups/new")}
              className="inline-flex items-center rounded-full bg-white px-4 py-1.5 font-medium text-[#001B4D] shadow-md hover:bg-slate-100"
            >
              <span className="mr-1">＋</span> New Group
            </button>
            <div className="rounded-full bg-white/10 px-4 py-1">
              Arfeen Travel • Group Management
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search + Status Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-md"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative w-full md:max-w-xs">
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-slate-50 px-9 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#001B4D] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#001B4D]"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              🔍
            </span>
          </div>

          {/* Status tabs */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            {STATUS_TABS.map((tab) => {
              const active =
                statusFilter === tab.key ||
                (statusFilter === "all" && tab.key === "all");
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={[
                    "rounded-full border px-3 py-1 transition",
                    active
                      ? "border-[#001B4D] bg-[#001B4D] text-white"
                      : "border-gray-200 bg-slate-50 text-gray-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Groups grid */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-md"
              >
                <div className="h-full w-full rounded-2xl bg-slate-50" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-xs text-gray-500">
            Koi group nahi mila. Naya group banayein ya filters reset karein.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => {
              const percent = Math.min(g.completion_percent || 0, 100);
              const colorClass = statusColor(g.status);
              const isCloning = cloningId === g.id;

              return (
                <motion.div
                  key={g.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-md"
                >
                  {/* Top: name + status */}
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-sm font-semibold text-[#001B4D]">
                        {g.name}
                      </h2>
                      <p className="text-[11px] text-gray-500">
                        {g.start_date && g.end_date
                          ? `${new Date(
                              g.start_date
                            ).toLocaleDateString()} → ${new Date(
                              g.end_date
                            ).toLocaleDateString()}`
                          : "Flexible dates"}
                      </p>
                    </div>
                    <span
                      className={
                        "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-medium " +
                        colorClass
                      }
                    >
                      {g.status}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Completion</span>
                      <span>{percent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#F6B800] to-[#FFD966] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="mt-auto flex items-center justify-between pt-2 text-[11px]">
                    <div className="space-y-1">
                      <div className="text-gray-500">
                        Members:{" "}
                        <span className="font-semibold text-[#001B4D]">
                          {g.total_members ?? 0}
                        </span>
                      </div>
                      <div className="text-gray-500">
                        Group Score:{" "}
                        <span className="font-semibold text-[#001B4D]">
                          {g.score.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleClone(g)}
                        disabled={isCloning}
                        className="inline-flex items-center rounded-full border border-gray-200 bg-slate-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-slate-100 disabled:opacity-50"
                      >
                        {isCloning ? "Cloning..." : "Clone"}
                      </button>
                      <Link
                        href={`/groups/${g.id}`}
                        className="inline-flex items-center rounded-full bg-[#001B4D] px-3 py-1.5 font-medium text-white shadow-md hover:bg-[#12377A]"
                      >
                        View
                        <span className="ml-1">›</span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
