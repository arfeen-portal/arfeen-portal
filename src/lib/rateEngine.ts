import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";

const supabase = createClient();

export async function getHotelRates(city: string, checkIn: string, checkOut: string) {
  const { data, error } = await supabase
    .from("hotel_rates")
    .select(`
      id, hotel_name, base_price, markup, currency, room_type, occupancy, supplier:supplier_id(name, priority, commission_pct)
    `)
    .eq("city", city)
    .gte("check_in", checkIn)
    .lte("check_out", checkOut)
    .order("priority", { foreignTable: "supplier" });

  if (error) throw error;

  return data.map(rate => ({
    ...rate,
    final_price: Number(rate.base_price) + Number(rate.markup)
  }));
}

export async function getFlightRates(route: string, travelDate: string) {
  const { data, error } = await supabase
    .from("flight_rates")
    .select(`
      id, airline, base_price, markup, currency, class, refundable, baggage_allowance, supplier:supplier_id(name, priority)
    `)
    .eq("route", route)
    .eq("travel_date", travelDate)
    .order("priority", { foreignTable: "supplier" });

  if (error) throw error;

  return data.map(rate => ({
    ...rate,
    final_price: Number(rate.base_price) + Number(rate.markup)
  }));
}
