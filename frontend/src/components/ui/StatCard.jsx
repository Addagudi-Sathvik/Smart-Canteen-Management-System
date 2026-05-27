import { motion } from 'framer-motion';

const StatCard = ({ label, value, icon: Icon, color = 'text-brand-600', bg = 'bg-brand-50 dark:bg-brand-900/25', index = 0 }) => (
  <motion.div
    className="glass rounded-2xl p-4 sm:p-5 card-hover"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06 }}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs sm:text-sm font-medium text-espresso-500 dark:text-espresso-400">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-espresso-900 dark:text-espresso-50 mt-1">{value}</p>
      </div>
      {Icon && (
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      )}
    </div>
  </motion.div>
);

export default StatCard;
