import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Wallet,
  CreditCard,
  Plus,
  Users,
  AlertTriangle,
  Receipt,
  Droplets,
  Package,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatCard from '@/components/StatCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { getStats, supplies, customers } = useStore();

  const todayStats = getStats('today');
  const weekStats = getStats('week');
  const monthStats = getStats('month');

  const lowSupplies = supplies.filter((s) => s.currentStock <= s.threshold);
  const creditCustomers = customers.filter((c) => c.id !== 'walk-in' && c.debt > 0);

  const quickActions = [
    { label: '快速记账', icon: Receipt, onClick: () => navigate('/billing'), color: 'bg-blue-600 hover:bg-blue-700' },
    { label: '新增客户', icon: Plus, onClick: () => navigate('/customers'), color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: '客户挂账', icon: Users, onClick: () => navigate('/customers'), color: 'bg-amber-600 hover:bg-amber-700' },
    { label: '耗材管理', icon: Package, onClick: () => navigate('/supplies'), color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">首页仪表板</h1>
        <p className="text-gray-500 mt-1">欢迎使用图文店账目管理系统</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="今日总收入"
          value={todayStats.total}
          icon={<DollarSign className="w-6 h-6" />}
          variant="default"
        />
        <StatCard
          title="今日现金"
          value={todayStats.cash}
          icon={<Wallet className="w-6 h-6" />}
          variant="success"
        />
        <StatCard
          title="今日挂账"
          value={todayStats.credit}
          icon={<CreditCard className="w-6 h-6" />}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="本周总收入"
          value={weekStats.total}
          icon={<DollarSign className="w-6 h-6" />}
          variant="default"
        />
        <StatCard
          title="本月总收入"
          value={monthStats.total}
          icon={<DollarSign className="w-6 h-6" />}
          variant="default"
        />
        <StatCard
          title="应收挂账总额"
          value={customers.reduce((sum, c) => sum + c.debt, 0)}
          icon={<CreditCard className="w-6 h-6" />}
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`${action.color} text-white p-6 rounded-xl flex flex-col items-center gap-3 transition-all hover:shadow-lg hover:-translate-y-1`}
          >
            <action.icon className="w-8 h-8" />
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            耗材提醒
          </h3>
          {lowSupplies.length > 0 ? (
            <div className="space-y-3">
              {lowSupplies.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.id === 'toner' ? (
                      <Droplets className="w-5 h-5 text-red-500" />
                    ) : (
                      <Package className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        当前库存: {item.currentStock}，阈值: {item.threshold}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                    库存不足
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
            耗材库存充足 ✓
          </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            挂账客户
          </h3>
          {creditCustomers.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-auto">
              {creditCustomers.map((customer) => (
                <div
                  key={customer.id}
              onClick={() => navigate(`/customers/${customer.id}`)}
              className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900">{customer.name}</p>
                <p className="text-sm text-gray-500">{customer.phone}</p>
              </div>
              <span className="text-red-600 font-semibold">
                欠 ¥{customer.debt.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          暂无挂账客户
        </p>
      )}
        </div>
      </div>
    </div>
  );
}
