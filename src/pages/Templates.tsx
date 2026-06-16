import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Trash2,
  Play,
  User,
  Plus,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import ConfirmModal from '@/components/ConfirmModal';
import type { Template } from '@/types';

export default function Templates() {
  const navigate = useNavigate();
  const { templates, services, deleteTemplate } = useStore();

  const [deleteConfirm, setDeleteConfirm] = useState<Template | null>(null);

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteTemplate(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const handleUseTemplate = (template: Template) => {
    navigate('/billing', { state: { templateId: template.id } });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">常用模板</h1>
          <p className="text-gray-500 mt-1">管理常用的服务配置模板，快速调用</p>
        </div>
        <button
          onClick={() => navigate('/billing')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>去记账页面创建</span>
        </button>
      </div>

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <User className="w-4 h-4" />
                      <span>{template.customerName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="使用模板"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(template)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {template.items.map((item) => {
                  const service = services.find((s) => s.id === item.serviceId);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{service?.icon}</span>
                        <span className="text-sm text-gray-700">
                          {item.serviceName}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{item.quantity}</span>
                        <span className="text-gray-500"> {service?.unit}</span>
                        <span className="text-gray-500 mx-1">×</span>
                        <span className="text-blue-600 font-medium">
                          ¥{item.unitPrice}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  共 {template.items.length} 项服务
                </span>
                <span className="text-lg font-bold text-blue-600">
                  ¥
                  {template.items
                    .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无模板</h3>
          <p className="text-gray-500 mb-6">
            在记账页面配置好服务项目后，可以保存为常用模板
          </p>
          <button
            onClick={() => navigate('/billing')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            去创建模板
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="删除模板"
        message={`确定要删除模板「${deleteConfirm?.name}」吗？此操作不可撤销。`}
        confirmText="删除"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
