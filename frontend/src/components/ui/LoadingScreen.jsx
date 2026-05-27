import { motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center mesh-bg">
    <motion.div
      className="flex flex-col items-center gap-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <UtensilsCrossed className="w-7 h-7 text-white" />
      </motion.div>
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-4 border-brand-200 dark:border-brand-900 rounded-full" />
        <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm font-medium text-espresso-500 dark:text-espresso-400 font-display">
        Loading CanteenHub...
      </p>
    </motion.div>
  </div>
);

export default LoadingScreen;
