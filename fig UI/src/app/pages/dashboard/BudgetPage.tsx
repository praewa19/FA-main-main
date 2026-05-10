import { useState } from 'react';
import { Wallet, Sparkles, AlertTriangle, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function BudgetPage() {
  const [hasDebt, setHasDebt] = useState(true);

  const [budgetData, setBudgetData] = useState({
    essentials: 50,
    debt: 15,
    savings: 20,
    lifestyle: 15,
  });

  const monthlyIncome = 100000;

  const categories = [
    {
      name: 'Essentials',
      key: 'essentials' as const,
      color: '#8B5CF6',
      description: 'Rent, utilities, groceries, insurance',
      aiRecommendation: '50% is optimal for essential expenses',
    },
    {
      name: 'Debt Payments',
      key: 'debt' as const,
      color: '#EF4444',
      description: 'Credit cards, loans, EMIs',
      aiRecommendation: 'Pay off high-interest debt first',
    },
    {
      name: 'Savings',
      key: 'savings' as const,
      color: '#10B981',
      description: 'Emergency fund, investments, retirement',
      aiRecommendation: 'Minimum 10% recommended for financial security',
    },
    {
      name: 'Lifestyle',
      key: 'lifestyle' as const,
      color: '#F59E0B',
      description: 'Entertainment, dining, shopping, hobbies',
      aiRecommendation: 'Adjusted based on your priorities',
    },
  ];

  const pieData = categories.map(cat => ({
    name: cat.name,
    value: budgetData[cat.key],
    color: cat.color,
  }));

  const handleSliderChange = (key: keyof typeof budgetData, value: number) => {
    setBudgetData(prev => ({ ...prev, [key]: value }));
  };

  const totalAllocation = Object.values(budgetData).reduce((sum, val) => sum + val, 0);

  const warnings = [];
  if (budgetData.savings < 10) {
    warnings.push({ type: 'savings', message: 'Savings below 10% recommended minimum' });
  }
  if (hasDebt && budgetData.lifestyle > 20) {
    warnings.push({ type: 'lifestyle', message: 'High lifestyle spending detected while debt exists' });
  }
  if (totalAllocation !== 100) {
    warnings.push({ type: 'total', message: 'Total allocation must equal 100%' });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Budget Engine</h1>
          <p className="text-gray-600">AI-powered budget allocation tailored to your goals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-600 mb-4">Monthly Income</h3>
          <div className="text-4xl font-bold text-purple-600 mb-2">
            ₹{monthlyIncome.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">Automatically allocated by AI</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-medium text-gray-600 mb-4">Budget Visualization</h3>
          <div className="flex items-center justify-between">
            <ResponsiveContainer width="40%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }}></div>
                  <div>
                    <div className="text-sm font-medium">{cat.name}</div>
                    <div className="text-xs text-gray-600">{budgetData[cat.key]}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <p key={index} className="text-sm text-red-900">{warning.message}</p>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-medium text-gray-600 mb-6">Adjust Budget Allocation</h3>
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: category.color }}></div>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-600">{category.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold" style={{ color: category.color }}>
                    {budgetData[category.key]}%
                  </div>
                  <div className="text-sm text-gray-600">
                    ₹{((monthlyIncome * budgetData[category.key]) / 100).toLocaleString()}
                  </div>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={budgetData[category.key]}
                onChange={(e) => handleSliderChange(category.key, parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${category.color} ${budgetData[category.key]}%, #E5E7EB ${budgetData[category.key]}%)`,
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total Allocation</span>
            <span className={totalAllocation === 100 ? 'text-emerald-600' : 'text-red-600'}>
              {totalAllocation}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-purple-900 mb-3">AI Insights</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.name} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{cat.name}:</span> {cat.aiRecommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hasDebt && budgetData.lifestyle > 15 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-orange-900 mb-2">Debt Detected</h3>
              <p className="text-sm text-gray-700 mb-3">
                You currently have debt. Our AI recommends reducing lifestyle spending to accelerate debt payoff and save on interest.
              </p>
              <button className="text-sm font-medium text-orange-600 hover:text-orange-700">
                View Debt Payoff Strategy →
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
