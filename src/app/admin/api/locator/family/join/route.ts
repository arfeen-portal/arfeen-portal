import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

const supabaseAdmin = createAdminClient();

export async function POST(request: Request) {
  try {
    const { familyCode, memberName, relation } = await request.json();

    if (!familyCode || !memberName) {
      return NextResponse.json(
        { error: "familyCode and memberName are required" },
        { status: 400 }
      );
    }

    const { data: family, error: famErr } = await supabaseAdmin
      .from("families")
      .select("*")
      .eq("family_code", familyCode)
      .single();

    if (famErr || !family) {
      return NextResponse.json(
        { error: "Family not found" },
        { status: 404 }
      );
    }

    const { data: member, error: memErr } = await supabaseAdmin
      .from("family_members")
      .insert({
        family_id: family.id,
        member_name: memberName,
        relation: relation ?? "Member",
        is_admin: false,
      })
      .select("*")
      .single();

    if (memErr) throw memErr;

    return NextResponse.json(
      {
        family,
        member,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("family/join error", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
