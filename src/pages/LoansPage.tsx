import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Modal, Button, Input, Select, Card, Table, Badge, formatCurrency, formatDate, EmptyState } from '../components/ui';
import { Plus, Search, DollarSign, Eye, FileText, RefreshCw, Trash2 } from 'lucide-react';
import type { Loan, LoanType, LoanModality } from '../types';

export default function LoansPage() {
  const { loans, clients, articles, addLoan, deleteLoan, addNotification, currentUser, routes } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Loan | null>(null);
  const [form, setForm] = useState({
    clientId: '', type: 'semanal' as LoanType, modality: 'efectivo' as LoanModality,
    amount: '', term: '3', interestRate: '14', assignedCollector: '', articleId: '', guarantees: '', observations: '', purpose: ''
  });

  const filtered = useMemo(() => {
    return loans.filter(l => {
      const client = clients.find(c => c.id === l.clientId);
      const matchSearch = !search || client?.fullName.toLowerCase().includes(search.toLowerCase()) || client?.cedula.includes(search);
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchRole = currentUser?.role !== 'cobrador' || l.assignedCollector === currentUser.id;
      return matchSearch && matchStatus && matchRole;
    });
  }, [loans, clients, search, statusFilter, currentUser]);

  // Calculate preview
  const preview = useMemo(() => {
    const amount = parseFloat(form.amount) || 0;
    const monthlyRate = parseFloat(form.interestRate) || 0;
    const term = parseInt(form.term) || 1;
    
    // Cálculo correcto según especificaciones:
    // 1. Porcentaje de Interés Total = Interés Mensual × Plazo en meses
    const totalInterestPercent = monthlyRate * term;
    
    // 2. Monto de Interés en dinero = Monto Principal × (Porcentaje Total / 100)
    const totalInterestAmount = amount * (totalInterestPercent / 100);
    
    // 3. Total a Pagar = Monto Principal + Monto de Interés
    const totalAmount = amount + totalInterestAmount;
    
    // 4. Cálculo de cuotas según modalidad
    let installments = term;
    if (form.type === 'semanal') installments = term * 4;
    else if (form.type === 'quincenal') installments = term * 2;
    
    const installmentAmount = Math.ceil(totalAmount / installments);
    
    return { 
      totalInterestPercent, 
      totalInterestAmount, 
      totalAmount, 
      installmentAmount, 
      installments 
    };
  }, [form.amount, form.interestRate, form.term, form.type]);

  const openCreate = () => {
    setForm({ clientId: '', type: 'semanal', modality: 'efectivo', amount: '', term: '3', interestRate: '14', assignedCollector: '', articleId: '', guarantees: '', observations: '', purpose: '' });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.amount) {
      addNotification('error', 'Selecciona un cliente e ingresa el monto');
      return;
    }
    addLoan({
      clientId: form.clientId,
      type: form.type,
      modality: form.modality,
      amount: parseFloat(form.amount),
      interestRate: parseFloat(form.interestRate),
      term: parseInt(form.term),
      startDate: new Date().toISOString().split('T')[0],
      status: 'activo',
      assignedCollector: form.assignedCollector || undefined,
      articleId: form.modality === 'articulo' ? form.articleId || undefined : undefined,
      guarantees: form.guarantees ? [form.guarantees] : undefined,
      observations: form.observations || undefined,
      purpose: form.purpose || undefined,
    });
    addNotification('success', 'Préstamo creado exitosamente');
    setShowModal(false);
  };

  const collectors = currentUser?.role === 'admin' || currentUser?.role === 'gerente'
    ? useStore.getState().users.filter(u => u.role === 'cobrador')
    : [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por cliente o cédula..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <Select options={[
          { value: 'all', label: 'Todos los estados' },
          { value: 'activo', label: 'Activos' },
          { value: 'mora', label: 'En Mora' },
          { value: 'cancelado', label: 'Cancelados' },
        ]} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />
        {currentUser?.role !== 'solo_lectura' && (
          <Button onClick={openCreate}><Plus size={18} /> Nuevo Préstamo</Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{loans.length}</p>
          <p className="text-xs text-gray-500">Total Préstamos</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{loans.filter(l => l.status === 'activo').length}</p>
          <p className="text-xs text-gray-500">Activos</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{loans.filter(l => l.status === 'mora').length}</p>
          <p className="text-xs text-gray-500">En Mora</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(loans.filter(l => l.status === 'activo' || l.status === 'mora').reduce((s, l) => s + (l.totalAmount - l.payments.reduce((ps, p) => ps + p.amount, 0)), 0))}
          </p>
          <p className="text-xs text-gray-500">Cartera Pendiente</p>
        </Card>
      </div>

      {/* Table */}
      <Card>
        {filtered.length > 0 ? (
          <Table headers={['Cliente', 'Monto', 'Tipo', 'Cuota', 'Pagos', 'Saldo', 'Estado', 'Acciones']}>
            {filtered.map(loan => {
              const client = clients.find(c => c.id === loan.clientId);
              const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
              const remaining = loan.totalAmount - paid;
              return (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{client?.fullName}</p>
                    <p className="text-xs text-gray-400">{loan.modality === 'articulo' ? '📦 Artículo' : '💵 Efectivo'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(loan.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{loan.type}</Badge>
                    <p className="text-xs text-gray-400 mt-0.5">{loan.term} meses</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(loan.installmentAmount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{loan.payments.length} pagos</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600">{formatCurrency(remaining)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={loan.status === 'activo' ? 'success' : loan.status === 'mora' ? 'danger' : loan.status === 'cancelado' ? 'info' : 'warning'}>
                      {loan.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setShowDetail(loan)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="Ver detalle"><Eye size={16} /></button>
                      {currentUser?.role === 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm('¿Estás seguro de eliminar este préstamo? Esta acción no se puede deshacer.')) {
                              deleteLoan(loan.id);
                              addNotification('success', 'Préstamo eliminado');
                            }
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                          title="Eliminar préstamo"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <EmptyState icon={<DollarSign size={40} className="text-gray-300" />} title="No hay préstamos" description="Crea el primer préstamo para un cliente" action={<Button onClick={openCreate}><Plus size={16} /> Crear</Button>} />
        )}
      </Card>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Préstamo" size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Select label="Cliente *" options={[
                { value: '', label: 'Seleccionar cliente...' },
                ...clients.map(c => ({ value: c.id, label: `${c.fullName} - ${c.cedula}` }))
              ]} value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} />
            </div>
            <Select label="Tipo de Préstamo" options={[
              { value: 'semanal', label: 'Semanal (excluye domingos)' },
              { value: 'quincenal', label: 'Quincenal' },
              { value: 'mensual', label: 'Mensual' },
            ]} value={form.type} onChange={e => setForm({...form, type: e.target.value as LoanType})} />
            <Select label="Modalidad" options={[
              { value: 'efectivo', label: '💵 Efectivo' },
              { value: 'articulo', label: '📦 Financiamiento de Artículo' },
            ]} value={form.modality} onChange={e => setForm({...form, modality: e.target.value as LoanModality})} />
            <Input label="Monto (RD$) *" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="10000" />
            <Input label="Plazo (meses)" type="number" value={form.term} onChange={e => setForm({...form, term: e.target.value})} />
            <Input label="Interés Mensual (%)" type="number" value={form.interestRate} onChange={e => setForm({...form, interestRate: e.target.value})} />
            {collectors.length > 0 && (
              <Select label="Asignar a Cobrador" options={[
                { value: '', label: 'Sin asignar' },
                ...collectors.map(c => ({ value: c.id, label: c.name }))
              ]} value={form.assignedCollector} onChange={e => setForm({...form, assignedCollector: e.target.value})} />
            )}
            {form.modality === 'articulo' && (
              <div className="sm:col-span-2">
                <Select label="Artículo" options={[
                  { value: '', label: 'Seleccionar artículo...' },
                  ...articles.filter(a => a.quantity > 0).map(a => ({ value: a.id, label: `${a.name} - ${formatCurrency(a.salePrice)} (${a.quantity} disp.)` }))
                ]} value={form.articleId} onChange={e => setForm({...form, articleId: e.target.value})} />
              </div>
            )}
            <Input label="Garantías (descripción)" value={form.guarantees} onChange={e => setForm({...form, guarantees: e.target.value})} placeholder="Ej: Cédula original, Título de propiedad..." />
            <Input label="Propósito del Préstamo" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="Ej: Compra de muebles, Gastos médicos..." />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                value={form.observations}
                onChange={e => setForm({...form, observations: e.target.value})}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Notas adicionales sobre este préstamo..."
              />
            </div>
          </div>

          {/* Preview */}
          {form.amount && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <DollarSign size={18} /> Resumen del Préstamo
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-purple-600">Monto</p>
                  <p className="font-bold text-lg">{formatCurrency(parseFloat(form.amount) || 0)}</p>
                </div>
                <div>
                  <p className="text-purple-600">Interés Mensual</p>
                  <p className="font-bold text-lg">{form.interestRate}%</p>
                </div>
                <div>
                  <p className="text-purple-600">Interés Total ({form.term} meses)</p>
                  <p className="font-bold text-lg">{preview.totalInterestPercent}%</p>
                </div>
                <div>
                  <p className="text-purple-600">Monto de Interés</p>
                  <p className="font-bold text-lg">{formatCurrency(preview.totalInterestAmount)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-purple-700">Total a Pagar:</span>
                  <span className="text-2xl font-bold text-purple-900">{formatCurrency(preview.totalAmount)}</span>
                </div>
                <p className="text-sm text-purple-700 font-medium">
                  {preview.installments} cuotas {form.type === 'semanal' ? 'semanales' : form.type === 'quincenal' ? 'quincenales' : 'mensuales'} de <span className="text-lg font-bold text-green-700">{formatCurrency(preview.installmentAmount)}</span>
                </p>
                <p className="text-xs text-purple-500 mt-1">
                  Cálculo: {form.interestRate}% mensual × {form.term} meses = {preview.totalInterestPercent}% total
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit"><FileText size={16} /> Crear y Generar Contrato</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Detalle del Préstamo" size="lg">
        {showDetail && (() => {
          const client = clients.find(c => c.id === showDetail.clientId);
          const paid = showDetail.payments.reduce((s, p) => s + p.amount, 0);
          const remaining = showDetail.totalAmount - paid;
          const progress = (paid / showDetail.totalAmount) * 100;
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Cliente</p><p className="font-medium">{client?.fullName}</p></div>
                <div><p className="text-xs text-gray-500">Cédula</p><p className="font-medium">{client?.cedula}</p></div>
                <div><p className="text-xs text-gray-500">Tipo</p><p className="font-medium capitalize">{showDetail.type} - {showDetail.modality}</p></div>
                <div><p className="text-xs text-gray-500">Fecha Inicio</p><p className="font-medium">{formatDate(showDetail.startDate)}</p></div>
                <div><p className="text-xs text-gray-500">Monto</p><p className="font-bold text-lg">{formatCurrency(showDetail.amount)}</p></div>
                <div><p className="text-xs text-gray-500">Interés</p><p className="font-medium">{showDetail.interestRate}% mensual</p></div>
                <div><p className="text-xs text-gray-500">Cuota</p><p className="font-bold text-green-700">{formatCurrency(showDetail.installmentAmount)}</p></div>
                <div><p className="text-xs text-gray-500">Total</p><p className="font-medium">{formatCurrency(showDetail.totalAmount)}</p></div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progreso de pago</span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-700 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-green-600">Pagado: {formatCurrency(paid)}</span>
                  <span className="text-red-600">Pendiente: {formatCurrency(remaining)}</span>
                </div>
              </div>

              {/* Payments */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Historial de Pagos</h4>
                {showDetail.payments.length > 0 ? (
                  <div className="space-y-2">
                    {showDetail.payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium">{p.receiptNumber} - {formatCurrency(p.amount)}</p>
                          <p className="text-xs text-gray-400">{formatDate(p.date)} • {p.method} • {p.synced ? '✓ Sincronizado' : '⏳ Pendiente'}</p>
                        </div>
                        <Badge variant={p.isLate ? 'warning' : 'success'}>{p.isLate ? 'Vencido' : 'Al día'}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Sin pagos registrados</p>
                )}
              </div>

              {showDetail.guarantees && showDetail.guarantees.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Garantías</h4>
                  <div className="flex flex-wrap gap-2">
                    {showDetail.guarantees.map((g, i) => <Badge key={i} variant="info">{g}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
