import { useState } from 'react';
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

  const customer = customers.find((c) => c.id === id);
  const customerOrders = orders.filter((o) => o.customerId === id);
  const customerPayments = payments.filter((p) => p.customerId === id);

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

  const transactions: Transaction[] = [
    ...customerOrders.map((o) => ({ type: 'order' as const, data: o })),
    ...customerPayments.map((p) => ({ type: 'payment' as const, data: p })),
  ].sort((a, b) =>
    new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
  );

  const totalCredit = customerOrders
    .filter((o) => o.type === 'credit')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);

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

      <div className="print-only hidden">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">客户对账单</h1>
          <p className="text-gray-600 mt-2">
            客户名称：{customer.name} | 联系电话：{customer.phone || '-'}
          </p>
          <p className="text-gray-600">
            打印日期：{format(new Date(), 'yyyy年MM月dd日', { locale: zhCN })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">累计挂账</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">
            ¥{totalCredit.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">累计还款</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">
            ¥{totalPaid.toFixed(2)}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <p className="text-sm text-red-700">当前欠款</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            ¥{customer.debt.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">交易明细</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {transactions.length > 0 ? (
            transactions.map((tx, index) => (
            <div
              key={`${tx.type}-${tx.data.id}`}
              className="p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'order'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {tx.type === 'order' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx.type === 'order' ? (
                        <>
                          挂账消费
                          {tx.data.remark && (
                            <span className="text-gray-500 font-normal ml-2">
                              - {tx.data.remark}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          还款
                          {tx.data.remark && (
                            <span className="text-gray-500 font-normal ml-2">
                              - {tx.data.remark}
                            </span>
                          )}
                        </>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(
                        new Date(tx.data.createdAt),
                        'yyyy-MM-dd HH:mm',
                        { locale: zhCN }
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      tx.type === 'order' ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {tx.type === 'order' ? '+' : '-'}¥
                    {tx.type === 'order'
                      ? tx.data.totalAmount.toFixed(2)
                      : tx.data.amount.toFixed(2)}
                  </p>
                  {tx.type === 'order' && tx.data.items.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {tx.data.items
                        .map(
                          (item) =>
                            `${item.serviceName}×${item.quantity}`
                        )
                        .join('，')}
                    </p>
                  )}
                </div>
              </div>
              {index === 0 && transactions.length > 0 && (
                <div className="print-only mt-4 pt-4 border-t-2 border-gray-900">
                  <div className="flex justify-between text-lg font-bold">
                    <span>当前欠款余额</span>
                    <span className="text-red-600">¥{customer.debt.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-500">
            暂无交易记录
          </div>
        )}
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
