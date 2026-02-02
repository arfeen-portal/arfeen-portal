import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, context: any) {
  // 🔹 Extract dynamic route param
  const { params } = context;
  const { id } = params;

  // 🔹 Initialize Supabase
 const supabase = createSupabaseServerClient();

  // 🔹 Read incoming request body
  const body = await req.json();

  // -----------------------------------------
  // 🔻 YAHAN APNA PURANA APPROVE LOGIC PASTE KARO
  // -----------------------------------------

  try {
    // Example (remove this if you paste your real code):
    const { error } = await supabase
      .from("orders")
      .update({ status: "approved" })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Order approved", orderId: id },
      { status: 200 }
    );

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
