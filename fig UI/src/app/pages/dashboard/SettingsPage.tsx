import { User, Bell, Lock, Palette, CreditCard, Globe, Smartphone, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export function SettingsPage() {
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    savingsReminders: true,
    goalUpdates: false,
    weeklyReports: true,
  });

  const [profileMode, setProfileMode] = useState('professional');

  const modes = [
    {
      id: 'student',
      name: 'Student Mode',
      description: 'Lower income focus with stricter essentials tracking',
      icon: '🎓',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'professional',
      name: 'Professional Mode',
      description: 'Investment-oriented with balanced budgeting',
      icon: '💼',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'family',
      name: 'Family Mode',
      description: 'Family expense management and childcare budgeting',
      icon: '👨‍👩‍👧‍👦',
      color: 'from-emerald-500 to-green-500',
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-lg">John Doe</h4>
              <p className="text-sm text-gray-600">john.doe@example.com</p>
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Profile Mode
          </h3>
          <p className="text-sm text-gray-600 mt-1">Choose a mode that matches your lifestyle</p>
        </div>
        <div className="p-6 space-y-3">
          {modes.map((mode) => (
            <motion.button
              key={mode.id}
              onClick={() => setProfileMode(mode.id)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                profileMode === mode.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${mode.color} rounded-lg flex items-center justify-center text-2xl`}>
                  {mode.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{mode.name}</h4>
                  <p className="text-sm text-gray-600">{mode.description}</p>
                </div>
                {profileMode === mode.id && (
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {key === 'budgetAlerts' && 'Budget Alerts'}
                  {key === 'savingsReminders' && 'Savings Reminders'}
                  {key === 'goalUpdates' && 'Goal Updates'}
                  {key === 'weeklyReports' && 'Weekly Reports'}
                </div>
                <div className="text-sm text-gray-600">
                  {key === 'budgetAlerts' && 'Get notified when you exceed budget limits'}
                  {key === 'savingsReminders' && 'Monthly reminders to review your savings'}
                  {key === 'goalUpdates' && 'Updates on your financial goals progress'}
                  {key === 'weeklyReports' && 'Weekly summary of your spending'}
                </div>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, [key]: !value })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  value ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    value ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security & Privacy
          </h3>
        </div>
        <div className="p-6 space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <div className="font-medium">Change Password</div>
                <div className="text-sm text-gray-600">Update your password</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <div className="font-medium">Two-Factor Authentication</div>
                <div className="text-sm text-gray-600">Add an extra layer of security</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Connected Accounts
          </h3>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">HDFC Bank ****4523</div>
                <div className="text-sm text-gray-600">Connected</div>
              </div>
            </div>
            <button className="text-sm text-red-600 hover:text-red-700">Disconnect</button>
          </div>
          <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors">
            + Add Bank Account
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Preferences
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>₹ INR - Indian Rupee</option>
              <option>$ USD - US Dollar</option>
              <option>€ EUR - Euro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>English</option>
              <option>हिंदी (Hindi)</option>
              <option>தமிழ் (Tamil)</option>
            </select>
          </div>
        </div>
      </div>

      <button className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200">
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Log Out</span>
      </button>
    </div>
  );
}
