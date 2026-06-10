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
  Menu,
  Plane,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Umrah Packages", href: "/umrah-packages" },
  { label: "Group Tickets", href: "/umrah/groups" },
  { label: "Hotels", href: "/hotels" },
  { label: "Transport", href: "/transport" },
  { label: "Visa", href: "/umrah/visa" },
  { label: "Contact", href: "#contact" },
];

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
  const [open, setOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-lg font-black text-slate-950 shadow-lg shadow-amber-400/20">
              AT
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
                Arfeen Travel
              </p>
              <h1 className="text-lg font-black leading-tight">
                Premium Umrah & Travel Services
              </h1>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Agent Login
            </Link>
            <Link
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2 text-sm font-black text-slate-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300"
            >
              Book Now <ArrowRight size={16} />
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl border border-white/10 p-2 lg:hidden"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-white/10 bg-[#050816] px-5 py-4 lg:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="rounded-2xl bg-amber-400 px-4 py-3 text-center text-sm font-black text-slate-950"
              >
                Agent Login
              </Link>
            </div>
          </div>
        ) : null}
      </header>

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

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-300">
              Our Services
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">
              Everything for your travel business and customers.
            </h2>
          </div>
          <p className="max-w-xl text-slate-300">
            B2C customers can submit inquiries, while agents can login for B2B
            services. Admin manages all records internally.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.title}
                href={service.href}
                className="group rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-6 transition hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/[0.08]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20">
                  <Icon size={26} />
                </div>
                <h3 className="text-2xl font-black">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {service.text}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-amber-300">
                  Explore <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-200 p-1">
          <div className="grid gap-8 rounded-[1.8rem] bg-[#07101f] p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-300">
                Why Choose Us
              </p>
              <h2 className="mt-3 text-4xl font-black">
                Professional service with transparent follow-up.
              </h2>
              <p className="mt-5 leading-8 text-slate-300">
                From package inquiry to booking confirmation, every request is
                routed to the office panel so the team can manage customers,
                agents, suppliers and records properly.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Live group ticket visibility",
                "Agent login for B2B services",
                "Customer inquiry to admin record",
                "Hotels, visa and transport support",
                "Clean booking and follow-up flow",
                "Internal accounts managed by admin",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                >
                  <BadgeCheck className="mt-0.5 text-emerald-300" size={20} />
                  <p className="font-semibold text-slate-100">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-7">
            <Star className="mb-5 text-amber-300" />
            <h3 className="text-2xl font-black">For Families</h3>
            <p className="mt-3 leading-7 text-slate-300">
              Simple Umrah, hotel and transport inquiry with professional office
              support.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-7">
            <Users className="mb-5 text-amber-300" />
            <h3 className="text-2xl font-black">For Agents</h3>
            <p className="mt-3 leading-7 text-slate-300">
              Login to access B2B group tickets, bookings, vouchers and agent
              services.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-7">
            <ShieldCheck className="mb-5 text-amber-300" />
            <h3 className="text-2xl font-black">For Admin</h3>
            <p className="mt-3 leading-7 text-slate-300">
              Complete backend control for records, bookings, suppliers and
              internal accounts.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-5 pb-20">
        <div className="rounded-[2rem] bg-white p-8 text-slate-950 shadow-2xl lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-blue-700">
                Contact Arfeen Travel
              </p>
              <h2 className="mt-3 text-4xl font-black md:text-5xl">
                Ready for Umrah, tickets, hotels or transport?
              </h2>
              <p className="mt-5 max-w-2xl leading-8 text-slate-600">
                Send your inquiry and our team will guide you with available
                options, rates and complete booking support.
              </p>
            </div>

            <div className="grid gap-3">
              <Link
                href="https://wa.me/923332482560"
                target="_blank"
                className="rounded-2xl bg-green-600 px-6 py-4 text-center text-sm font-black text-white transition hover:bg-green-700"
              >
                WhatsApp: 0333 2482560
              </Link>
              <Link
                href="/login"
                className="rounded-2xl bg-slate-950 px-6 py-4 text-center text-sm font-black text-white transition hover:bg-slate-800"
              >
                Agent / Admin Login
              </Link>
              <Link
                href="/umrah/groups"
                className="rounded-2xl border border-slate-200 px-6 py-4 text-center text-sm font-black text-slate-950 transition hover:bg-slate-50"
              >
                View Live Group Tickets
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#030712]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Arfeen Travel. All rights reserved.</p>
          <p>
            Public website for B2C customers. Agent services available through secure login.
          </p>
        </div>
      </footer>
    </main>
  );
}