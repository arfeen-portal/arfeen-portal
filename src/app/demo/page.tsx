export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="card max-w-lg w-full space-y-4 text-sm">
        <h1 className="text-xl font-bold text-center">Demo Access</h1>

        <div className="space-y-2">
          <p className="font-semibold">Agent Portal</p>
          <p className="text-xs text-gray-500">
            URL: <span className="font-mono">/agent</span>
          </p>
          <p className="text-xs text-gray-500">
            Email: demo.agent@arfeentravel.com
            <br />
            Password: ********
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-semibold">Admin Dashboard</p>
          <p className="text-xs text-gray-500">
            URL: <span className="font-mono">/admin</span>
          </p>
        </div>

        <p className="text-[11px] text-gray-400">
          * Ye sirf demo data hai, original bookings & accounts alag secure
          database pe chal rahe hain.
        </p>
      </div>
    </div>
  );
}
