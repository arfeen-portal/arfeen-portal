import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";
const REQUIRED_HOTEL_FIELDS = [
  "hotel_name",
  "city",
  "room_type",
  "occupancy",
  "base_price",
  "currency",
  "check_in",
  "check_out",
  "markup",
  "supplier_name",
];

const REQUIRED_FLIGHT_FIELDS = [
  "airline",
  "route",
  "travel_date",
  "base_price",
  "currency",
  "class",
  "baggage_allowance",
  "refundable",
  "markup",
  "supplier_name",
];

type ImportType = "hotel" | "flight";

interface ImportBody {
  type: ImportType;
  filename?: string;
  columns: string[];
  mapping: Record<string, string>;
  rows: any[];
  agentLabel?: string | null;
  primarySupplierName?: string | null;
}

// 🔹 POST = IMPORT
export async function POST(req: Request) {
  const supabase = createClient();

  try {
    const body = (await req.json()) as ImportBody;
    const {
      type,
      filename,
      columns,
      mapping,
      rows,
      agentLabel,
      primarySupplierName,
    } = body;

    if (!type || !rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload. Missing type or rows." },
        { status: 400 }
      );
    }

    const requiredFields =
      type === "hotel" ? REQUIRED_HOTEL_FIELDS : REQUIRED_FLIGHT_FIELDS;

    // ✅ Create import job
    const { data: job, error: jobError } = await supabase
      .from("rate_import_jobs")
      .insert({
        type,
        filename: filename || null,
        total_rows: rows.length,
        status: "processing",
        agent_label: agentLabel || null,
        primary_supplier_name: primarySupplierName || null,
      })
      .select("*")
      .single();

    if (jobError || !job) {
      console.error(jobError);
      throw new Error("Failed to create import job");
    }

    const jobId = job.id as string;

    let successCount = 0;
    let failedCount = 0;
    const errorRows: any[] = [];
    const hotelBatch: any[] = [];
    const flightBatch: any[] = [];

    // ✅ Helper: get or create supplier by name
    const getOrCreateSupplierId = async (name: string | null) => {
      if (!name) return null;

      const trimmed = name.trim();
      if (!trimmed) return null;

      const { data: existing, error: findErr } = await supabase
        .from("hotel_suppliers")
        .select("id")
        .eq("name", trimmed)
        .maybeSingle();

      if (findErr) {
        console.error("Find supplier error", findErr);
      }

      if (existing?.id) return existing.id;

      const { data: created, error: createErr } = await supabase
        .from("hotel_suppliers")
        .insert({
          name: trimmed,
          api_source: "manual",
          priority: 1,
        })
        .select("id")
        .single();

      if (createErr || !created) {
        console.error("Create supplier error", createErr);
        return null;
      }

      return created.id;
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const csvRow = rows[i] || {};
      const mapped: Record<string, any> = {};
      const missing: string[] = [];

      // Apply mapping: CSV header -> field
      for (const header of columns) {
        const target = mapping[header];
        if (!target || target === "ignore") continue;

        const rawValue = csvRow[header];
        mapped[target] = rawValue;
      }

      // Check required fields
      for (const field of requiredFields) {
        if (
          mapped[field] === undefined ||
          mapped[field] === null ||
          mapped[field] === ""
        ) {
          missing.push(field);
        }
      }

      if (missing.length > 0) {
        failedCount++;
        errorRows.push({
          row_number: i + 1,
          error_message: `Missing required fields: ${missing.join(", ")}`,
          raw_data: csvRow,
        });
        continue;
      }

      if (type === "hotel") {
        const supplierId = await getOrCreateSupplierId(
          String(mapped["supplier_name"] || primarySupplierName || "")
        );

        const hotelRow = {
          import_job_id: jobId,
          supplier_id: supplierId,
          hotel_name: String(mapped["hotel_name"]),
          city: String(mapped["city"]),
          room_type: String(mapped["room_type"]),
          occupancy: Number(mapped["occupancy"] || 2),
          base_price: Number(mapped["base_price"] || 0),
          currency: String(mapped["currency"] || "SAR"),
          check_in: mapped["check_in"],
          check_out: mapped["check_out"],
          markup: Number(mapped["markup"] || 0),
          is_api: false,
        };

        hotelBatch.push(hotelRow);
      } else {
        const supplierId = await getOrCreateSupplierId(
          String(mapped["supplier_name"] || primarySupplierName || "")
        );

        const flightRow = {
          import_job_id: jobId,
          supplier_id: supplierId,
          airline: String(mapped["airline"]),
          route: String(mapped["route"]),
          travel_date: mapped["travel_date"],
          base_price: Number(mapped["base_price"] || 0),
          currency: String(mapped["currency"] || "SAR"),
          baggage_allowance: String(mapped["baggage_allowance"] || ""),
          refundable:
            String(mapped["refundable"]).toLowerCase() === "true" ||
            String(mapped["refundable"]).toLowerCase() === "yes",
          is_api: false,
          markup: Number(mapped["markup"] || 0),
          class: String(mapped["class"] || "Economy"),
        };

        flightBatch.push(flightRow);
      }

      successCount++;
    }

    // Insert batches
    if (hotelBatch.length > 0) {
      const { error: insertHotelErr } = await supabase
        .from("hotel_rates")
        .insert(hotelBatch);

      if (insertHotelErr) {
        console.error("Insert hotel batch error", insertHotelErr);
      }
    }

    if (flightBatch.length > 0) {
      const { error: insertFlightErr } = await supabase
        .from("flight_rates")
        .insert(flightBatch);

      if (insertFlightErr) {
        console.error("Insert flight batch error", insertFlightErr);
      }
    }

    // Insert error rows
    if (errorRows.length > 0) {
      const errorsToInsert = errorRows.map((e) => ({
        job_id: jobId,
        row_number: e.row_number,
        error_message: e.error_message,
        raw_data: e.raw_data,
      }));

      const { error: errorsErr } = await supabase
        .from("rate_import_errors")
        .insert(errorsToInsert);

      if (errorsErr) {
        console.error("Insert error rows error", errorsErr);
      }
    }

    // Update job summary
    const finalStatus =
      successCount > 0 && failedCount === 0
        ? "completed"
        : successCount > 0 && failedCount > 0
        ? "completed"
        : "failed";

    await supabase
      .from("rate_import_jobs")
      .update({
        success_rows: successCount,
        failed_rows: failedCount,
        status: finalStatus,
      })
      .eq("id", jobId);

    return NextResponse.json({
      job_id: jobId,
      type,
      total_rows: rows.length,
      success_rows: successCount,
      failed_rows: failedCount,
      status: finalStatus,
    });
  } catch (err: any) {
    console.error("Import error", err);
    return NextResponse.json(
      {
        error: "Import failed",
        details: err?.message || err,
      },
      { status: 500 }
    );
  }
}

// 🔹 GET = JOB LIST / JOB DETAILS + ERRORS
export async function GET(req: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job_id");

  try {
    if (jobId) {
      const { data: job, error: jobError } = await supabase
        .from("rate_import_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError || !job) {
        console.error(jobError);
        return NextResponse.json(
          { error: "Job not found" },
          { status: 404 }
        );
      }

      const { data: errors, error: errorsError } = await supabase
        .from("rate_import_errors")
        .select("*")
        .eq("job_id", jobId)
        .order("row_number", { ascending: true });

      if (errorsError) {
        console.error(errorsError);
        return NextResponse.json(
          { error: "Failed to load errors" },
          { status: 500 }
        );
      }

      return NextResponse.json({ job, errors: errors || [] });
    }

    const { data: jobs, error } = await supabase
      .from("rate_import_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to load jobs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobs: jobs || [] });
  } catch (err: any) {
    console.error("GET jobs error", err);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
