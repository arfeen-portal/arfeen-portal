import HotelBookingForm from "@/components/hotels/HotelBookingForm";

export default function NewHotelBookingPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-3">
      <a href="/hotel-bookings" className="text-blue-600 text-sm">
        &larr; Back
      </a>
      <h1 className="text-xl font-bold">New Hotel Booking</h1>
      <HotelBookingForm />
    </div>
  );
}
