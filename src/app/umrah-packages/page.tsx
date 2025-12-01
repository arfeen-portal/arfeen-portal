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
      name: "Tharwat Misfillah",
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
    flights: "Saudia • Multan → Jeddah / Madinah",
  },
  // yahan baqi real / sample packages add kar sakte ho
];

const departureCities = ["Any City", "Multan", "Lahore", "Karachi"];
const airlines = ["Any Airline", "Saudia", "PIA", "AirBlue"];
const dateRanges = ["All Dates", "Dec 2025", "Jan 2026"];

export default function UmrahPackagesPage() {
  // 🔹 Filters (top bar)
  const [selectedDepartureCity, setSelectedDepartureCity] = useState("Any City");
  const [selectedAirline, setSelectedAirline] = useState("Any Airline");
  const [selectedDateRange, setSelectedDateRange] = useState("All Dates");
  const [maxBudget, setMaxBudget] = useState(600000);

  // ⭐ NEW: Separate distance filters
  const [maxMakkahDistance, setMaxMakkahDistance] = useState(1500); // meters
  const [maxMadinahDistance, setMaxMadinahDistance] = useState(1500); // meters

  // 🔹 Card ke andar room selection
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

  // 🔎 Filtered packages
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

      // Max budget check: lowest room price bhi budget ke andar honi chahiye
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            21 Days Umrah Packages
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Multan • Saudia &amp; other airlines • Multiple date ranges • Sharing /
            Quad / Triple / Double
          </p>
        </div>

        {/* Brand badge */}
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-700">
            Arfeen Travel &amp; Tours — Dynamic Package Engine
          </span>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Departure City */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                Departure City
              </label>
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                Airline
              </label>
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                Travel Dates
              </label>
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
            <div className="flex items-end justify-end md:justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Sliders row: Budget + Makkah + Madinah */}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {/* Max Budget */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-500">
                  Max Budget (PKR)
                </label>
                <span className="text-xs font-semibold text-slate-700">
                  Up to {maxBudget.toLocaleString("en-PK")}
                </span>
              </div>
              <input
                type="range"
                min={150000}
                max={600000}
                step={10000}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </div>

            {/* Makkah distance */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-500">
                  Max Distance – Makkah (from Haram)
                </label>
                <span className="text-xs font-semibold text-slate-700">
                  Up to {maxMakkahDistance} m
                </span>
              </div>
              <input
                type="range"
                min={300}
                max={2500}
                step={50}
                value={maxMakkahDistance}
                onChange={(e) => setMaxMakkahDistance(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </div>

            {/* Madinah distance */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-500">
                  Max Distance – Madinah (from Masjid Nabawi)
                </label>
                <span className="text-xs font-semibold text-slate-700">
                  Up to {maxMadinahDistance} m
                </span>
              </div>
              <input
                type="range"
                min={300}
                max={2500}
                step={50}
                value={maxMadinahDistance}
                onChange={(e) => setMaxMadinahDistance(Number(e.target.value))}
                className="mt-1 w-full"
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
                className="rounded-2xl bg-white p-4 shadow-sm md:p-6"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  {/* Left side content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                        {pkg.code}
                      </span>
                      <span className="text-slate-500">{pkg.title}</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Makkah hotel */}
                      <div>
                        <p className="text-[11px] font-semibold text-slate-500">
                          MAKKAH HOTEL
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {pkg.makkahHotel.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {pkg.makkahHotel.distanceFromHaram}m from Haram ·{" "}
                          {pkg.makkahHotel.stars} Star
                        </p>
                      </div>

                      {/* Madinah hotel */}
                      <div>
                        <p className="text-[11px] font-semibold text-slate-500">
                          MADINAH HOTEL
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {pkg.madinahHotel.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {pkg.madinahHotel.distanceFromHaram}m from Masjid
                          Nabawi · {pkg.madinahHotel.stars} Star
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Avg distance from Haram / Nabawi:{" "}
                      <span className="font-semibold">
                        {Math.round(avgDistance)}m
                      </span>
                    </p>

                    <p className="text-[11px] text-slate-500">
                      FLIGHT DATES:{" "}
                      <span className="font-semibold">
                        {pkg.travelDatesLabel}
                      </span>{" "}
                      · {pkg.flights}
                    </p>
                  </div>

                  {/* Right side: price + actions */}
                  <div className="mt-4 w-full max-w-xs space-y-3 md:mt-0">
                    {/* Room type buttons – sirf yahan par */}
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
                              className={`rounded-xl border px-2 py-2 ${
                                isActive
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                              }`}
                            >
                              <div className="text-[11px] font-semibold">
                                {label}
                              </div>
                              <div className="mt-0.5 text-[10px]">
                                {roomPrice.toLocaleString("en-PK")}
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>

                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <div>Selected: {selectedRoomTypeLabel(selectedRoomType)}</div>
                      <div className="text-sm font-semibold text-slate-900">
                        PKR {selectedPrice.toLocaleString("en-PK")}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
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
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Koi package aap ke selected budget / distance filters ke andar
              nahi mila. Filters thora loose kar ke try karein.
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
