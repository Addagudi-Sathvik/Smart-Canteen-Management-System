import { useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import { getAdminNextAction } from '../../utils/adminOrderPipeline';

const AdminOrderActionButton = ({ order, onUpdated, size = 'default' }) => {
  const [loading, setLoading] = useState(false);
  const action = getAdminNextAction(order);

  if (!action) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.updateOrderStatus(order._id, action.status);
      toast.success(data.message || `${action.label} — done`);
      onUpdated?.(data.order);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const sizeClass =
    size === 'sm'
      ? 'text-xs py-2 px-3 min-h-[36px]'
      : 'text-sm py-2.5 px-4 min-h-[44px]';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`w-full rounded-xl font-semibold transition-all disabled:opacity-60 ${action.btnClass} ${sizeClass}`}
    >
      {loading ? 'Updating…' : action.label}
    </button>
  );
};

export default AdminOrderActionButton;
