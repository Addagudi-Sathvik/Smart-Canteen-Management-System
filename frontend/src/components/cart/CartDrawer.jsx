import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  closeCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  selectCartTotal,
  selectCartCount,
} from '../../store/slices/cartSlice';
import { createOrder } from '../../store/slices/orderSlice';
import { motionSpring } from '../../config/navigation';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { ShoppingCart, Trash2, Plus, Minus, X, ArrowRight, Clock } from 'lucide-react';
import { useState } from 'react';
import useRazorpay from '../../hooks/useRazorpay';

// Pickup slots available every 15 minutes from 12:00 PM to 2:00 PM
const PICKUP_SLOTS = [
  '12:00 PM',
  '12:15 PM',
  '12:30 PM',
  '12:45 PM',
  '1:00 PM',
  '1:15 PM',
  '1:30 PM',
  '1:45 PM',
  '2:00 PM',
];

const CartDrawer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, isOpen } = useSelector((state) => state.cart);
  const total = useSelector(selectCartTotal);
  const count = useSelector(selectCartCount);
  const { loading } = useSelector((state) => state.orders);
  const user = useSelector((state) => state.auth.user);
  const [ordering, setOrdering] = useState(false);

  // Pickup slot state — default to first slot
  const [selectedSlot, setSelectedSlot] = useState(PICKUP_SLOTS[0]);

  const { initiatePayment, processing } = useRazorpay();

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    // Guard — slot must be selected (it always will be since we default, but safety check)
    if (!selectedSlot) {
      toast.error('Please select a pickup time slot.');
      return;
    }

    setOrdering(true);
    try {
      // Step 1 — Create the order in DB, include pickupSlot
      const result = await dispatch(createOrder({
        items: items.map((item) => ({
          menuItem: item.menuItem,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        pickupSlot: selectedSlot, // ✅ sent to backend
      })).unwrap();

      if (result.order) {
        const orderId = result.order._id;

        // Step 2 — Trigger Razorpay payment popup
        await initiatePayment({
          orderId,
          amount:    result.order.totalAmount,
          userName:  user?.name  || '',
          userEmail: user?.email || '',
          onSuccess: () => {
            dispatch(clearCart());
            dispatch(closeCart());
            toast.success(`Order placed! Pickup at ${selectedSlot} 🎉`);
            navigate('/orders/active');
          },
          onFailure: () => {
            toast.error('Payment was not completed. Please try again.');
          },
        });
      }
    } catch (error) {
      toast.error(error || 'Failed to place order. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-espresso-950/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeCart())}
          />

          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md glass-strong border-l border-brand-200/40 dark:border-brand-800/30 flex flex-col safe-bottom"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={motionSpring}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-200/40 dark:border-brand-800/30">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-brand-600" />
                </div>
                <h2 className="font-display font-bold text-lg">
                  Your Cart
                  {count > 0 && <span className="text-sm font-normal text-espresso-500 ml-1">({count})</span>}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => dispatch(closeCart())}
                className="p-2.5 rounded-xl hover:bg-brand-50 dark:hover:bg-espresso-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
              {items.length === 0 ? (
                <EmptyState
                  icon={ShoppingCart}
                  title="Your cart is empty"
                  description="Add some delicious items from the menu!"
                  actionLabel="Browse Menu"
                  onAction={() => { dispatch(closeCart()); navigate('/menu'); }}
                />
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    <AnimatePresence>
                      {items.map((item) => (
                        <motion.div
                          key={item.menuItem}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 40 }}
                          className="flex items-center gap-3 p-4 bg-brand-50/50 dark:bg-espresso-800/50 rounded-2xl border border-brand-100/50 dark:border-espresso-700/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{item.name}</p>
                            <p className="text-xs text-espresso-500">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center gap-1 bg-white dark:bg-espresso-900 rounded-xl p-0.5">
                            <button
                              type="button"
                              onClick={() => dispatch(updateQuantity({ menuItem: item.menuItem, quantity: item.quantity - 1 }))}
                              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-espresso-100 dark:hover:bg-espresso-800"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => dispatch(updateQuantity({ menuItem: item.menuItem, quantity: item.quantity + 1 }))}
                              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-espresso-100 dark:hover:bg-espresso-800"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-bold w-14 text-right">₹{item.price * item.quantity}</p>
                          <button
                            type="button"
                            onClick={() => dispatch(removeFromCart(item.menuItem))}
                            className="p-2 text-tomato-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Checkout Panel */}
                  <div className="border-t border-brand-200/40 dark:border-brand-800/30 px-5 py-4 space-y-4 bg-white/50 dark:bg-espresso-950/50">

                    {/* ✅ Pickup Slot Picker */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-brand-600" />
                        <span className="text-sm font-semibold text-espresso-700 dark:text-espresso-300">
                          Pick up time
                        </span>
                        <span className="ml-auto text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-900/40 px-2 py-0.5 rounded-full">
                          {selectedSlot}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {PICKUP_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all min-h-[36px] ${
                              selectedSlot === slot
                                ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                                : 'bg-white dark:bg-espresso-900 border-espresso-200 dark:border-espresso-700 text-espresso-600 dark:text-espresso-400 hover:border-brand-400 hover:text-brand-600'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subtotal + Action Buttons */}
                    <div className="flex justify-between items-center">
                      <span className="text-espresso-500 font-medium">Subtotal</span>
                      <span className="text-xl font-display font-bold">₹{total}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1" onClick={() => dispatch(clearCart())}>
                        Clear
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handlePlaceOrder}
                        disabled={loading || ordering || processing || items.length === 0}
                        loading={ordering || processing}
                      >
                        Place Order <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;