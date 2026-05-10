import { useState } from 'react';
import { Target, Plus, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function GoalsPage() {
  const goals = [
    {
      id: 1,
      name: 'Emergency Fund',
      target: 300000,
      current: 180000,
      deadline: '2026-12-31',
      priority: 'high',
      color: '#10B981',
      icon: '🏦',
    },
    {
      id: 2,
      name: 'Vacation to Europe',
      target: 250000,
      current: 85000,
      deadline: '2026-11-15',
      priority: 'medium',
      color: '#F59E0B',
      icon: '✈️',
    },
    {
      id: 3,
      name: 'New Laptop',
      target: 120000,
      current: 95000,
      deadline: '2026-08-01',
      priority: 'low',
      color: '#8B5CF6',
      icon: '💻',
    },
    {
      id: 4,
      name: 'Debt Free',
      target: 500000,
      current: 285000,
      deadline: '2027-03-31',
      priority: 'high',
      color: '#EF4444',
      icon: '🎯',
    },
  ];

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const calculateDaysLeft = (deadline: string) => {
    const today = new Date('2026-05-09');
    const targetDate = new Date(deadline);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Goals</h1>
          <p className="text-gray-600">Track your progress towards your financial objectives</p>
        </div>
        <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-shadow flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Goal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal, index) => {
          const progress = calculateProgress(goal.current, goal.target);
          const daysLeft = calculateDaysLeft(goal.deadline);
          const remaining = goal.target - goal.current;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{goal.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg">{goal.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(goal.priority)}`}>
                        {goal.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <Target className="w-6 h-6 text-gray-400" />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: goal.color }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Current</div>
                    <div className="font-bold text-lg">₹{goal.current.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Target</div>
                    <div className="font-bold text-lg">₹{goal.target.toLocaleString()}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{daysLeft} days left</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ₹{remaining.toLocaleString()} to go
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-purple-900 mb-3">AI Goal Recommendations</h3>
            <div className="space-y-3">
              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Emergency Fund on track</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Save ₹20,000/month to reach your goal by December. You're currently ahead of schedule!
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Target className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Adjust Europe trip budget</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Increase monthly savings by ₹8,000 to reach your vacation goal on time.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">New laptop goal achievable</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Just ₹3,125/month for the next 8 months will get you there!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
