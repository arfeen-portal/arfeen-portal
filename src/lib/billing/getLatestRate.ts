// Adjust import to your existing Supabase server client helper
import { createClient } from '@supabase/supabase-js';
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serverClient = () =>
  createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

export async function getLatestRate(baseCurrency: string, targetCurrency: string) {
  if (baseCurrency === targetCurrency) {
    return 1;
  }

  const supabase = serverClient();

  const { data, error } = await supabase
    .from('currency_rates')
    .select('*')
    .eq('base_currency', baseCurrency)
    .eq('currency', targetCurrency)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`No currency rate found for ${baseCurrency} -> ${targetCurrency}`);
  }

  return Number(data.rate);
}
