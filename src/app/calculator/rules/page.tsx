'use client';

const RULES = [
  {
    title: 'Walk Load',
    description:
      'Zyada walking (Tawaf + Saee + Ziyarat) hone par fatigue barhta hai. Elderly / weak logon ke liye daily distance limit rakho.',
  },
  {
    title: 'Heat & Hydration',
    description:
      'High temperature + kam pani = fatigue explosion. Har 30–40 minutes me pani ya electrolyte sip karna zaroori hai.',
  },
  {
    title: 'Sleep & Rest',
    description:
      '4–5 ghante se kam sleep ko red zone samjho. Planner me rozana ek proper rest block zaroor add karo.',
  },
  {
    title: 'Age & Health',
    description:
      'Heart / sugar / BP / joint issues walay logon ka fatigue multiplier zyada hota hai. Unke liye short routes aur lifts use karo.',
  },
];

export default function FatigueCalculatorRulesPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Umrah Fatigue – Calculator Rules</h1>
      <p className="text-xs text-gray-500">
        Ye rules AI fatigue score calculate karne ke base banenge. Abhi static
        text hai, baad me isko dynamic calculator ke sath connect karenge.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RULES.map((rule) => (
          <div
            key={rule.title}
            className="bg-white rounded-lg shadow-sm p-4 space-y-2"
          >
            <h2 className="text-sm font-semibold">{rule.title}</h2>
            <p className="text-xs text-gray-600">{rule.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
