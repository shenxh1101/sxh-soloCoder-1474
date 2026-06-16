import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Minus,
  Save,
  FileText,
  User,
  Wallet,
  CreditCard,
  ChevronDown,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { OrderItem } from '@/types';

interface OrderItemForm {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
}

export default function Billing() {
  const navigate = useNavigate();
  const { customers, services, templates, addOrder, addTemplate } = useStore();

  const [customerId, setCustomerId] = useState('walk-in');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<OrderItemForm[]>([]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [saveTemplateModal, setSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerTemplates = templates.filter((t) => t.customerId === customerId || t.customerId === 'walk-in');

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const addServiceItem = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    const existingItem = items.find((i) => i.serviceId === serviceId);
    if (existingItem) {
      setItems(
        items.map((i) =>
          i.serviceId === serviceId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          serviceId: service.id,
          serviceName: service.name,
          quantity: 1,
          unitPrice: service.price,
        },
      ]);
    }
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setItems(
      items
        .map((i) =>
          i.serviceId === serviceId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setCustomerId(template.customerId);
    setItems(
      template.items.map((item) => ({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    );
    setShowTemplateDropdown(false);
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      alert('请至少选择一项服务');
      return;
    }

    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    const orderItems: Omit<OrderItem, 'id' | 'orderId'>[] = items.map((item) => ({
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
    }));

    addOrder({
      customerId,
      customerName: customer.name,
      type: paymentType,
      totalAmount,
      remark,
      items: orderItems,
    });

    alert('记账成功！');
    navigate('/');
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('请输入模板名称');
      return;
    }
    if (items.length === 0) {
      alert('请至少选择一项服务');
      return;
    }

    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    addTemplate({
      name: templateName,
      customerId,
      customerName: customer.name,
      items: items.map((item) => ({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    setTemplateName('');
    setSaveTemplateModal(false);
    alert('模板保存成功！');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">记账管理</h1>
        <p className="text-gray-500 mt-1">录入新订单，选择服务项目和结算方式</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">客户信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择客户
                </label>
                <button
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-between hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <span>{selectedCustomer?.name || '请选择客户'}</span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>
                {showCustomerDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          setCustomerId(customer.id);
                          setShowCustomerDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          {customer.phone && (
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                          )}
                        </div>
                        {customer.id !== 'walk-in' && customer.debt > 0 && (
                          <span className="text-red-600 text-sm">
                            欠 ¥{customer.debt.toFixed(2)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  结算方式
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentType('cash')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      paymentType === 'cash'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Wallet className="w-5 h-5" />
                    <span className="font-medium">现金</span>
                  </button>
                  <button
                    onClick={() => setPaymentType('credit')}
                    disabled={customerId === 'walk-in'}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      paymentType === 'credit'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${customerId === 'walk-in' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">挂账</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">选择服务</h3>
              <div className="relative">
                <button
                  onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>使用模板</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showTemplateDropdown && customerTemplates.length > 0 && (
                  <div className="absolute right-0 z-10 w-64 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {customerTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template.id)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50"
                      >
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-500">
                          {template.customerName} · {template.items.length}项服务
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {showTemplateDropdown && customerTemplates.length === 0 && (
                  <div className="absolute right-0 z-10 w-64 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    暂无可用模板
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => addServiceItem(service.id)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-2"
                >
                  <span className="text-3xl">{service.icon}</span>
                  <span className="font-medium">{service.name}</span>
                  <span className="text-sm text-gray-500">¥{service.price}/{service.unit}</span>
                </button>
              ))}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">已选服务</h4>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.serviceId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {services.find((s) => s.id === item.serviceId)?.icon}
                        </span>
                        <div>
                          <p className="font-medium">{item.serviceName}</p>
                          <p className="text-sm text-gray-500">
                            ¥{item.unitPrice}/{services.find((s) => s.id === item.serviceId)?.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.serviceId, -1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.serviceId, 1)}
                            className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="w-20 text-right font-semibold">
                          ¥{(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">备注</h3>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="可选：填写订单备注信息..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">订单汇总</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>服务项目</span>
                <span>{items.length} 项</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>客户</span>
                <span>{selectedCustomer?.name}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>结算方式</span>
                <span>{paymentType === 'cash' ? '现金' : '挂账'}</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">应收金额</span>
                  <span className="text-3xl font-bold text-blue-600">
                    ¥{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={items.length === 0}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>保存订单</span>
              </button>
              <button
                onClick={() => setSaveTemplateModal(true)}
                disabled={items.length === 0}
                className="w-full py-3 border-2 border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>保存为模板</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {saveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSaveTemplateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">保存为模板</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="请输入模板名称"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSaveTemplateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
