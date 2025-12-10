"use client";

import { useMemo } from "react";

interface Props {
  memberName: string;
  certificateUrl: string; // Supabase public URL (or signed URL)
}

export function CertificateShareButton({ memberName, certificateUrl }: Props) {
  const waLink = useMemo(() => {
    const text = `Alhamdulillah!\n\n${memberName} ne Arfeen Travel ke sath apni Ziyarat journey complete ki hai.\nCertificate link:\n${certificateUrl}\n\nDuaon me yaad rakhiye.`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [memberName, certificateUrl]);

  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-medium text-white shadow-md transition hover:bg-[#1ebe5d]"
    >
      <span className="text-lg"></span>
      <span>WhatsApp par share karein</span>
    </a>
  );
}
