import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../utils/api';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

const statusVariant = {
  pending: 'neutral', confirmed: 'info', preparing: 'warning',
  ready: 'success', completed: 'neutral', cancelled: 'danger',
};

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await adminAPI.getAllOrders(params);
      setOrders(data.orders);
      setTotalPages(data.pages);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const filteredOrders = search
    ? orders.filter((o) => o.orderId?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      <PageHeader title="All Orders" subtitle="View and filter all canteen orders" />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input icon={Search} type="text" placeholder="Search by Order ID..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-36">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredOrders.map((order, i) => (
                <motion.tr key={order._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">{order.orderId}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{order.userId?.name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                    {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">₹{order.totalAmount}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setSelectedOrder(order)} className="btn-ghost p-1.5">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary p-2">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                p === page ? 'bg-brand-600 text-white' : 'bg-espresso-100 dark:bg-espresso-800 text-espresso-600 dark:text-espresso-400'
              }`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="btn-secondary p-2">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order ${selectedOrder?.orderId}`}>
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant={statusVariant[selectedOrder.status]}>{selectedOrder.status}</Badge>
              <span className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Student</p>
              <p className="font-medium">{selectedOrder.userId?.name} ({selectedOrder.userId?.email})</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Items</p>
              <div className="space-y-1">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">₹{selectedOrder.totalAmount}</span>
            </div>
            <div className="text-xs text-gray-400">
              <p>Payment: {selectedOrder.paymentStatus} • {selectedOrder.paymentMethod}</p>
              {selectedOrder.notes && <p>Notes: {selectedOrder.notes}</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllOrders;
