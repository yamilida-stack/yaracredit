import { useStore } from '../store';
import { Card, StatCard, formatCurrency, Badge } from '../components/ui';
import { TrendingUp, Users, AlertTriangle, DollarSign, Clock, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const { loans, clients, cashMovements, currentUser } = useStore();

  const activeLoans = loans.filter(l => l.status === 'activo');
  const overdueLoans = loans.filter(l => l.status === 'mora');
  const cancelledLoans = loans.filter(l => l.status === 'cancelado');
  const totalPortfolio = activeLoans.reduce((sum, l) => {
    const paid = l.payments.reduce((s, p) => s + p.amount, 0);
    return sum + (l.totalAmount - paid);
  }, 0);
  const totalCollected = loans.flatMap(l => l.payments).reduce((sum, p) => sum + p.amount, 0);
  const totalIncome = cashMovements.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0);
  const totalExpenses = cashMovements.filter(m => m.type === 'egreso').reduce((s, m) => s + m.amount, 0);

  // Chart data
  const monthlyData = [
    { month: 'Ago', cobros: 45000, nuevos: 30000 },
    { month: 'Sep', cobros: 62000, nuevos: 50000 },
    { month: 'Oct', cobros: 78000, nuevos: 26000 },
    { month: 'Nov', cobros: 85000, nuevos: 15000 },
    { month: 'Dic', cobros: 92000, nuevos: 5000 },
  ];

  const portfolioStatus = [
    { name: 'Activos', value: activeLoans.length, color: '#7C3AED' },
    { name: 'En Mora', value: overdueLoans.length, color: '#EF4444' },
    { name: 'Cancelados', value: cancelledLoans.length, color: '#10B981' },
  ];

  const overdueRate = loans.length > 0 ? ((overdueLoans.length / loans.length) * 100).toFixed(1) : '0';

  // Recent activity
  const recentPayments = loans
    .flatMap(l => l.payments.map(p => ({ ...p, clientName: clients.find(c => c.id === p.clientId)?.fullName || '' })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Cartera Total" value={formatCurrency(totalPortfolio)} icon={<DollarSign size={24} />} color="purple" />
        <StatCard title="Préstamos Activos" value={String(activeLoans.length)} icon={<TrendingUp size={24} />} color="green" />
        <StatCard title="Clientes" value={String(clients.length)} icon={<Users size={24} />} color="blue" />
        <StatCard title="En Mora" value={String(overdueLoans.length)} icon={<AlertTriangle size={24} />} color="red" />
        <StatCard title="Tasa Morosidad" value={`${overdueRate}%`} icon={<Clock size={24} />} color="yellow" />
        <StatCard title="Balance Caja" value={formatCurrency(totalIncome - totalExpenses)} icon={<PiggyBank size={24} />} color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Cobros vs Nuevos Préstamos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="cobros" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Cobros" />
                <Bar dataKey="nuevos" fill="#A78BFA" radius={[4, 4, 0, 0]} name="Nuevos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Estado de Cartera</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={portfolioStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {portfolioStatus.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {portfolioStatus.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-gray-600">{s.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Últimos Cobros</h3>
          <div className="space-y-3">
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.clientName}</p>
                  <p className="text-xs text-gray-400">{p.date} • {p.method}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{formatCurrency(p.amount)}</p>
                  <Badge variant={p.isLate ? 'warning' : 'success'}>{p.isLate ? 'Vencido' : 'Al día'}</Badge>
                </div>
              </div>
            ))}
            {recentPayments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No hay cobros registrados</p>
            )}
          </div>
        </Card>

        {/* Overdue Loans */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            <span className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              Préstamos en Mora
            </span>
          </h3>
          <div className="space-y-3">
            {overdueLoans.map(l => {
              const client = clients.find(c => c.id === l.clientId);
              const paid = l.payments.reduce((s, p) => s + p.amount, 0);
              const remaining = l.totalAmount - paid;
              return (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{client?.fullName}</p>
                    <p className="text-xs text-gray-400">{l.type} • {l.payments.length} pagos realizados</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{formatCurrency(remaining)}</p>
                    <Badge variant="danger">Mora</Badge>
                  </div>
                </div>
              );
            })}
            {overdueLoans.length === 0 && (
              <p className="text-sm text-green-600 text-center py-4">✓ No hay préstamos en mora</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick alerts for collectors */}
      {currentUser?.role === 'cobrador' && (
        <Card className="p-6 border-purple-200 bg-purple-50/50">
          <h3 className="text-lg font-bold text-purple-900 mb-2">📋 Tu Ruta de Hoy</h3>
          <p className="text-sm text-purple-700">
            Tienes {activeLoans.filter(l => l.assignedCollector === currentUser.id).length} clientes activos en tu ruta.
            Monto pendiente: {formatCurrency(
              activeLoans
                .filter(l => l.assignedCollector === currentUser.id)
                .reduce((sum, l) => sum + (l.totalAmount - l.payments.reduce((s, p) => s + p.amount, 0)), 0)
            )}
          </p>
        </Card>
      )}
    </div>
  );
}
