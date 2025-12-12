"use client";

import React from "react";

type Pkg = {
  id: string;
  name: string;
  code?: string | null;
  // agar aapke pkg me aur fields bhi hain to yahan add kar lo (optional)
  [key: string]: any;
};

type Props = {
  pkg: Pkg;
};

export default function PackageCalculatorInline({ pkg }: Props) {
  // NOTE: yahan aapka existing UI/logic paste kar sakte ho
  // Main safe skeleton de raha hoon — aapka code yahan continue ho sakta hai.

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-gray-500">Package</div>
      <div className="text-lg font-semibold">{pkg?.name}</div>
      {pkg?.code ? (
        <div className="text-sm text-gray-600">Code: {pkg.code}</div>
      ) : null}

      {/* ✅ Apna calculator UI yahan */}
    </div>
  );
}
