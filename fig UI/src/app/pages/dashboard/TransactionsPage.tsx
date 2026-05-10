import { useState } from 'react';
import { Search, Filter, TrendingDown, TrendingUp, ShoppingBag, Coffee, Home, Car, Heart, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const transactions = [
    { id: 1, name: 'Grocery Shopping', amount: -4500, category: 'essentials', date: '2026-05-08', icon: ShoppingBag, color: '#8B5CF6' },
    { id: 2, name: 'Salary Deposit', amount: 100000, category: 'income', date: '2026-05-01', icon: TrendingUp, color: '#10B981' },
    { id: 3, name: 'Coffee Shop', amount: -450, category: 'lifestyle', date: '2026-05-07', icon: Coffee, color: '#F59E0B' },
    { id: 4, name: 'Electricity Bill', amount: -2800, category: 'essentials', date: '2026-05-06', icon: Zap, color: '#8B5CF6' },
    { id: 5, name: 'Car EMI', amount: -15000, category: 'debt', date: '2026-05-05', icon: Car, color: '#EF4444' },
    { id: 6, name: 'Rent Payment', amount: -25000, category: 'essentials', date: '2026-05-03', icon: Home, color: '#8B5CF6' },
    { id: 7, name: 'Restaurant Dinner', amount: -3200, category: 'lifestyle', date: '2026-05-04', icon: Coffee, color: '#F59E0B' },
    { id: 8, name: 'Investment SIP', amount: -10000, category: 'savings', date: '2026-05-02', icon: TrendingUp, color: '#10B981' },
    { id: 9, name: 'Online Shopping', amount: -5600, category: 'lifestyle', date: '2026-05-03', icon: ShoppingBag, color: '#F59E0B' },
    { id: 10, name: 'Gym Membership', amount: -2000, category: 'lifestyle', date: '2026-05-01', icon: Heart, color: '#F59E0B' },
  ];

  const categories = [
    { value: 'all', label: 'All Transactions' },
    { value: 'income', label: 'Income' },
    { value: 'essentials', label: 'Essentials' },
    { value: 'debt', label: 'Debt' },
    { value: 'savings', label: 'Savings' },
    { value: 'lifestyle', label: 'Lifestyle' },
  ];

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-gray-600">Track all your income and expenses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-gray-600">Total Income</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            ₹{totalIncome.toLocaleString()}
          </div>
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
            <span className="text-gray-600">Total Expenses</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            ₹{totalExpenses.toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-gray-600">Net Balance</span>
          </div>
          <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ₹{netBalance.toLocaleString()}
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTransactions.map((transaction) => {
            const Icon = transaction.icon;
            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${transaction.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: transaction.color }} />
                    </div>
                    <div>
                      <div className="font-medium">{transaction.name}</div>
                      <div className="text-sm text-gray-600">{transaction.date}</div>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${transaction.amount >= 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {transaction.amount >= 0 ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
