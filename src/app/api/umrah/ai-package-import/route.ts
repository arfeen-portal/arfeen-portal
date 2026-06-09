import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin not configured" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("package_imports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ imports: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin not configured" },
      { status: 500 }
    );
  }

  const formData = (await req.formData()) as any;

  const file = formData.get("file") as File | null;
  const title = String(formData.get("title") || "AI Imported Package");
  const totalSeats = Number(formData.get("total_seats") || 0);

  if (!file) {
    return NextResponse.json(
      { error: "Poster image is required" },
      { status: 400 }
    );
  }

  const ext = file.name?.split(".").pop() || "jpg";
  const path = `imports/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const upload = await supabase.storage
    .from("package-posters")
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (upload.error) {
    return NextResponse.json(
      { error: upload.error.message },
      { status: 500 }
    );
  }

  const publicUrl = supabase.storage
    .from("package-posters")
    .getPublicUrl(path).data.publicUrl;

  const { data, error } = await supabase
    .from("package_imports")
    .insert([
      {
        title,
        source_file_url: publicUrl,
        source_file_path: path,
        total_seats: totalSeats,
        booked_seats: 0,
        remaining_seats: totalSeats,
        status: "uploaded",
      },
    ])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ import: data });
}