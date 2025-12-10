import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job_id");

  if (!jobId) {
    return NextResponse.json(
      { error: "job_id is required" },
      { status: 400 }
    );
  }

  try {
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

    const type: "hotel" | "flight" = job.type;

    if (type === "hotel") {
      const { data: newRates, error: newErr } = await supabase
        .from("hotel_rates")
        .select(
          "id,supplier_id,hotel_name,city,room_type,occupancy,base_price,markup,currency,check_in,check_out,created_at"
        )
        .eq("import_job_id", jobId);

      if (newErr) {
        console.error(newErr);
        return NextResponse.json(
          { error: "Failed to load new hotel rates" },
          { status: 500 }
        );
      }

      return await buildHotelImpact(jobId, newRates || []);
    } else {
      const { data: newRates, error: newErr } = await supabase
        .from("flight_rates")
        .select(
          "id,supplier_id,airline,route,travel_date,base_price,markup,currency,class,created_at"
        )
        .eq("import_job_id", jobId);

      if (newErr) {
        console.error(newErr);
        return NextResponse.json(
          { error: "Failed to load new flight rates" },
          { status: 500 }
        );
      }

      return await buildFlightImpact(jobId, newRates || []);
    }
  } catch (err: any) {
    console.error("Impact error", err);
    return NextResponse.json(
      { error: "Failed to calculate impact" },
      { status: 500 }
    );
  }
}

// Helpers

async function buildHotelImpact(jobId: string, newRates: any[]) {
  const supabase = createClient();

  let totalNewRows = newRates.length;
  let comparable = 0;
  let cheaper = 0;
  let moreExpensive = 0;
  let same = 0;
  let noPrev = 0;
  let totalOld = 0;
  let totalNew = 0;

  const samples: {
    label: string;
    old_price: number | null;
    new_price: number;
    diff: number | null;
    direction: "cheaper" | "expensive" | "same" | "new";
  }[] = [];

  for (let i = 0; i < newRates.length; i++) {
    const r = newRates[i];
    const newPrice = Number(r.base_price || 0) + Number(r.markup || 0);

    const { data: prev, error: prevErr } = await supabase
      .from("hotel_rates")
      .select("base_price,markup")
      .neq("id", r.id)
      .neq("import_job_id", jobId)
      .eq("hotel_name", r.hotel_name)
      .eq("room_type", r.room_type)
      .eq("city", r.city)
      .eq("currency", r.currency)
      .order("created_at", { ascending: false })
      .limit(1);

    if (prevErr) {
      console.error(prevErr);
    }

    if (!prev || prev.length === 0) {
      noPrev++;
      totalNew += newPrice;
      if (samples.length < 15) {
        samples.push({
          label: `${r.hotel_name} / ${r.room_type} (${r.city})`,
          old_price: null,
          new_price: newPrice,
          diff: null,
          direction: "new",
        });
      }
      continue;
    }

    const oldPrice =
      Number(prev[0].base_price || 0) + Number(prev[0].markup || 0);

    comparable++;
    totalNew += newPrice;
    totalOld += oldPrice;

    const diff = newPrice - oldPrice;

    let direction: "cheaper" | "expensive" | "same" = "same";
    if (diff < 0) {
      cheaper++;
      direction = "cheaper";
    } else if (diff > 0) {
      moreExpensive++;
      direction = "expensive";
    } else {
      same++;
      direction = "same";
    }

    if (samples.length < 15) {
      samples.push({
        label: `${r.hotel_name} / ${r.room_type} (${r.city})`,
        old_price: oldPrice,
        new_price: newPrice,
        diff,
        direction,
      });
    }
  }

  const netChange = totalNew - totalOld;
  const avgChange =
    comparable > 0 ? netChange / comparable : null;

  return NextResponse.json({
    job_id: jobId,
    type: "hotel",
    total_new_rows: totalNewRows,
    comparable_rows: comparable,
    cheaper_count: cheaper,
    more_expensive_count: moreExpensive,
    unchanged_count: same,
    no_previous_count: noPrev,
    total_old_value: totalOld,
    total_new_value: totalNew,
    net_change: netChange,
    avg_change_per_row: avgChange,
    samples,
  });
}

async function buildFlightImpact(jobId: string, newRates: any[]) {
  const supabase = createClient();

  let totalNewRows = newRates.length;
  let comparable = 0;
  let cheaper = 0;
  let moreExpensive = 0;
  let same = 0;
  let noPrev = 0;
  let totalOld = 0;
  let totalNew = 0;

  const samples: {
    label: string;
    old_price: number | null;
    new_price: number;
    diff: number | null;
    direction: "cheaper" | "expensive" | "same" | "new";
  }[] = [];

  for (let i = 0; i < newRates.length; i++) {
    const r = newRates[i];
    const newPrice = Number(r.base_price || 0) + Number(r.markup || 0);

    const { data: prev, error: prevErr } = await supabase
      .from("flight_rates")
      .select("base_price,markup")
      .neq("id", r.id)
      .neq("import_job_id", jobId)
      .eq("airline", r.airline)
      .eq("route", r.route)
      .eq("class", r.class)
      .eq("currency", r.currency)
      .order("created_at", { ascending: false })
      .limit(1);

    if (prevErr) {
      console.error(prevErr);
    }

    if (!prev || prev.length === 0) {
      noPrev++;
      totalNew += newPrice;
      if (samples.length < 15) {
        samples.push({
          label: `${r.airline} ${r.route} (${r.class})`,
          old_price: null,
          new_price: newPrice,
          diff: null,
          direction: "new",
        });
      }
      continue;
    }

    const oldPrice =
      Number(prev[0].base_price || 0) + Number(prev[0].markup || 0);

    comparable++;
    totalNew += newPrice;
    totalOld += oldPrice;

    const diff = newPrice - oldPrice;

    let direction: "cheaper" | "expensive" | "same" = "same";
    if (diff < 0) {
      cheaper++;
      direction = "cheaper";
    } else if (diff > 0) {
      moreExpensive++;
      direction = "expensive";
    } else {
      same++;
      direction = "same";
    }

    if (samples.length < 15) {
      samples.push({
        label: `${r.airline} ${r.route} (${r.class})`,
        old_price: oldPrice,
        new_price: newPrice,
        diff,
        direction,
      });
    }
  }

  const netChange = totalNew - totalOld;
  const avgChange =
    comparable > 0 ? netChange / comparable : null;

  return NextResponse.json({
    job_id: jobId,
    type: "flight",
    total_new_rows: totalNewRows,
    comparable_rows: comparable,
    cheaper_count: cheaper,
    more_expensive_count: moreExpensive,
    unchanged_count: same,
    no_previous_count: noPrev,
    total_old_value: totalOld,
    total_new_value: totalNew,
    net_change: netChange,
    avg_change_per_row: avgChange,
    samples,
  });
}
