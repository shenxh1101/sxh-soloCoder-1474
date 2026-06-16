import { useState } from 'react';
import { Save, Edit2, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function Services() {
  const { services, updateService } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');

  const handleEdit = (id: string, currentPrice: number) => {
    setEditingId(id);
    setEditingPrice(currentPrice.toString());
  };

  const handleSave = (id: string) => {
    const price = parseFloat(editingPrice);
    if (isNaN(price) || price < 0) {
      alert('请输入有效的价格');
      return;
    }
    updateService(id, price);
    setEditingId(null);
    setEditingPrice('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSave(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingPrice('');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">服务价格</h1>
        <p className="text-gray-500 mt-1">设置各项服务的单价</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-600">
            <div className="col-span-1">图标</div>
            <div className="col-span-3">服务名称</div>
            <div className="col-span-3">单位</div>
            <div className="col-span-3">单价</div>
            <div className="col-span-2 text-right">操作</div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {services.map((service) => (
            <div
              key={service.id}
              className="p-6 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors"
            >
              <div className="col-span-1">
                <span className="text-3xl">{service.icon}</span>
              </div>
              <div className="col-span-3">
                <span className="font-medium text-gray-900">{service.name}</span>
              </div>
              <div className="col-span-3 text-gray-600">
                每{service.unit}
              </div>
              <div className="col-span-3">
                {editingId === service.id ? (
                  <input
                    type="number"
                    value={editingPrice}
                    onChange={(e) => setEditingPrice(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, service.id)}
                    step="0.01"
                    min="0"
                    autoFocus
                    className="w-32 px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <span className="text-lg font-semibold text-blue-600">
                    ¥{service.price.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                {editingId === service.id ? (
                  <>
                    <button
                      onClick={() => handleSave(service.id)}
                      className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                      title="保存"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingPrice('');
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="取消"
                    >
                      <Save className="w-5 h-5 rotate-180" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEdit(service.id, service.price)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 温馨提示</h3>
        <p className="text-blue-700 text-sm">
          修改价格后，新订单将使用新价格计算。历史订单的价格不会受到影响。
        </p>
      </div>
    </div>
  );
}
