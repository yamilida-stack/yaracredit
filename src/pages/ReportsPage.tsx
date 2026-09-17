import { useState } from 'react';
import { useStore } from '../store';
import { Card, Badge, Button, formatCurrency, formatDate, Select } from '../components/ui';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Clock, PieChart as PieIcon, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { exportClientsPDF, exportLoansPDF, generatePDF } from '../utils/pdfGenerator';

export default function ReportsPage() {
  const { loans, clients, cashMovements, users } = useStore();
  const [period, setPeriod] = useState('month');

  const activeLoans = loans.filter(l => l.status === 'activo');
  const overdueLoans = loans.filter(l => l.status === 'mora');
  const cancelledLoans = loans.filter(l => l.status === 'cancelado');
  const allPayments = loans.flatMap(l => l.payments);

  // Portfolio summary
  const totalPortfolio = activeLoans.reduce((sum, l) => sum + (l.totalAmount - l.payments.reduce((s, p) => s + p.amount, 0)), 0);
  const totalCollected = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalDisbursed = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalInterest = loans.reduce((sum, l) => sum + l.totalInterest, 0);
  const totalIncome = cashMovements.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0);
  const totalExpenses = cashMovements.filter(m => m.type === 'egreso').reduce((s, m) => s + m.amount, 0);

  // Overdue analysis
  const overdueAmount = overdueLoans.reduce((sum, l) => sum + (l.totalAmount - l.payments.reduce((s, p) => s + p.amount, 0)), 0);
  const overdueRate = loans.length > 0 ? ((overdueLoans.length / loans.length) * 100).toFixed(1) : '0';

  // Collector performance
  const collectorPerformance = users.filter(u => u.role === 'cobrador').map(c => {
    const collectorLoans = loans.filter(l => l.assignedCollector === c.id);
    const collectorPayments = collectorLoans.flatMap(l => l.payments.filter(p => p.collectorId === c.id));
    const collected = collectorPayments.reduce((s, p) => s + p.amount, 0);
    return { name: c.name, loans: collectorLoans.length, collected, payments: collectorPayments.length, commission: collected * 0.05 };
  });

  // Charts data
  const monthlyCollections = [
    { month: 'Ago', amount: 45000 }, { month: 'Sep', amount: 62000 }, { month: 'Oct', amount: 78000 },
    { month: 'Nov', amount: 85000 }, { month: 'Dic', amount: 92000 },
  ];

  const expenseBreakdown = cashMovements.filter(m => m.type === 'egreso' && m.category).reduce((acc, m) => {
    const cat = m.category || 'otros';
    acc[cat] = (acc[cat] || 0) + m.amount;
    return acc;
  }, {} as Record<string, number>);

  const expenseData = Object.entries(expenseBreakdown).map(([name, value]) => ({ name, value }));
  const COLORS = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6B7280'];

  const cashFlowData = [
    { month: 'Ago', ingresos: 50000, egresos: 15000 },
    { month: 'Sep', ingresos: 68000, egresos: 22000 },
    { month: 'Oct', ingresos: 82000, egresos: 18000 },
    { month: 'Nov', ingresos: 90000, egresos: 25000 },
    { month: 'Dic', ingresos: 95000, egresos: 20000 },
  ];

  // Funciones de exportación PDF
  const handleExportClients = () => {
    exportClientsPDF(clients);
  };

  const handleExportLoans = () => {
    exportLoansPDF(loans, clients);
  };

  const handleExportPayments = () => {
    const headers = ['Fecha', 'Cliente', 'Monto', 'Método', 'Recibo'];
    const data = allPayments.map(payment => {
      const loan = loans.find(l => l.id === payment.loanId);
      const client = clients.find(c => c.id === loan?.clientId);
      return [
        formatDate(payment.date),
        client?.fullName || 'N/A',
        `C$ ${payment.amount.toLocaleString('es-NI')}`,
        payment.method,
        payment.receiptNumber
      ];
    });

    generatePDF({
      title: 'Reporte de Pagos',
      subtitle: `Total: ${allPayments.length} pagos | Total Cobrado: C$ ${totalCollected.toLocaleString('es-NI')}`,
      filename: `pagos_${new Date().toISOString().split('T')[0]}`,
      headers,
      data,
      footer: 'YaraCredit - Sistema de Gestión de Préstamos'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={24} className="text-purple-600" />
          <h3 className="text-lg font-bold">Reportes Generales</h3>
        </div>
        <div className="flex gap-2">
          <Select options={[{ value: 'week', label: 'Semana' }, { value: 'month', label: 'Mes' }, { value: 'all', label: 'Todo' }]} value={period} onChange={e => setPeriod(e.target.value)} />
          <div className="relative group">
            <Button variant="outline" size="sm">
              <Download size={14} /> Exportar PDF
            </Button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={handleExportClients}
                className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2"
              >
                <Users size={16} /> Exportar Clientes
              </button>
              <button
                onClick={handleExportLoans}
                className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2"
              >
                <DollarSign size={16} /> Exportar Préstamos
              </button>
              <button
                onClick={handleExportPayments}
                className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2"
              >
                <TrendingUp size={16} /> Exportar Pagos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 text-center"><p className="text-xs text-gray-500">Cartera Total</p><p className="text-lg font-bold text-purple-700">{formatCurrency(totalPortfolio)}</p></Card>
        <Card className="p-4 text-center"><p className="text-xs text-gray-500">Total Cobrado</p><p className="text-lg font-bold text-green-600">{formatCurrency(totalCollected)}</p></Card>
        <Card className="p-4 text-center"><p className="text-xs text-gray-500">Desembolsado</p><p className="text-lg font-bold text-blue-600">{formatCurrency(totalDisbursed)}</p></Card>
        <Card className="p-4 text-center"><p className="text-xs text-gray-500">Intereses</p><p className="text-lg font-bold text-yellow-600">{formatCurrency(totalInterest)}</p></Card>
        <Card className="p-4 text-center"><p className="text-xs text-gray-500">Mora</p><p className="text-lg font-bold text-red-600">{formatCurrency(overdueAmount)}</p></Card>
        <Card className="p-4 text-center"><p className="text-xs text-gray-500">Tasa Mora</p><p className="text-lg font-bold text-red-600">{overdueRate}%</p></Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-green-500" /> Cobros Mensuales</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCollections}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="amount" stroke="#7C3AED" strokeWidth={3} dot={{ fill: '#7C3AED', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><DollarSign size={18} className="text-purple-500" /> Flujo de Caja</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="ingresos" fill="#10B981" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="egresos" fill="#EF4444" radius={[4, 4, 0, 0]} name="Egresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Collector performance */}
      <Card className="p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Users size={18} className="text-blue-500" /> Rendimiento por Cobrador</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-xs font-semibold text-gray-500">Cobrador</th>
                <th className="text-center py-2 text-xs font-semibold text-gray-500">Préstamos</th>
                <th className="text-center py-2 text-xs font-semibold text-gray-500">Cobros</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500">Total Cobrado</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500">Comisión (5%)</th>
              </tr>
            </thead>
            <tbody>
              {collectorPerformance.map(cp => (
                <tr key={cp.name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 text-sm font-medium">{cp.name}</td>
                  <td className="py-3 text-sm text-center">{cp.loans}</td>
                  <td className="py-3 text-sm text-center">{cp.payments}</td>
                  <td className="py-3 text-sm text-right font-medium text-green-600">{formatCurrency(cp.collected)}</td>
                  <td className="py-3 text-sm text-right font-medium text-purple-600">{formatCurrency(cp.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expense breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingDown size={18} className="text-red-500" /> Gastos por Categoría</h4>
          {expenseData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-8">Sin gastos registrados</p>}
        </Card>

        <Card className="p-6">
          <h4 className="font-bold text-gray-900 mb-4">Resumen de Cartera</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span className="text-sm">Activos</span></div>
              <div className="text-right"><p className="font-bold text-green-700">{activeLoans.length}</p><p className="text-xs text-green-600">{formatCurrency(activeLoans.reduce((s, l) => s + l.amount, 0))}</p></div>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full" /><span className="text-sm">En Mora</span></div>
              <div className="text-right"><p className="font-bold text-red-700">{overdueLoans.length}</p><p className="text-xs text-red-600">{formatCurrency(overdueAmount)}</p></div>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full" /><span className="text-sm">Cancelados</span></div>
              <div className="text-right"><p className="font-bold text-blue-700">{cancelledLoans.length}</p><p className="text-xs text-blue-600">{formatCurrency(cancelledLoans.reduce((s, l) => s + l.amount, 0))}</p></div>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-sm font-medium text-gray-600">Balance Neto</span>
              <span className="font-bold text-lg text-purple-700">{formatCurrency(totalPortfolio)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
