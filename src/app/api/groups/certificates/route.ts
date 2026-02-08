import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const group_id = searchParams.get("group_id");

  if (!group_id) {
    return NextResponse.json({ error: "Missing group_id" }, { status: 400 });
  }

   const supabase = createSupabaseServerClient();

  // 1) Fetch certificates
  const { data: certs, error: certErr } = await supabase
    .from("certificates")
    .select("id, group_id, member_id, pdf_url, issued_at")
    .eq("group_id", group_id)
    .order("issued_at", { ascending: false });

  if (certErr) {
    return NextResponse.json({ error: certErr.message }, { status: 500 });
  }

  // 2) Fetch member names
  const { data: members, error: memErr } = await supabase
    .from("group_members")
    .select("id, full_name")
    .eq("group_id", group_id);

  if (memErr) {
    return NextResponse.json({ error: memErr.message }, { status: 500 });
  }

  const memberMap = new Map<string, string>();
  (members || []).forEach((m) => {
    memberMap.set(m.id, m.full_name);
  });

  // 3) Attach public URL
  const result =
    certs?.map((c) => {
      const { data } = supabase.storage
        .from("certificates")
        .getPublicUrl(c.pdf_url || "");
      const publicUrl = data.publicUrl;

      return {
        id: c.id,
        group_id: c.group_id,
        member_id: c.member_id,
        member_name: memberMap.get(c.member_id) || "Unknown",
        issued_at: c.issued_at,
        pdf_url: c.pdf_url,
        pdf_public_url: publicUrl,
      };
    }) || [];

  return NextResponse.json({ certificates: result });
}
