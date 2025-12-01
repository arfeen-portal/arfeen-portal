import { createSupabaseServerClient } from "./supabase";

export async function convert(amount: number, to: string, base = "SAR") {
  if (to === base) return amount;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("fx_rates")
    .select("rate")
    .eq("base_currency", base).eq("quote_currency", to)
    .single();
  if (error || !data) return amount; // fallback
  return amount * Number(data.rate);
}

export function formatMoney(amount: number, currency: string, locale = "en") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}
