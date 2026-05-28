import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ordersAPI } from '../../utils/api';
import { updateOrderFromSocket } from '../../store/slices/orderSlice';
import { PICKUP_SUCCESS_MESSAGE } from '../../utils/orderStatus';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import QrCameraScanner from './QrCameraScanner';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  User,
  Clock,
  ShoppingBag,
  ScanLine,
} from 'lucide-react';

const statusBadge = (status) => {
  const map = {
    confirmed: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    preparing: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
    ready: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
    completed: 'bg-espresso-100 text-espresso-600 dark:bg-espresso-800 dark:text-espresso-300',
  };
  return map[status] || map.confirmed;
};

const PickupVerificationPanel = () => {
  const dispatch = useDispatch();
  const [orderIdInput, setOrderIdInput] = useState('');
  const [qrPaste, setQrPaste] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const applyVerifiedOrder = useCallback(
    (order, message) => {
      if (order) {
        dispatch(updateOrderFromSocket(order));
        setPreview(order);
      }
      toast.success(message || PICKUP_SUCCESS_MESSAGE, { duration: 5000 });
      setQrPaste('');
      setCameraActive(false);
    },
    [dispatch]
  );

  const handleLookup = async (e) => {
    e?.preventDefault();
    const orderId = orderIdInput.trim();
    if (!orderId) {
      toast.error('Enter an order ID');
      return;
    }

    setLoading(true);
    try {
      const { data } = await ordersAPI.pickupLookup({ orderId });
      setPreview(data.order);
      toast.success('Order found');
    } catch (err) {
      setPreview(null);
      toast.error(err.response?.data?.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFromQr = useCallback(
    async (payloadString) => {
      const raw = payloadString?.trim();
      if (!raw) return;

      setVerifying(true);
      setCameraActive(false);
      try {
        const { data } = await ordersAPI.verifyQr({ qrPayload: raw });
        applyVerifiedOrder(data.order, data.message || PICKUP_SUCCESS_MESSAGE);
      } catch (err) {
        const msg = err.response?.data?.message || 'Verification failed';
        if (err.response?.data?.order) {
          setPreview(err.response.data.order);
          dispatch(updateOrderFromSocket(err.response.data.order));
        }
        toast.error(msg);
      } finally {
        setVerifying(false);
      }
    },
    [applyVerifiedOrder, dispatch]
  );

  const handleVerifyScanned = async (e) => {
    e.preventDefault();
    const raw = qrPaste.trim();
    if (!raw) {
      toast.error('Paste scanned QR data or use camera');
      return;
    }
    await handleVerifyFromQr(raw);
  };

  const handleMarkPickedUp = async () => {
    if (!preview?._id || !preview?.qrToken) {
      toast.error('Order has no QR token. Lookup order again.');
      return;
    }
    if (preview.qrUsed) {
      toast.error('QR already used');
      return;
    }
    if (preview.status !== 'ready') {
      toast.error('Order must be Ready for Pickup before collection.');
      return;
    }

    setVerifying(true);
    try {
      const { data } = await ordersAPI.verifyPickup(preview._id, {
        qrToken: preview.qrToken,
      });
      applyVerifiedOrder(data.order, data.message || PICKUP_SUCCESS_MESSAGE);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify pickup');
      if (err.response?.data?.order) {
        setPreview(err.response.data.order);
        dispatch(updateOrderFromSocket(err.response.data.order));
      }
    } finally {
      setVerifying(false);
    }
  };

  const toggleCamera = () => {
    setCameraActive((prev) => !prev);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-espresso-900 dark:text-espresso-50">
            Verify pickup
          </h2>
        </div>

        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Input
              icon={Search}
              placeholder="Order ID e.g. ORD0001"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value.toUpperCase())}
            />
          </div>
          <Button type="submit" loading={loading} className="sm:w-auto min-h-[44px]">
            Lookup
          </Button>
        </form>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={cameraActive ? 'secondary' : 'primary'}
              onClick={toggleCamera}
              disabled={verifying}
              className="flex items-center gap-2 min-h-[44px] touch-manipulation"
            >
              <QrCode className="w-4 h-4" />
              {cameraActive ? 'Stop camera' : 'Scan with camera'}
            </Button>
          </div>

          <QrCameraScanner
            active={cameraActive}
            onScan={handleVerifyFromQr}
            onClose={() => setCameraActive(false)}
          />

          <label className="block text-sm font-medium text-espresso-600 dark:text-espresso-400 pt-2">
            Or paste scanned QR JSON
          </label>
          <textarea
            value={qrPaste}
            onChange={(e) => setQrPaste(e.target.value)}
            rows={3}
            placeholder='{"v":1,"o":"ORD0001","t":"...","p":"10:00 AM","ts":...}'
            className="w-full rounded-xl border border-brand-200/60 dark:border-brand-800/40 bg-white dark:bg-espresso-800 text-sm font-mono px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleVerifyScanned}
            loading={verifying}
            className="flex items-center gap-2 min-h-[44px] w-full sm:w-auto touch-manipulation"
          >
            <ScanLine className="w-4 h-4" />
            Verify pasted QR
          </Button>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {preview && (
          <motion.div
            key={preview._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card
              className={
                preview.status === 'completed'
                  ? 'border-accent-500/50'
                  : preview.qrUsed
                  ? 'border-tomato-500/40'
                  : preview.status === 'ready'
                  ? 'border-accent-500/40'
                  : ''
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm text-espresso-500">Order</p>
                  <p className="text-2xl font-display font-bold">{preview.orderId}</p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${statusBadge(
                    preview.status
                  )}`}
                >
                  {preview.status === 'ready' ? 'Ready for Pickup' : preview.status}
                </span>
              </div>

              {preview.status === 'completed' && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-accent-500/10 text-accent-700 dark:text-accent-300 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  {PICKUP_SUCCESS_MESSAGE}
                  {preview.pickupVerifiedAt && (
                    <span className="text-espresso-500 font-normal block sm:inline sm:ml-2">
                      {new Date(preview.pickupVerifiedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {preview.qrUsed && preview.status !== 'completed' && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-tomato-500/10 text-tomato-600 dark:text-tomato-400 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  QR already used
                  {preview.pickupVerifiedAt && (
                    <span className="text-espresso-500 font-normal">
                      · {new Date(preview.pickupVerifiedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex items-center gap-2 text-espresso-600 dark:text-espresso-400">
                  <User className="w-4 h-4 text-brand-500" />
                  {preview.user?.name || '—'}
                </div>
                <div className="flex items-center gap-2 text-espresso-600 dark:text-espresso-400">
                  <Clock className="w-4 h-4 text-brand-500" />
                  Pickup {preview.pickupSlot || '—'}
                </div>
                <div className="flex items-center gap-2 text-espresso-600 dark:text-espresso-400">
                  <ShoppingBag className="w-4 h-4 text-brand-500" />
                  Payment: {preview.paymentStatus}
                </div>
                <div className="font-bold text-brand-600">₹{preview.totalAmount}</div>
              </div>

              <ul className="space-y-1 mb-4 text-sm border-t border-espresso-100 dark:border-espresso-800 pt-3">
                {preview.items?.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </li>
                ))}
              </ul>

              {preview.status === 'ready' && !preview.qrUsed && preview.qrToken && (
                <Button
                  type="button"
                  onClick={handleMarkPickedUp}
                  loading={verifying}
                  className="w-full flex items-center justify-center gap-2 min-h-[48px] touch-manipulation"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Mark as Collected
                </Button>
              )}

              {preview.status !== 'ready' && preview.status !== 'completed' && !preview.qrUsed && (
                <p className="text-sm text-espresso-500 text-center py-2">
                  Order must be <strong>Ready for Pickup</strong> before collection.
                </p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PickupVerificationPanel;
