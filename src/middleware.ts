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

const MASTER_DOMAINS = ["localhost", "127.0.0.1"];

const CLIENT_BLOCKED_PREFIXES = [
  "/admin",
  "/accounts",
  "/operations",
  "/reports",
  "/branding",
  "/system",
  "/ai",
];

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/auth",
  "/register",
  "/unauthorized",
  "/api/public",
  "/umrah-packages",
  "/umrah/groups",
  "/hotels",
  "/transport",
  "/umrah/visa",
  "/umrah/ziyarat",
  "/contact",
];

const ROLE_RULES: { prefixes: string[]; roles: Role[] }[] = [
  {
    prefixes: ["/admin/hotels/offline-demands"],
    roles: ["super_admin", "admin", "operations"],
  },
  {
    prefixes: ["/admin", "/api/admin"],
    roles: ["super_admin", "admin"],
  },
  {
    prefixes: ["/accounts", "/api/accounts"],
    roles: ["super_admin", "admin", "accountant"],
  },
  {
    prefixes: ["/operations", "/oprations", "/api/operations"],
    roles: ["super_admin", "admin", "operations"],
  },
  {
    prefixes: ["/agent", "/api/agent"],
    roles: ["super_admin", "admin", "agent"],
  },
];

function cleanDomain(host: string) {
  return host.toLowerCase().replace(/^www\./, "").split(":")[0];
}

function isMasterDomain(domain: string) {
  return MASTER_DOMAINS.includes(domain);
}

function startsWithPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isPublicPath(pathname: string) {
  return startsWithPrefix(pathname, PUBLIC_PATHS);
}

function matchedRule(pathname: string) {
  return ROLE_RULES.find((rule) => startsWithPrefix(pathname, rule.prefixes));
}

function apiResponse(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");

  const host = req.headers.get("host") || "";
  const domain = cleanDomain(host);
  const masterDomain = isMasterDomain(domain);

  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  res.headers.set("x-portal-domain", domain);

  if (domain && !masterDomain) {
    res.cookies.set("portal_domain", domain, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  }

  const rule = matchedRule(pathname);

  /**
   * WHITE-LABEL SECURITY RULE
   * Client domain par unauthenticated backend routes open nahi honge.
   * Auth-protected ROLE_RULES paths (e.g. /admin, /accounts) fall through
   * to session/role checks below instead of redirecting to public homepage.
   */
  if (
    !masterDomain &&
    startsWithPrefix(pathname, CLIENT_BLOCKED_PREFIXES) &&
    !rule
  ) {
    if (isApi) {
      return apiResponse("This backend route is not available on client domain.", 403);
    }

    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  if (isPublicPath(pathname)) {
    return res;
  }

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