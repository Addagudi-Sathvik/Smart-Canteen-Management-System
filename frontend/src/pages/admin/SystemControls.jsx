import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import { Settings, Power, PowerOff, MessageSquareText, Save, AlertCircle } from 'lucide-react';

const SystemControls = () => {
  const [systemState, setSystemState] = useState({ orderingOpen: true, message: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const { data } = await adminAPI.getSystemState();
        setSystemState(data.systemState);
        setMessage(data.systemState.message || '');
      } catch (error) {
        toast.error('Failed to load system state');
      } finally {
        setLoading(false);
      }
    };
    fetchState();
  }, []);

  const handleToggleOrdering = async () => {
    try {
      const { data } = await adminAPI.updateSystemState({
        orderingOpen: !systemState.orderingOpen,
        message,
      });
      setSystemState(data.systemState);
      toast.success(`Ordering ${data.systemState.orderingOpen ? 'opened' : 'closed'}`);
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleSaveMessage = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSystemState({ message });
      toast.success('Message saved');
    } catch (error) {
      toast.error('Failed to save message');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="System Controls" subtitle="Manage canteen operations" />

      <motion.div
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              systemState.orderingOpen
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {systemState.orderingOpen
                ? <Power className="w-6 h-6 text-green-600 dark:text-green-400" />
                : <PowerOff className="w-6 h-6 text-red-600 dark:text-red-400" />
              }
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ordering System</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Currently {systemState.orderingOpen ? 'Open' : 'Closed'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleOrdering}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              systemState.orderingOpen ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
              systemState.orderingOpen ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className={`p-3 rounded-lg text-sm ${
          systemState.orderingOpen
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>
              Students {systemState.orderingOpen ? 'can' : 'cannot'} place new orders
            </span>
          </div>
        </div>
      </motion.div>

      {/* System Message */}
      <motion.div
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <MessageSquareText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Message</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Display a message to all users</p>
          </div>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter a system message..."
          className="input-field resize-none"
          rows={3}
        />
        <button
          onClick={handleSaveMessage}
          disabled={saving}
          className="btn-primary mt-3"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Message'}
        </button>
      </motion.div>

      {/* Info */}
      <motion.div
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Info</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">System statistics</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {systemState.orderingOpen ? 'Open' : 'Closed'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ordering Status</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{message ? 'Yes' : 'No'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Active Message</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SystemControls;
