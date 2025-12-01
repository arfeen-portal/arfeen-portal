'use client';

export default function UmrahToolsPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Umrah AI Tools</h1>
      <p className="text-xs text-gray-500">
        Yahaan se tum fatigue score, spiritual check-in, visa probability, etc. use kar sakte ho.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ToolCard
          title="Fatigue Score"
          description="Daily walk, heat, sleep aur pani ke hisab se AI fatigue level."
          href="/api/ai/fatigue-score"
        />
        <ToolCard
          title="Visa Probability"
          description="Profile data ke hisab se estimated visa approval chance."
          href="/api/ai/visa-probability"
        />
        <ToolCard
          title="Spiritual Check-In"
          description="Tawaf, Saee, Quran pages etc. ko track karo."
          href="/journeys"
        />
      </div>
    </div>
  );
}

function ToolCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="bg-white rounded-xl shadow-sm px-4 py-3 flex flex-col justify-between hover:shadow-md transition text-xs"
    >
      <div>
        <div className="font-semibold text-sm mb-1">{title}</div>
        <p className="text-gray-600">{description}</p>
      </div>
      <span className="mt-2 text-[10px] text-[#0b3d91] font-semibold">
        Open →
      </span>
    </a>
  );
}
