import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  // Jo columns aap staging mein expect karte hain:
  const header = [
    'Agent Name',
    'Email',
    'Phone',
    'City',
    'Country',
    'Commission %',
    'Credit Limit',
  ];

  const csvContent = header.join(',') + '\n';

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="agents_import_template.csv"',
    },
  });
}
