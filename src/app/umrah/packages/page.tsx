"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function PackagesPage() {
  const supabase = createClient();
  const [packages, setPackages] = useState([]);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from("umrah_packages")
      .select("id, title, nights_makkah, nights_madinah, is_available, total_profit");

    if (!error) setPackages(data);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Umrah Packages</h1>
        <Link
          href="/umrah/packages/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          + Create Package
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {packages.map((pkg) => (
          <div key={pkg.id} className="p-5 border rounded-lg shadow-sm bg-white space-y-2">
            <h3 className="font-bold text-xl">{pkg.title}</h3>

            <p className="text-gray-700">
              <span className="font-medium">Makkah:</span> {pkg.nights_makkah} nights
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Madinah:</span> {pkg.nights_madinah} nights
            </p>

            <p className="text-gray-900 font-semibold">
              Profit: {pkg.total_profit} SAR
            </p>

            <div className="flex items-center justify-between">
              <Link
                href={`/umrah/packages/${pkg.id}`}
                className="text-blue-600 font-medium"
              >
                View
              </Link>

              <span
                className={`px-3 py-1 rounded-full text-xs ${
                  pkg.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {pkg.is_available ? "Available" : "Not Available"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

