export type KPITrend = "up" | "down" | "neutral";

export type KPIItem = {
  label: string;
  value: string;
  change: string;
  trend: KPITrend;
};

export type RevenuePoint = {
  month: string;
  revenue: number;
  bookings: number;
};

export type RoutePoint = {
  route: string;
  total: number;
  bookings: number;
};

export type StatusPoint = {
  name: string;
  value: number;
};

export type RecentBooking = {
  id: string;
  customer_name: string;
  agent_name: string;
  pickup_city: string;
  dropoff_city: string;
  vehicle_type: string;
  pickup_time: string | null;
  total_price: number;
  status: string;
};

export type DashboardResponse = {
  success: boolean;
  kpis: KPIItem[];
  revenueTrend: RevenuePoint[];
  topRoutes: RoutePoint[];
  bookingStatuses: StatusPoint[];
  recentBookings: RecentBooking[];
};