import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { menuAPI, adminAPI } from '../../utils/api';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { generatePickupSlots, getDefaultPickupSlot } from '../../utils/pickupTime';
import { Plus, Minus, ShoppingCart } from 'lucide-react';

const PICKUP_SLOTS = generatePickupSlots();
const DEFAULT_SLOT = getDefaultPickupSlot(PICKUP_SLOTS);

const AdminCounterOrder = () => {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [pickupSlot, setPickupSlot] = useState(DEFAULT_SLOT);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    menuAPI.getAll({ availability: 'true' }).then(({ data }) => {
      setMenu(data.items || []);
    });
  }, []);

  const addItem = (item) => {
    setCart((prev) => ({
      ...prev,
      [item._id]: { item, qty: (prev[item._id]?.qty || 0) + 1 },
    }));
  };

  const changeQty = (id, delta) => {
    setCart((prev) => {
      const entry = prev[id];
      if (!entry) return prev;
      const qty = entry.qty + delta;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...entry, qty } };
    });
  };

  const cartEntries = Object.values(cart);
  const total = cartEntries.reduce((sum, { item, qty }) => sum + item.price * qty, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartEntries.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    setSubmitting(true);
    try {
      const items = cartEntries.map(({ item, qty }) => ({
        menuItem: item._id,
        quantity: qty,
      }));

      const { data } = await adminAPI.createCounterOrder({
        items,
        pickupSlot,
        customerName: customerName.trim(),
        notes: notes.trim(),
      });

      toast.success(`Counter order ${data.order.orderId} created`);
      setCart({});
      setCustomerName('');
      setNotes('');
      navigate('/admin/live-orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="New Counter Order"
        subtitle="Walk-in cash orders — confirmed and paid immediately"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-espresso-600 dark:text-espresso-400">
              Customer name (optional)
            </label>
            <input
              className="input-field mt-1 w-full"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in customer"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-espresso-600 dark:text-espresso-400">
              Pickup slot
            </label>
            <select
              className="input-field mt-1 w-full"
              value={pickupSlot}
              onChange={(e) => setPickupSlot(e.target.value)}
            >
              {PICKUP_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 max-h-[45vh] overflow-y-auto space-y-2">
          {menu.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between gap-3 py-2 border-b border-espresso-100 dark:border-espresso-800 last:border-0"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">{item.name}</p>
                <p className="text-sm text-brand-600">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {cart[item._id] ? (
                  <>
                    <button
                      type="button"
                      onClick={() => changeQty(item._id, -1)}
                      className="p-2 rounded-lg bg-espresso-100 dark:bg-espresso-800"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-bold">{cart[item._id].qty}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(item._id, 1)}
                      className="p-2 rounded-lg bg-espresso-100 dark:bg-espresso-800"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => addItem(item)}
                    className="btn-secondary text-sm py-2 px-3"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand-600" />
            <span className="text-lg font-bold">₹{total}</span>
            <span className="text-sm text-espresso-500">
              ({cartEntries.length} item{cartEntries.length !== 1 ? 's' : ''})
            </span>
          </div>
          <Button type="submit" loading={submitting} className="min-h-[48px] sm:min-w-[200px]">
            Place counter order
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminCounterOrder;
