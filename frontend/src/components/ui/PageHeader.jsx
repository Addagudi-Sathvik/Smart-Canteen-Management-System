import { motion } from 'framer-motion';

const PageHeader = ({ title, subtitle, action, className = '' }) => (
  <motion.div
    className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 ${className}`}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
  >
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-espresso-50">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-espresso-500 dark:text-espresso-400 mt-1">{subtitle}</p>
      )}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </motion.div>
);

export default PageHeader;
