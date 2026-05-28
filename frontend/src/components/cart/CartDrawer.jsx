import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState, useCallback } from 'react';
import {
  closeCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  selectCartTotal,
} from '../../store/slices/cartSlice';
import { createOrder } from '../../store/slices/orderSlice';
import useRazorpay from '../../hooks/useRazorpay';
import {
  generatePickupSlots,
  getDefaultPickupSlot,
  isValidPickupSlot,
  normalizePickupSlot,
  slotToTimeInput,
  timeInputToPickupSlot,
} from '../../utils/pickupTime';
import { X, ShoppingBag, Trash2, Plus, Minus, Clock, ArrowRight } from 'lucide-react';

const PICKUP_SLOTS = generatePickupSlots();
const DEFAULT_SLOT = normalizePickupSlot(getDefaultPickupSlot(PICKUP_SLOTS)) || PICKUP_SLOTS[0];

const getErrorMessage = (err) =>
  typeof err === 'string' ? err : err?.message || 'Something went wrong. Please try again.';

const CartDrawer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isOpen, items } = useSelector((state) => state.cart);
  const total = useSelector(selectCartTotal);
  const { loading } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  const [pickupSlot, setPickupSlot] = useState(DEFAULT_SLOT);
  const [pickupMode, setPickupMode] = useState('quick');
  const [customTimeValue, setCustomTimeValue] = useState(() => slotToTimeInput(DEFAULT_SLOT));
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const { initiatePayment, processing } = useRazorpay();

  const isBusy = loading || processing || placing;
  const canPlaceOrder = pickupSlot?.trim() && isValidPickupSlot(pickupSlot);

  const selectQuickSlot = useCallback((slot) => {
    const normalized = normalizePickupSlot(slot);
    if (!normalized) return;
    setPickupMode('quick');
    setPickupSlot(normalized);
    setCustomTimeValue(slotToTimeInput(normalized));
  }, []);

  const switchToCustom = useCallback(() => {
    setPickupMode('custom');
    setCustomTimeValue(slotToTimeInput(pickupSlot || DEFAULT_SLOT));
  }, [pickupSlot]);

  const handleCustomTimeChange = useCallback((e) => {
    const value = e.target.value;
    setCustomTimeValue(value);
    if (!value) return;

    const slot = normalizePickupSlot(timeInputToPickupSlot(value));
    if (slot) {
      setPickupSlot(slot);
    } else {
      toast.error('Pickup time must be between 9:00 AM and 5:00 PM.');
    }
  }, []);

  const handleClose = useCallback(() => {
    dispatch(closeCart());
  }, [dispatch]);

  const handleClearCart = useCallback(() => {
    dispatch(clearCart());
    toast.success('Cart cleared');
  }, [dispatch]);

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    const slot = normalizePickupSlot(pickupSlot);
    if (!slot) {
      toast.error('Please select a pickup time slot.');
      return;
    }

    const orderItems = items
      .filter((item) => item.menuItem && item.quantity > 0)
      .map((item) => ({
        menuItem: String(item.menuItem),
        quantity: item.quantity,
      }));

    if (orderItems.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    setPlacing(true);
    try {
      const orderData = {
        items: orderItems,
        pickupSlot: slot,
        notes: notes.trim(),
        paymentMethod: 'online',
      };

      const result = await dispatch(createOrder(orderData)).unwrap();
      const order = result?.order;

      if (!order?._id) {
        toast.error('Order created but payment could not start.');
        return;
      }

      await initiatePayment({
        orderId: order._id,
        userName: user?.name || '',
        userEmail: user?.email || '',
        userPhone: user?.phone || '',
        onSuccess: () => {
          dispatch(clearCart());
          dispatch(closeCart());
          navigate('/orders/active');
        },
        onFailure: () => {
          /* pending order cancelled via payments/failed on dismiss/fail */
        },
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  const slotButtonClass = useCallback(
    (slot) =>
      `py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${
        pickupMode === 'quick' && pickupSlot === slot
          ? 'bg-brand-600 text-white border-brand-600 shadow-soft scale-[1.02]'
          : 'bg-white/80 dark:bg-espresso-800/80 text-espresso-700 dark:text-espresso-300 border-brand-200/60 dark:border-brand-800/40 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400'
      }`,
    [pickupMode, pickupSlot]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-espresso-950/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-md glass-strong shadow-elevated z-50 flex flex-col border-l border-brand-200/40 dark:border-brand-800/30"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-brand-200/40 dark:border-brand-800/30">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h2 className="font-display text-lg font-semibold text-espresso-900 dark:text-espresso-50">
                  Your Cart
                </h2>
                {items.length > 0 && (
                  <span className="bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-xl hover:bg-brand-50 dark:hover:bg-espresso-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-espresso-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-espresso-400 px-6">
                  <ShoppingBag className="w-16 h-16 opacity-30" />
                  <p className="text-lg font-medium text-espresso-600 dark:text-espresso-300">
                    Your cart is empty
                  </p>
                  <p className="text-sm text-center">
                    Add some delicious items from the menu!
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.menuItem}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-brand-50/50 dark:bg-espresso-800/60 border border-brand-100/60 dark:border-espresso-700/50"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-espresso-900 dark:text-espresso-50 truncate">
                          {item.name}
                        </p>
                        <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(updateQuantity({ menuItem: item.menuItem, delta: -1 }))
                          }
                          className="w-8 h-8 rounded-full bg-white dark:bg-espresso-700 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-colors border border-brand-200/50 dark:border-espresso-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-semibold text-sm text-espresso-900 dark:text-espresso-50">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(updateQuantity({ menuItem: item.menuItem, delta: 1 }))
                          }
                          className="w-8 h-8 rounded-full bg-white dark:bg-espresso-700 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-colors border border-brand-200/50 dark:border-espresso-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatch(removeFromCart(item.menuItem))}
                          className="w-8 h-8 rounded-full bg-tomato-500/10 flex items-center justify-center hover:bg-tomato-500 hover:text-white text-tomato-600 transition-colors ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  <div className="mt-2 pt-2 border-t border-brand-200/40 dark:border-brand-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <h3 className="font-semibold text-espresso-900 dark:text-espresso-50 text-sm">
                        Pick up time
                      </h3>
                      {pickupSlot && (
                        <span className="ml-auto text-xs font-bold text-brand-600 dark:text-brand-400">
                          {pickupSlot}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPickupMode('quick');
                          if (!pickupSlot || !isValidPickupSlot(pickupSlot)) {
                            selectQuickSlot(DEFAULT_SLOT);
                          }
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                          pickupMode === 'quick'
                            ? 'bg-brand-600 text-white'
                            : 'bg-espresso-100 dark:bg-espresso-800 text-espresso-600 dark:text-espresso-400'
                        }`}
                      >
                        Quick slots
                      </button>
                      <button
                        type="button"
                        onClick={switchToCustom}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                          pickupMode === 'custom'
                            ? 'bg-brand-600 text-white'
                            : 'bg-espresso-100 dark:bg-espresso-800 text-espresso-600 dark:text-espresso-400'
                        }`}
                      >
                        Custom time
                      </button>
                    </div>

                    {pickupMode === 'quick' ? (
                      <div className="max-h-44 overflow-y-auto pr-1">
                        <div className="grid grid-cols-3 gap-2">
                          {PICKUP_SLOTS.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => selectQuickSlot(slot)}
                              className={slotButtonClass(slot)}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-espresso-500 dark:text-espresso-400">
                          Choose time (9:00 AM – 5:00 PM)
                        </label>
                        <input
                          type="time"
                          min="09:00"
                          max="17:00"
                          step="900"
                          value={customTimeValue}
                          onChange={handleCustomTimeChange}
                          className="w-full rounded-xl border border-brand-200/60 dark:border-brand-800/40 bg-white dark:bg-espresso-800 text-espresso-900 dark:text-espresso-50 px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                        {pickupSlot && isValidPickupSlot(pickupSlot) && (
                          <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                            Selected: {pickupSlot}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-espresso-700 dark:text-espresso-300 mb-1">
                      Special instructions (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="E.g. no onions, extra spicy..."
                      maxLength={300}
                      rows={2}
                      className="w-full rounded-xl border border-brand-200/60 dark:border-brand-800/40 bg-white dark:bg-espresso-800 text-sm text-espresso-900 dark:text-espresso-50 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-brand-200/40 dark:border-brand-800/30 p-4 space-y-3 safe-bottom">
                <div className="flex justify-between items-center">
                  <span className="text-espresso-500 dark:text-espresso-400 text-sm">Subtotal</span>
                  <span className="font-display font-bold text-espresso-900 dark:text-espresso-50">
                    ₹{total.toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClearCart}
                    disabled={isBusy}
                    className="px-4 py-3 rounded-xl font-semibold text-sm border border-brand-200/60 dark:border-brand-800/40 text-espresso-600 dark:text-espresso-400 hover:bg-brand-50 dark:hover:bg-espresso-800 transition-all disabled:opacity-50"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isBusy || !canPlaceOrder}
                    className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isBusy ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        {processing ? 'Opening payment…' : 'Placing order…'}
                      </>
                    ) : (
                      <>
                        Place Order
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
