import HotelRateForm from "@/components/hotels/HotelRateForm";

export default function NewHotelRatePage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-3">
      <a href="/hotel-rates" className="text-blue-600 text-sm">
        &larr; Back
      </a>
      <h1 className="text-xl font-bold">New Rate Plan</h1>
      <HotelRateForm />
    </div>
  );
}
