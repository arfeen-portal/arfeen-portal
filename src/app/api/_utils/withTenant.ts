import { NextRequest } from "next/server";
import { getTenantContext } from "@/lib/getTenantContext";

export async function withTenant(req: NextRequest) {
  const domain = req.headers.get("host")?.split(":")[0];

  return await getTenantContext({ domain });
}
