"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clientLogout } from "@/lib/auth/clientLogout";
import {
  BadgeDollarSign,
  BarChart3,
  BedDouble,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageOpen,
  Plane,
  ReceiptText,
  UserCircle,
  X,
} from "lucide-react";
import { useState } from "react";

const nav = [
  {
    label: "Dashboard",
    href: "/agent/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "New Booking",
    href: "/agent/bookings/new",
    icon: Plane,
  },
  {
    label: "My Bookings",
    href: "/agent/bookings",
    icon: FileText,
  },
  {
    label: "Packages",
    href: "/agent/packages",
    icon: PackageOpen,
  },
  {
    label: "Hotel Demand",
    href: "/agent/hotel-demands",
    icon: BedDouble,
  },
  {
    label: "Invoices",
    href: "/agent/invoices",
    icon: ReceiptText,
  },
  {
    label: "Ledger",
    href: "/agent/ledger",
    icon: BarChart3,
  },
  {
    label: "Payments",
    href: "/agent/payments",
    icon: BadgeDollarSign,
  },
  {
    label: "Profile",
    href: "/agent/profile",
    icon: UserCircle,
  },
];

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    await clientLogout();
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200 bg-white shadow-xl transition lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <Link href="/agent/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              AT
            </div>
            <div>
              <p className="text-sm font-black">Arfeen Travel</p>
              <p className="text-xs font-semibold text-slate-500">
                Agent Portal
              </p>
            </div>
          </Link>

          <button
            onClick={() => setOpen(false)}
            className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1 p-4">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-slate-950 text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-100"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-2xl border border-slate-200 p-3 lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="text-sm font-black">Agent Workspace</p>
              <p className="text-xs font-semibold text-slate-500">
                Private dashboard, bookings, invoices and ledger
              </p>
            </div>
          </div>

          <div className="hidden rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 sm:block">
            Secure Agent Mode
          </div>
        </header>

        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}