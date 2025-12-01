export type DriverRideStatus = "upcoming" | "ongoing" | "completed";

export type DriverRide = {
  id: string;
  pickup_name: string;
  dropoff_name: string;
  pickup_time: string; // ISO string
  passengers: number;
  notes?: string | null;
  status: DriverRideStatus;
};
