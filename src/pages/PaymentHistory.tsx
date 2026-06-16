import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Printer,
  ArrowDownLeft,
  User,
  ChevronDown,
  Download,
  X,
  FileText,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import type { Order, Payment, Customer } from '@/types';

interface PaymentDetail {
  payment: Payment;
  customer: Customer | undefined;
  balanceBefore: number;
  balanceAfter: number;
}

export default function PaymentHistory() {
  const navigate = useNavigate();
  const { payments, customers, orders } = useStore();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(today);
  const [selectedCustomerId, setSelectedCustomerId] = useState('all');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<PaymentDetail | null>(null);

  const creditCustomers = customers.filter((c) => c.id !== 'walk-in');

  const paymentDetails = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let filteredPayments = payments.filter((p) => {
      const d = new Date(p.createdAt);
      return d >= start && d <= end;
    });

    if (selectedCustomerId !== 'all') {
      filteredPayments = filteredPayments.filter(
        (p) => p.customerId === selectedCustomerId
      );
    }

    const paymentMap: Record<string, PaymentDetail[]> = {};

    creditCustomers.forEach((customer) => {
      const customerOrders = orders.filter(
        (o) => o.customerId === customer.id && o.type === 'credit'
      );
      const customerPayments = payments.filter((p) => p.customerId === customer.id);

      type Tx =
        | { type: 'order'; data: Order }
        | { type: 'payment'; data: Payment };

      const transactions: Tx[] = [
        ...customerOrders.map((o) => ({ type: 'order' as const, data: o })),
        ...customerPayments.map((p) => ({ type: 'payment' as const, data: p })),
      ].sort(
        (a, b) =>
          new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime()
      );

      let balance = 0;
      const details: PaymentDetail[] = [];

      transactions.forEach((tx) => {
        if (tx.type === 'order') {
          balance += tx.data.totalAmount;
        } else {
          const balanceBefore = balance;
          balance = Math.max(0, balance - tx.data.amount);
          details.push({
            payment: tx.data,
            customer,
            balanceBefore,
            balanceAfter: balance,
          });
        }
      });

      paymentMap[customer.id] = details;
    });

    const allDetails: PaymentDetail[] = [];
    filteredPayments.forEach((p) => {
      const customerDetails = paymentMap[p.customerId] || [];
      const detail = customerDetails.find((d) => d.payment.id === p.id);
      if (detail) {
        allDetails.push(detail);
      }
    });

    return allDetails.sort(
      (a, b) =>
        new Date(b.payment.createdAt).getTime() -
        new Date(a.payment.createdAt).getTime()
    );
  }, [payments, orders, customers, startDate, endDate, selectedCustomerId]);

  const totalCollected = paymentDetails.reduce((sum, d) => sum + d.payment.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['日期', '客户', '还款前欠款', '本次收款', '还款后欠款', '备注'];
    const rows = paymentDetails.map((d) => [
      format(new Date(d.payment.createdAt), 'yyyy-MM-dd HH:mm'),
      d.customer?.name || '-',
      d.balanceBefore.toFixed(2),
      d.payment.amount.toFixed(2),
      d.balanceAfter.toFixed(2),
      d.payment.remark || '',
    ]);

    const summaryRows = [
      [],
      ['合计'],
      ['总收款笔数', paymentDetails.length.toString()],
      ['总收款金额', totalCollected.toFixed(2)],
    ];

    const csvContent = [headers, ...rows, ...summaryRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `收款流水_${startDate}_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const openDetail = (detail: PaymentDetail) => {
    setSelectedDetail(detail);
    setShowDetailModal(true);
  };

  const goToCustomerStatement = () => {
    if (selectedDetail?.customer) {
      navigate(`/customers/${selectedDetail.customer.id}`);
      setShowDetailModal(false);
    }
  };

  const selectedCustomer = creditCustomers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">收款流水</h1>
          <p className="text-gray-500 mt-1">按日期和客户查看还款记录</p>
        </div>
        <div className="flex items-center gap-3">
          {paymentDetails.length > 0 && (
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
                <Printer className="w-5 h-5" />
                <span>打印</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="print-only hidden">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">收款流水报表</h1>
          <p className="text-gray-600 mt-2">
            统计期间：{startDate} 至 {endDate}
          </p>
          {selectedCustomerId !== 'all' && (
            <p className="text-gray-600">客户：{selectedCustomer?.name}</p>
          )}
          <p className="text-gray-600">
            打印日期：{format(new Date(), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
          </p>
        </div>
      </div>

      <div className="no-print bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              客户
            </label>
            <button
              onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
              className="w-48 px-4 py-2.5 border border-gray-300 rounded-lg flex items-center justify-between hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm">
                  {selectedCustomerId === 'all'
                    ? '全部客户'
                    : selectedCustomer?.name || '全部客户'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showCustomerDropdown && (
              <div className="absolute z-10 w-64 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-auto">
                <button
                  onClick={() => {
                    setSelectedCustomerId('all');
                    setShowCustomerDropdown(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                    selectedCustomerId === 'all' ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  全部客户
                </button>
                {creditCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomerId(customer.id);
                      setShowCustomerDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                      selectedCustomerId === customer.id
                        ? 'bg-blue-50 text-blue-700'
                        : ''
                    }`}
                  >
                    <span>{customer.name}</span>
                    <span className="text-xs text-gray-400">{customer.phone || ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
                const weekStart = new Date(
                  d.getFullYear(),
                  d.getMonth(),
                  d.getDate() - d.getDay() + 1
                );
                setStartDate(format(weekStart, 'yyyy-MM-dd'));
                setEndDate(today);
              }}
              className="px-3 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              本周
            </button>
            <button
              onClick={() => {
                setStartDate(
                  format(
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    'yyyy-MM-dd'
                  )
                );
                setEndDate(today);
              }}
              className="px-3 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              本月
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">收款笔数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5">
            {paymentDetails.length} 笔
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
          <p className="text-sm text-emerald-700">总收款金额</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1.5">
            ¥{totalCollected.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 no-print">
          还款明细（共 {paymentDetails.length} 笔）
        </h3>
        <div className="print-only mb-3">
          <h3 className="text-lg font-semibold">还款明细</h3>
        </div>

        {paymentDetails.length > 0 ? (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 print:bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    时间
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    客户
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    还款前欠款
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    本次收款
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    还款后欠款
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    备注
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-20 print:hidden">
                    详情
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paymentDetails.map((detail) => (
                  <tr
                    key={detail.payment.id}
                    className="hover:bg-gray-50 print:hover:bg-white cursor-pointer no-print"
                    onClick={() => openDetail(detail)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {format(
                        new Date(detail.payment.createdAt),
                        'yyyy-MM-dd HH:mm',
                        { locale: zhCN }
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {detail.customer?.name || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      ¥{detail.balanceBefore.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600 text-right">
                      +¥{detail.payment.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      ¥{detail.balanceAfter.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {detail.payment.remark || '-'}
                    </td>
                    <td className="px-4 py-3 text-center print:hidden">
                      <button
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="查看详情"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(detail);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paymentDetails.map((detail) => (
                  <tr
                    key={`print-${detail.payment.id}`}
                    className="hover:bg-white print-only"
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {format(
                        new Date(detail.payment.createdAt),
                        'yyyy-MM-dd HH:mm',
                        { locale: zhCN }
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {detail.customer?.name || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      ¥{detail.balanceBefore.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600 text-right">
                      +¥{detail.payment.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      ¥{detail.balanceAfter.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {detail.payment.remark || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 print:bg-gray-100 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700">
                    合计
                  </td>
                  <td className="px-4 py-3 text-lg font-bold text-emerald-600 text-right">
                    ¥{totalCollected.toFixed(2)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-xl">
            <ArrowDownLeft className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>该条件下暂无还款记录</p>
          </div>
        )}
      </div>

      {showDetailModal && selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center no-print">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDetailModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">还款详情</h3>
                  <p className="text-sm text-gray-500">
                    {format(
                      new Date(selectedDetail.payment.createdAt),
                      'yyyy年MM月dd日 HH:mm',
                      { locale: zhCN }
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">客户</p>
                    <p className="font-semibold text-gray-900">
                      {selectedDetail.customer?.name || '-'}
                    </p>
                    {selectedDetail.customer?.phone && (
                      <p className="text-sm text-gray-500">
                        {selectedDetail.customer.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-center">
                  <p className="text-xs text-amber-700">还款前欠款</p>
                  <p className="text-xl font-bold text-amber-700 mt-1">
                    ¥{selectedDetail.balanceBefore.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <p className="text-xs text-emerald-700">本次收款</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">
                    ¥{selectedDetail.payment.amount.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <p className="text-xs text-gray-700">还款后欠款</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    ¥{selectedDetail.balanceAfter.toFixed(2)}
                  </p>
                </div>
              </div>

              {selectedDetail.payment.remark && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">备注</p>
                  <p className="text-gray-900">{selectedDetail.payment.remark}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={goToCustomerStatement}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>查看客户对账单</span>
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
