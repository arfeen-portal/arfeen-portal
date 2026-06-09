import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type Role =
  | "super_admin"
  | "admin"
  | "accountant"
  | "operations"
  | "agent"
  | "staff"
  | "driver";

const PUBLIC_PATHS = [
  "/login",
  "/auth",
  "/register",
  "/unauthorized",
  "/api/public",
];

const ROLE_RULES: { prefixes: string[]; roles: Role[] }[] = [
  {
    prefixes: ["/admin", "/api/admin"],
    roles: ["super_admin", "admin"],
  },
  {
    prefixes: ["/accounts", "/api/accounts"],
    roles: ["super_admin", "admin", "accountant"],
  },
  {
    prefixes: ["/operations", "/api/operations"],
    roles: ["super_admin", "admin", "operations"],
  },
  {
    prefixes: ["/agent", "/api/agent"],
    roles: ["super_admin", "admin", "agent"],
  },
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function matchedRule(pathname: string) {
  return ROLE_RULES.find((rule) =>
    rule.prefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  );
}

function apiResponse(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");

  const host = req.headers.get("host") || "";
  const cleanHost = host.replace(/^www\./, "").split(":")[0];

  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  res.headers.set("x-portal-domain", cleanHost);

  if (cleanHost && cleanHost !== "localhost") {
    res.cookies.set("portal_domain", cleanHost, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  }

  if (isPublicPath(pathname)) {
    return res;
  }

  const rule = matchedRule(pathname);

  if (!rule) {
    return res;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isApi) {
      return apiResponse("Supabase environment variables are missing.", 500);
    }

    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "missing_env");
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    if (isApi) {
      return apiResponse("Authentication required.", 401);
    }

    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("email", user.email)
    .maybeSingle();

  if (profileError || !profile?.role) {
    if (isApi) {
      return apiResponse("User role not found.", 403);
    }

    const url = req.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  const role = profile.role as Role;

  if (!rule.roles.includes(role)) {
    if (isApi) {
      return apiResponse("You do not have permission to access this resource.", 403);
    }

    const url = req.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};