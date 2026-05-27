const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral',
  };

  return (
    <span className={`${variants[variant] || variants.neutral} capitalize ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
