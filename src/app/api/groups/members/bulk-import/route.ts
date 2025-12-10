import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type IncomingRow = {
  full_name?: string;
  name?: string;
  passport?: string;
  seat_no?: string;
  seat?: string;
  role?: string;
};

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  const { group_id, rows } = body as {
    group_id?: string;
    rows?: IncomingRow[];
  };

  if (!group_id || !Array.isArray(rows)) {
    return NextResponse.json(
      { error: "group_id and rows[] are required" },
      { status: 400 }
    );
  }

  const cleaned = rows
    .map((r) => {
      const full_name =
        r.full_name ||
        r.name ||
        (r as any)["Full Name"] ||
        (r as any)["full name"];

      if (!full_name) return null;

      const passport =
        r.passport || (r as any)["Passport"] || (r as any)["passport_no"];
      const seat_no = r.seat_no || r.seat || (r as any)["Seat No"];

      const role =
        (r.role || (r as any)["role"] || "member").toString().toLowerCase();

      return {
        group_id,
        full_name: full_name.toString().trim(),
        passport: passport ? passport.toString().trim() : null,
        seat_no: seat_no ? seat_no.toString().trim() : null,
        role,
      };
    })
    .filter(Boolean) as {
    group_id: string;
    full_name: string;
    passport: string | null;
    seat_no: string | null;
    role: string;
  }[];

  if (cleaned.length === 0) {
    return NextResponse.json(
      { error: "No valid rows in CSV" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("group_members").insert(cleaned);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    inserted: cleaned.length,
  });
}
