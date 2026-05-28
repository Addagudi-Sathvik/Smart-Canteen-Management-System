import { motion } from 'framer-motion';
import { ShoppingBag, ChefHat, Package, CheckCircle2 } from 'lucide-react';
import {
  PROGRESS_STEPS,
  PROGRESS_STEP_CONFIG,
  getStatusTheme,
} from '../../utils/orderStatus';

const STEP_ICONS = {
  confirmed: ShoppingBag,
  preparing: ChefHat,
  ready: Package,
  completed: CheckCircle2,
};

/**
 * Dynamic color-coded order progress tracker.
 */
const OrderProgress = ({ currentStatus, className = '' }) => {
  const currentIndex = PROGRESS_STEPS.indexOf(currentStatus);
  const safeIndex = currentIndex < 0 ? 0 : currentIndex;
  const progressPercent =
    PROGRESS_STEPS.length > 1
      ? Math.max(0, (safeIndex / (PROGRESS_STEPS.length - 1)) * 100)
      : 0;

  const activeTheme = getStatusTheme(
    currentIndex >= 0 ? currentStatus : PROGRESS_STEPS[0]
  );

  return (
    <div className={className}>
      <div className="relative pl-2">
        <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-espresso-200 dark:bg-espresso-800 rounded-full" />
        <motion.div
          className={`absolute left-[23px] top-2 w-0.5 rounded-full origin-top ${activeTheme.line}`}
          initial={{ height: 0 }}
          animate={{ height: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        <div className="space-y-6">
          {PROGRESS_STEPS.map((step, index) => {
            const config = PROGRESS_STEP_CONFIG[step];
            const theme = getStatusTheme(step);
            const Icon = STEP_ICONS[step];
            const isReached = safeIndex >= index;
            const isCurrent = safeIndex === index;

            return (
              <motion.div
                key={step}
                className="relative flex items-start gap-4"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.07 }}
              >
                <div
                  className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-colors ${
                    isReached
                      ? `${theme.iconBg} ${theme.ring} border-transparent`
                      : 'bg-espresso-50 dark:bg-espresso-900 border-espresso-200 dark:border-espresso-700'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isReached ? theme.iconColor : 'text-espresso-300 dark:text-espresso-600'
                    }`}
                  />
                  {isCurrent && (
                    <motion.span
                      className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-espresso-900 ${theme.pulse}`}
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                </div>

                <div className="flex-1 pt-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`font-semibold ${
                        isReached
                          ? 'text-espresso-900 dark:text-espresso-100'
                          : 'text-espresso-400 dark:text-espresso-600'
                      }`}
                    >
                      {config.label}
                    </h3>
                    {isCurrent && (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${theme.badge}`}
                      >
                        Now
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm mt-0.5 ${
                      isReached
                        ? 'text-espresso-500 dark:text-espresso-400'
                        : 'text-espresso-300 dark:text-espresso-600'
                    }`}
                  >
                    {config.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderProgress;
