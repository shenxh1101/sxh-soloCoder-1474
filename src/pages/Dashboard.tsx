import { useState } from 'react';
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
  Calendar,
  ChevronRight,
  Printer,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import StatCard from '@/components/StatCard';
import type { Order } from '@/types';

type Period = 'today' | 'week' | 'month';

export default function Dashboard() {
  const navigate = useNavigate();
  const { getStats, getOrdersByPeriod, supplies, customers } = useStore();

  const [period, setPeriod] = useState<Period>('today');

  const stats = getStats(period);
  const periodOrders = getOrdersByPeriod(period);

  const lowSupplies = supplies.filter((s) => s.currentStock <= s.threshold);
  const creditCustomers = customers.filter((c) => c.id !== 'walk-in' && c.debt > 0);

  const quickActions = [
    { label: '快速记账', icon: Receipt, onClick: () => navigate('/billing'), color: 'bg-blue-600 hover:bg-blue-700' },
    { label: '新增客户', icon: Plus, onClick: () => navigate('/customers'), color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: '月底收账', icon: FileText, onClick: () => navigate('/customers'), color: 'bg-amber-600 hover:bg-amber-700' },
    { label: '耗材管理', icon: Package, onClick: () => navigate('/supplies'), color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  const tabs: { key: Period; label: string; icon: typeof Calendar }[] = [
    { key: 'today', label: '今日', icon: Calendar },
    { key: 'week', label: '本周', icon: Calendar },
    { key: 'month', label: '本月', icon: Calendar },
  ];

  const handlePrintPeriodOrders = () => {
    window.print();
  };

  const getOrderTypeBadge = (order: Order) => {
    if (order.type === 'cash') {
      return (
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
          现金
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
        挂账
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">首页仪表板</h1>
          <p className="text-gray-500 mt-1">欢迎使用图文店账目管理系统</p>
        </div>
      </div>

      <div className="print-only hidden">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            {period === 'today' ? '今日' : period === 'week' ? '本周' : '本月'}经营统计
          </h1>
          <p className="text-gray-600 mt-2">
            打印日期：{format(new Date(), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
          </p>
        </div>
      </div>

      <div className="no-print">
        <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all ${
                period === tab.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title={`${tabs.find((t) => t.key === period)?.label}总收入`}
          value={stats.total}
          icon={<DollarSign className="w-6 h-6" />}
          variant="default"
        />
        <StatCard
          title={`${tabs.find((t) => t.key === period)?.label}现金`}
          value={stats.cash}
          icon={<Wallet className="w-6 h-6" />}
          variant="success"
        />
        <StatCard
          title={`${tabs.find((t) => t.key === period)?.label}挂账`}
          value={stats.credit}
          icon={<CreditCard className="w-6 h-6" />}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4 no-print">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-500" />
              {tabs.find((t) => t.key === period)?.label}订单明细
            </h3>
            {periodOrders.length > 0 && (
              <button
                onClick={handlePrintPeriodOrders}
                className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                打印
              </button>
            )}
          </div>
          <div className="print-only mb-2">
            <h3 className="text-lg font-semibold">
              {tabs.find((t) => t.key === period)?.label}订单明细
            </h3>
          </div>

          {periodOrders.length > 0 ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">时间</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">客户</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">服务</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">类型</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">金额</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {periodOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {format(new Date(order.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {order.customerName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {order.items.map((item) => `${item.serviceName}×${item.quantity}`).join('、')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {getOrderTypeBadge(order)}
                          {(order.discount ?? 100) < 100 && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              {order.discount}折
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          ¥{order.totalAmount.toFixed(2)}
                        </div>
                        {(order.discount ?? 100) < 100 && (
                          <div className="text-xs text-gray-400 line-through">
                            ¥{(order.originalAmount ?? order.totalAmount).toFixed(2)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 print:bg-gray-100 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">
                      合计
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-blue-600">
                      ¥{stats.total.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-xs font-medium text-emerald-700">
                      其中现金：¥{stats.cash.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right text-xs font-medium text-amber-700">
                      挂账：¥{stats.credit.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-xl">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>该时间段暂无订单</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`${action.color} text-white p-5 rounded-xl flex flex-col items-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5`}
              >
                <action.icon className="w-7 h-7" />
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>

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
                          当前: {item.currentStock}，阈值: {item.threshold}
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
              <p className="text-gray-500 text-center py-6">
                耗材库存充足 ✓
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 no-print">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            挂账客户
          </h3>
          <button
            onClick={() => navigate('/customers')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {creditCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {creditCustomers.slice(0, 6).map((customer) => (
              <div
                key={customer.id}
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                    <p className="text-xs text-gray-500 truncate">{customer.phone || '-'}</p>
                  </div>
                </div>
                <span className="text-red-600 font-semibold flex-shrink-0 ml-2">
                  ¥{customer.debt.toFixed(2)}
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
  );
}
