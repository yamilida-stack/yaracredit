import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Modal, Button, Input, Select, Card, Table, Badge, formatCurrency, formatDate, EmptyState } from '../components/ui';
import { Plus, Search, DollarSign, Eye, FileText, Trash2, Calendar, Clock } from 'lucide-react';
import type { Loan, LoanType, LoanModality } from '../types';

type PaymentFrequency = 'semanal' | 'quincenal' | 'mensual';
type PreferredDay = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

interface AmortizationSchedule {
  installmentNumber: number;
  dueDate: string;
  amount: number;
}

export default function LoansPage() {
  const { loans, clients, articles, addLoan, deleteLoan, addNotification, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Loan | null>(null);
  
  const [form, setForm] = useState({
    clientId: '',
    modality: 'efectivo' as LoanModality,
    startDate: new Date().toISOString().split('T')[0],
    preferredDay: 'lunes' as PreferredDay,
    amount: '',
    termMonths: '3',
    interestRate: '15',
    frequency: 'semanal' as PaymentFrequency,
    assignedCollector: '',
    articleId: '',
    guarantees: '',
    observations: '',
    purpose: ''
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

  // CÁLCULO FINANCIERO EXACTO - INTERÉS SIMPLE MENSUAL FIJO
  const calculation = useMemo(() => {
    const montoPrincipal = parseFloat(form.amount) || 0;
    const interesMensual = parseFloat(form.interestRate) || 0;
    const plazoMeses = parseInt(form.termMonths) || 0;
    const frecuencia = form.frequency;

    if (montoPrincipal <= 0 || plazoMeses <= 0) {
      return {
        porcentajeTotal: 0,
        montoInteres: 0,
        totalAPagar: 0,
        numeroCuotas: 0,
        valorCuota: 0,
        schedule: [] as AmortizationSchedule[]
      };
    }

    // FÓRMULA EXACTA SOLICITADA
    const porcentajeTotal = interesMensual * plazoMeses;
    const montoInteres = montoPrincipal * (porcentajeTotal / 100);
    const totalAPagar = montoPrincipal + montoInteres;

    // Determinación del número total de cuotas según la frecuencia
    let numeroCuotas = 0;
    if (frecuencia === 'semanal') numeroCuotas = plazoMeses * 4;
    if (frecuencia === 'quincenal') numeroCuotas = plazoMeses * 2;
    if (frecuencia === 'mensual') numeroCuotas = plazoMeses;

    const valorCuota = totalAPagar / numeroCuotas;

    // Generar tabla de amortización con fechas
    const schedule: AmortizationSchedule[] = [];
    const startDate = new Date(form.startDate);

    for (let i = 1; i <= numeroCuotas; i++) {
      const dueDate = calculateDueDate(startDate, i, frecuencia, form.preferredDay);
      
      schedule.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: valorCuota
      });
    }

    return {
      porcentajeTotal,
      montoInteres,
      totalAPagar,
      numeroCuotas,
      valorCuota,
      schedule
    };
  }, [form.amount, form.interestRate, form.termMonths, form.frequency, form.startDate, form.preferredDay]);

  // Función para calcular fecha de cobro
  function calculateDueDate(startDate: Date, installmentNumber: number, frequency: PaymentFrequency, preferredDay: PreferredDay): Date {
    const date = new Date(startDate);
    
    // Ajustar al día preferido si es la primera cuota
    if (installmentNumber === 1) {
      const dayMap: Record<PreferredDay, number> = {
        'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
        'jueves': 4, 'viernes': 5, 'sabado': 6
      };
      const targetDay = dayMap[preferredDay];
      const currentDay = date.getDay();
      const daysToAdd = (targetDay - currentDay + 7) % 7;
      date.setDate(date.getDate() + daysToAdd);
      return date;
    }

    // Calcular fecha según frecuencia
    if (frequency === 'semanal') {
      date.setDate(date.getDate() + (installmentNumber - 1) * 7);
    } else if (frequency === 'quincenal') {
      date.setDate(date.getDate() + (installmentNumber - 1) * 15);
    } else if (frequency === 'mensual') {
      date.setDate(date.getDate() + (installmentNumber - 1) * 30);
    }

    // Asegurar que caiga en el día preferido
    const dayMap: Record<PreferredDay, number> = {
      'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
      'jueves': 4, 'viernes': 5, 'sabado': 6
    };
    const targetDay = dayMap[preferredDay];
    const currentDay = date.getDay();
    
    if (currentDay !== targetDay) {
      const diff = (targetDay - currentDay + 7) % 7;
      date.setDate(date.getDate() + diff);
    }

    return date;
  }

  const openCreate = () => {
    setForm({
      clientId: '',
      modality: 'efectivo',
      startDate: new Date().toISOString().split('T')[0],
      preferredDay: 'lunes',
      amount: '',
      termMonths: '3',
      interestRate: '15',
      frequency: 'semanal',
      assignedCollector: '',
      articleId: '',
      guarantees: '',
      observations: '',
      purpose: ''
    });
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
      type: form.frequency as LoanType,
      modality: form.modality,
      amount: parseFloat(form.amount),
      interestRate: parseFloat(form.interestRate),
      term: parseInt(form.termMonths),
      startDate: form.startDate,
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

  const frequencyLabels: Record<PaymentFrequency, string> = {
    semanal: 'Semanal',
    quincenal: 'Quincenal',
    mensual: 'Mensual'
  };

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
          <Table headers={['Cliente', 'Monto', 'Frecuencia', 'Cuota', 'Pagos', 'Saldo', 'Estado', 'Acciones']}>
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
                    <Badge variant="info">{frequencyLabels[loan.type as PaymentFrequency] || loan.type}</Badge>
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
            {/* Cliente */}
            <div className="sm:col-span-2">
              <Select label="Cliente *" options={[
                { value: '', label: 'Seleccionar cliente...' },
                ...clients.map(c => ({ value: c.id, label: `${c.fullName} - ${c.cedula}` }))
              ]} value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} />
            </div>

            {/* Fecha de Creación */}
            <Input 
              label="Fecha de Creación / Inicio" 
              type="date" 
              value={form.startDate} 
              onChange={e => setForm({...form, startDate: e.target.value})} 
            />

            {/* Día de Cobro Preferido */}
            <Select 
              label="Día de Cobro Preferido" 
              options={[
                { value: 'lunes', label: 'Lunes' },
                { value: 'martes', label: 'Martes' },
                { value: 'miercoles', label: 'Miércoles' },
                { value: 'jueves', label: 'Jueves' },
                { value: 'viernes', label: 'Viernes' },
                { value: 'sabado', label: 'Sábado' },
                { value: 'domingo', label: 'Domingo' },
              ]} 
              value={form.preferredDay} 
              onChange={e => setForm({...form, preferredDay: e.target.value as PreferredDay})} 
            />

            {/* Monto Prestado */}
            <Input 
              label="Monto Prestado (C$) *" 
              type="number" 
              value={form.amount} 
              onChange={e => setForm({...form, amount: e.target.value})} 
              placeholder="10000" 
            />

            {/* Plazo en Meses */}
            <Input 
              label="Plazo en Meses" 
              type="number" 
              value={form.termMonths} 
              onChange={e => setForm({...form, termMonths: e.target.value})} 
              placeholder="3" 
            />

            {/* Interés Mensual */}
            <Input 
              label="Interés Mensual (%)" 
              type="number" 
              value={form.interestRate} 
              onChange={e => setForm({...form, interestRate: e.target.value})} 
              placeholder="15" 
            />

            {/* Frecuencia de Pago */}
            <Select 
              label="Frecuencia de Pago" 
              options={[
                { value: 'semanal', label: 'Semanal' },
                { value: 'quincenal', label: 'Quincenal' },
                { value: 'mensual', label: 'Mensual' },
              ]} 
              value={form.frequency} 
              onChange={e => setForm({...form, frequency: e.target.value as PaymentFrequency})} 
            />

            {/* Modalidad */}
            <Select 
              label="Modalidad" 
              options={[
                { value: 'efectivo', label: '💵 Efectivo' },
                { value: 'articulo', label: '📦 Financiamiento de Artículo' },
              ]} 
              value={form.modality} 
              onChange={e => setForm({...form, modality: e.target.value as LoanModality})} 
            />

            {/* Cobrador */}
            {collectors.length > 0 && (
              <Select 
                label="Asignar a Cobrador" 
                options={[
                  { value: '', label: 'Sin asignar' },
                  ...collectors.map(c => ({ value: c.id, label: c.name }))
                ]} 
                value={form.assignedCollector} 
                onChange={e => setForm({...form, assignedCollector: e.target.value})} 
              />
            )}

            {/* Artículo */}
            {form.modality === 'articulo' && (
              <div className="sm:col-span-2">
                <Select label="Artículo" options={[
                  { value: '', label: 'Seleccionar artículo...' },
                  ...articles.filter(a => a.quantity > 0).map(a => ({ value: a.id, label: `${a.name} - ${formatCurrency(a.salePrice)} (${a.quantity} disp.)` }))
                ]} value={form.articleId} onChange={e => setForm({...form, articleId: e.target.value})} />
              </div>
            )}

            {/* Garantías */}
            <Input label="Garantías (descripción)" value={form.guarantees} onChange={e => setForm({...form, guarantees: e.target.value})} placeholder="Ej: Cédula original, Título de propiedad..." />
            
            {/* Propósito */}
            <Input label="Propósito del Préstamo" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="Ej: Compra de muebles, Gastos médicos..." />
            
            {/* Observaciones */}
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

          {/* RESUMEN DEL PRÉSTAMO - DESGLOSE EXACTO */}
          {form.amount && parseFloat(form.amount) > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-200">
              <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg">
                <DollarSign size={22} /> Resumen del Préstamo
              </h4>
              
              <div className="space-y-3">
                {/* Monto Solicitado */}
                <div className="flex justify-between items-center py-2 border-b border-purple-100">
                  <span className="text-sm font-medium text-gray-700">Monto Solicitado:</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(parseFloat(form.amount))}</span>
                </div>

                {/* Interés Mensual */}
                <div className="flex justify-between items-center py-2 border-b border-purple-100">
                  <span className="text-sm font-medium text-gray-700">Interés Mensual:</span>
                  <span className="text-lg font-bold text-gray-900">{form.interestRate}%</span>
                </div>

                {/* Plazo */}
                <div className="flex justify-between items-center py-2 border-b border-purple-100">
                  <span className="text-sm font-medium text-gray-700">Plazo:</span>
                  <span className="text-lg font-bold text-gray-900">{form.termMonths} meses</span>
                </div>

                {/* Interés Total */}
                <div className="flex justify-between items-center py-2 border-b border-purple-100">
                  <span className="text-sm font-medium text-gray-700">Interés Total ({calculation.porcentajeTotal}%):</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(calculation.montoInteres)}</span>
                </div>

                {/* TOTAL A PAGAR - DESTACADO */}
                <div className="bg-white rounded-lg p-4 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">TOTAL A PAGAR:</span>
                    <span className="text-3xl font-bold text-purple-900">{formatCurrency(calculation.totalAPagar)}</span>
                  </div>
                </div>

                {/* Plan de Pago */}
                <div className="flex justify-between items-center py-2 bg-green-50 rounded-lg px-3">
                  <span className="text-sm font-bold text-gray-700">Plan:</span>
                  <span className="text-base font-bold text-green-700">
                    {calculation.numeroCuotas} cuotas {frequencyLabels[form.frequency]} de {formatCurrency(calculation.valorCuota)}
                  </span>
                </div>
              </div>

              {/* Fechas de Cobro */}
              {calculation.schedule.length > 0 && (
                <div className="mt-4 bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Primer Cobro:</span>
                    <span className="text-sm font-bold text-gray-900">{formatDate(calculation.schedule[0].dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Último Cobro:</span>
                    <span className="text-sm font-bold text-gray-900">{formatDate(calculation.schedule[calculation.schedule.length - 1].dueDate)}</span>
                  </div>
                </div>
              )}

              {/* Tabla de Amortización */}
              {calculation.schedule.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-purple-700 hover:text-purple-900">
                    Ver Tabla de Amortización Completa
                  </summary>
                  <div className="mt-3 max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-purple-100 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">#</th>
                          <th className="px-2 py-1 text-left">Fecha de Cobro</th>
                          <th className="px-2 py-1 text-right">Monto Cuota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculation.schedule.map((row) => (
                          <tr key={row.installmentNumber} className="border-t hover:bg-gray-50">
                            <td className="px-2 py-1">{row.installmentNumber}</td>
                            <td className="px-2 py-1">{formatDate(row.dueDate)}</td>
                            <td className="px-2 py-1 text-right font-medium">{formatCurrency(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit"><FileText size={16} /> Crear Préstamo</Button>
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
