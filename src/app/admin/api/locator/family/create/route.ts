import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

const supabaseAdmin = createAdminClient();

function generateFamilyCode() {
  return "AF-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const { familyName, memberName, relation, createdBy } =
      await request.json();

    if (!familyName || !memberName) {
      return NextResponse.json(
        { error: "familyName and memberName are required" },
        { status: 400 }
      );
    }

    const familyCode = generateFamilyCode();

    // 1) create family
    const { data: family, error: famErr } = await supabaseAdmin
      .from("families")
      .insert({
        family_name: familyName,
        family_code: familyCode,
        created_by: createdBy ?? null,
      })
      .select("*")
      .single();

    if (famErr) throw famErr;

    // 2) create first member
    const { data: member, error: memErr } = await supabaseAdmin
      .from("family_members")
      .insert({
        family_id: family.id,
        member_name: memberName,
        relation: relation ?? "Self",
        is_admin: true,
      })
      .select("*")
      .single();

    if (memErr) throw memErr;

    return NextResponse.json(
      {
        family,
        member,
        familyCode,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("family/create error", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
