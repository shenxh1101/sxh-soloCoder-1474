import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  variant: 'default' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'bg-white border-gray-200 text-gray-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  danger: 'bg-red-50 border-red-200 text-red-700',
};

const iconBgStyles = {
  default: 'bg-gray-100 text-gray-600',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-600',
};

export default function StatCard({ title, value, icon, variant }: StatCardProps) {
  return (
    <div className={`p-6 rounded-xl border-2 ${variantStyles[variant]} transition-all hover:shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-2">¥{value.toFixed(2)}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconBgStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
