'use client';

import React from 'react';

export default function HotelsLandingPage() {
  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-50 flex flex-col items-center">
      <div className="w-full max-w-6xl px-4 py-12 md:py-16">
        {/* HERO */}
        <section className="text-center mb-10 md:mb-14">
          <p className="text-xs md:text-sm tracking-[0.3em] text-amber-300 mb-3">
            ARFEEN TRAVEL · SAUDI HOTELS
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mb-3">
            Book Premium Hotels in Makkah &amp; Madinah
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto">
            5-star, 4-star and budget hotels with real-time support from Arfeen Travel.
            Perfect for Umrah families, VIP groups and corporate guests.
          </p>
        </section>

        {/* SEARCH CARD */}
        <section className="grid lg:grid-cols-[1.6fr,1.2fr] gap-6 md:gap-8">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 md:p-7 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold">
                Search Hotels
              </h2>
              <span className="text-[10px] md:text-xs uppercase tracking-wide bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded-full">
                Instant confirmation*
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs md:text-sm">
              <div>
                <label className="block mb-1 text-slate-300">City</label>
                <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                  <option>Makkah</option>
                  <option>Madinah</option>
                  <option>Jeddah</option>
                  <option>Taif</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-300">Hotel Category</label>
                <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                  <option>5★ – Clock Tower / Haram Front</option>
                  <option>4★ – Walking distance</option>
                  <option>3★ – Budget</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-300">Check-in</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300">Check-out</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300">Rooms</label>
                <input
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300">Guests</label>
                <input
                  type="number"
                  min={1}
                  defaultValue={2}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </div>
            </div>

            <button
              type="button"
              className="mt-6 w-full md:w-auto rounded-full bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-semibold px-6 py-2.5 transition-colors"
            >
              Search Hotels (Demo)
            </button>

            <p className="mt-3 text-[11px] text-slate-400">
              * Live inventory &amp; instant booking will connect to supplier APIs later.
              For now this page is a static demo inside the portal.
            </p>
          </div>

          {/* SIDE INFO */}
          <div className="space-y-4 text-xs md:text-sm">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 md:p-5">
              <h3 className="text-sm font-semibold mb-2">Popular Makkah hotels</h3>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Swissotel Al Maqam · Clock Tower</li>
                <li>Pullman Zamzam · Fairmont Makkah</li>
                <li>Hilton Suites · Conrad · Hyatt Regency</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 md:p-5">
              <h3 className="text-sm font-semibold mb-2">Popular Madinah hotels</h3>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Anwar Al Madinah Mövenpick</li>
                <li>Dar Al Taqwa · Pullman Zamzam</li>
                <li>Budget hotels behind Masjid Nabawi</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 md:p-5">
              <h3 className="text-sm font-semibold mb-1">Why book via Arfeen Travel?</h3>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Haram distance &amp; view preference clearly explained</li>
                <li>Group &amp; family room-sharing optimisation</li>
                <li>Real-time WhatsApp support during check-in</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
