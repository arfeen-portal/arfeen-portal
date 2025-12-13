import { createSupabaseServerClient } from "./supabase";

type CurrencyRateRow = {
  rate: number;
};

export async function convertAmount(
  amount: number,
  from: string,
  to: string
) {
  try {
    if (from === to) return amount;

    const supabase = createSupabaseServerClient();

    const { data, error } = await (supabase as any)
      .from("currency_rates")
      .select("rate")
      .eq("from", from)
      .eq("to", to)
      .single();

    // fallback safety
    if (error || !data) return amount;

    const row = data as CurrencyRateRow;

    return amount * Number(row.rate);
  } catch (e) {
    console.error("currency convert error:", e);
    return amount;
  }
}

export function formatMoney(
  amount: number,
  currency: string,
  locale = "en"
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
