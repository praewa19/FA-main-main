"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

const categoryColors = {
  essentials: "#5f8f63",
  debt: "#b36a3c",
  savings: "#2f7d46",
  lifestyle: "#b59b64",
};

export const ActualExpectedChart = memo(function ActualExpectedChart({ chartData }) {
  return (
    <div className="panel section chart-panel">
      <h2>Actual vs Expected</h2>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%" debounce={80}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(65, 85, 61, 0.18)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6f745f" }} tickLine={false} axisLine={false} interval={0} />
            <YAxis tickFormatter={(value) => `INR ${Math.round(value / 1000)}k`} tick={{ fontSize: 11, fill: "#6f745f" }} tickLine={false} axisLine={false} width={58} />
            <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ background: "#fffaf0", border: "1px solid rgba(75, 115, 82, 0.22)", borderRadius: 8, color: "#263124" }} cursor={{ fill: "rgba(47, 125, 70, 0.08)" }} />
            <Legend wrapperStyle={{ color: "#6f745f" }} />
            <Bar dataKey="Actual" fill="#2f7d46" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="Expected" fill="#b59b64" radius={[6, 6, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export const BudgetAllocationChart = memo(function BudgetAllocationChart({ pieData }) {
  return (
    <div className="panel section chart-panel">
      <h2>Budget Allocation</h2>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%" debounce={80}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={105} innerRadius={48} paddingAngle={2} isAnimationActive={false} label={(entry) => entry.name.split(" ")[0]}>
              {pieData.map((entry) => <Cell key={entry.type} fill={categoryColors[entry.type]} />)}
            </Pie>
            <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ background: "#fffaf0", border: "1px solid rgba(75, 115, 82, 0.22)", borderRadius: 8, color: "#263124" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
