// src/app/(dashboard)/transport/bookings/new/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default function NewTransportBookingPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">New Transport Booking</h1>
      <p className="text-sm text-gray-500 mt-2">
        This page will show the full transport booking form.
      </p>
    </div>
  );
}
