import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { params: Promise<{ id: string }> };

function cleanJsonText(text: string) {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

async function extractWithAI(imageUrl: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    return {
      confidence_score: 0.25,
      packages: [],
      note: "OPENAI_API_KEY missing. Manual review required.",
    };
  }

  const prompt = `
You are extracting Umrah package data from a travel poster.
Return ONLY valid JSON.

Schema:
{
  "confidence_score": number,
  "title": string,
  "days": number | null,
  "nights": number | null,
  "makkah_nights": number | null,
  "madinah_nights": number | null,
  "departure_city": string | null,
  "arrival_city": string | null,
  "airline": string | null,
  "baggage": string | null,
  "packages": [
    {
      "package_no": string,
      "departure_city": string | null,
      "arrival_city": string | null,
      "airline": string | null,
      "flight_no_departure": string | null,
      "flight_no_return": string | null,
      "departure_date": string | null,
      "return_date": string | null,
      "days": number | null,
      "nights": number | null,
      "makkah_nights": number | null,
      "madinah_nights": number | null,
      "makkah_hotel": string | null,
      "makkah_distance": string | null,
      "madinah_hotel": string | null,
      "madinah_distance": string | null,
      "sharing_rate": number | null,
      "quad_rate": number | null,
      "triple_rate": number | null,
      "double_rate": number | null,
      "baggage": string | null,
      "pnr": string | null,
      "group_code": string | null,
      "available_seats": number | null
    }
  ]
}
Rules:
- Convert prices like 306,999 to 306999.
- If multiple packages are visible, return all.
- Do not guess dates if unclear; use null.
- Keep hotel names exactly as visible.
`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageUrl },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg);
  }

  const json = await res.json();
  const text =
    json.output_text ||
    json.output?.[0]?.content?.[0]?.text ||
    "{}";

  return JSON.parse(cleanJsonText(text));
}

export async function POST(_req: NextRequest, context: Params) {
  const { id } = await context.params;
  const supabase = getSupabaseAdminSafe();

  if (!supabase) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

  const { data: imported, error: importError } = await supabase
    .from("package_imports")
    .select("*")
    .eq("id", id)
    .single();

  if (importError || !imported) {
    return NextResponse.json({ error: importError?.message || "Import not found" }, { status: 404 });
  }

  try {
    const extracted = await extractWithAI(imported.source_file_url);

    const packages = Array.isArray(extracted.packages) ? extracted.packages : [];
    const firstDeparture = packages[0]?.departure_date || null;
    const firstAirline = packages[0]?.airline || extracted.airline || null;

    let duplicateWarning = false;
    let duplicatePackageId: string | null = null;

    if (firstDeparture && firstAirline) {
      const duplicate = await supabase
        .from("umrah_package_inventory")
        .select("id")
        .eq("departure_date", firstDeparture)
        .eq("airline", firstAirline)
        .limit(1)
        .maybeSingle();

      if (duplicate.data?.id) {
        duplicateWarning = true;
        duplicatePackageId = duplicate.data.id;
      }
    }

    await supabase.from("package_import_items").delete().eq("import_id", id);

    if (packages.length) {
      const rows = packages.map((p: any, index: number) => ({
        import_id: id,
        package_no: p.package_no || String(index + 1),
        departure_city: p.departure_city || extracted.departure_city,
        arrival_city: p.arrival_city || extracted.arrival_city || "JED",
        airline: p.airline || extracted.airline,
        flight_no_departure: p.flight_no_departure,
        flight_no_return: p.flight_no_return,
        departure_date: p.departure_date || null,
        return_date: p.return_date || null,
        days: p.days || extracted.days,
        nights: p.nights || extracted.nights,
        makkah_nights: p.makkah_nights || extracted.makkah_nights,
        madinah_nights: p.madinah_nights || extracted.madinah_nights,
        makkah_hotel: p.makkah_hotel,
        makkah_distance: p.makkah_distance,
        madinah_hotel: p.madinah_hotel,
        madinah_distance: p.madinah_distance,
        sharing_rate: Number(p.sharing_rate || 0),
        quad_rate: Number(p.quad_rate || 0),
        triple_rate: Number(p.triple_rate || 0),
        double_rate: Number(p.double_rate || 0),
        baggage: p.baggage || extracted.baggage,
        pnr: p.pnr,
        group_code: p.group_code,
        available_seats: Number(p.available_seats || imported.total_seats || 0),
      }));

      const insertItems = await supabase.from("package_import_items").insert(rows);
      if (insertItems.error) throw new Error(insertItems.error.message);
    }

    const update = await supabase
      .from("package_imports")
      .update({
        raw_ai_json: extracted,
        extracted_data: extracted,
        confidence_score: Number(extracted.confidence_score || 0),
        status: "extracted",
        duplicate_warning: duplicateWarning,
        duplicate_package_id: duplicatePackageId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    await supabase.from("package_ai_extraction_logs").insert([
      {
        import_id: id,
        response_payload: extracted,
        status: "success",
      },
    ]);

    return NextResponse.json({ import: update.data, extracted });
  } catch (e: any) {
    await supabase.from("package_ai_extraction_logs").insert([
      {
        import_id: id,
        error_message: e.message,
        status: "failed",
      },
    ]);

    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}