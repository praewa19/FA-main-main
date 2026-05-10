import { TrendingUp, TrendingDown, AlertTriangle, Sparkles, Target, Flame, Trophy } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { motion } from 'motion/react';

export function DashboardPage() {
  const financialHealthScore = 72;
  const budgetCategories = [
    { name: 'Essentials', limit: 50000, spent: 42000, color: '#8B5CF6' },
    { name: 'Debt', limit: 15000, spent: 15000, color: '#EF4444' },
    { name: 'Savings', limit: 20000, spent: 18000, color: '#10B981' },
    { name: 'Lifestyle', limit: 15000, spent: 12000, color: '#F59E0B' },
  ];

  const spendingTrend = [
    { month: 'Jan', actual: 82000, expected: 85000 },
    { month: 'Feb', actual: 87000, expected: 85000 },
    { month: 'Mar', actual: 91000, expected: 85000 },
    { month: 'Apr', actual: 89000, expected: 85000 },
    { month: 'May', actual: 87000, expected: 85000 },
  ];

  const categoryDistribution = budgetCategories.map(cat => ({
    name: cat.name,
    value: cat.spent,
    color: cat.color,
  }));

  const risks = [
    { category: 'Food & Dining', severity: 'high', message: '45% over budget this month', amount: '+₹6,750' },
    { category: 'Entertainment', severity: 'medium', message: 'Trending higher than usual', amount: '+₹2,100' },
    { category: 'Savings', severity: 'low', message: 'Below 10% target', amount: '-₹2,000' },
  ];

  const recommendations = [
    { icon: TrendingDown, text: 'Reduce food delivery spending by ₹2,000 this month', impact: 'High' },
    { icon: TrendingUp, text: 'Increase savings allocation by 5% to reach emergency fund goal', impact: 'Medium' },
    { icon: Target, text: 'Prioritize debt repayment to save ₹5,000 in interest', impact: 'High' },
  ];

  const habits = [
    { name: 'Daily budget tracking', streak: 12, target: 30 },
    { name: 'No impulse purchases', streak: 5, target: 7 },
    { name: 'Weekly review', streak: 3, target: 4 },
  ];

  const topProblems = [
    { category: 'Food & Dining', risk: 92, trend: 'up' },
    { category: 'Shopping', risk: 78, trend: 'up' },
    { category: 'Transportation', risk: 45, trend: 'down' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Stable';
    return 'Risk';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your financial overview</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg">
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">AI Assistant</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-600 mb-4">Financial Health Score</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - financialHealthScore / 100)}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${getScoreColor(financialHealthScore)}`}>
                  {financialHealthScore}
                </span>
                <span className="text-sm text-gray-500">{getScoreLabel(financialHealthScore)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-600 mb-4">Budget Allocation</h3>
          <div className="grid grid-cols-2 gap-4">
            {budgetCategories.map((category) => {
              const percentage = (category.spent / category.limit) * 100;
              const remaining = category.limit - category.spent;
              return (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-gray-600">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      ₹{category.spent.toLocaleString()} / ₹{category.limit.toLocaleString()}
                    </span>
                    <span className={remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {remaining >= 0 ? `₹${remaining.toLocaleString()} left` : `₹${Math.abs(remaining).toLocaleString()} over`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-600 mb-4">Spending Analytics</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={spendingTrend}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Area type="monotone" dataKey="expected" stroke="#D1D5DB" strokeWidth={2} fill="none" strokeDasharray="5 5" />
              <Area type="monotone" dataKey="actual" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="text-gray-600">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-gray-300 rounded-full border-dashed"></div>
              <span className="text-gray-600">Expected</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-600 mb-4">Category Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryDistribution.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                <span className="text-sm text-gray-600">{cat.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-600 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Risk Alerts
          </h3>
          <div className="space-y-3">
            {risks.map((risk, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  risk.severity === 'high'
                    ? 'bg-red-50 border-red-200'
                    : risk.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium">{risk.category}</span>
                  <span className={`text-sm font-medium ${
                    risk.severity === 'high' ? 'text-red-600' : risk.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                  }`}>
                    {risk.amount}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{risk.message}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-600 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const Icon = rec.icon;
              return (
                <div key={index} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm mb-1">{rec.text}</p>
                      <span className={`text-xs font-medium ${
                        rec.impact === 'High' ? 'text-purple-600' : 'text-blue-600'
                      }`}>
                        {rec.impact} Impact
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-600 mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Daily Habit Tracker
          </h3>
          <div className="space-y-4">
            {habits.map((habit, index) => {
              const percentage = (habit.streak / habit.target) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{habit.name}</span>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">{habit.streak} day streak</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {habit.streak} / {habit.target} days
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-900">Achievement Unlocked!</span>
            </div>
            <p className="text-sm text-gray-600">
              You've tracked your budget for 12 consecutive days!
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-600 mb-4">Top Problem Categories</h3>
          <div className="space-y-4">
            {topProblems.map((problem, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{problem.category}</span>
                    {problem.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    Risk: {problem.risk}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                    style={{ width: `${problem.risk}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
