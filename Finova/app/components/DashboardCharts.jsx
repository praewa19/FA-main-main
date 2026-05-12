"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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

export const MonthlyPaceTrackerChart = memo(function MonthlyPaceTrackerChart({ chartData, isHistoricalMonth = false, activeMonthLabel = "" }) {
  const totals = chartData.reduce((acc, item) => {
    acc.actual += Number(item.Actual || 0);
    acc.expected += Number(item.Expected || 0);
    acc.limit += Number(item.Limit || 0);
    return acc;
  }, { actual: 0, expected: 0, limit: 0 });
  const paceDelta = totals.actual - totals.expected;
  const pacePercent = totals.expected > 0 ? Math.round((totals.actual / totals.expected) * 100) : 0;
  const budgetDelta = totals.actual - totals.limit;
  const budgetUsePercent = totals.limit > 0 ? Math.round((totals.actual / totals.limit) * 100) : 0;
  const largestVariance = chartData.reduce((current, item) => {
    const variance = Number(item.Actual || 0) - Number(item.Limit || 0);
    if (!current || Math.abs(variance) > Math.abs(current.variance)) {
      return { item, variance };
    }
    return current;
  }, null);

  if (isHistoricalMonth) {
    return (
      <div className="panel section chart-panel">
        <h2>Month-End Review</h2>
        <div className="pace-tracker-summary">
          <div>
            <span>Total spent</span>
            <strong>{formatMoney(totals.actual)}</strong>
          </div>
          <div>
            <span>Budget used</span>
            <strong className={budgetDelta > 0 ? "negative" : "positive"}>{budgetUsePercent}%</strong>
            <small>{budgetDelta > 0 ? `${formatMoney(Math.abs(budgetDelta))} over plan` : `${formatMoney(Math.abs(budgetDelta))} under plan`}</small>
          </div>
          <div>
            <span>Largest variance</span>
            <strong>{shortLabels[largestVariance?.item?.type] || largestVariance?.item?.name || activeMonthLabel || "Month review"}</strong>
            <small className={largestVariance?.variance > 0 ? "negative" : "positive"}>
              {largestVariance ? `${formatMoney(Math.abs(largestVariance.variance))} ${largestVariance.variance > 0 ? "over budget" : "under budget"}` : "No category movement"}
            </small>
          </div>
        </div>
        <div className="pace-tracker-rows">
          {chartData.map((item) => {
            const actual = Number(item.Actual || 0);
            const limit = Number(item.Limit || 0);
            const variance = actual - limit;
            const usagePercent = limit > 0 ? Math.round((actual / limit) * 100) : 0;
            const barWidth = Math.min(100, Math.max(4, usagePercent));
            const tone = actual > limit ? "over" : "under";
            return (
              <div className="pace-row" key={item.type || item.name}>
                <div className="pace-row-head">
                  <strong>{shortLabels[item.type] || item.name}</strong>
                  <span className={variance > 0 ? "negative" : "positive"}>
                    {variance > 0 ? `${formatMoney(variance)} over` : `${formatMoney(Math.abs(variance))} under`}
                  </span>
                </div>
                <div className="pace-row-track">
                  <span className={`pace-row-bar ${tone}`} style={{ width: `${barWidth}%`, background: categoryColors[item.type] || "#8B5CF6" }} />
                </div>
                <div className="pace-row-meta">
                  <small>Spent {formatMoney(actual)}</small>
                  <small>Budget {formatMoney(limit)}</small>
                  <small>{usagePercent}% used</small>
                </div>
              </div>
            );
          })}
        </div>
        <div className="pace-tracker-legend">
          <span><b className="pace-dot actual" /> spending used</span>
          <span><b className="pace-dot cap" /> monthly budget cap</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel section chart-panel">
      <h2>Monthly Pace Tracker</h2>
      <div className="pace-tracker-summary">
        <div>
          <span>Spent so far</span>
          <strong>{formatMoney(totals.actual)}</strong>
        </div>
        <div>
          <span>Expected by now</span>
          <strong>{formatMoney(totals.expected)}</strong>
        </div>
        <div>
          <span>Pace signal</span>
          <strong className={paceDelta > 0 ? "negative" : "positive"}>
            {paceDelta > 0 ? `${formatMoney(Math.abs(paceDelta))} ahead` : `${formatMoney(Math.abs(paceDelta))} below`}
          </strong>
          <small>{pacePercent}% of expected pace</small>
        </div>
      </div>
      <div className="pace-tracker-rows">
        {chartData.map((item) => {
          const actual = Number(item.Actual || 0);
          const expected = Number(item.Expected || 0);
          const limit = Number(item.Limit || 0);
          const ratio = expected > 0 ? Math.min(160, Math.round((actual / expected) * 100)) : 0;
          const barWidth = Math.min(100, Math.max(4, ratio));
          const tone = actual > expected ? "over" : "under";
          return (
            <div className="pace-row" key={item.type || item.name}>
              <div className="pace-row-head">
                <strong>{shortLabels[item.type] || item.name}</strong>
                <span className={actual > expected ? "negative" : "positive"}>
                  {actual > expected ? `${formatMoney(actual - expected)} ahead` : `${formatMoney(expected - actual)} left`}
                </span>
              </div>
              <div className="pace-row-track">
                <span className={`pace-row-bar ${tone}`} style={{ width: `${barWidth}%`, background: categoryColors[item.type] || "#8B5CF6" }} />
                <i className="pace-row-marker" style={{ left: `${Math.min(100, expected > 0 && limit > 0 ? Math.max(6, Math.round((expected / limit) * 100)) : 0)}%` }} />
              </div>
              <div className="pace-row-meta">
                <small>Actual {formatMoney(actual)}</small>
                <small>Expected {formatMoney(expected)}</small>
                <small>Limit {formatMoney(limit)}</small>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pace-tracker-legend">
        <span><b className="pace-dot actual" /> actual pace</span>
        <span><b className="pace-dot marker" /> expected marker</span>
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
                {pieData.map((entry) => <Cell key={entry.type} fill={entry.color || categoryColors[entry.type] || "#8B5CF6"} />)}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, color: "#111827" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="budget-viz-legend">
          {pieData.map((entry) => (
            <div className="budget-viz-item" key={entry.type}>
              <span style={{ background: entry.color || categoryColors[entry.type] || "#8B5CF6" }} />
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
      <h2>Spending Distribution</h2>
      <div className="budget-viz-layout category-distribution-layout">
        <div className="budget-viz-chart category-distribution-chart">
          <ResponsiveContainer width="100%" height="100%" debounce={80}>
            <PieChart>
              <Pie data={pieData} dataKey="spent" nameKey="name" outerRadius={104} innerRadius={68} paddingAngle={3} isAnimationActive={false}>
                {pieData.map((entry) => <Cell key={entry.type} fill={entry.color || categoryColors[entry.type] || "#8B5CF6"} />)}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, color: "#111827" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="budget-viz-legend category-distribution-legend">
          {pieData.map((entry) => (
            <div className="budget-viz-item" key={entry.type}>
              <span style={{ background: entry.color || categoryColors[entry.type] || "#8B5CF6" }} />
              <div>
                <strong>{shortLabels[entry.type] || entry.name}</strong>
                <small>{formatMoney(entry.spent || 0)}</small>
              </div>
            </div>
          ))}
        </div>
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

export const HealthScoreTrendChart = memo(function HealthScoreTrendChart({ data = [] }) {
  return (
    <div className="health-score-trend-chart">
      <ResponsiveContainer width="100%" height="100%" debounce={80}>
        <LineChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: -10 }}>
          <CartesianGrid stroke="rgba(17, 24, 39, 0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#717182" }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#717182" }} tickLine={false} axisLine={false} width={34} />
          <Tooltip formatter={(value) => [`${value}/100`, "Health score"]} contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, color: "#111827" }} />
          <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 3, fill: "#8B5CF6" }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
