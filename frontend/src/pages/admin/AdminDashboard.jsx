import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { StatsSkeleton } from '../../components/ui/Skeleton';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import { chartTooltipStyle, chartGridStroke, chartAxisStroke, CHART_COLORS } from '../../components/ui/ChartTooltip';
import {
  TrendingUp, Users, ShoppingBag, Clock, UtensilsCrossed, AlertCircle, CheckCircle2,
} from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: result } = await adminAPI.getDashboard();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="space-y-6"><PageHeader title="Admin Dashboard" subtitle="Loading analytics..." /><StatsSkeleton /></div>;
  if (!data) return <div className="text-center py-16 text-espresso-500">Failed to load dashboard data</div>;

  const { metrics, ordersByStatus, popularItems, dailyOrders, systemState } = data;

  const pieData = Object.entries(ordersByStatus)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  const statCards = [
    { label: "Today's Orders", value: metrics.totalOrdersToday, icon: ShoppingBag },
    { label: 'Revenue Today', value: `₹${metrics.revenueToday}`, icon: TrendingUp, color: 'text-accent-600', bg: 'bg-accent-50 dark:bg-accent-900/25' },
    { label: 'Avg Prep Time', value: `${metrics.avgPrepTime} min`, icon: Clock },
    { label: 'Total Users', value: metrics.totalUsers, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/25' },
    { label: 'Students', value: metrics.totalStudents, icon: Users },
    { label: 'Menu Items', value: metrics.totalMenuItems, icon: UtensilsCrossed, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/25' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Overview of canteen operations" />

      <Card
        className={`flex items-center gap-3 ${
          systemState?.orderingOpen ? 'border-l-4 border-accent-500' : 'border-l-4 border-tomato-500'
        }`}
      >
        {systemState?.orderingOpen ? (
          <CheckCircle2 className="w-5 h-5 text-accent-500 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-tomato-500 shrink-0" />
        )}
        <div>
          <p className="font-semibold text-espresso-900 dark:text-espresso-100">
            Ordering is {systemState?.orderingOpen ? 'Open' : 'Closed'}
          </p>
          {systemState?.message && (
            <p className="text-sm text-espresso-500 mt-0.5">{systemState.message}</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-espresso-900 dark:text-espresso-50 mb-4">Daily Orders (7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke={chartAxisStroke} />
              <YAxis tick={{ fontSize: 11 }} stroke={chartAxisStroke} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="orders" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-bold text-espresso-900 dark:text-espresso-50 mb-4">Daily Revenue (7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke={chartAxisStroke} />
              <YAxis tick={{ fontSize: 11 }} stroke={chartAxisStroke} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-espresso-900 dark:text-espresso-50 mb-4">Orders by Status (Today)</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-espresso-500 py-12">No orders today</p>
          )}
        </Card>

        <Card>
          <h3 className="font-bold text-espresso-900 dark:text-espresso-50 mb-4">Popular Items (This Week)</h3>
          {popularItems.length > 0 ? (
            <div className="space-y-4">
              {popularItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-600 w-6">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-semibold">{item.name}</span>
                      <span className="text-xs text-espresso-500">{item.count} orders</span>
                    </div>
                    <div className="w-full bg-espresso-100 dark:bg-espresso-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / Math.max(...popularItems.map((p) => p.count))) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.08 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-espresso-500 py-12">No data available</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
