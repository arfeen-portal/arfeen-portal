"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend
);

const currencyFmt = (n: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n ?? 0);

function SeriesLine({ data }: { data: any[] }) {
  const chartData = useMemo(() => {
    const labels = data.map((r) => r.d);
    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: data.map((r) => r.revenue ?? r.rev ?? r.r ?? 0),
          borderWidth: 2,
          tension: 0.25,
        },
        {
          label: "Profit",
          data: data.map((r) => r.profit ?? r.p ?? 0),
          borderWidth: 2,
          tension: 0.25,
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${currencyFmt(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (v: any) => currencyFmt(Number(v)),
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}

function SectorDonut({ data }: { data: any[] }) {
  const chartData = useMemo(() => {
    const labels = data.map((r) => r.sector ?? r.sector_id);
    const values = data.map((r) => r.profit ?? 0);
    return {
      labels,
      datasets: [
        {
          label: "Profit",
          data: values,
        },
      ],
    };
  }, [data]);

  const options = {
    plugins: {
      legend: { position: "bottom" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.label}: ${currencyFmt(ctx.parsed)}`,
        },
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}

function AgentBar({ data }: { data: any[] }) {
  const chartData = useMemo(() => {
    const labels = data.map((r) => r.agent_name ?? r.agent_id);
    return {
      labels,
      datasets: [
        {
          label: "Profit",
          data: data.map((r) => r.profit ?? 0),
        },
      ],
    };
  }, [data]);

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx: any) => currencyFmt(ctx.parsed.x) },
      },
    },
    scales: {
      x: {
        ticks: { callback: (v: any) => currencyFmt(Number(v)) },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}

const SalesCharts = { SeriesLine, SectorDonut, AgentBar };
export default SalesCharts;
export { SeriesLine, SectorDonut, AgentBar };
