import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Settings,
  FileText,
  AlertTriangle,
  Printer,
  BarChart3,
  ArrowDownLeft,
} from 'lucide-react';

const navItems = [
  { path: '/', label: '首页', icon: LayoutDashboard },
  { path: '/billing', label: '记账', icon: Receipt },
  { path: '/customers', label: '客户管理', icon: Users },
  { path: '/payments', label: '收款流水', icon: ArrowDownLeft },
  { path: '/statistics', label: '经营统计', icon: BarChart3 },
  { path: '/services', label: '服务价格', icon: Settings },
  { path: '/templates', label: '常用模板', icon: FileText },
  { path: '/supplies', label: '耗材提醒', icon: AlertTriangle },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="no-print w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <Printer className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold">图文店管理</h1>
              <p className="text-xs text-blue-300">账目管理系统</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                isActive
                  ? 'bg-blue-800 text-white shadow-md'
                  : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
              }`
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
        </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800 text-xs text-blue-400">
          数据自动保存在本地浏览器中
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
