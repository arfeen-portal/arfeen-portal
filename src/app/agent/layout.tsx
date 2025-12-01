import "@/app/globals.css";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" className="w-8 h-8 object-contain" />
          <div>
            <p className="font-semibold text-sm">Arfeen Agent Portal</p>
            <p className="text-[11px] text-gray-500">
              B2B Umrah & Transport Booking
            </p>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
