"use client";
import { PieChart, Pie, Tooltip } from "recharts";

export default function SectorChart({ data }: { data: any[] }) {
  return (
    <>
      <h3>🛫 Sector Wise Profit</h3>
      <PieChart width={400} height={300}>
        <Pie data={data} dataKey="profit" nameKey="sector" outerRadius={120} fill="#ff9800" label />
        <Tooltip />
      </PieChart>
    </>
  );
}
