import { motion } from 'framer-motion';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-tomato-500 text-white rounded-xl font-semibold hover:bg-tomato-600 focus-visible:ring-2 focus-visible:ring-red-500 transition-all active:scale-[0.98] disabled:opacity-50',
};

const Button = ({
  children,
  variant = 'primary',
  className = '',
  loading = false,
  disabled,
  as: Component = 'button',
  ...props
}) => {
  const classes = `${variants[variant] || variants.primary} ${className}`;

  if (Component === motion.button) {
    return (
      <motion.button
        className={classes}
        disabled={disabled || loading}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        {...props}
      >
        {loading ? 'Loading...' : children}
      </motion.button>
    );
  }

  return (
    <Component className={classes} disabled={disabled || loading} {...props}>
      {loading ? 'Loading...' : children}
    </Component>
  );
};

export default Button;
