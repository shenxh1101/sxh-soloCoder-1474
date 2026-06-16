import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Phone,
  User,
  X,
  Printer,
  ListOrdered,
  Users,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import ConfirmModal from '@/components/ConfirmModal';
import type { Customer } from '@/types';

type Tab = 'list' | 'collection';

export default function Customers() {
  const navigate = useNavigate();
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useStore();

  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const creditCustomers = customers
    .filter((c) => c.id !== 'walk-in' && c.debt > 0)
    .sort((a, b) => b.debt - a.debt);

  const totalDebt = creditCustomers.reduce((sum, c) => sum + c.debt, 0);

  const handleAdd = () => {
    if (!formData.name.trim()) {
      alert('请输入客户名称');
      return;
    }
    addCustomer(formData);
    setFormData({ name: '', phone: '' });
    setShowAddModal(false);
  };

  const handleEdit = () => {
    if (!editingCustomer || !formData.name.trim()) {
      alert('请输入客户名称');
      return;
    }
    updateCustomer(editingCustomer.id, formData);
    setFormData({ name: '', phone: '' });
    setShowEditModal(false);
    setEditingCustomer(null);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteCustomer(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ name: customer.name, phone: customer.phone });
    setShowEditModal(true);
  };

  const handlePrintCollection = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
          <p className="text-gray-500 mt-1">管理客户信息和月底收账</p>
        </div>
        {activeTab === 'list' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>新增客户</span>
          </button>
        )}
        {activeTab === 'collection' && creditCustomers.length > 0 && (
          <button
            onClick={handlePrintCollection}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Printer className="w-5 h-5" />
            <span>打印收账清单</span>
          </button>
        )}
      </div>

      <div className="print-only hidden">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">月底收账清单</h1>
          <p className="text-gray-600 mt-2">
            打印日期：{format(new Date(), 'yyyy年MM月dd日', { locale: zhCN })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">总客户数</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {customers.length - 1}
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
          <p className="text-sm text-amber-700">挂账客户数</p>
          <p className="text-3xl font-bold text-amber-700 mt-2">
            {creditCustomers.length}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <p className="text-sm text-red-700">应收总额</p>
          <p className="text-3xl font-bold text-red-700 mt-2">
            ¥{totalDebt.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="no-print">
        <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>客户列表</span>
          </button>
          <button
            onClick={() => setActiveTab('collection')}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all ${
              activeTab === 'collection'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>月底收账</span>
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden no-print">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索客户名称或电话..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">客户信息</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">联系电话</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">当前欠款</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          customer.debt > 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {customer.debt > 0
                          ? `¥${customer.debt.toFixed(2)}`
                          : '¥0.00'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {customer.id !== 'walk-in' && (
                          <>
                            <button
                              onClick={() => openEditModal(customer)}
                              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="编辑"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(customer)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              暂无客户数据
            </div>
          )}
        </div>
      )}

      {activeTab === 'collection' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="no-print p-4 border-b border-gray-200 bg-amber-50/50">
            <div className="flex items-center gap-2 text-amber-800">
              <ListOrdered className="w-5 h-5" />
              <span className="font-medium">
                共 {creditCustomers.length} 位客户有欠款，按金额从高到低排列
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 print:bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-16">序号</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">客户名称</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">联系电话</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">欠款金额</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-24 print:hidden">详情</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-28">签字</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {creditCustomers.length > 0 ? (
                  creditCustomers.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="px-6 py-4 text-sm font-medium text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {customer.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-red-600">
                          ¥{customer.debt.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center print:hidden">
                        <button
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          对账单
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-400 border-dashed border print:border-black/30">
                        __________________
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      🎉 太好了！当前没有客户欠款
                    </td>
                  </tr>
                )}
              </tbody>
              {creditCustomers.length > 0 && (
                <tfoot className="bg-gray-50 print:bg-gray-100 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-lg font-bold text-gray-700">
                      合计应收金额
                    </td>
                    <td className="px-6 py-4 text-right text-2xl font-bold text-red-600">
                      ¥{totalDebt.toFixed(2)}
                    </td>
                    <td colSpan={2} className="print:hidden"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {creditCustomers.length > 0 && (
            <div className="p-6 border-t border-gray-200 space-y-4 print:border-black/30">
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">制单人：</span>
                  <span className="inline-block w-24 border-b border-dashed border-gray-400 print:border-black/40">&nbsp;</span>
                </div>
                <div>
                  <span className="font-medium">审核人：</span>
                  <span className="inline-block w-24 border-b border-dashed border-gray-400 print:border-black/40">&nbsp;</span>
                </div>
                <div>
                  <span className="font-medium">日期：</span>
                  <span>{format(new Date(), 'yyyy年MM月dd日', { locale: zhCN })}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center no-print">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setEditingCustomer(null);
              setFormData({ name: '', phone: '' });
            }}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showAddModal ? '新增客户' : '编辑客户'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setEditingCustomer(null);
                  setFormData({ name: '', phone: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  客户名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入客户名称"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  联系电话
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入联系电话（可选）"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setEditingCustomer(null);
                  setFormData({ name: '', phone: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={showAddModal ? handleAdd : handleEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                {showAddModal ? '新增' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="删除客户"
        message={`确定要删除客户「${deleteConfirm?.name}」吗？此操作不可撤销。`}
        confirmText="删除"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
