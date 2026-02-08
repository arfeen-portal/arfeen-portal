import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY not configured" },
        { status: 500 }
      );
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not available" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const todayISO = new Date().toISOString().slice(0, 10);

    const { data: invoicesRaw, error } = await supabase
      .from("invoices")
      .select(`
        id,
        tenant_id,
        agent_id,
        booking_reference,
        status,
        total_billing,
        billing_currency,
        due_date,
        last_reminder_at,
        reminder_count
      `)
      .in("status", ["sent", "partially_paid"])
      .or(
        `due_date.lt.${todayISO},last_reminder_at.is.null,last_reminder_at.lt.${new Date(
          Date.now() - 24 * 60 * 60 * 1000
        ).toISOString()}`
      );

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to load invoices" },
        { status: 500 }
      );
    }

    const invoices = (invoicesRaw ?? []) as any[];
    if (!invoices.length) {
      return NextResponse.json({ message: "No overdue invoices" });
    }

    const agentIds = Array.from(
      new Set(invoices.map((i) => i.agent_id).filter(Boolean))
    );

    const { data: agents } = await supabase
      .from("agents")
      .select("id, name, email")
      .in("id", agentIds);

    const agentsById: Record<string, any> = {};
    (agents ?? []).forEach((a) => (agentsById[a.id] = a));

    const fromEmail = process.env.INVOICE_FROM_EMAIL!;
    const recoveryEmail = process.env.RECOVERY_TEAM_EMAIL!;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://arfeentravel.com";

    for (const inv of invoices) {
      const agent = agentsById[inv.agent_id];
      if (!agent?.email) continue;

      const invoiceUrl = `${appUrl}/billing/invoices/${inv.id}`;

      const html = `
        <p>Assalam Alaikum <strong>${agent.name}</strong>,</p>
        <p>Your invoice is pending:</p>
        <ul>
          <li><strong>Invoice:</strong> ${
            inv.booking_reference || inv.id
          }</li>
          <li><strong>Amount:</strong> ${(
            inv.total_billing || 0
          ).toFixed(2)} ${inv.billing_currency}</li>
          <li><strong>Due Date:</strong> ${inv.due_date}</li>
        </ul>
        <p><a href="${invoiceUrl}">View Invoice</a></p>
        <p>JazakAllah khair,<br/>Arfeen Travel</p>
      `;

      const toList: string[] = [agent.email];
      if (recoveryEmail) toList.push(recoveryEmail);

      try {
        await resend.emails.send({
          from: fromEmail,
          to: toList,
          subject: `Overdue Invoice | ${inv.booking_reference || inv.id}`,
          html,
        });

        await supabase
          .from("invoices")
          .update({
            last_reminder_at: new Date().toISOString(),
            reminder_count: (inv.reminder_count || 0) + 1,
          })
          .eq("id", inv.id);
      } catch (e) {
        console.error("Reminder failed:", inv.id, e);
      }
    }

    return NextResponse.json({
      ok: true,
      count: invoices.length,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
