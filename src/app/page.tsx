"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  Globe2,
  Hotel,
  MapPin,
  Plane,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Users,
} from "lucide-react";

const services = [
  {
    title: "Umrah Packages",
    text: "Complete Makkah & Madinah packages with hotels, transport and visa support.",
    icon: Building2,
    href: "/umrah-packages",
  },
  {
    title: "Group Tickets",
    text: "Live airline group inventory with date-wise selection and seat visibility.",
    icon: Ticket,
    href: "/umrah/groups",
  },
  {
    title: "Saudi Transport",
    text: "Airport, Makkah, Madinah and intercity private transport arrangements.",
    icon: Car,
    href: "/transport",
  },
  {
    title: "Hotels",
    text: "Makkah and Madinah hotel arrangements for groups, families and agents.",
    icon: Hotel,
    href: "/hotels",
  },
  {
    title: "Visa Services",
    text: "Umrah visa processing with clear requirements and professional follow-up.",
    icon: ShieldCheck,
    href: "/umrah/visa",
  },
  {
    title: "Ziyarat",
    text: "Makkah, Madinah and historical ziyarat planning with trusted arrangements.",
    icon: MapPin,
    href: "/umrah/ziyarat",
  },
];

const stats = [
  ["B2B / B2C", "Travel Support"],
  ["24/7", "Operational Follow-up"],
  ["Makkah + Madinah", "Hotel & Transport"],
  ["Live", "Group Inventory"],
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.25),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.25),transparent_35%)]" />
        <div className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-bold text-amber-200">
              <Sparkles size={16} />
              Trusted Umrah, Tickets, Hotels & Transport
            </div>

            <h2 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
              Your complete travel partner for{" "}
              <span className="text-amber-300">Haramain journeys.</span>
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Arfeen Travel provides professional Umrah packages, group tickets,
              Saudi transport, hotels, visa services and B2B agent support from
              one reliable platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/umrah-packages"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-7 py-4 text-sm font-black text-slate-950 shadow-xl shadow-amber-400/20 transition hover:bg-amber-300"
              >
                Explore Packages <ArrowRight size={18} />
              </Link>
              <Link
                href="/umrah/groups"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-black text-white transition hover:bg-white/10"
              >
                View Group Tickets <Ticket size={18} />
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(([value, label]) => (
                <div
                  key={value}
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur"
                >
                  <p className="text-xl font-black text-white">{value}</p>
                  <p className="mt-1 text-sm text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl" />
            <div className="rounded-[2.2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur">
              <div className="rounded-[1.7rem] bg-gradient-to-br from-[#101a34] via-[#151f43] to-[#030712] p-6">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
                        Live Travel Desk
                      </p>
                      <h3 className="mt-2 text-2xl font-black">
                        B2C inquiry + B2B agent access
                      </h3>
                    </div>
                    <Globe2 className="text-amber-300" />
                  </div>

                  <div className="mt-6 grid gap-3">
                    {[
                      ["Umrah Package Inquiry", "Makkah + Madinah + Visa"],
                      ["Group Ticket Seats", "Date-wise airline groups"],
                      ["Saudi Transport", "Airport & intercity routes"],
                      ["Agent Portal", "B2B rates and bookings"],
                    ].map(([title, sub]) => (
                      <div
                        key={title}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div>
                          <p className="font-bold">{title}</p>
                          <p className="text-sm text-slate-400">{sub}</p>
                        </div>
                        <CheckCircle2 className="text-emerald-300" size={20} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-amber-400 p-5 text-slate-950">
                    <Plane className="mb-4" />
                    <p className="text-sm font-bold uppercase tracking-wider">
                      Popular Route
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      Pakistan → Jeddah / Madinah
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <CalendarDays className="mb-4 text-amber-300" />
                    <p className="text-sm font-bold uppercase tracking-wider text-slate-300">
                      Group Seats
                    </p>
                    <p className="mt-2 text-2xl font-black">Live Inventory</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Baqi same content yahan continue rahega */}
    </main>
  );
}