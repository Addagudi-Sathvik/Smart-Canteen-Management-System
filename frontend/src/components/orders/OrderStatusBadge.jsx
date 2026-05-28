import { getStatusLabel, getStatusTheme } from '../../utils/orderStatus';

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

/**
 * Reusable color-coded order status badge (Student, Staff, Admin).
 */
const OrderStatusBadge = ({
  status,
  size = 'md',
  showDot = true,
  className = '',
  label,
}) => {
  const theme = getStatusTheme(status);
  const text = label ?? getStatusLabel(status);

  const pulseReady = status === 'ready' ? 'ring-2 ring-emerald-400/60 animate-pulse' : '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold capitalize whitespace-nowrap ${theme.badge} ${sizeClasses[size]} ${pulseReady} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} aria-hidden />
      )}
      {text}
    </span>
  );
};

export default OrderStatusBadge;
