import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

export function InvestmentsPage() {
  const goldPriceData = [
    { time: '9:00', price: 62800 },
    { time: '10:00', price: 62950 },
    { time: '11:00', price: 63100 },
    { time: '12:00', price: 63050 },
    { time: '1:00', price: 63200 },
    { time: '2:00', price: 63350 },
    { time: '3:00', price: 63280 },
  ];

  const silverPriceData = [
    { time: '9:00', price: 74200 },
    { time: '10:00', price: 74350 },
    { time: '11:00', price: 74280 },
    { time: '12:00', price: 74400 },
    { time: '1:00', price: 74550 },
    { time: '2:00', price: 74620 },
    { time: '3:00', price: 74580 },
  ];

  const currentGoldPrice = 63280;
  const goldChange = 480;
  const goldChangePercent = 0.76;

  const currentSilverPrice = 74580;
  const silverChange = 380;
  const silverChangePercent = 0.51;

  const investments = [
    {
      name: 'Gold (10g)',
      currentPrice: currentGoldPrice,
      invested: 620000,
      currentValue: 632800,
      units: 10,
      changePercent: goldChangePercent,
      change: goldChange,
      color: '#F59E0B',
    },
    {
      name: 'Silver (1kg)',
      currentPrice: currentSilverPrice,
      invested: 72000,
      currentValue: 74580,
      units: 1,
      changePercent: silverChangePercent,
      change: silverChange,
      color: '#9CA3AF',
    },
  ];

  const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalGain = totalCurrentValue - totalInvested;
  const totalGainPercent = ((totalGain / totalInvested) * 100).toFixed(2);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Investments</h1>
        <p className="text-gray-600">Track gold and silver prices and your investment portfolio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="text-sm text-gray-600 mb-2">Total Invested</div>
          <div className="text-3xl font-bold text-gray-900">₹{totalInvested.toLocaleString()}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="text-sm text-gray-600 mb-2">Current Value</div>
          <div className="text-3xl font-bold text-purple-600">₹{totalCurrentValue.toLocaleString()}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="text-sm text-gray-600 mb-2">Total Gain</div>
          <div className={`text-3xl font-bold ${totalGain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {totalGain >= 0 ? '+' : ''}₹{totalGain.toLocaleString()}
          </div>
          <div className={`text-sm ${totalGain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {totalGain >= 0 ? '+' : ''}{totalGainPercent}%
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 shadow-sm border border-yellow-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-2xl">
                🥇
              </div>
              <div>
                <h3 className="text-xl font-bold">Gold</h3>
                <p className="text-sm text-gray-600">Price per 10g</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
              goldChange >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {goldChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span className="text-sm font-medium">{goldChangePercent}%</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-3xl font-bold text-yellow-900 mb-1">
              ₹{currentGoldPrice.toLocaleString()}
            </div>
            <div className={`text-sm font-medium ${goldChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {goldChange >= 0 ? '+' : ''}₹{goldChange} today
            </div>
          </div>

          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={goldPriceData}>
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
              <YAxis domain={['dataMin - 100', 'dataMax + 100']} stroke="#9CA3AF" fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 pt-4 border-t border-yellow-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Market Direction</span>
              <span className={`font-medium ${goldChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {goldChange >= 0 ? 'Bullish ↗' : 'Bearish ↘'}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 shadow-sm border border-gray-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-gray-500 rounded-lg flex items-center justify-center text-2xl">
                🥈
              </div>
              <div>
                <h3 className="text-xl font-bold">Silver</h3>
                <p className="text-sm text-gray-600">Price per 1kg</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
              silverChange >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {silverChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span className="text-sm font-medium">{silverChangePercent}%</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ₹{currentSilverPrice.toLocaleString()}
            </div>
            <div className={`text-sm font-medium ${silverChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {silverChange >= 0 ? '+' : ''}₹{silverChange} today
            </div>
          </div>

          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={silverPriceData}>
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
              <YAxis domain={['dataMin - 100', 'dataMax + 100']} stroke="#9CA3AF" fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#9CA3AF"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 pt-4 border-t border-gray-300">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Market Direction</span>
              <span className={`font-medium ${silverChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {silverChange >= 0 ? 'Bullish ↗' : 'Bearish ↘'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4">Your Portfolio</h3>
        <div className="space-y-4">
          {investments.map((investment, index) => {
            const gain = investment.currentValue - investment.invested;
            const gainPercent = ((gain / investment.invested) * 100).toFixed(2);

            return (
              <motion.div
                key={investment.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-lg">{investment.name}</h4>
                    <p className="text-sm text-gray-600">Units: {investment.units}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">₹{investment.currentValue.toLocaleString()}</div>
                    <div className={`text-sm font-medium ${gain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {gain >= 0 ? '+' : ''}₹{gain.toLocaleString()} ({gain >= 0 ? '+' : ''}{gainPercent}%)
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Invested</div>
                    <div className="font-medium">₹{investment.invested.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Current Price</div>
                    <div className="font-medium">₹{investment.currentPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Today's Change</div>
                    <div className={`font-medium ${investment.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {investment.change >= 0 ? '+' : ''}₹{investment.change}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-purple-900 mb-2">Investment Insights</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>
                  <span className="font-medium">Gold trending up:</span> Consider holding or adding more during dips. Historical data shows strong performance.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>
                  <span className="font-medium">Silver gaining momentum:</span> Up 0.51% today. Good diversification asset alongside gold.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>
                  <span className="font-medium">Portfolio health:</span> Your precious metals portfolio is up {totalGainPercent}%, providing a hedge against inflation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
