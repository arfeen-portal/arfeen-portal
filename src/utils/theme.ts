import { createClient } from "@/utils/supabase/server";

export type BrandConfig = {
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  name: string;
};

export async function getBrandForHost(
  host: string
): Promise<BrandConfig> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("portal_brands")
    .select("name, primary_color, accent_color, logo_url, host")
    .eq("host", host)
    .maybeSingle();

  if (!data) {
    // default Arfeen brand
    return {
      name: "Arfeen Travel",
      primaryColor: "#0F3A6D",
      accentColor: "#E4B343",
      logoUrl: "/arfeen-logo.png",
    };
  }

  return {
    name: data.name,
    primaryColor: data.primary_color,
    accentColor: data.accent_color,
    logoUrl: data.logo_url,
  };
}
