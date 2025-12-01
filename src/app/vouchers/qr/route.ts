import { NextResponse } from 'next/server';
import * as QRCode from 'qrcode';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hash = searchParams.get('hash') || 'NO_HASH';

  const png = await QRCode.toBuffer(hash);

  return new NextResponse(png as any, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': png.length.toString(),
    },
  });
}
