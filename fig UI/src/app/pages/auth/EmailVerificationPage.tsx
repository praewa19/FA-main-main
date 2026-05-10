import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function EmailVerificationPage() {
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVerified(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-12 max-w-md w-full text-center shadow-2xl"
      >
        {!verified ? (
          <>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center"
            >
              <Mail className="w-12 h-12 text-purple-600" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-4">Check your email</h2>
            <p className="text-gray-600 mb-8">
              We've sent a verification link to your email address. Click the link to verify your account.
            </p>
            <div className="flex gap-2 justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                className="w-2 h-2 bg-purple-600 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-blue-600 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-cyan-600 rounded-full"
              />
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-4">Email verified!</h2>
            <p className="text-gray-600 mb-8">
              Your email has been successfully verified. Let's set up your profile.
            </p>
            <button
              onClick={() => navigate('/onboarding/profile')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              Continue to Profile Setup
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
