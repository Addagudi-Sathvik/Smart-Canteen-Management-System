import { motion } from 'framer-motion';
import Button from './Button';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => (
  <motion.div
    className={`text-center py-16 px-6 ${className}`}
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-100/80 dark:bg-brand-900/30 flex items-center justify-center">
      {Icon && <Icon className="w-8 h-8 text-brand-600 dark:text-brand-400" />}
    </div>
    <h3 className="text-lg font-semibold text-espresso-800 dark:text-espresso-200">{title}</h3>
    {description && (
      <p className="text-sm text-espresso-500 dark:text-espresso-400 mt-2 max-w-sm mx-auto">{description}</p>
    )}
    {actionLabel && onAction && (
      <Button className="mt-6" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </motion.div>
);

export default EmptyState;
