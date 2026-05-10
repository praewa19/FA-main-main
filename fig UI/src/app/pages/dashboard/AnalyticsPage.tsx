import { TrendingUp, TrendingDown, Activity, Calendar, AlertCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { motion } from 'motion/react';

export function AnalyticsPage() {
  const monthlyTrend = [
    { month: 'Nov', income: 95000, expenses: 82000 },
    { month: 'Dec', income: 100000, expenses: 87000 },
    { month: 'Jan', income: 100000, expenses: 91000 },
    { month: 'Feb', income: 100000, expenses: 89000 },
    { month: 'Mar', income: 105000, expenses: 87000 },
    { month: 'Apr', income: 100000, expenses: 90000 },
    { month: 'May', income: 100000, expenses: 45000 },
  ];

  const categoryRanking = [
    { category: 'Food & Dining', spent: 18500, budget: 15000, rank: 1 },
    { category: 'Shopping', spent: 12800, budget: 10000, rank: 2 },
    { category: 'Transportation', spent: 8200, budget: 8000, rank: 3 },
    { category: 'Entertainment', spent: 6500, budget: 5000, rank: 4 },
    { category: 'Healthcare', spent: 4200, budget: 5000, rank: 5 },
  ];

  const behaviorData = [
    { metric: 'Impulse Control', score: 65, fullMark: 100 },
    { metric: 'Savings Rate', score: 75, fullMark: 100 },
    { metric: 'Budget Adherence', score: 70, fullMark: 100 },
    { metric: 'Planning', score: 80, fullMark: 100 },
    { metric: 'Debt Management', score: 85, fullMark: 100 },
  ];

  const spendingHeatmap = [
    { day: 'Mon', spending: 2800 },
    { day: 'Tue', spending: 1900 },
    { day: 'Wed', spending: 3500 },
    { day: 'Thu', spending: 2200 },
    { day: 'Fri', spending: 4800 },
    { day: 'Sat', spending: 5200 },
    { day: 'Sun', spending: 3100 },
  ];

  const savingsGap = 20000 - 18000;
  const totalSavingsTarget = 20000;
  const savingsProgress = (18000 / totalSavingsTarget) * 100;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Insights</h1>
        <p className="text-gray-600">Deep analysis of your financial behavior and trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm text-gray-600">Avg Monthly Savings</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">₹14,286</div>
          <div className="text-xs text-gray-600 mt-1">+12% vs last month</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-600">Highest Spend Day</span>
          </div>
          <div className="text-2xl font-bold">Saturday</div>
          <div className="text-xs text-gray-600 mt-1">₹5,200 average</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Budget Score</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">72/100</div>
          <div className="text-xs text-gray-600 mt-1">Good performance</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-600">Savings Gap</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">₹{savingsGap.toLocaleString()}</div>
          <div className="text-xs text-gray-600 mt-1">Behind target</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-900 mb-4">Income vs Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-900 mb-4">Category Ranking by Overspend</h3>
          <div className="space-y-4">
            {categoryRanking.map((cat, index) => {
              const overBudget = cat.spent - cat.budget;
              const percentage = ((cat.spent / cat.budget) * 100) - 100;
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">#{cat.rank}</span>
                      <span className="text-sm font-medium">{cat.category}</span>
                    </div>
                    <span className={`text-sm font-medium ${overBudget > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {overBudget > 0 ? '+' : ''}₹{overBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${overBudget > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(Math.abs(percentage), 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-12 text-right">
                      {percentage > 0 ? '+' : ''}{percentage.toFixed(0)}%
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
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-900 mb-4">Financial Behavior Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={behaviorData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Your Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="text-center text-sm text-gray-600 mt-2">
            Higher scores indicate better financial behavior
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-900 mb-4">Weekly Spending Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendingHeatmap}>
              <XAxis dataKey="day" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Bar dataKey="spending" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-center text-sm text-gray-600 mt-2">
            You spend more on weekends
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <h3 className="font-medium text-gray-900 mb-4">Predictive Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Next Month Forecast</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">₹88,500</div>
            <p className="text-xs text-gray-600">Projected expenses based on trends</p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900">Savings Potential</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600 mb-1">₹11,500</div>
            <p className="text-xs text-gray-600">If you follow AI recommendations</p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Goal Timeline</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-1">8 months</div>
            <p className="text-xs text-gray-600">To reach emergency fund goal</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
