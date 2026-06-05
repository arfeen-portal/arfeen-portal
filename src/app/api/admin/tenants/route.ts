import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getEnvStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    url,
    hasUrl: Boolean(url),
    hasServiceKey: Boolean(serviceKey),
    urlLooksValid: Boolean(url?.startsWith("https://") && url.includes(".supabase.co")),
  };
}

export async function GET() {
  try {
    const env = getEnvStatus();

    if (!env.hasUrl || !env.hasServiceKey || !env.urlLooksValid) {
      return NextResponse.json(
        {
          data: [],
          error: "Supabase env invalid or missing",
          debug: {
            hasUrl: env.hasUrl,
            hasServiceKey: env.hasServiceKey,
            urlLooksValid: env.urlLooksValid,
            url: env.url,
          },
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          fetch,
        },
      }
    );

    const { data, error } = await supabase
      .from("tenants")
      .select("id,name,domain,is_active,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          data: [],
          error: error.message,
          debug: {
            code: error.code,
            details: error.details,
            hint: error.hint,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data ?? [],
      error: null,
      debug: {
        rows: data?.length ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        data: [],
        error: err?.message || "Unknown API error",
        debug: {
          name: err?.name,
          cause: err?.cause?.message,
          stack: err?.stack,
        },
      },
      { status: 500 }
    );
  }
}