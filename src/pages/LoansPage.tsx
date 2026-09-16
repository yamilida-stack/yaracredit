import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Modal, Button, Input, Select, Card, Table, Badge, formatCurrency, formatDate, EmptyState } from '../components/ui';
import { Plus, Search, DollarSign, Eye, FileText, Trash2, Calendar, Clock } from 'lucide-react';
import type { Loan, LoanType, LoanModality } from '../types';

type PaymentFrequency = 'Semanal' | 'Quincenal' | 'Mensual';
type PreferredDay = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

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
    preferredDay: 'Lunes' as PreferredDay,
    amount: '',
    termMonths: '3',
    interestRate: '15',
    frequency: 'Semanal' as PaymentFrequency,
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

  // --- FUNCIÓN DE CÁLCULO EXACTA DEL MODELO EXCEL/VBA ---
  interface CalculoPrestamoParams {
    montoSinInteres: number; // Principal prestado
    tasaMensualPct: number;  // Ej: 15 para 15%
    plazoMeses: number;      // Ej: 3 meses
    frecuencia: 'Semanal' | 'Quincenal' | 'Mensual';
  }

  const calcularPrestamo = ({
    montoSinInteres,
    tasaMensualPct,
    plazoMeses,
    frecuencia
  }: CalculoPrestamoParams) => {
    const principal = Number(montoSinInteres) || 0;
    const meses = Number(plazoMeses) || 0;
    const tasaMensualDecimal = (Number(tasaMensualPct) || 0) / 100;

    // 1. Ganancia total de interés (Monto Interés)
    // Fórmula: Principal * Tasa Mensual * Plazo en Meses
    const montoInteresTotal = principal * tasaMensualDecimal * meses;

    // 2. Monto Con Interés (Total a Pagar)
    const montoConInteres = principal + montoInteresTotal;

    // 3. Tasa Total del Período (Formato Texto para UI/Reportes)
    const tasaTotalPorcentaje = (tasaMensualDecimal * meses) * 100;
    const etiquetaTasa = `${tasaMensualPct}% MES (${tasaTotalPorcentaje}% TOTAL)`;

    // 4. Determinación de Cuotas
    let totalCuotas = meses;
    if (frecuencia === 'Semanal') totalCuotas = meses * 4;
    if (frecuencia === 'Quincenal') totalCuotas = meses * 2;

    const valorCuota = totalCuotas > 0 ? montoConInteres / totalCuotas : 0;

    return {
      montoSinInteres: principal,
      montoConInteres,
      montoInteresTotal,
      tasaTotalPorcentaje,
      etiquetaTasa,
      totalCuotas,
      valorCuota
    };
  };

  // CÁLCULO COMPLETO CON CUOTAS Y FECHAS
  const calculation = useMemo(() => {
    const principal = Number(form.amount) || 0;
    const plazoMeses = Number(form.termMonths) || 0;
    const tasaMensual = Number(form.interestRate) || 0;

    // Validar que todos los valores sean números válidos
    if (principal <= 0 || plazoMeses <= 0) {
      return {
        montoSinInteres: 0,
        montoConInteres: 0,
        montoInteresTotal: 0,
        tasaTotalPorcentaje: 0,
        etiquetaTasa: '',
        totalCuotas: 0,
        valorCuota: 0,
        schedule: [] as AmortizationSchedule[]
      };
    }

    // Usar la función exacta del modelo Excel/VBA
    const resultado = calcularPrestamo({
      montoSinInteres: principal,
      tasaMensualPct: tasaMensual,
      plazoMeses: plazoMeses,
      frecuencia: form.frequency
    });

    // Generar tabla de amortización con fechas
    const schedule: AmortizationSchedule[] = [];
    const startDate = new Date(form.startDate);

    for (let i = 1; i <= resultado.totalCuotas; i++) {
      const dueDate = calculateDueDate(startDate, i, form.frequency, form.preferredDay);
      
      schedule.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: resultado.valorCuota
      });
    }

    return {
      ...resultado,
      schedule
    };
  }, [form.amount, form.interestRate, form.termMonths, form.frequency, form.startDate, form.preferredDay]);

  // Función para calcular fecha de cobro
  function calculateDueDate(startDate: Date, installmentNumber: number, frequency: PaymentFrequency, preferredDay: PreferredDay): Date {
    const date = new Date(startDate);
    
    // Ajustar al día preferido si es la primera cuota
    if (installmentNumber === 1) {
      const dayMap: Record<PreferredDay, number> = {
        'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
        'Jueves': 4, 'Viernes': 5, 'Sábado': 6
      };
      const targetDay = dayMap[preferredDay];
      const currentDay = date.getDay();
      const daysToAdd = (targetDay - currentDay + 7) % 7;
      date.setDate(date.getDate() + daysToAdd);
      return date;
    }

    // Calcular fecha según frecuencia
    if (frequency === 'Semanal') {
      date.setDate(date.getDate() + (installmentNumber - 1) * 7);
    } else if (frequency === 'Quincenal') {
      date.setDate(date.getDate() + (installmentNumber - 1) * 15);
    } else if (frequency === 'Mensual') {
      date.setMonth(date.getMonth() + (installmentNumber - 1));
    }

    // Asegurar que caiga en el día preferido
    const dayMap: Record<PreferredDay, number> = {
      'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
      'Jueves': 4, 'Viernes': 5, 'Sábado': 6
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
      preferredDay: 'Lunes',
      amount: '',
      termMonths: '3',
      interestRate: '15',
      frequency: 'Semanal',
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
      type: form.frequency.toLowerCase() as LoanType,
      modality: form.modality,
      amount: Number(form.amount),
      interestRate: Number(form.interestRate),
      term: Number(form.termMonths),
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
          <Table headers={['Cliente / Cédula', 'Tipo / Frecuencia', 'Monto Principal', 'Tasa Aplicada', 'Cuota', 'Total a Pagar', 'Estado', 'Acciones']}>
            {filtered.map(loan => {
              const client = clients.find(c => c.id === loan.clientId);
              const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
              
              // Calcular usando la misma función del modal
              const calculo = calcularPrestamo({
                montoSinInteres: loan.amount,
                tasaMensualPct: loan.interestRate,
                plazoMeses: loan.term,
                frecuencia: loan.type.charAt(0).toUpperCase() + loan.type.slice(1) as 'Semanal' | 'Quincenal' | 'Mensual'
              });
              
              // Determinar estado visual
              const remaining = calculo.montoConInteres - paid;
              let estadoLabel = 'Al día';
              let estadoVariant: 'success' | 'warning' | 'danger' | 'info' = 'success';
              
              if (loan.status === 'mora') {
                estadoLabel = 'En mora';
                estadoVariant = 'danger';
              } else if (loan.status === 'cancelado' || remaining <= 0) {
                estadoLabel = 'Finalizado';
                estadoVariant = 'info';
              }
              
              return (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{client?.fullName}</p>
                    <p className="text-xs text-gray-400 font-mono">{client?.cedula}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{loan.type.charAt(0).toUpperCase() + loan.type.slice(1)}</Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {loan.modality === 'articulo' ? '📦 Artículo' : '💵 Efectivo'}
                    </p>
                    <p className="text-xs text-gray-400">{loan.term} meses</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatCurrency(Math.round(calculo.montoSinInteres * 100) / 100)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{loan.interestRate}% mens.</p>
                    <p className="text-xs text-gray-500">{calculo.tasaTotalPorcentaje.toFixed(0)}% total</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-purple-700">
                    {formatCurrency(Math.round(calculo.valorCuota * 100) / 100)}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    {formatCurrency(Math.round(calculo.montoConInteres * 100) / 100)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={estadoVariant}>
                      {estadoLabel}
                    </Badge>
                    {loan.status === 'activo' && remaining > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Faltan: {formatCurrency(Math.round(remaining * 100) / 100)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setShowDetail(loan)} 
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" 
                        title="Ver detalle"
                      >
                        <Eye size={16} />
                      </button>
                      {loan.status === 'activo' && remaining > 0 && (
                        <button 
                          onClick={() => {
                            // Aquí iría la lógica para registrar pago
                            addNotification('info', 'Función de registrar pago - próximamente');
                          }}
                          className="p-2 hover:bg-green-50 rounded-lg text-green-600" 
                          title="Registrar pago"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
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

            {/* Fecha de Creación / Emisión */}
            <Input 
              label="Fecha de Creación / Emisión" 
              type="date" 
              value={form.startDate} 
              onChange={e => setForm({...form, startDate: e.target.value})} 
            />

            {/* Día de Cobro Preferido */}
            <Select 
              label="Día de Cobro Preferido" 
              options={[
                { value: 'Lunes', label: 'Lunes' },
                { value: 'Martes', label: 'Martes' },
                { value: 'Miércoles', label: 'Miércoles' },
                { value: 'Jueves', label: 'Jueves' },
                { value: 'Viernes', label: 'Viernes' },
                { value: 'Sábado', label: 'Sábado' },
              ]} 
              value={form.preferredDay} 
              onChange={e => setForm({...form, preferredDay: e.target.value as PreferredDay})} 
            />

            {/* Monto del Préstamo */}
            <Input 
              label="Monto del Préstamo (C$)" 
              type="number" 
              value={form.amount} 
              onChange={e => setForm({...form, amount: e.target.value})} 
              placeholder="1000" 
            />

            {/* Plazo en Meses */}
            <Input 
              label="Plazo (en Meses)" 
              type="number" 
              value={form.termMonths} 
              onChange={e => setForm({...form, termMonths: e.target.value})} 
              placeholder="3" 
            />

            {/* Interés Mensual */}
            <Input 
              label="Interés Mensual (%) - Tasa fija por mes (Ej: 15 para 15% mensual)" 
              type="number" 
              value={form.interestRate} 
              onChange={e => setForm({...form, interestRate: e.target.value})} 
              placeholder="15" 
            />

            {/* Frecuencia de Pago */}
            <Select 
              label="Frecuencia de Pago" 
              options={[
                { value: 'Semanal', label: 'Semanal' },
                { value: 'Quincenal', label: 'Quincenal' },
                { value: 'Mensual', label: 'Mensual' },
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

          {/* RESUMEN VISUAL - DESGLOSE EXACTO DEL MODELO EXCEL/VBA */}
          {form.amount && Number(form.amount) > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-200">
              <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg">
                <DollarSign size={22} /> Resumen del Préstamo
              </h4>
              
              <div className="space-y-3">
                {/* Monto Sin Interés (Principal) */}
                <div className="flex justify-between items-center py-2 border-b border-purple-100">
                  <span className="text-sm font-medium text-gray-700">Monto Sin Interés (Principal):</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(calculation.montoSinInteres)}</span>
                </div>

                {/* Tasa */}
                <div className="flex justify-between items-center py-2 border-b border-purple-100">
                  <span className="text-sm font-medium text-gray-700">Tasa:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {calculation.etiquetaTasa}
                  </span>
                </div>

                {/* Interés Ganado */}
                <div className="flex justify-between items-center py-2 border-b border-purple-100">
                  <span className="text-sm font-medium text-gray-700">Interés Ganado:</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(calculation.montoInteresTotal)}</span>
                </div>

                {/* MONTO CON INTERÉS (TOTAL A PAGAR) - DESTACADO */}
                <div className="bg-white rounded-lg p-4 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Monto Con Interés (Total a Pagar):</span>
                    <span className="text-3xl font-bold text-purple-900">{formatCurrency(calculation.montoConInteres)}</span>
                  </div>
                </div>

                {/* Plan de Pago */}
                <div className="flex justify-between items-center py-2 bg-green-50 rounded-lg px-3">
                  <span className="text-sm font-bold text-gray-700">Plan:</span>
                  <span className="text-base font-bold text-green-700">
                    [{calculation.totalCuotas} cuotas] de {formatCurrency(calculation.valorCuota)}
                  </span>
                </div>

                {/* Texto Explicativo */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-blue-900 font-medium">
                    Fórmula: {formatCurrency(calculation.montoSinInteres)} × {form.interestRate}% × {form.termMonths} meses = {formatCurrency(calculation.montoInteresTotal)} de interés
                  </p>
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
