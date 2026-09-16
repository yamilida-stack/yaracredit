import { useState } from 'react';
import { useStore } from '../store';
import {
  LayoutDashboard, Users, DollarSign, Package, Receipt, FileText,
  Wallet, UserCog, BarChart3, Route, LogOut, Menu, X, Bell, Wifi, WifiOff
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'gerente', 'cobrador', 'solo_lectura'] },
  { id: 'clients', label: 'Clientes', icon: Users, roles: ['admin', 'gerente', 'cobrador', 'solo_lectura'] },
  { id: 'loans', label: 'Préstamos', icon: DollarSign, roles: ['admin', 'gerente', 'cobrador', 'solo_lectura'] },
  { id: 'collections', label: 'Cobros', icon: Receipt, roles: ['admin', 'gerente', 'cobrador'] },
  { id: 'routes', label: 'Rutas', icon: Route, roles: ['admin', 'gerente'] },
  { id: 'stock', label: 'Stock', icon: Package, roles: ['admin', 'gerente', 'solo_lectura'] },
  { id: 'cash', label: 'Caja', icon: Wallet, roles: ['admin', 'gerente'] },
  { id: 'contracts', label: 'Contratos', icon: FileText, roles: ['admin', 'gerente'] },
  { id: 'payroll', label: 'Planilla', icon: UserCog, roles: ['admin', 'gerente'] },
  { id: 'reports', label: 'Reportes', icon: BarChart3, roles: ['admin', 'gerente', 'solo_lectura'] },
  { id: 'users', label: 'Usuarios', icon: Users, roles: ['admin'] },
];

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { currentUser, logout, notifications } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline] = useState(navigator.onLine);

  const filteredNav = navItems.filter(item =>
    currentUser && item.roles.includes(currentUser.role)
  );

  const roleLabels = {
    admin: 'Administrador',
    gerente: 'Gerente',
    cobrador: 'Cobrador',
    solo_lectura: 'Solo Lectura',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">Y</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">YaraCredit</h1>
              <p className="text-xs text-gray-400">Gestión de Préstamos</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNav.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-purple-600' : ''} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-purple-600 rounded-full" />}
              </button>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-700 font-bold text-sm">
                {currentUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-400">{currentUser ? roleLabels[currentUser.role] : ''}</p>
            </div>
            <button onClick={logout} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {navItems.find(i => i.id === currentPage)?.label || 'Dashboard'}
                </h2>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Connection status */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isOnline ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span className="hidden sm:inline">{isOnline ? 'En línea' : 'Sin conexión'}</span>
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell size={20} className="text-gray-500" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
