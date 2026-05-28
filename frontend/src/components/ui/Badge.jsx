import { getStatusBadgeClass, getStatusLabel } from '../../utils/orderStatus';

const Badge = ({ children, variant = 'neutral', status, className = '' }) => {
  if (status) {
    return (
      <span className={`${getStatusBadgeClass(status)} capitalize ${className}`}>
        {children ?? getStatusLabel(status)}
      </span>
    );
  }

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
