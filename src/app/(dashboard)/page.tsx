import { useEffect, useState } from 'react';

export function RecentAIAssistantPlans() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetch('/api/ai/recommendations')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPlans(d.recommendations);
      });
  }, []);

  if (!plans.length) return null;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
      <h3 className="font-semibold text-sm">🧠 Recent AI Plans</h3>
      <ul className="space-y-2 text-xs">
        {plans.map((p, i) => (
          <li key={i} className="border rounded p-2">
            <div className="font-medium">
              Budget: {p.generated_plan.summary.totalBudget} SAR
            </div>
            <div>Hotel: {p.generated_plan.summary.hotelCategory}</div>
            <div className="text-gray-500">
              Created: {new Date(p.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
