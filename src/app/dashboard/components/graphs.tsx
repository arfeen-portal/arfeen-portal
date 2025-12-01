"use client";

import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

export function RevenueGraph({ data }) {
  return (
    <div className="p-5 bg-white border rounded shadow">
      <h2 className="text-lg font-bold mb-3">Monthly Revenue</h2>
      <Bar
        data={{
          labels: data.map((x) => x.month),
          datasets: [
            {
              label: "Revenue (SAR)",
              data: data.map((x) => x.total),
            },
          ],
        }}
      />
    </div>
  );
}

export function TopRoutesGraph({ data }) {
  return (
    <div className="p-5 bg-white border rounded shadow">
      <h2 className="text-lg font-bold mb-3">Top Routes (%)</h2>
      <Pie
        data={{
          labels: data.map((x) => x.route),
          datasets: [
            {
              label: "% share",
              data: data.map((x) => x.percent),
            },
          ],
        }}
      />
    </div>
  );
}
