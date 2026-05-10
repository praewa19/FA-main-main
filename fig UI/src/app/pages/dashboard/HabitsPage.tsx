import { Flame, Trophy, Zap, Calendar, TrendingUp, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export function HabitsPage() {
  const [habits, setHabits] = useState([
    {
      id: 1,
      name: 'Daily budget tracking',
      description: 'Review and log your daily spending',
      streak: 12,
      bestStreak: 18,
      target: 30,
      completedToday: true,
      icon: '📊',
      color: '#8B5CF6',
    },
    {
      id: 2,
      name: 'No impulse purchases',
      description: 'Avoid unplanned spending over ₹500',
      streak: 5,
      bestStreak: 14,
      target: 7,
      completedToday: false,
      icon: '🛑',
      color: '#EF4444',
    },
    {
      id: 3,
      name: 'Weekly budget review',
      description: 'Analyze your spending patterns',
      streak: 3,
      bestStreak: 6,
      target: 4,
      completedToday: true,
      icon: '📈',
      color: '#10B981',
    },
    {
      id: 4,
      name: 'Save before spending',
      description: 'Transfer savings first thing each month',
      streak: 8,
      bestStreak: 12,
      target: 12,
      completedToday: true,
      icon: '💰',
      color: '#F59E0B',
    },
  ]);

  const achievements = [
    { id: 1, name: 'Budget Beginner', description: '7-day streak', icon: '🌱', unlocked: true },
    { id: 2, name: 'Saving Star', description: '30-day streak', icon: '⭐', unlocked: false },
    { id: 3, name: 'Financial Guru', description: '90-day streak', icon: '🏆', unlocked: false },
    { id: 4, name: 'Debt Destroyer', description: 'Pay off ₹50,000 in debt', icon: '💪', unlocked: true },
    { id: 5, name: 'Goal Getter', description: 'Complete 3 financial goals', icon: '🎯', unlocked: false },
    { id: 6, name: 'Smart Spender', description: 'Stay under budget for 30 days', icon: '🧠', unlocked: false },
  ];

  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  const completedToday = habits.filter(h => h.completedToday).length;

  const toggleHabit = (id: number) => {
    setHabits(habits.map(h =>
      h.id === id ? { ...h, completedToday: !h.completedToday } : h
    ));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Habits</h1>
        <p className="text-gray-600">Build consistent habits to achieve your financial goals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-8 h-8" />
            <span className="text-white/80">Total Streak</span>
          </div>
          <div className="text-4xl font-bold">{totalStreak}</div>
          <div className="text-white/80 text-sm mt-1">days combined</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <Check className="w-8 h-8" />
            <span className="text-white/80">Completed Today</span>
          </div>
          <div className="text-4xl font-bold">{completedToday}/{habits.length}</div>
          <div className="text-white/80 text-sm mt-1">habits tracked</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8" />
            <span className="text-white/80">Achievements</span>
          </div>
          <div className="text-4xl font-bold">
            {achievements.filter(a => a.unlocked).length}/{achievements.length}
          </div>
          <div className="text-white/80 text-sm mt-1">unlocked</div>
        </motion.div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Today's Habits
        </h3>
        <div className="space-y-4">
          {habits.map((habit, index) => {
            const progress = (habit.streak / habit.target) * 100;
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-3xl">{habit.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium">{habit.name}</h4>
                      <p className="text-sm text-gray-600">{habit.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                      habit.completedToday
                        ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg scale-110'
                        : 'border-2 border-gray-300 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {habit.completedToday ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <X className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="font-medium">{habit.streak} day streak</span>
                    </div>
                    <span className="text-gray-600">
                      Best: {habit.bestStreak} days
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    {habit.streak} / {habit.target} days to target
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Achievements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border-2 ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-4xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium">{achievement.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                  {achievement.unlocked && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium text-yellow-700">
                      <Zap className="w-3 h-3" />
                      Unlocked
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-purple-900 mb-2">Keep it up!</h3>
            <p className="text-sm text-gray-700">
              You're on a 12-day streak for budget tracking! Consistency is the key to financial success.
              Complete all habits today to unlock a bonus achievement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
