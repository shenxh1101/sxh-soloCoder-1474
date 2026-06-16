import { useState, useMemo } from 'react';
import {
  Calendar,
  Printer,
  Download,
  DollarSign,
  Wallet,
  CreditCard,
  Search,
  BarChart3,
  TrendingUp,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import StatCard from '@/components/StatCard';
import type { Order } from '@/types';

interface ServiceStat {
  serviceId: string;
  serviceName: string;
  quantity: number;
  amount: number;
  icon?: string;
}

interface CustomerStat {
  customerId: string;
  customerName: string;
  cash: number;
  credit: number;
  payment: number;
  currentDebt: number;
  total: number;
}

export default function Statistics() {
  const { getStatsByDateRange, getOrdersByDateRange, services, customers, payments } = useStore();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(today);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'customers'>('orders');

  const start = new Date(startDate);
  const end = new Date(endDate);
  const stats = getStatsByDateRange(start, end);
  const orders = getOrdersByDateRange(start, end);

  const filteredOrders = searchQuery
    ? orders.filter(
        (o) =>
          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.items.some((item) =>
            item.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : orders;

  const serviceStats: ServiceStat[] = useMemo(() => {
    return services
      .map((service) => {
        let quantity = 0;
        let amount = 0;
        orders.forEach((order) => {
          order.items.forEach((item) => {
            if (item.serviceId === service.id) {
              quantity += item.quantity;
              amount += item.subtotal;
            }
          });
        });
        return {
          serviceId: service.id,
          serviceName: service.name,
          quantity,
          amount,
          icon: service.icon,
        };
      })
      .filter((s) => s.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [orders, services]);

  const customerStats: CustomerStat[] = useMemo(() => {
    const endDateFull = new Date(endDate);
    endDateFull.setHours(23, 59, 59, 999);

    const customerMap: Record<string, CustomerStat> = {};

    orders.forEach((order) => {
      if (!customerMap[order.customerId]) {
        const customer = customers.find((c) => c.id === order.customerId);
        customerMap[order.customerId] = {
          customerId: order.customerId,
          customerName: customer?.name || order.customerName,
          cash: 0,
          credit: 0,
          payment: 0,
          currentDebt: customer?.debt || 0,
          total: 0,
        };
      }
      if (order.type === 'cash') {
        customerMap[order.customerId].cash += order.totalAmount;
      } else {
        customerMap[order.customerId].credit += order.totalAmount;
      }
      customerMap[order.customerId].total += order.totalAmount;
    });

    payments.forEach((payment) => {
      const d = new Date(payment.createdAt);
      if (d >= start && d <= endDateFull) {
        if (!customerMap[payment.customerId]) {
          const customer = customers.find((c) => c.id === payment.customerId);
          customerMap[payment.customerId] = {
            customerId: payment.customerId,
            customerName: customer?.name || '未知客户',
            cash: 0,
            credit: 0,
            payment: 0,
            currentDebt: customer?.debt || 0,
            total: 0,
          };
        }
        customerMap[payment.customerId].payment += payment.amount;
      }
    });

    customers.forEach((customer) => {
      if (customer.id !== 'walk-in' && !customerMap[customer.id]) {
        customerMap[customer.id] = {
          customerId: customer.id,
          customerName: customer.name,
          cash: 0,
          credit: 0,
          payment: 0,
          currentDebt: customer.debt,
          total: 0,
        };
      }
    });

    return Object.values(customerMap)
      .filter((c) => c.total > 0 || c.payment > 0 || c.currentDebt > 0)
      .sort((a, b) => b.total - a.total);
  }, [orders, payments, customers, startDate, endDate, start]);

  const totalServiceQuantity = serviceStats.reduce((sum, s) => sum + s.quantity, 0);
  const totalCustomerCash = customerStats.reduce((sum, c) => sum + c.cash, 0);
  const totalCustomerCredit = customerStats.reduce((sum, c) => sum + c.credit, 0);
  const totalCustomerPayment = customerStats.reduce((sum, c) => sum + c.payment, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (activeTab === 'orders') {
      const headers = ['日期', '客户', '服务项目', '数量', '单价', '原价', '折扣', '小计', '结算方式', '备注'];
      const rows = filteredOrders.flatMap((order) =>
        order.items.map((item, idx) => {
          const originalPrice = item.originalPrice ?? item.unitPrice;
          const discount = order.discount ?? 100;
          return [
            idx === 0 ? format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm') : '',
            idx === 0 ? order.customerName : '',
            item.serviceName,
            item.quantity,
            item.unitPrice.toFixed(2),
            originalPrice.toFixed(2),
            discount < 100 ? `${discount}折` : '',
            item.subtotal.toFixed(2),
            idx === 0 ? (order.type === 'cash' ? '现金' : '挂账') : '',
            idx === 0 ? order.remark : '',
          ];
        })
      );

      const summaryRows = [
        [],
        ['统计汇总'],
        ['总收入', stats.total.toFixed(2)],
        ['现金收入', stats.cash.toFixed(2)],
        ['挂账金额', stats.credit.toFixed(2)],
        ['订单数', orders.length.toString()],
      ];

      const csvContent = [headers, ...rows, ...summaryRows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `经营统计_订单明细_${startDate}_${endDate}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else if (activeTab === 'services') {
      const headers = ['排名', '服务项目', '数量', '收入', '占收入比例'];
      const rows = serviceStats.map((s, idx) => [
        idx + 1,
        s.serviceName,
        s.quantity,
        s.amount.toFixed(2),
        stats.total > 0 ? `${((s.amount / stats.total) * 100).toFixed(1)}%` : '0%',
      ]);

      const summaryRows = [
        [],
        ['合计', '', totalServiceQuantity.toString(), stats.total.toFixed(2), '100%'],
      ];

      const csvContent = [headers, ...rows, ...summaryRows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `经营统计_服务排行_${startDate}_${endDate}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else if (activeTab === 'customers') {
      const headers = ['排名', '客户', '现金收入', '挂账金额', '还款金额', '总金额', '当前欠款'];
      const rows = customerStats.map((c, idx) => [
        idx + 1,
        c.customerName,
        c.cash.toFixed(2),
        c.credit.toFixed(2),
        c.payment.toFixed(2),
        c.total.toFixed(2),
        c.currentDebt.toFixed(2),
      ]);

      const summaryRows = [
        [],
        ['合计', '', totalCustomerCash.toFixed(2), totalCustomerCredit.toFixed(2), totalCustomerPayment.toFixed(2), stats.total.toFixed(2), ''],
      ];

      const csvContent = [headers, ...rows, ...summaryRows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `经营统计_客户排行_${startDate}_${endDate}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
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

  const canExport = activeTab === 'orders'
    ? filteredOrders.length > 0
    : activeTab === 'services'
    ? serviceStats.length > 0
    : customerStats.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">经营统计</h1>
          <p className="text-gray-500 mt-1">按日期范围筛选查看经营数据</p>
        </div>
        <div className="flex items-center gap-3">
          {canExport && (
            <>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>导出CSV</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>打印</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="print-only hidden">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">经营统计报表</h1>
          <p className="text-gray-600 mt-2">
            统计期间：{startDate} 至 {endDate}
          </p>
          <p className="text-gray-600">
            打印日期：{format(new Date(), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
          </p>
        </div>
      </div>

      <div className="no-print bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              开始日期
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              结束日期
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStartDate(today);
                setEndDate(today);
              }}
              className="px-3 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              今天
            </button>
            <button
              onClick={() => {
                const d = new Date();
                const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay() + 1);
                setStartDate(format(weekStart, 'yyyy-MM-dd'));
                setEndDate(today);
              }}
              className="px-3 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              本周
            </button>
            <button
              onClick={() => {
                setStartDate(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
                setEndDate(today);
              }}
              className="px-3 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              本月
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="总收入"
          value={stats.total}
          icon={<DollarSign className="w-6 h-6" />}
          variant="default"
        />
        <StatCard
          title="现金收入"
          value={stats.cash}
          icon={<Wallet className="w-6 h-6" />}
          variant="success"
        />
        <StatCard
          title="挂账金额"
          value={stats.credit}
          icon={<CreditCard className="w-6 h-6" />}
          variant="warning"
        />
      </div>

      <div className="no-print bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'orders'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              订单明细
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 px-6 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'services'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              服务排行
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex-1 px-6 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'customers'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              客户排行
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4 no-print">
            <h3 className="text-lg font-semibold text-gray-900">
              订单明细（共 {filteredOrders.length} 笔）
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索客户或服务..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="print-only mb-3">
            <h3 className="text-lg font-semibold">订单明细</h3>
          </div>

          {filteredOrders.length > 0 ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">时间</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">客户</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">服务</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">数量</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">单价</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">类型</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">金额</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) =>
                    order.items.map((item, idx) => {
                      const originalPrice = item.originalPrice ?? item.unitPrice;
                      const hasPriceChange = item.unitPrice !== originalPrice;
                      return (
                        <tr key={`${order.id}-${item.id}`} className="hover:bg-gray-50 print:hover:bg-white">
                          {idx === 0 ? (
                            <>
                              <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap" rowSpan={order.items.length}>
                                {format(new Date(order.createdAt), 'MM-dd HH:mm')}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium" rowSpan={order.items.length}>
                                {order.customerName}
                              </td>
                            </>
                          ) : null}
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.serviceName}
                            {hasPriceChange && (
                              <span className="text-orange-500 text-xs ml-1">
                                (原¥{originalPrice})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">¥{item.unitPrice}</td>
                          {idx === 0 ? (
                            <>
                              <td className="px-4 py-3" rowSpan={order.items.length}>
                                {getOrderTypeBadge(order)}
                                {(order.discount ?? 100) < 100 && (
                                  <div className="text-xs text-orange-500 mt-1">{order.discount}折</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900" rowSpan={order.items.length}>
                                ¥{order.totalAmount.toFixed(2)}
                              </td>
                            </>
                          ) : null}
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-gray-50 print:bg-gray-100 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-gray-700">
                      合计
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold">
                      ¥{stats.total.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-xs font-medium text-emerald-700">
                      现金：¥{stats.cash.toFixed(2)}
                    </td>
                    <td colSpan={4} className="px-4 py-2 text-right text-xs font-medium text-amber-700">
                      挂账：¥{stats.credit.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-xl">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>该日期范围内暂无订单</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4 no-print">
            <h3 className="text-lg font-semibold text-gray-900">
              服务项目排行（共 {serviceStats.length} 项）
            </h3>
          </div>

          <div className="print-only mb-3">
            <h3 className="text-lg font-semibold">服务项目排行</h3>
          </div>

          {serviceStats.length > 0 ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-16">排名</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">服务项目</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">数量</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">收入</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-32">占比</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {serviceStats.map((s, idx) => (
                    <tr key={s.serviceId} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-gray-200 text-gray-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{s.icon}</span>
                          <span className="font-medium text-gray-900">{s.serviceName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {s.quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        ¥{s.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{
                                width: stats.total > 0 ? `${(s.amount / stats.total) * 100}%` : '0%',
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-12 text-right">
                            {stats.total > 0 ? `${((s.amount / stats.total) * 100).toFixed(1)}%` : '0%'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 print:bg-gray-100 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700">
                      合计
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {totalServiceQuantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-lg font-bold text-blue-600 text-right">
                      ¥{stats.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-xl">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>该日期范围内暂无服务数据</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4 no-print">
            <h3 className="text-lg font-semibold text-gray-900">
              客户贡献排行（共 {customerStats.length} 位）
            </h3>
          </div>

          <div className="print-only mb-3">
            <h3 className="text-lg font-semibold">客户贡献排行</h3>
          </div>

          {customerStats.length > 0 ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-16">排名</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">客户</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">现金收入</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">挂账金额</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">还款金额</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">总金额</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">当前欠款</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerStats.map((c, idx) => (
                    <tr key={c.customerId} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-gray-200 text-gray-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium text-gray-900">{c.customerName}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-emerald-700 text-right font-medium">
                        ¥{c.cash.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-700 text-right font-medium">
                        ¥{c.credit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-700 text-right font-medium">
                        ¥{c.payment.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        ¥{c.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {c.currentDebt > 0 ? (
                          <span className="font-medium text-red-600">¥{c.currentDebt.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 print:bg-gray-100 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700">
                      合计
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-700 text-right">
                      ¥{totalCustomerCash.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-amber-700 text-right">
                      ¥{totalCustomerCredit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-700 text-right">
                      ¥{totalCustomerPayment.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-lg font-bold text-blue-600 text-right">
                      ¥{stats.total.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-xl">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>该日期范围内暂无客户数据</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
