"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AgentWelcomePage() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(10);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">
          Shukriya! Aapka Agent Account ban gaya ✅
        </h1>
        <p className="text-sm text-slate-600 mb-4">
          Aapka status abhi <span className="font-semibold">"pending"</span> hai.
          Arfeen Travel team aapki details review karegi. Approval ke baad aapko
          net rates aur full dashboard access mil jayega.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 text-left text-xs text-slate-600 mb-4">
          <p className="font-semibold mb-1">Next steps:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Email / WhatsApp par Arfeen team se confirmation message receive
              hoga.
            </li>
            <li>
              Approval ke baad aap same email & password se login karke
              dashboard use kar sakte hain.
            </li>
            <li>
              Zarurat pare to Arfeen team aap se additional documents bhi
              maang sakti hai.
            </li>
          </ul>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Go to Dashboard (Login Area)
        </button>

        <p className="text-[11px] text-slate-400 mt-3">
          Aap {seconds} seconds baad automatic dashboard par redirect ho
          jayenge.
        </p>
      </div>
    </div>
  );
}
