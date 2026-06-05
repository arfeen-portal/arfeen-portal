"use client";

import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";

import {
  Bar as BarChart,
  Pie as PieChart,
} from "react-chartjs-2";

ChartJS.register(
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

type RevenueItem = {
  month: string;
  total: number;
};

type RouteItem = {
  route: string;
  percent: number;
};

type RevenueGraphProps = {
  data: RevenueItem[];
};

type TopRoutesGraphProps = {
  data: RouteItem[];
};

const barOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
};

const pieOptions: ChartOptions<"pie"> = {
  responsive: true,
  maintainAspectRatio: false,
};

export function RevenueGraph({ data }: RevenueGraphProps) {
  const chartData: ChartData<"bar"> = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: "Revenue (SAR)",
        data: data.map((item) => Number(item.total ?? 0)),
      },
    ],
  };

  return (
    <div className="p-5 bg-white border rounded shadow">
      <h2 className="text-lg font-bold mb-3">
        Monthly Revenue
      </h2>

      <div className="h-72">
        <BarChart
          data={chartData}
          options={barOptions}
        />
      </div>
    </div>
  );
}

export function TopRoutesGraph({
  data,
}: TopRoutesGraphProps) {
  const chartData: ChartData<"pie"> = {
    labels: data.map((item) => item.route),
    datasets: [
      {
        label: "% Share",
        data: data.map((item) =>
          Number(item.percent ?? 0)
        ),
      },
    ],
  };

  return (
    <div className="p-5 bg-white border rounded shadow">
      <h2 className="text-lg font-bold mb-3">
        Top Routes (%)
      </h2>

      <div className="h-72">
        <PieChart
          data={chartData}
          options={pieOptions}
        />
      </div>
    </div>
  );
}