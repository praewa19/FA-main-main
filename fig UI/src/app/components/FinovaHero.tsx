import { motion } from 'motion/react';
import { ArrowRight, Play, TrendingUp, AlertCircle, PiggyBank, Sparkles, DollarSign, ShoppingCart, Gem, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router';

export function FinovaHero() {
  const navigate = useNavigate();
  const floatingAnimation = {
    y: [0, -20, 0],
    rotate: [0, 5, 0],
  };

  const floatingTransition = {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Particle effect */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -40, -20],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 z-10"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">AI-Powered Financial Intelligence</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-6xl lg:text-7xl font-bold leading-tight"
            >
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Your Financial
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                Decision Assistant
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-400 max-w-xl leading-relaxed"
            >
              Track expenses, optimize spending, detect financial risks, and build smarter financial habits with AI-powered insights tailored to your lifestyle.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={() => navigate('/signup')}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-medium text-white hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl font-medium text-white hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                See How It Works
              </button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-8 pt-8"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-slate-900"
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-400">
                  <span className="text-white font-medium">50K+</span> users
                </div>
              </div>
              <div className="text-sm text-gray-400">
                <div className="flex items-center gap-1 text-yellow-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <span className="text-white font-medium">4.9</span> rating
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - 3D floating objects */}
          <div className="relative h-[600px] hidden lg:block">
            {/* Floating 3D Icons */}
            <motion.div
              animate={floatingAnimation}
              transition={{ ...floatingTransition, delay: 0 }}
              className="absolute top-10 right-20"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50 rotate-12">
                <span className="text-4xl">₹</span>
              </div>
            </motion.div>

            <motion.div
              animate={floatingAnimation}
              transition={{ ...floatingTransition, delay: 0.5 }}
              className="absolute top-40 left-10"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50 -rotate-12">
                <Wallet className="w-8 h-8 text-white" />
              </div>
            </motion.div>

            <motion.div
              animate={floatingAnimation}
              transition={{ ...floatingTransition, delay: 1 }}
              className="absolute top-20 left-40"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/50 rotate-6">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </motion.div>

            <motion.div
              animate={floatingAnimation}
              transition={{ ...floatingTransition, delay: 1.5 }}
              className="absolute bottom-40 right-10"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/50 -rotate-6">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
            </motion.div>

            <motion.div
              animate={floatingAnimation}
              transition={{ ...floatingTransition, delay: 2 }}
              className="absolute bottom-20 left-20"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-pink-500/50 rotate-12">
                <Gem className="w-7 h-7 text-white" />
              </div>
            </motion.div>

            <motion.div
              animate={floatingAnimation}
              transition={{ ...floatingTransition, delay: 2.5 }}
              className="absolute top-1/2 right-0"
            >
              <div className="w-18 h-18 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/50">
                <PiggyBank className="w-9 h-9 text-white" />
              </div>
            </motion.div>

            {/* Floating UI Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute top-32 right-0"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-64 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm text-gray-300 font-medium">Monthly Savings</span>
                </div>
                <div className="text-2xl font-bold text-white mb-2">₹45,280</div>
                <div className="flex items-center gap-1 text-emerald-400 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+23% from last month</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute top-80 left-0"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="w-72 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-300 font-medium">AI Recommendation</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Reduce food delivery by ₹3,500 this month to reach your savings goal faster.
                </p>
                <div className="mt-3 text-xs text-blue-400 font-medium">High Impact</div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-32 right-32"
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="w-56 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="text-sm text-gray-300 font-medium">Risk Alert</span>
                </div>
                <p className="text-sm text-gray-300">
                  Shopping budget 45% exceeded
                </p>
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[145%] bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="absolute bottom-0 left-32"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="w-48 p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
              >
                <div className="text-xs text-gray-400 mb-2">Expense Categories</div>
                <div className="space-y-2">
                  {[
                    { name: 'Food', percent: 35, color: 'bg-blue-500' },
                    { name: 'Transport', percent: 20, color: 'bg-purple-500' },
                    { name: 'Shopping', percent: 45, color: 'bg-orange-500' },
                  ].map((cat) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                        <span>{cat.name}</span>
                        <span>{cat.percent}%</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${cat.color} rounded-full`}
                          style={{ width: `${cat.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
