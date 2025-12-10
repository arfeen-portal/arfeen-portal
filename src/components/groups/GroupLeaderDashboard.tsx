"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// react-qr-reader CommonJS export hai, is liye dynamic import ko default ya module dono handle karwa rahe hain
const QrReader = dynamic(
  () =>
    import("react-qr-reader").then((mod: any) => (mod as any).default || (mod as any)),
  { ssr: false }
) as any;

type Summary = {
  totalMembers: number;
  totalSpots: number;
  totalCheckins: number;
  completionPercent: number;
  score: number;
};

interface Props {
  groupId: string;
  currentSpotId: string;
}

export function GroupLeaderDashboard({ groupId, currentSpotId }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    const res = await fetch(`/api/groups/leader-summary?group_id=${groupId}`);
    const data = await res.json();
    setSummary(data);
  };

  useEffect(() => {
    fetchSummary();
  }, [groupId]);

  const handleScan = async (value: string | null) => {
    if (!value || loading) return;

    try {
      setLoading(true);
      setScanStatus("Processing...");

      const parsed = JSON.parse(value);

      if (parsed.t !== "attendance" || !parsed.qr_token) {
        setScanStatus("Invalid QR code");
        setLoading(false);
        return;
      }

      // Optional: GPS
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const res = await fetch("/api/groups/qr-checkin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              qr_token: parsed.qr_token,
              group_id: groupId,
              spot_id: currentSpotId,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          });

          if (res.ok) {
            setScanStatus("Attendance marked ✅");
            await fetchSummary();
          } else {
            const err = await res.json();
            setScanStatus(err.error || "Error saving attendance");
          }

          setLoading(false);
        },
        async () => {
          // GPS na mile to bhi basic attendance
          const res = await fetch("/api/groups/qr-checkin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              qr_token: parsed.qr_token,
              group_id: groupId,
              spot_id: currentSpotId,
            }),
          });

          if (res.ok) {
            setScanStatus("Attendance marked (no GPS) ✅");
            await fetchSummary();
          } else {
            const err = await res.json();
            setScanStatus(err.error || "Error saving attendance");
          }

          setLoading(false);
        }
      );
    } catch (e) {
      console.error(e);
      setScanStatus("QR parse error");
      setLoading(false);
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setScanStatus("Camera error");
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-[#001B4D] to-[#12377A] p-5 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Group Leader Console</h1>
            <p className="text-xs text-blue-100">
              QR scan se attendance + live completion stats
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-4 py-2 text-xs">
            Arfeen Travel • Ziyarat
          </div>
        </div>
        {summary && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
            <div>
              <div className="text-blue-100">Members</div>
              <div className="text-lg font-bold">{summary.totalMembers}</div>
            </div>
            <div>
              <div className="text-blue-100">Completion</div>
              <div className="text-lg font-bold">
                {summary.completionPercent}%
              </div>
            </div>
            <div>
              <div className="text-blue-100">Group Score</div>
              <div className="text-lg font-bold text-yellow-300">
                {summary.score.toFixed(1)}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Scanner + Status + Progress */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-md"
        >
          <h2 className="mb-3 text-sm font-semibold text-[#001B4D]">
            QR Scan Attendance
          </h2>
          <div className="overflow-hidden rounded-xl bg-black/90">
            {/* TypeScript ko props ki parwa na karne do */}
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <QrReader
              delay={400}
              onError={handleError}
              onScan={handleScan}
              style={{ width: "100%" }}
            />
          </div>
          <div className="mt-3 text-xs">
            <span className="font-medium text-gray-700">Status: </span>
            <span
              className={
                scanStatus?.includes("✅")
                  ? "text-green-600"
                  : scanStatus
                  ? "text-red-500"
                  : "text-gray-400"
              }
            >
              {scanStatus || "Ready to scan..."}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-md"
        >
          <h2 className="mb-3 text-sm font-semibold text-[#001B4D]">
            Journey Progress
          </h2>
          {summary ? (
            <>
              <div className="mb-2 flex justify-between text-[11px] text-gray-500">
                <span>Overall Completion</span>
                <span>{summary.completionPercent}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-[#F6B800] to-[#FFD966] transition-all"
                  style={{
                    width: `${Math.min(summary.completionPercent, 100)}%`,
                  }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-gray-500">Total Spots</div>
                  <div className="text-lg font-semibold text-[#001B4D]">
                    {summary.totalSpots}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-gray-500">Total Check-ins</div>
                  <div className="text-lg font-semibold text-[#001B4D]">
                    {summary.totalCheckins}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="animate-pulse text-xs text-gray-400">
              Loading stats...
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
