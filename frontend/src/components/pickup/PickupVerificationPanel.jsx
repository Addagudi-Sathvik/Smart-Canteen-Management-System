import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ordersAPI } from '../../utils/api';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
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
  const [orderIdInput, setOrderIdInput] = useState('');
  const [qrPaste, setQrPaste] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const scannerInstance = useRef(null);

  const stopScanner = async () => {
    if (scannerInstance.current) {
      try {
        await scannerInstance.current.stop();
        await scannerInstance.current.clear();
      } catch {
        /* ignore */
      }
      scannerInstance.current = null;
    }
    setScanning(false);
  };

  useEffect(() => () => {
    stopScanner();
  }, []);

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

  const handleVerifyFromQr = async (payloadString) => {
    setVerifying(true);
    try {
      const { data } = await ordersAPI.verifyQr({ qrPayload: payloadString });
      setPreview(data.order);
      setQrPaste('');
      toast.success(data.message || 'Pickup verified!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      if (err.response?.data?.order) {
        setPreview(err.response.data.order);
      }
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

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

    setVerifying(true);
    try {
      const { data } = await ordersAPI.verifyPickup(preview._id, {
        qrToken: preview.qrToken,
      });
      setPreview(data.order);
      toast.success('Order marked as picked up!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify pickup');
      if (err.response?.data?.order) setPreview(err.response.data.order);
    } finally {
      setVerifying(false);
    }
  };

  const startScanner = async () => {
    if (scanning) {
      await stopScanner();
      return;
    }

    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      setScanning(true);

      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 220, height: 220 } },
        false
      );
      scannerInstance.current = scanner;

      scanner.render(
        async (decodedText) => {
          setQrPaste(decodedText);
          await stopScanner();
          await handleVerifyFromQr(decodedText);
        },
        () => {}
      );
    } catch {
      toast.error('Camera scanner unavailable. Paste QR data manually.');
      setScanning(false);
    }
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
          <Button type="submit" loading={loading} className="sm:w-auto">
            Lookup
          </Button>
        </form>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-espresso-600 dark:text-espresso-400">
            Paste scanned QR JSON
          </label>
          <textarea
            value={qrPaste}
            onChange={(e) => setQrPaste(e.target.value)}
            rows={3}
            placeholder='{"v":1,"o":"ORD0001","t":"...","p":"10:00 AM","ts":...}'
            className="w-full rounded-xl border border-brand-200/60 dark:border-brand-800/40 bg-white dark:bg-espresso-800 text-sm font-mono px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleVerifyScanned}
              loading={verifying}
              className="flex items-center gap-2"
            >
              <ScanLine className="w-4 h-4" />
              Verify pasted QR
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={startScanner}
              className="flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              {scanning ? 'Stop camera' : 'Scan with camera'}
            </Button>
          </div>
        </div>

        {scanning && (
          <div id="qr-reader" ref={scannerRef} className="mt-4 rounded-xl overflow-hidden" />
        )}
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
                preview.qrUsed
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
                  {preview.status}
                </span>
              </div>

              {preview.qrUsed && (
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
                  className="w-full flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Mark as Picked Up
                </Button>
              )}

              {preview.status !== 'ready' && !preview.qrUsed && (
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
