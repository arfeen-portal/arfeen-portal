"use client";

export default function ZiyaratPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#001B4D] to-[#12377A] p-5 text-white shadow-lg">
        <h1 className="text-xl font-semibold">Ziyarat Module</h1>
        <p className="mt-1 text-xs text-blue-100">
          Ziyarat attendance, QR scan, certificates waghera ab Groups module
          ke andar manage ho rahe hain.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-xs text-gray-600">
        Abhi Ziyarat ke liye main workflow yeh hai:
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li><span className="font-semibold">Groups</span> page se group select karein.</li>
          <li>Group dashboard se <span className="font-semibold">Leader Console</span>, <span className="font-semibold">QR Print</span> aur <span className="font-semibold">Certificates</span> use karein.</li>
        </ol>
      </div>
    </div>
  );
}
