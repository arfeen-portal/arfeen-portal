"use client";

import { useState } from "react";
import * as Papa from "papaparse";

type ImportType = "hotel" | "flight";

interface ParsedRow {
  [key: string]: any;
}

const HOTEL_FIELDS = [
  { value: "ignore", label: "Ignore column" },
  { value: "hotel_name", label: "Hotel Name" },
  { value: "city", label: "City" },
  { value: "room_type", label: "Room Type" },
  { value: "occupancy", label: "Occupancy" },
  { value: "base_price", label: "Base Price" },
  { value: "currency", label: "Currency" },
  { value: "check_in", label: "Check-in Date" },
  { value: "check_out", label: "Check-out Date" },
  { value: "markup", label: "Markup" },
  { value: "supplier_name", label: "Supplier Name" },
];

const FLIGHT_FIELDS = [
  { value: "ignore", label: "Ignore column" },
  { value: "airline", label: "Airline" },
  { value: "route", label: "Route (e.g. JED-MED)" },
  { value: "travel_date", label: "Travel Date" },
  { value: "base_price", label: "Base Price" },
  { value: "currency", label: "Currency" },
  { value: "class", label: "Class (Economy/Business)" },
  { value: "baggage_allowance", label: "Baggage Allowance" },
  { value: "refundable", label: "Refundable (Yes/No)" },
  { value: "markup", label: "Markup" },
  { value: "supplier_name", label: "Supplier Name" },
];

export default function RateImportPage() {
  const [importType, setImportType] = useState<ImportType>("hotel");
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [agentLabel, setAgentLabel] = useState<string>("");
  const [primarySupplierName, setPrimarySupplierName] =
    useState<string>("");

  const fieldOptions = importType === "hotel" ? HOTEL_FIELDS : FLIGHT_FIELDS;

  const autoGuessField = (header: string): string => {
    const h = header.toLowerCase();

    if (h.includes("hotel")) return "hotel_name";
    if (h.includes("city")) return "city";
    if (h.includes("room type") || h.includes("room")) return "room_type";
    if (h.includes("occupancy") || h.includes("pax")) return "occupancy";
    if (h.includes("base") || h.includes("rate") || h.includes("price"))
      return "base_price";
    if (h.includes("curr")) return "currency";
    if (h.includes("check in") || h.includes("checkin") || h.includes("from"))
      return "check_in";
    if (h.includes("check out") || h.includes("checkout") || h.includes("to"))
      return "check_out";
    if (h.includes("markup")) return "markup";
    if (h.includes("supplier") || h.includes("vendor")) return "supplier_name";

    if (h.includes("airline")) return "airline";
    if (h.includes("route")) return "route";
    if (h.includes("date")) return importType === "hotel" ? "check_in" : "travel_date";
    if (h.includes("class")) return "class";
    if (h.includes("baggage")) return "baggage_allowance";
    if (h.includes("refund")) return "refundable";

    return "ignore";
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setResult(null);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const data: ParsedRow[] = (results.data || []).filter(
          (r: any) => Object.keys(r).length > 0
        );
        const fields: string[] = results.meta.fields || [];

        setRows(data);
        setHeaders(fields);

        const autoMap: Record<string, string> = {};
        fields.forEach((h: string) => {
          autoMap[h] = autoGuessField(h);
        });
        setMapping(autoMap);
      },
      error: (err) => {
        console.error(err);
        setError("File parsing error. Please check your CSV/Excel export.");
      },
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleMappingChange = (header: string, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [header]: value,
    }));
  };

  const handleImport = async () => {
    if (!rows.length) {
      setError("Please upload a file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/rate-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: importType,
          filename: fileName,
          columns: headers,
          mapping,
          rows,
          agentLabel: agentLabel || null,
          primarySupplierName: primarySupplierName || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Import failed");
      } else {
        setResult(json);
      }
    } catch (err: any) {
      console.error(err);
      setError("Unexpected error during import.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Rate Sheet Import Tool
          </h1>
          <p className="text-sm text-gray-500">
            Excel/CSV → Auto mapping → Insert into hotel_rates / flight_rates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Import Type:</label>
          <select
            value={importType}
            onChange={(e) => {
              setImportType(e.target.value as ImportType);
              setMapping({});
              setResult(null);
            }}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="hotel">Hotel Rates</option>
            <option value="flight">Flight Rates</option>
          </select>
        </div>
      </div>

      {/* Agent / Supplier info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white shadow rounded-xl p-4 text-xs">
        <div className="flex flex-col gap-1">
          <label className="font-semibold">Agent (label / name)</label>
          <input
            value={agentLabel}
            onChange={(e) => setAgentLabel(e.target.value)}
            placeholder="e.g. Sheraz Travel, Agent-001"
            className="border rounded px-2 py-1 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-semibold">Primary Supplier</label>
          <input
            value={primarySupplierName}
            onChange={(e) => setPrimarySupplierName(e.target.value)}
            placeholder="e.g. Abdul Samad / Booking.com"
            className="border rounded px-2 py-1 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-semibold">File Selected</label>
          <div className="border rounded px-2 py-1 text-xs text-gray-600 bg-gray-50">
            {fileName || "No file chosen yet"}
          </div>
        </div>
      </div>

      {/* Upload area */}
      <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center bg-white shadow-sm">
        <p className="mb-2 font-medium">
          Drag & drop your Excel-exported CSV file here
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Supported: CSV (Excel se “Save As → CSV”)
        </p>

        <label className="cursor-pointer px-4 py-2 rounded-full bg-primary text-white text-sm">
          Choose File
          <input
            type="file"
            accept=".csv"
            onChange={onFileChange}
            className="hidden"
          />
        </label>

        {fileName && (
          <p className="mt-3 text-xs text-gray-600">
            Selected: <span className="font-semibold">{fileName}</span>
          </p>
        )}
      </div>

      {/* Mapping table */}
      {headers.length > 0 && (
        <div className="bg-white shadow rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-lg text-primary">
            Step 2: Column Mapping
          </h2>
          <p className="text-xs text-gray-500 mb-2">
            Left: your sheet columns | Right: portal fields — auto-guess already
            applied, aap adjust kar sakte hain.
          </p>

          <div className="max-h-72 overflow-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Your Column</th>
                  <th className="px-3 py-2 text-left">Map To</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h) => (
                  <tr key={h} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">{h}</td>
                    <td className="px-3 py-2">
                      <select
                        className="border rounded px-2 py-1 text-xs w-full"
                        value={mapping[h] || "ignore"}
                        onChange={(e) =>
                          handleMappingChange(h, e.target.value)
                        }
                      >
                        {(fieldOptions || []).map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Preview first 3 rows */}
          <div>
            <h3 className="text-sm font-semibold mb-2">
              Preview (first 3 rows)
            </h3>
            <div className="max-h-40 overflow-auto border rounded-lg text-xs">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="px-2 py-1 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((row, idx) => (
                    <tr key={idx} className="border-t">
                      {headers.map((h) => (
                        <td key={h} className="px-2 py-1">
                          {String(row[h] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            disabled={loading}
            onClick={handleImport}
            className="mt-3 w-full rounded-xl bg-primary text-white py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Importing, please wait..." : "✅ Import Now"}
          </button>
        </div>
      )}

      {/* Result / Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 text-sm rounded-xl px-4 py-3 space-y-1">
          <p className="font-semibold text-green-800">
            Import Completed (Job: {result.job_id})
          </p>
          <p>Type: {result.type}</p>
          <p>Total Rows: {result.total_rows}</p>
          <p>Success: {result.success_rows}</p>
          <p>Failed: {result.failed_rows}</p>
          <p>Status: {result.status}</p>
        </div>
      )}
    </div>
  );
}
