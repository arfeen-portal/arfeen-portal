"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface Props {
  groupId: string;
}

const cards = (groupId: string) => [
  {
    key: "journey",
    title: "Ziyarat Journey",
    subtitle: "Live progress, check-ins & map",
    href: `/groups/${groupId}/journey`,
    badge: "Live",
    emoji: "🕋",
  },
  {
    key: "leader",
    title: "Leader Console",
    subtitle: "QR scan attendance + stats",
    href: `/groups/${groupId}/leader`,
    badge: "Leader",
    emoji: "🧭",
  },
  {
    key: "qr-print",
    title: "QR Print Sheet",
    subtitle: "A4 sheet – cards for all members",
    href: `/groups/${groupId}/qr-print`,
    badge: "Printable",
    emoji: "🖨️",
  },
  {
    key: "certificates",
    title: "Certificates",
    subtitle: "Download & WhatsApp share",
    href: `/groups/${groupId}/certificates`,
    badge: "Ready",
    emoji: "📜",
  },
];

export function GroupNavGrid({ groupId }: Props) {
  const items = cards(groupId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-[#001B4D] to-[#12377A] p-5 text-white shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">
              Group Control Panel
            </h1>
            <p className="mt-1 text-xs text-blue-100">
              Yahi se journey, attendance, QR print aur certificates sab manage karein.
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-4 py-1 text-[11px]">
            Arfeen Travel • Ziyarat
          </div>
        </div>
      </motion.div>

      {/* Cards grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2"
      >
        {items.map((card, idx) => (
          <motion.div
            key={card.key}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Link
              href={card.href}
              className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-md hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 inline-flex items-center gap-2">
                    <span className="text-lg">{card.emoji}</span>
                    <h2 className="text-sm font-semibold text-[#001B4D]">
                      {card.title}
                    </h2>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {card.subtitle}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-gray-600">
                  {card.badge}
                </span>
              </div>

              <div className="mt-4 h-px w-full bg-gradient-to-r from-[#F6B800] via-transparent to-[#F6B800] opacity-60" />

              <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                <span>Tap to open</span>
                <span className="text-[#001B4D]">
                  View &gt;
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
