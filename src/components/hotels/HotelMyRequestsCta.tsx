"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BedDouble, FileText } from "lucide-react";
import { getHotelRequestsHref } from "@/lib/hotels/audience";

type SessionProfile = {
  role: string | null;
  name: string | null;
  full_name: string | null;
};

export default function HotelMyRequestsCta() {
  const [href, setHref] = useState("/login?next=/hotels/offline-demands");

  useEffect(() => {
    let mounted = true;

    async function resolveHref() {
      try {
        const res = await fetch("/api/auth/whoami", { cache: "no-store" });
        const json = await res.json();
        const user = json?.user;
        const profile = (json?.profile || null) as SessionProfile | null;

        if (!mounted) return;

        setHref(
          getHotelRequestsHref(profile?.role, Boolean(user?.email))
        );
      } catch {
        if (!mounted) return;
        setHref("/login?next=/hotels/offline-demands");
      }
    }

    void resolveHref();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl transition hover:border-amber-400/40 hover:bg-slate-900"
    >
      <div className="mb-4 inline-flex rounded-2xl bg-amber-400/10 p-3 text-amber-300">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">My Requests &amp; Quotations</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Track your submitted hotel requests, quotations, confirmations, and HCN status.
      </p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-300">
        View My Requests
        <BedDouble className="h-4 w-4" />
      </span>
    </Link>
  );
}
