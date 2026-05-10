"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Area,
  AreaChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
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
  essentials: "#8B5CF6",
  debt: "#EF4444",
  savings: "#10B981",
  lifestyle: "#F59E0B",
  credit: "#3B82F6",
};

const shortLabels = {
  essentials: "Essentials",
  debt: "Debt Payments",
  savings: "Savings",
  lifestyle: "Lifestyle",
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

export const ActualExpectedLineChart = memo(function ActualExpectedLineChart({ chartData }) {
  return (
    <div className="panel section chart-panel">
      <h2>Spending Analytics</h2>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%" debounce={80}>
          <AreaChart data={chartData} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="actualArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="4%" stopColor="#8B5CF6" stopOpacity={0.34} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(17, 24, 39, 0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#717182" }} tickLine={false} axisLine={false} interval={0} />
            <YAxis tickFormatter={(value) => `INR ${Math.round(value / 1000)}k`} tick={{ fontSize: 11, fill: "#717182" }} tickLine={false} axisLine={false} width={58} />
            <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, color: "#111827" }} />
            <Legend />
            <Area type="monotone" dataKey="Actual" stroke="#8B5CF6" strokeWidth={3} fill="url(#actualArea)" dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="Expected" stroke="#CBD5E1" strokeWidth={2.5} strokeDasharray="6 6" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export const BudgetAllocationChart = memo(function BudgetAllocationChart({ pieData }) {
  return (
    <div className="panel section chart-panel budget-viz-panel">
      <h2>Budget Visualization</h2>
      <div className="budget-viz-layout">
        <div className="budget-viz-chart">
          <ResponsiveContainer width="100%" height="100%" debounce={80}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={82} innerRadius={50} paddingAngle={3} isAnimationActive={false}>
                {pieData.map((entry) => <Cell key={entry.type} fill={categoryColors[entry.type] || "#8B5CF6"} />)}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, color: "#111827" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="budget-viz-legend">
          {pieData.map((entry) => (
            <div className="budget-viz-item" key={entry.type}>
              <span style={{ background: categoryColors[entry.type] || "#8B5CF6" }} />
              <div>
                <strong>{shortLabels[entry.type] || entry.name}</strong>
                <small>{Math.round(entry.percent || 0)}%</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export const CategoryDistributionChart = memo(function CategoryDistributionChart({ pieData }) {
  return (
    <div className="panel section chart-panel">
      <h2>Category Distribution</h2>
      <div className="chart-box split-chart">
        <ResponsiveContainer width="100%" height="100%" debounce={80}>
          <PieChart>
            <Pie data={pieData} dataKey="spent" nameKey="name" outerRadius={104} innerRadius={68} paddingAngle={3} isAnimationActive={false}>
              {pieData.map((entry) => <Cell key={entry.type} fill={categoryColors[entry.type] || "#8B5CF6"} />)}
            </Pie>
            <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, color: "#111827" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export const BehaviorRadarChart = memo(function BehaviorRadarChart({ data }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%" debounce={80}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(17, 24, 39, 0.12)" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#717182" }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "#717182" }} />
          <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.38} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
});
