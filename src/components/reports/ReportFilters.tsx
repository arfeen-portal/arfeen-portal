"use client";

import React from "react";

type ReportFiltersProps = {
  search?: string;
  fromDate?: string;
  toDate?: string;
  onSearchChange?: (value: string) => void;
  onFromDateChange?: (value: string) => void;
  onToDateChange?: (value: string) => void;
};

export default function ReportFilters({
  search = "",
  fromDate = "",
  toDate = "",
  onSearchChange,
  onFromDateChange,
  onToDateChange,
}: ReportFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search reports..."
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        />

        <input
          type="date"
          value={fromDate}
          onChange={(event) => onFromDateChange?.(event.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        />

        <input
          type="date"
          value={toDate}
          onChange={(event) => onToDateChange?.(event.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        />
      </div>
    </div>
  );
}