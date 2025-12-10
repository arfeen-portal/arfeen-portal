import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { source_group_id, name, start_date, end_date } = body;

  if (!source_group_id) {
    return NextResponse.json(
      { error: "source_group_id is required" },
      { status: 400 }
    );
  }

  // 1) Source group
  const { data: source, error: srcErr } = await supabase
    .from("groups")
    .select("*")
    .eq("id", source_group_id)
    .single();

  if (srcErr || !source) {
    return NextResponse.json(
      { error: "Source group not found" },
      { status: 404 }
    );
  }

  // 2) New group insert
  const newName =
    name && name.trim().length > 0
      ? name.trim()
      : `${source.name} (Copy)`;

  const { data: newGroup, error: newErr } = await supabase
    .from("groups")
    .insert({
      name: newName,
      start_date: start_date || null,
      end_date: end_date || null,
      created_by: user.id,
      tenant_id: source.tenant_id || null,
    })
    .select("id")
    .single();

  if (newErr || !newGroup) {
    return NextResponse.json(
      { error: newErr?.message || "Failed to create cloned group" },
      { status: 500 }
    );
  }

  const newGroupId = newGroup.id;

  // 3) Members of source group
  const { data: members, error: memErr } = await supabase
    .from("group_members")
    .select("user_id, full_name, passport, seat_no, role")
    .eq("group_id", source_group_id);

  if (memErr) {
    // Group created but members copy failed → still return id
    return NextResponse.json({
      id: newGroupId,
      warning: "Group created but members not copied",
    });
  }

  if (members && members.length > 0) {
    const rows = members.map((m) => ({
      group_id: newGroupId,
      user_id: m.user_id,
      full_name: m.full_name,
      passport: m.passport,
      seat_no: m.seat_no,
      role: m.role,
    }));

    await supabase.from("group_members").insert(rows);
  }

  return NextResponse.json({
    id: newGroupId,
    members_copied: members?.length || 0,
  });
}
