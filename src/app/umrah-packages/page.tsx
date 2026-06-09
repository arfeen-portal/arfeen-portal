"use client";

import React, { useMemo, useState } from "react";

type RoomType = "sharing" | "quad" | "triple" | "double";

type HotelInfo = {
  name: string;
  distanceFromHaram: number; // in meters
  stars: number;
};

type PackageData = {
  id: string;
  code: string;
  title: string;
  departureCity: string;
  airline: string;
  travelDatesLabel: string;
  makkahHotel: HotelInfo;
  madinahHotel: HotelInfo;
  prices: {
    sharing: number;
    quad: number;
    triple: number;
    double: number;
  };
  flights: string;
};

const ALL_PACKAGES: PackageData[] = [
  {
    id: "pkg-01",
    code: "PKG #01",
    title: "21 Days Umrah Package",
    departureCity: "Multan",
    airline: "Saudia",
    travelDatesLabel: "01 Dec – 21 Dec",
    makkahHotel: {
      name: "Tharwat Misfllah",
      distanceFromHaram: 1200,
      stars: 3,
    },
    madinahHotel: {
      name: "Kinan Al Madina",
      distanceFromHaram: 900,
      stars: 3,
    },
    prices: {
      sharing: 275860,
      quad: 286400,
      triple: 303140,
      double: 337550,
    },
    flights: "Saudia · Multan → Jeddah / Madinah",
  },
  // yahan baqi real / sample packages add kar sakte ho
];

const departureCities = ["Any City", "Multan", "Lahore", "Karachi"];
const airlines = ["Any Airline", "Saudia", "PIA", "AirBlue"];
const dateRanges = ["All Dates", "Dec 2025", "Jan 2026"];

export default function UmrahPackagesPage() {
  const [selectedDepartureCity, setSelectedDepartureCity] = useState("Any City");
  const [selectedAirline, setSelectedAirline] = useState("Any Airline");
  const [selectedDateRange, setSelectedDateRange] = useState("All Dates");
  const [maxBudget, setMaxBudget] = useState(600000);

  // NEW: Separate distance filters
  const [maxMakkahDistance, setMaxMakkahDistance] = useState(1500); // meters
  const [maxMadinahDistance, setMaxMadinahDistance] = useState(1500); // meters

  // Card ke andar room selection
  const [selectedRoomTypeByPackage, setSelectedRoomTypeByPackage] = useState<
    Record<string, RoomType>
  >({});

  const handleRoomTypeChange = (pkgId: string, roomType: RoomType) => {
    setSelectedRoomTypeByPackage((prev) => ({
      ...prev,
      [pkgId]: roomType,
    }));
  };

  const resetFilters = () => {
    setSelectedDepartureCity("Any City");
    setSelectedAirline("Any Airline");
    setSelectedDateRange("All Dates");
    setMaxBudget(600000);
    setMaxMakkahDistance(1500);
    setMaxMadinahDistance(1500);
  };

  const filteredPackages = useMemo(() => {
    return ALL_PACKAGES.filter((pkg) => {
      if (
        selectedDepartureCity !== "Any City" &&
        pkg.departureCity !== selectedDepartureCity
      ) {
        return false;
      }

      if (selectedAirline !== "Any Airline" && pkg.airline !== selectedAirline) {
        return false;
      }

      if (
        selectedDateRange !== "All Dates" &&
        pkg.travelDatesLabel.indexOf(selectedDateRange) === -1
      ) {
        return false;
      }

      // Makkah distance check
      if (pkg.makkahHotel.distanceFromHaram > maxMakkahDistance) {
        return false;
      }

      // Madinah distance check
      if (pkg.madinahHotel.distanceFromHaram > maxMadinahDistance) {
        return false;
      }

      // low budget check: lowest room price budget ke andar honi chahiye
      const minPrice = Math.min(
        pkg.prices.sharing,
        pkg.prices.quad,
        pkg.prices.triple,
        pkg.prices.double
      );

      if (minPrice > maxBudget) {
        return false;
      }

      return true;
    });
  }, [
    selectedDepartureCity,
    selectedAirline,
    selectedDateRange,
    maxBudget,
    maxMakkahDistance,
    maxMadinahDistance,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {/* Page heading */}
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white/90 px-5 py-6 shadow-sm md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                Premium Umrah Package Finder
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                21 Days Umrah Packages
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
                Multan • Saudia & other airlines • Multiple date ranges • Sharing
                / Quad / Triple / Double
              </p>
            </div>

            <div className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              Arfeen Travel &amp; Tours — Dynamic Package Engine
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Departure City */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Departure City
              </label>
              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={selectedDepartureCity}
                onChange={(e) => setSelectedDepartureCity(e.target.value)}
              >
                {departureCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Airline */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Airline
              </label>
              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={selectedAirline}
                onChange={(e) => setSelectedAirline(e.target.value)}
              >
                {airlines.map((air) => (
                  <option key={air} value={air}>
                    {air}
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Dates */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Travel Dates
              </label>
              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
              >
                {dateRanges.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset button */}
            <div className="flex items-end justify-start md:justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Sliders row */}
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {/* Max Budget */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Max Budget (PKR)
                </label>
                <span className="text-sm font-semibold text-slate-800">
                  Up to {maxBudget.toLocaleString("en-PK")}
                </span>
              </div>
              <input
                type="range"
                min="150000"
                max="600000"
                step="1000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="mt-1 w-full accent-emerald-600"
              />
            </div>

            {/* Makkah distance */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Max Distance — Makkah
                </label>
                <span className="text-sm font-semibold text-slate-800">
                  Up to {maxMakkahDistance} m
                </span>
              </div>
              <input
                type="range"
                min="300"
                max="2500"
                step="50"
                value={maxMakkahDistance}
                onChange={(e) => setMaxMakkahDistance(Number(e.target.value))}
                className="mt-1 w-full accent-emerald-600"
              />
            </div>

            {/* Madinah distance */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Max Distance — Madinah
                </label>
                <span className="text-sm font-semibold text-slate-800">
                  Up to {maxMadinahDistance} m
                </span>
              </div>
              <input
                type="range"
                min="300"
                max="2500"
                step="50"
                value={maxMadinahDistance}
                onChange={(e) => setMaxMadinahDistance(Number(e.target.value))}
                className="mt-1 w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Package list */}
        <div className="space-y-4">
          {filteredPackages.map((pkg) => {
            const selectedRoomType: RoomType =
              selectedRoomTypeByPackage[pkg.id] ?? "sharing";

            const selectedPrice = pkg.prices[selectedRoomType];

            const avgDistance =
              (pkg.makkahHotel.distanceFromHaram +
                pkg.madinahHotel.distanceFromHaram) /
              2;

            return (
              <div
                key={pkg.id}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  {/* Left side: content */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                        {pkg.code}
                      </span>
                      <span className="text-lg font-semibold text-slate-900">
                        {pkg.title}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Makkah hotel */}
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          Makkah Hotel
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {pkg.makkahHotel.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {pkg.makkahHotel.distanceFromHaram}m from Haram •{" "}
                          {pkg.makkahHotel.stars} Star
                        </p>
                      </div>

                      {/* Madinah hotel */}
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          Madinah Hotel
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {pkg.madinahHotel.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {pkg.madinahHotel.distanceFromHaram}m from Masjid
                          Nabawi • {pkg.madinahHotel.stars} Star
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm text-slate-600">
                      <p>
                        Avg distance from Haram / Nabawi:{" "}
                        <span className="font-semibold text-slate-900">
                          {Math.round(avgDistance)}m
                        </span>
                      </p>
                      <p>
                        Flight Dates:{" "}
                        <span className="font-semibold text-slate-900">
                          {pkg.travelDatesLabel}
                        </span>{" "}
                        • {pkg.flights}
                      </p>
                    </div>
                  </div>

                  {/* Right side: price + actions */}
                  <div className="w-full max-w-md space-y-4 md:ml-6 md:w-[340px]">
                    {/* Room buttons */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {(["sharing", "quad", "triple", "double"] as RoomType[]).map(
                        (room) => {
                          const isActive = selectedRoomType === room;

                          const label =
                            room === "sharing"
                              ? "Sharing"
                              : room === "quad"
                              ? "Quad"
                              : room === "triple"
                              ? "Triple"
                              : "Double";

                          const roomPrice = pkg.prices[room];

                          return (
                            <button
                              key={room}
                              type="button"
                              onClick={() => handleRoomTypeChange(pkg.id, room)}
                              className={`rounded-2xl border px-2 py-3 transition ${
                                isActive
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div className="text-[11px] font-semibold">
                                {label}
                              </div>
                              <div className="mt-1 text-[11px]">
                                {roomPrice.toLocaleString("en-PK")}
                              </div>
                            </button>
                          );
                        })}
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-xs text-slate-600">
                      <div>
                        Selected:{" "}
                        <span className="font-semibold text-slate-900">
                          {selectedRoomTypeLabel(selectedRoomType)}
                        </span>
                      </div>
                      <div className="mt-1 text-lg font-bold text-slate-900">
                        PKR {selectedPrice.toLocaleString("en-PK")}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPackages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Koi package selected budget / distance filters ke andar nahi mila.
              Filters thore loose kar ke try karein.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function selectedRoomTypeLabel(room: RoomType) {
  switch (room) {
    case "sharing":
      return "Sharing";
    case "quad":
      return "Quad";
    case "triple":
      return "Triple";
    case "double":
      return "Double";
    default:
      return "Sharing";
  }
}