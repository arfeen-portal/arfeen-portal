import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serverClient = () =>
  createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const invoiceId = context.params.id;
    const supabase = serverClient();

    // 1) Load invoice + items
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('id', { ascending: true });

    if (itemsError) {
      console.error(itemsError);
    }

    // 2) Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size (portrait)
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Arfeen theme colors (approx Royal Blue + Gold)
    const royalBlue = rgb(0 / 255, 47 / 255, 108 / 255);
    const gold = rgb(244 / 255, 189 / 255, 59 / 255);
    const textDark = rgb(40 / 255, 40 / 255, 40 / 255);

    let y = height - 50;

    // 3) Header bar
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width,
      height: 80,
      color: royalBlue
    });

    page.drawText('ARFEEN TRAVEL', {
      x: 40,
      y: height - 50,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText('Invoice', {
      x: width - 140,
      y: height - 50,
      size: 18,
      font: fontBold,
      color: gold
    });

    y = height - 110;

    // 4) Invoice meta
    const labelSize = 10;
    const valueSize = 11;

    const drawLabelValue = (label: string, value: string, x: number, yPos: number) => {
      page.drawText(label, {
        x,
        y: yPos,
        size: labelSize,
        font: fontRegular,
        color: textDark
      });
      page.drawText(value, {
        x,
        y: yPos - 14,
        size: valueSize,
        font: fontBold,
        color: textDark
      });
    };

    drawLabelValue('Invoice ID', invoice.id, 40, y);
    drawLabelValue(
      'Booking Reference',
      invoice.booking_reference || '-',
      40,
      y - 40
    );

    drawLabelValue(
      'Issue Date',
      invoice.issue_date ? String(invoice.issue_date) : '-',
      280,
      y
    );
    drawLabelValue(
      'Due Date',
      invoice.due_date ? String(invoice.due_date) : '-',
      280,
      y - 40
    );

    // 5) Bill to section
    y = y - 90;
    page.drawText('Bill To', {
      x: 40,
      y,
      size: 11,
      font: fontBold,
      color: royalBlue
    });

    page.drawText(invoice.customer_name || 'N/A', {
      x: 40,
      y: y - 16,
      size: 10,
      font: fontRegular,
      color: textDark
    });

    if (invoice.customer_email) {
      page.drawText(invoice.customer_email, {
        x: 40,
        y: y - 30,
        size: 10,
        font: fontRegular,
        color: textDark
      });
    }

    // 6) Items table header
    y = y - 70;
    const tableStartX = 40;
    const tableWidth = width - 80;

    page.drawRectangle({
      x: tableStartX,
      y: y - 20,
      width: tableWidth,
      height: 24,
      color: royalBlue
    });

    const headerY = y - 15;

    const drawHeaderCell = (text: string, x: number) => {
      page.drawText(text, {
        x,
        y: headerY,
        size: 10,
        font: fontBold,
        color: rgb(1, 1, 1)
      });
    };

    drawHeaderCell('Description', tableStartX + 8);
    drawHeaderCell('Qty', tableStartX + 260);
    drawHeaderCell(`Unit (${invoice.base_currency})`, tableStartX + 310);
    drawHeaderCell(`Total (${invoice.base_currency})`, tableStartX + 420);

    // 7) Items rows
    let rowY = y - 48;

    if (items && items.length > 0) {
      items.forEach((item: any) => {
        if (rowY < 120) {
          // new page if needed (simple)
          const newPage = pdfDoc.addPage([595, 842]);
          rowY = 760;
          newPage.drawText('Continued...', {
            x: 40,
            y: rowY,
            size: 10,
            font: fontRegular,
            color: textDark
          });
        }

        page.drawText(String(item.description || ''), {
          x: tableStartX + 8,
          y: rowY,
          size: 10,
          font: fontRegular,
          color: textDark
        });

        page.drawText(String(item.quantity || 1), {
          x: tableStartX + 260,
          y: rowY,
          size: 10,
          font: fontRegular,
          color: textDark
        });

        page.drawText(
          (Number(item.unit_price_base) || 0).toFixed(2),
          {
            x: tableStartX + 310,
            y: rowY,
            size: 10,
            font: fontRegular,
            color: textDark
          }
        );

        page.drawText(
          (Number(item.total_base) || 0).toFixed(2),
          {
            x: tableStartX + 420,
            y: rowY,
            size: 10,
            font: fontRegular,
            color: textDark
          }
        );

        rowY -= 18;
      });
    } else {
      page.drawText('No items found.', {
        x: tableStartX + 8,
        y: rowY,
        size: 10,
        font: fontRegular,
        color: textDark
      });
      rowY -= 18;
    }

    // 8) Totals box (bottom right)
    const totalsBoxY = 140;
    const boxX = width - 260;
    const boxWidth = 220;

    page.drawRectangle({
      x: boxX,
      y: totalsBoxY,
      width: boxWidth,
      height: 110,
      borderColor: royalBlue,
      borderWidth: 1
    });

    const lineStartY = totalsBoxY + 90;
    const totalsCurrency = invoice.base_currency;
    const billingCurrency = invoice.billing_currency;

    const drawTotalLine = (
      label: string,
      value: string,
      yPos: number,
      bold = false
    ) => {
      page.drawText(label, {
        x: boxX + 10,
        y: yPos,
        size: 10,
        font: bold ? fontBold : fontRegular,
        color: textDark
      });
      page.drawText(value, {
        x: boxX + boxWidth - 10 - value.length * 5,
        y: yPos,
        size: 10,
        font: bold ? fontBold : fontRegular,
        color: textDark
      });
    };

    drawTotalLine(
      `Subtotal (${totalsCurrency})`,
      (Number(invoice.subtotal_base) || 0).toFixed(2),
      lineStartY
    );
    drawTotalLine(
      `Tax (${totalsCurrency})`,
      (Number(invoice.tax_base) || 0).toFixed(2),
      lineStartY - 18
    );
    drawTotalLine(
      `Total (${totalsCurrency})`,
      (Number(invoice.total_base) || 0).toFixed(2),
      lineStartY - 36,
      true
    );

    drawTotalLine(
      `Total (${billingCurrency})`,
      (Number(invoice.total_billing) || 0).toFixed(2),
      lineStartY - 60,
      true
    );

    // Conversion note
    page.drawText(
      `Rate: 1 ${totalsCurrency} = ${Number(invoice.conversion_rate || 1).toFixed(
        4
      )} ${billingCurrency}`,
      {
        x: boxX + 10,
        y: totalsBoxY + 10,
        size: 9,
        font: fontRegular,
        color: textDark
      }
    );

    // 9) Footer
    page.drawText('Thank you for choosing Arfeen Travel.', {
      x: 40,
      y: 60,
      size: 10,
      font: fontRegular,
      color: textDark
    });

    if (invoice.notes) {
      page.drawText(`Notes: ${invoice.notes}`, {
        x: 40,
        y: 45,
        size: 9,
        font: fontRegular,
        color: textDark
      });
    }

    // 10) Finalize PDF
    const pdfBytes = await pdfDoc.save();

   return new Response(pdfBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoiceId}.pdf"`
      }
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
