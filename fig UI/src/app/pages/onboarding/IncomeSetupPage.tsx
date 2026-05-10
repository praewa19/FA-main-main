import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DollarSign, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export function IncomeSetupPage() {
  const navigate = useNavigate();
  const [incomeType, setIncomeType] = useState<'monthly' | 'annual'>('monthly');
  const [income, setIncome] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/onboarding/priorities');
  };

  const convertedIncome = incomeType === 'monthly'
    ? parseFloat(income) * 12
    : parseFloat(income) / 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">What's your income?</h2>
        <p className="text-gray-600">This helps us create a personalized budget</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setIncomeType('monthly')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              incomeType === 'monthly'
                ? 'bg-white text-purple-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setIncomeType('annual')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              incomeType === 'annual'
                ? 'bg-white text-purple-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {incomeType === 'monthly' ? 'Monthly' : 'Annual'} Income
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xl"
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>
        </div>

        {income && !isNaN(parseFloat(income)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-blue-900">
              <RefreshCw className="w-5 h-5" />
              <span className="font-medium">
                That's {incomeType === 'monthly' ? '₹' + convertedIncome.toLocaleString() + ' annually' : '₹' + convertedIncome.toLocaleString() + ' monthly'}
              </span>
            </div>
          </motion.div>
        )}

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-shadow flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
