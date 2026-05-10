import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PiggyBank, TrendingDown, Sparkles, ArrowRight, Check } from 'lucide-react';
import { motion } from 'motion/react';

type Priority = 'saving' | 'debt' | 'lifestyle';

export function PrioritySetupPage() {
  const navigate = useNavigate();
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);

  const priorities = [
    {
      id: 'saving' as Priority,
      icon: PiggyBank,
      title: 'Saving',
      description: 'Build an emergency fund and save for the future',
      color: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      id: 'debt' as Priority,
      icon: TrendingDown,
      title: 'Debt Reduction',
      description: 'Pay off debts faster and become debt-free',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      id: 'lifestyle' as Priority,
      icon: Sparkles,
      title: 'Lifestyle',
      description: 'Enjoy life while maintaining financial balance',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  const handleSubmit = () => {
    if (selectedPriority) {
      navigate('/dashboard');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">What's your main priority?</h2>
        <p className="text-gray-600">This will help us optimize your budget allocation</p>
      </div>

      <div className="grid gap-4 mb-8">
        {priorities.map((priority) => {
          const Icon = priority.icon;
          const isSelected = selectedPriority === priority.id;

          return (
            <motion.button
              key={priority.id}
              type="button"
              onClick={() => setSelectedPriority(priority.id)}
              className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? `${priority.borderColor} ${priority.bgColor} shadow-lg scale-[1.02]`
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${priority.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{priority.title}</h3>
                  <p className="text-gray-600">{priority.description}</p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={handleSubmit}
          disabled={!selectedPriority}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Complete Setup
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
