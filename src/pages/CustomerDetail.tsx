import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  Calendar,
  X,
  Wallet,
  CreditCard,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import type { Order, Payment } from '@/types';

type Transaction =
  | { type: 'order'; data: Order }
  | { type: 'payment'; data: Payment };

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, orders, payments, addPayment } = useStore();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRemark, setPaymentRemark] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const customer = customers.find((c) => c.id === id);
  const customerOrders = orders.filter((o) => o.customerId === id);
  const customerPayments = payments.filter((p) => p.customerId === id);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    customerOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    customerPayments.forEach((p) => {
      const d = new Date(p.createdAt);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [customerOrders, customerPayments]);

  const monthFilter = (dateStr: string) => {
    if (selectedMonth === 'all') return true;
    const d = new Date(dateStr);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return month === selectedMonth;
  };

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">客户不存在</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          返回客户列表
        </button>
      </div>
    );
  }

  const allTransactions: Transaction[] = [
    ...customerOrders.map((o) => ({ type: 'order' as const, data: o })),
    ...customerPayments.map((p) => ({ type: 'payment' as const, data: p })),
  ].sort((a, b) =>
    new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
  );

  const creditTransactionsAll: Transaction[] = [
    ...customerOrders
      .filter((o) => o.type === 'credit')
      .map((o) => ({ type: 'order' as const, data: o })),
    ...customerPayments.map((p) => ({ type: 'payment' as const, data: p })),
  ].sort((a, b) =>
    new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
  );

  const creditTransactions: Transaction[] = creditTransactionsAll.filter((tx) =>
    monthFilter(tx.data.createdAt)
  );

  const totalCreditAll = customerOrders
    .filter((o) => o.type === 'credit')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCredit = customerOrders
    .filter((o) => o.type === 'credit' && monthFilter(o.createdAt))
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCash = customerOrders
    .filter((o) => o.type === 'cash')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaidAll = customerPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = customerPayments
    .filter((p) => monthFilter(p.createdAt))
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOrders = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效的还款金额');
      return;
    }
    if (!id) return;

    addPayment({
      customerId: id,
      amount,
      remark: paymentRemark,
    });

    setPaymentAmount('');
    setPaymentRemark('');
    setShowPaymentModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTransactionRow = (tx: Transaction, index: number, totalCount: number, showCashLabel = true) => {
    const isOrder = tx.type === 'order';
    const order = isOrder ? tx.data : null;
    const payment = !isOrder ? tx.data : null;
    const isCreditOrder = isOrder && order!.type === 'credit';

    return (
      <div
        key={`${tx.type}-${tx.data.id}-${index}`}
        className="p-4 hover:bg-gray-50 print:hover:bg-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                !isOrder
                  ? 'bg-emerald-100 text-emerald-600'
                  : isCreditOrder
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-blue-100 text-blue-600'
              }`}
            >
              {!isOrder ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900">
                  {!isOrder ? '还款' : '消费'}
                </p>
                {isOrder && showCashLabel && (
                  order!.type === 'cash' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                      <Wallet className="w-3 h-3" />
                      现金
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      <CreditCard className="w-3 h-3" />
                      挂账
                    </span>
                  )
                )}
                {isOrder && !showCashLabel && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    <CreditCard className="w-3 h-3" />
                    挂账
                  </span>
                )}
              </div>
              {isOrder && (
                <>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order!.items
                      .map((item) => {
                        const originalPrice = item.originalPrice ?? item.unitPrice;
                        const hasDiscount = item.unitPrice !== originalPrice;
                        return `${item.serviceName}×${item.quantity}${hasDiscount ? ` (¥${item.unitPrice}/张)` : ''}`;
                      })
                      .join('，')}
                  </p>
                  {(order!.discount ?? 100) < 100 && (
                    <p className="text-xs text-orange-500 mt-0.5">
                      整单{order!.discount}折
                    </p>
                  )}
                  {order!.remark && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      备注：{order!.remark}
                    </p>
                  )}
                </>
              )}
              {!isOrder && payment?.remark && (
                <p className="text-xs text-gray-500 mt-0.5">
                  备注：{payment.remark}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {format(
                  new Date(tx.data.createdAt),
                  'yyyy-MM-dd HH:mm',
                  { locale: zhCN }
                )}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p
              className={`font-semibold ${
                !isOrder
                  ? 'text-emerald-600'
                  : isCreditOrder
                    ? 'text-amber-600'
                    : 'text-blue-600'
              }`}
            >
              {!isOrder ? '-' : '+'}¥
              {isOrder
                ? order!.totalAmount.toFixed(2)
                : payment!.amount.toFixed(2)}
            </p>
            {isCreditOrder && (
              <p className="text-xs text-red-500 mt-0.5">计入欠款</p>
            )}
            {isOrder && !isCreditOrder && showCashLabel && (
              <p className="text-xs text-gray-400 mt-0.5">已收现</p>
            )}
            {!isOrder && (
              <p className="text-xs text-emerald-500 mt-0.5">抵扣欠款</p>
            )}
          </div>
        </div>
        {index === totalCount - 1 && !showCashLabel && (
          <div className="print-only mt-4 pt-4 border-t-2 border-gray-900">
            <div className="flex justify-between text-lg font-bold">
              <span>当前欠款余额</span>
              <span className="text-red-600">¥{customer.debt.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const formatMonthLabel = (month: string) => {
    if (month === 'all') return '全部月份';
    const [year, m] = month.split('-');
    return `${year}年${parseInt(m)}月`;
  };

  const monthLabelForPrint = selectedMonth === 'all'
    ? '全部'
    : formatMonthLabel(selectedMonth);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-gray-500">
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{customer.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  建档于 {format(new Date(customer.createdAt), 'yyyy年MM月dd日', { locale: zhCN })}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Printer className="w-5 h-5" />
            <span>打印对账单</span>
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>登记还款</span>
          </button>
        </div>
      </div>

      <div className="no-print">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">累计消费</p>
            <p className="text-2xl font-bold text-gray-900 mt-1.5">
              ¥{totalOrders.toFixed(2)}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <p className="text-xs text-emerald-700">现金结算</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1.5">
              ¥{totalCash.toFixed(2)}
            </p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
            <p className="text-xs text-amber-700">累计挂账</p>
            <p className="text-2xl font-bold text-amber-700 mt-1.5">
              ¥{totalCreditAll.toFixed(2)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
            <p className="text-xs text-blue-700">累计还款</p>
            <p className="text-2xl font-bold text-blue-700 mt-1.5">
              ¥{totalPaidAll.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-5 md:col-span-1 col-span-2">
            <p className="text-xs text-red-700">当前欠款</p>
            <p className="text-2xl font-bold text-red-700 mt-1.5">
              ¥{customer.debt.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="no-print">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              全部交易记录（含现金）
              <span className="ml-auto text-sm font-normal text-gray-500">
                共 {allTransactions.length} 笔
              </span>
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {allTransactions.length > 0 ? (
              allTransactions.map((tx, idx) =>
                renderTransactionRow(tx, idx, allTransactions.length, true)
              )
            ) : (
              <div className="p-12 text-center text-gray-500">
                暂无交易记录
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-amber-200 overflow-hidden" id="credit-statement">
        <div className="print-only mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">客户挂账对账单</h1>
            <div className="mt-3 space-y-1 text-base">
              <p>客户名称：<span className="font-semibold">{customer.name}</span></p>
              <p>联系电话：{customer.phone || '-'}</p>
              <p>对账月份：{monthLabelForPrint}</p>
              <p>打印日期：{format(new Date(), 'yyyy年MM月dd日', { locale: zhCN })}</p>
            </div>
          </div>
        </div>

        <div className="p-5 border-b border-amber-200 bg-amber-50/70 no-print">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-base font-semibold text-amber-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                挂账对账单（欠款明细）
                <span className="text-sm font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  打印用此表
                </span>
              </h3>
              <p className="text-xs text-amber-700 mt-1">
                仅包含挂账消费和还款记录，用于核对欠款金额
              </p>
            </div>
            {availableMonths.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  className="px-4 py-2 bg-white border border-amber-300 rounded-lg flex items-center gap-2 hover:border-amber-400 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">
                    {formatMonthLabel(selectedMonth)}
                  </span>
                  <ChevronDown className="w-4 h-4 text-amber-600" />
                </button>
                {showMonthDropdown && (
                  <div className="absolute right-0 z-10 w-44 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <button
                      onClick={() => {
                        setSelectedMonth('all');
                        setShowMonthDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                        selectedMonth === 'all'
                          ? 'bg-amber-50 text-amber-700 font-medium'
                          : ''
                      }`}
                    >
                      全部月份
                    </button>
                    {availableMonths.map((month) => (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(month);
                          setShowMonthDropdown(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                          selectedMonth === month
                            ? 'bg-amber-50 text-amber-700 font-medium'
                            : ''
                        }`}
                      >
                        {formatMonthLabel(month)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {creditTransactions.length > 0 ? (
            creditTransactions.map((tx, idx) =>
              renderTransactionRow(tx, idx, creditTransactions.length, false)
            )
          ) : (
            <div className="p-12 text-center text-gray-500">
              暂无挂账记录
            </div>
          )}
        </div>
        <div className="p-5 border-t-2 border-amber-300 bg-amber-50/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedMonth === 'all' ? '挂账消费合计' : `${monthLabelForPrint}挂账消费`}
            </span>
            <span className="font-semibold text-amber-700">+¥{totalCredit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedMonth === 'all' ? '已还合计' : `${monthLabelForPrint}已还`}
            </span>
            <span className="font-semibold text-emerald-700">-¥{totalPaid.toFixed(2)}</span>
          </div>
          {selectedMonth !== 'all' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{monthLabelForPrint}欠款变动</span>
              <span className={`font-semibold ${
                totalCredit - totalPaid >= 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {totalCredit - totalPaid >= 0 ? '+' : ''}¥{(totalCredit - totalPaid).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t-2 border-amber-300 mt-2">
            <span className="text-lg font-bold text-gray-800">欠款余额</span>
            <span className="text-2xl font-bold text-red-600">¥{customer.debt.toFixed(2)}</span>
          </div>
        </div>
        <div className="print-only p-6 border-t border-gray-300 space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-8 text-base">
            <div>
              <span className="font-medium">客户签字：</span>
              <span className="inline-block w-32 border-b border-dashed border-black/40">&nbsp;</span>
            </div>
            <div>
              <span className="font-medium">日期：</span>
              <span className="inline-block w-32 border-b border-dashed border-black/40">&nbsp;</span>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center no-print">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPaymentModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">登记还款</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800">当前欠款</span>
                  <span className="text-xl font-bold text-emerald-700">
                    ¥{customer.debt.toFixed(2)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  还款金额
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    ¥
                  </span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                {customer.debt > 0 && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setPaymentAmount(customer.debt.toString())}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                    >
                      全额还款
                    </button>
                    <button
                      onClick={() => setPaymentAmount((customer.debt / 2).toFixed(2))}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                    >
                      还一半
                    </button>
                    <button
                      onClick={() => setPaymentAmount('100')}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                    >
                      ¥100
                    </button>
                    <button
                      onClick={() => setPaymentAmount('500')}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                    >
                      ¥500
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注
                </label>
                <input
                  type="text"
                  value={paymentRemark}
                  onChange={(e) => setPaymentRemark(e.target.value)}
                  placeholder="可选：还款方式等备注信息"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handlePayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
              >
                确认还款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
