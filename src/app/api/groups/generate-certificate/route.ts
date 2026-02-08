import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { member_id, group_id, name, completed_spots } = await req.json();

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 400]);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawText(`Certificate of Completion`, { x: 150, y: 330, size: 18, font });
  page.drawText(name, { x: 200, y: 260, size: 16 });
  page.drawText(`Completed ${completed_spots} Ziyarat Points.`, { x: 140, y: 200 });

  const pdfBytes = await pdf.save();

  const { data: storage } = await supabase.storage
    .from("certificates")
    .upload(`certificate-${member_id}.pdf`, pdfBytes, {
      contentType: "application/pdf",
    });

  await supabase.from("certificates").insert({
    member_id,
    group_id,
    pdf_url: storage?.path,
  });

  return NextResponse.json({
    success: true,
    url: storage?.path,
  });
}
