"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Group name is required.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          start_date: startDate || null,
          end_date: endDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create group.");
        setLoading(false);
        return;
      }

      router.push(`/groups/${data.id}`);
    } catch (e) {
      console.error(e);
      setErrorMsg("Unexpected error.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#001B4D] to-[#12377A] p-5 text-white shadow-lg">
        <h1 className="text-xl font-semibold">Create New Ziyarat Group</h1>
        <p className="mt-1 text-xs text-blue-100">
          Group name aur dates set karein, phir members add karke journey start karein.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-md">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-w-md"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:border-[#001B4D] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#001B4D]"
              placeholder="e.g. March Umrah Group – Karachi"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-gray-800 focus:border-[#001B4D] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#001B4D]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-gray-800 focus:border-[#001B4D] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#001B4D]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-full bg-[#001B4D] px-5 py-2 text-xs font-medium text-white shadow-md hover:bg-[#12377A] disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
