import { useState } from 'react';
import {
  Droplets,
  Package,
  Edit2,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import type { Supplies } from '@/types';

export default function SuppliesPage() {
  const { supplies, updateSupplies } = useStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState('');
  const [editThreshold, setEditThreshold] = useState('');

  const handleEdit = (item: Supplies) => {
    setEditingId(item.id);
    setEditStock(item.currentStock.toString());
    setEditThreshold(item.threshold.toString());
  };

  const handleSave = (id: string) => {
    const stock = parseInt(editStock);
    const threshold = parseInt(editThreshold);

    if (isNaN(stock) || stock < 0) {
      alert('请输入有效的库存数量');
      return;
    }
    if (isNaN(threshold) || threshold < 0) {
      alert('请输入有效的提醒阈值');
      return;
    }

    updateSupplies(id, stock, threshold);
    setEditingId(null);
    setEditStock('');
    setEditThreshold('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditStock('');
    setEditThreshold('');
  };

  const getIcon = (id: string) => {
    return id === 'toner' ? Droplets : Package;
  };

  const getPercentage = (current: number, threshold: number) => {
    const max = threshold * 5;
    return Math.min(100, Math.max(0, (current / max) * 100));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">耗材提醒</h1>
        <p className="text-gray-500 mt-1">手动登记墨粉和纸张库存，设置提醒阈值</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">使用说明</h3>
            <p className="text-amber-700 text-sm mt-1">
              当库存低于设定的阈值时，系统会在首页显示红色提醒。请在更换墨粉或补充纸张后及时更新库存数量。
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {supplies.map((item) => {
          const Icon = getIcon(item.id);
          const isLow = item.currentStock <= item.threshold;
          const percentage = getPercentage(item.currentStock, item.threshold);
          const isEditing = editingId === item.id;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border-2 p-6 transition-all ${
                isLow ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      isLow ? 'bg-red-100' : 'bg-blue-100'
                    }`}
                  >
                    <Icon
                      className={`w-7 h-7 ${
                        isLow ? 'text-red-600' : 'text-blue-600'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      最后更新：
                      {format(
                        new Date(item.updatedAt),
                        'yyyy-MM-dd HH:mm',
                        { locale: zhCN }
                      )}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        当前库存
                      </label>
                      <input
                        type="number"
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        提醒阈值
                      </label>
                      <input
                        type="number"
                        value={editThreshold}
                        onChange={(e) => setEditThreshold(e.target.value)}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span>取消</span>
                    </button>
                    <button
                      onClick={() => handleSave(item.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>保存</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">库存状态</span>
                      {isLow ? (
                        <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          库存不足
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          库存充足
                        </span>
                      )}
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLow ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-500">当前库存</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {item.currentStock}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">提醒阈值</p>
                      <p className="text-2xl font-bold text-amber-600 mt-1">
                        ≤ {item.threshold}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 小建议</h3>
        <ul className="space-y-2 text-gray-600 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>墨粉库存可以按百分比估算，如剩余20%时填写20</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>纸张库存按张数统计，一包A4纸通常是500张</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>建议在阈值还剩2-3天用量时设置提醒，留出采购时间</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
