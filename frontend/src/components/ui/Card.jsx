import { motion } from 'framer-motion';

const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'p-5 sm:p-6',
  glass = true,
  ...motionProps
}) => {
  const base = `${glass ? 'glass' : 'bg-white dark:bg-espresso-900 border border-espresso-200/60 dark:border-espresso-800'} rounded-2xl ${padding} ${hover ? 'card-hover cursor-pointer' : ''} ${className}`;

  if (motionProps.initial || motionProps.variants) {
    return (
      <motion.div className={base} {...motionProps}>
        {children}
      </motion.div>
    );
  }

  return <div className={base}>{children}</div>;
};

export default Card;
