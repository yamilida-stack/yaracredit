import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Modal, Button, Input, Select, Card, Table, Badge, formatCurrency, formatDate, EmptyState } from '../components/ui';
import { Plus, Search, DollarSign, Eye, FileText, Trash2, Calendar, Clock, Edit2, Download } from 'lucide-react';
import { exportLoansPDF } from '../utils/pdfGenerator';
import type { Loan, LoanType, LoanModality, Client } from '../types';

type PaymentFrequency = 'Semanal' | 'Quincenal' | 'Mensual';
type PreferredDay = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

interface AmortizationSchedule {
  installmentNumber: number;
  dueDate: string;
  amount: number;
}

export default function LoansPage() {
  const { articles, addNotification, currentUser } = useStore();
  const { profile } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Loan | null>(null);
  const [editing, setEditing] = useState<Loan | null>(null);

  // Cargar préstamos y clientes desde Supabase
  useEffect(() => {
    loadLoans();
    loadClients();
  }, []);

  // Cargar clientes desde Supabase
  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      
      // Mapear datos de Supabase al formato de Client
      const mappedClients: Client[] = (data || []).map(client => ({
        id: client.id,
        fullName: client.nombre,
        cedula: client.cedula,
        address: client.direccion || '',
        phone: client.telefono,
        whatsapp: client.whatsapp || client.telefono,
        email: client.email,
        guarantor: client.garante,
        guarantorPhone: client.garante_telefono,
        lat: client.lat,
        lng: client.lng,
        occupation: client.ocupacion,
        monthlyIncome: client.ingreso_mensual,
        references: client.referencias,
        observations: client.observaciones,
        riskLevel: client.nivel_riesgo,
        createdAt: client.created_at,
      }));

      setClients(mappedClients);
    } catch (error: any) {
      console.error('Error al cargar clientes:', error);
      addNotification('error', 'Error al cargar clientes: ' + error.message);
    }
  };

  const loadLoans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prestamos')
        .select(`
          *,
          clientes!inner(*),
          cuotas(*),
          pagos(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear datos de Supabase al formato de Loan
      const mappedLoans: Loan[] = (data || []).map(loan => ({
        id: loan.id,
        clientId: loan.cliente_id,
        type: 'mensual', // Valor por defecto, ya no viene de la BD
        modality: 'efectivo', // Valor por defecto, ya no viene de la BD
        amount: loan.monto,
        interestRate: loan.tasa_interes,
        term: loan.plazo_meses,
        installmentAmount: loan.monto_total / loan.plazo_meses, // Calcular cuota
        totalAmount: loan.monto_total,
        totalInterest: loan.monto_total - loan.monto, // Calcular interés
        startDate: loan.fecha_inicio,
        status: loan.estado.toLowerCase(),
        assignedCollector: loan.cobrador_id,
        articleId: undefined, // Ya no se guarda en la BD
        guarantees: undefined, // Ya no se guarda en la BD
        observations: undefined, // Ya no se guarda en la BD
        purpose: undefined, // Ya no se guarda en la BD
        preferredDay: loan.dia_cobro,
        payments: (loan.pagos || loan.cobros || []).map((p: any) => ({
          id: p.id,
          loanId: p.prestamo_id,
          clientId: '', // Ya no viene de la BD
          amount: p.monto,
          method: p.metodo_pago,
          date: p.fecha || p.fecha_cobro,
          collectorId: p.creado_por,
          receiptNumber: p.nota?.replace('Recibo: ', '') || '',
          isLate: false, // Ya no viene de la BD
          synced: true,
        })),
        createdAt: loan.created_at,
      }));

      setLoans(mappedLoans);
    } catch (error: any) {
      console.error('Error al cargar préstamos:', error);
      addNotification('error', 'Error al cargar préstamos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
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

    // CUOTAS EN NÚMEROS ENTEROS
    const valorCuota = totalCuotas > 0 ? Math.round(montoConInteres / totalCuotas) : 0;

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

  // Función para calcular fecha de cobro - CORREGIDA
  function calculateDueDate(startDate: Date, installmentNumber: number, frequency: PaymentFrequency, preferredDay: PreferredDay): Date {
    const dayMap: Record<PreferredDay, number> = {
      'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
      'Jueves': 4, 'Viernes': 5, 'Sábado': 6
    };
    const targetDay = dayMap[preferredDay];
    
    // Paso 1: Ajustar fecha de inicio al día preferido
    const firstDueDate = new Date(startDate);
    const currentDay = firstDueDate.getDay();
    const daysToAdd = (targetDay - currentDay + 7) % 7;
    firstDueDate.setDate(firstDueDate.getDate() + daysToAdd);
    
    // Paso 2: Calcular fecha de la cuota específica desde la primera fecha ajustada
    const dueDate = new Date(firstDueDate);
    
    if (installmentNumber === 1) {
      return dueDate;
    }
    
    // Calcular según frecuencia desde la primera fecha de cobro
    if (frequency === 'Semanal') {
      // Sumar semanas completas (7 días) - siempre caerá en el mismo día
      dueDate.setDate(dueDate.getDate() + (installmentNumber - 1) * 7);
    } else if (frequency === 'Quincenal') {
      // Sumar 2 semanas (14 días) para mantener el mismo día de la semana
      dueDate.setDate(dueDate.getDate() + (installmentNumber - 1) * 14);
    } else if (frequency === 'Mensual') {
      // Sumar meses y luego ajustar al día de la semana correcto
      dueDate.setMonth(dueDate.getMonth() + (installmentNumber - 1));
      
      // Ajustar al día de la semana preferido
      const currentDayAfterMonth = dueDate.getDay();
      const daysToAdjust = (targetDay - currentDayAfterMonth + 7) % 7;
      dueDate.setDate(dueDate.getDate() + daysToAdjust);
    }
    
    return dueDate;
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
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (loan: Loan) => {
    setForm({
      clientId: loan.clientId,
      modality: loan.modality,
      startDate: loan.startDate,
      preferredDay: (loan.preferredDay as PreferredDay) || 'Lunes',
      amount: loan.amount.toString(),
      termMonths: loan.term.toString(),
      interestRate: loan.interestRate.toString(),
      frequency: (loan.type.charAt(0).toUpperCase() + loan.type.slice(1)) as PaymentFrequency,
      assignedCollector: loan.assignedCollector || '',
      articleId: loan.articleId || '',
      guarantees: loan.guarantees?.[0] || '',
      observations: loan.observations || '',
      purpose: loan.purpose || ''
    });
    setEditing(loan);
    setShowModal(true);
  };

  const handleEditLoan = async (id: string, updatedData: Record<string, unknown>) => {
    try {
      const { error } = await supabase
        .from('prestamos')
        .update(updatedData)
        .eq('id', id);

      if (error) throw error;
      await loadLoans();
    } catch (error: any) {
      console.error('Error al editar préstamo:', error);
      throw error;
    }
  };

  const handleDeleteLoan = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este préstamo? Esta acción no se puede deshacer.')) return;

    try {
      const { error } = await supabase
        .from('prestamos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      addNotification('success', 'Préstamo eliminado exitosamente');
      await loadLoans();
    } catch (error: any) {
      console.error('Error al eliminar préstamo:', error);
      addNotification('error', 'Error al eliminar préstamo: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // DEPURACIÓN: Verificar qué valores se están enviando
    console.log('=== DEPURACIÓN CREACIÓN DE PRÉSTAMO ===');
    console.log('Cliente seleccionado (form.clientId):', form.clientId);
    console.log('Usuario logueado (profile):', profile);
    console.log('ID del cobrador (profile.id):', profile?.id);
    console.log('Formulario completo:', form);
    
    if (!form.clientId || !form.amount) {
      addNotification('error', 'Selecciona un cliente e ingresa el monto');
      return;
    }

    // Validar que tengamos UUIDs válidos
    if (!profile?.id) {
      addNotification('error', 'Error: No se pudo obtener el ID del usuario logueado');
      console.error('profile.id es undefined o null');
      return;
    }

    // Validar que el cliente_id sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(form.clientId)) {
      addNotification('error', 'Error: El ID del cliente no es válido');
      console.error('cliente_id no es un UUID válido:', form.clientId);
      return;
    }

    // Calcular valores del préstamo
    const amount = Number(form.amount);
    const interestRate = Number(form.interestRate);
    const term = Number(form.termMonths);
    const frequency = form.frequency.toLowerCase() as 'semanal' | 'quincenal' | 'mensual';
    
    // Calcular interés y totales
    const totalInterestPercent = interestRate * term;
    const totalInterest = amount * (totalInterestPercent / 100);
    const totalAmount = amount + totalInterest;
    
    // Calcular número de cuotas
    let totalCuotas = term;
    if (frequency === 'semanal') totalCuotas = term * 4;
    if (frequency === 'quincenal') totalCuotas = term * 2;
    
    const installmentAmount = Math.round(totalAmount / totalCuotas);

    // Calcular fecha_fin (último cobro)
    const fechaInicio = new Date(form.startDate);
    const fechaFin = new Date(fechaInicio);
    
    if (frequency === 'semanal') {
      fechaFin.setDate(fechaFin.getDate() + (totalCuotas - 1) * 7);
    } else if (frequency === 'quincenal') {
      fechaFin.setDate(fechaFin.getDate() + (totalCuotas - 1) * 14);
    } else {
      fechaFin.setMonth(fechaFin.getMonth() + (totalCuotas - 1));
    }
    
    const fechaFinStr = fechaFin.toISOString().split('T')[0];
    
    console.log('=== CÁLCULO DE FECHAS ===');
    console.log('Fecha inicio:', form.startDate);
    console.log('Frecuencia:', frequency);
    console.log('Total cuotas:', totalCuotas);
    console.log('Fecha fin calculada:', fechaFinStr);

    console.log('Valores calculados:', {
      amount,
      interestRate,
      term,
      totalInterest,
      totalAmount,
      totalCuotas,
      installmentAmount,
      fecha_inicio: form.startDate,
      fecha_fin: fechaFinStr
    });

    try {
      if (editing) {
        // Actualizar préstamo existente
        const updatePayload = {
          cliente_id: form.clientId,
          cobrador_id: profile.id,
          monto: amount,
          tasa_interes: interestRate,
          plazo_meses: term,
          monto_total: totalAmount,
          monto_restante: totalAmount,
          estado: 'activo',
          dia_cobro: form.preferredDay.toLowerCase(),
          fecha_inicio: form.startDate,
          fecha_fin: fechaFinStr,
        };
        
        await handleEditLoan(editing.id, updatePayload);
        addNotification('success', 'Préstamo actualizado exitosamente');
      } else {
        // Crear nuevo préstamo
        const payload = {
          cliente_id: form.clientId,
          cobrador_id: profile.id,
          monto: amount,
          tasa_interes: interestRate,
          plazo_meses: term,
          monto_total: totalAmount,
          monto_restante: totalAmount,
          estado: 'activo',
          dia_cobro: form.preferredDay.toLowerCase(),
          fecha_inicio: form.startDate,
          fecha_fin: fechaFinStr,
        };
        
        console.log('=== PAYLOAD A ENVIAR A SUPABASE ===');
        console.log('Payload completo:', payload);
        console.log('fecha_inicio:', payload.fecha_inicio);
        console.log('fecha_fin:', payload.fecha_fin);
        console.log('¿fecha_fin es null o undefined?', payload.fecha_fin === null || payload.fecha_fin === undefined);

        const { data: newLoan, error: loanError } = await supabase
          .from('prestamos')
          .insert([payload])
          .select()
          .single();

        if (loanError) {
          console.error('Error al crear préstamo:', loanError);
          throw loanError;
        }

        console.log('Préstamo creado exitosamente:', newLoan);

        // Generar cuotas
        const cuotas = [];
        const startDate = new Date(form.startDate);
        
        for (let i = 1; i <= totalCuotas; i++) {
          const dueDate = new Date(startDate);
          
          if (frequency === 'semanal') {
            dueDate.setDate(dueDate.getDate() + (i - 1) * 7);
          } else if (frequency === 'quincenal') {
            dueDate.setDate(dueDate.getDate() + (i - 1) * 14);
          } else {
            dueDate.setMonth(dueDate.getMonth() + (i - 1));
          }

          cuotas.push({
            prestamo_id: newLoan.id,
            numero_cuota: i,
            fecha_vencimiento: dueDate.toISOString().split('T')[0],
            monto: installmentAmount,
          });
        }

        console.log('Generando cuotas:', cuotas);

        // Insertar cuotas
        if (cuotas.length > 0) {
          const { error: cuotasError } = await supabase
            .from('cuotas')
            .insert(cuotas);

          if (cuotasError) {
            console.error('Error al insertar cuotas:', cuotasError);
            throw cuotasError;
          }
          console.log('Cuotas insertadas exitosamente');
        }

        // Si es artículo, actualizar estado del inventario
        if (form.modality === 'articulo' && form.articleId) {
          await supabase
            .from('inventario')
            .update({ estado: 'Entregado' })
            .eq('id', form.articleId);
        }

        addNotification('success', 'Préstamo creado exitosamente');
      }

      if (!editing) {
        await loadLoans();
      }
      setShowModal(false);
    } catch (error: any) {
      console.error('Error al guardar préstamo:', error);
      addNotification('error', 'Error: ' + error.message);
    }
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
        <Button variant="outline" onClick={() => exportLoansPDF(filtered, clients)}>
          <Download size={18} /> Exportar PDF
        </Button>
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
                      {currentUser?.role !== 'solo_lectura' && (
                        <button 
                          onClick={() => openEdit(loan)} 
                          className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600" 
                          title="Editar préstamo"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
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
                          onClick={() => handleDeleteLoan(loan.id)}
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

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Préstamo' : 'Nuevo Préstamo'} size="xl">
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
                <div className="mt-4">
                  <h5 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <Calendar size={16} />
                    Calendario de Pagos (Día de cobro: {form.preferredDay})
                  </h5>
                  <div className="max-h-64 overflow-y-auto border border-purple-200 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-purple-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-purple-900">#</th>
                          <th className="px-3 py-2 text-left font-semibold text-purple-900">Fecha de Cobro</th>
                          <th className="px-3 py-2 text-right font-semibold text-purple-900">Monto Cuota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculation.schedule.map((row) => (
                          <tr key={row.installmentNumber} className="border-t hover:bg-purple-50">
                            <td className="px-3 py-2 font-medium text-purple-700">{row.installmentNumber}</td>
                            <td className="px-3 py-2 text-gray-700">{formatDate(row.dueDate)}</td>
                            <td className="px-3 py-2 text-right font-bold text-gray-900">{formatCurrency(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">
              <FileText size={16} /> {editing ? 'Actualizar Préstamo' : 'Crear Préstamo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail & Edit Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Detalle y Edición del Crédito" size="xl">
        {showDetail && (() => {
          const client = clients.find(c => c.id === showDetail.clientId);
          const paid = showDetail.payments.reduce((s, p) => s + p.amount, 0);
          
          // Calcular usando la función exacta
          const calculo = calcularPrestamo({
            montoSinInteres: showDetail.amount,
            tasaMensualPct: showDetail.interestRate,
            plazoMeses: showDetail.term,
            frecuencia: showDetail.type.charAt(0).toUpperCase() + showDetail.type.slice(1) as 'Semanal' | 'Quincenal' | 'Mensual'
          });
          
          const remaining = calculo.montoConInteres - paid;
          const progress = (paid / calculo.montoConInteres) * 100;
          
          // Generar tabla de cuotas con números enteros
          const schedule = [];
          const startDate = new Date(showDetail.startDate);
          const preferredDay = (showDetail.preferredDay || 'Lunes') as PreferredDay;
          for (let i = 1; i <= calculo.totalCuotas; i++) {
            const dueDate = calculateDueDate(startDate, i, showDetail.type.charAt(0).toUpperCase() + showDetail.type.slice(1) as 'Semanal' | 'Quincenal' | 'Mensual', preferredDay);
            schedule.push({
              number: i,
              date: dueDate.toISOString().split('T')[0],
              amount: Math.round(calculo.valorCuota),
              paid: i <= showDetail.payments.length,
              paymentDate: showDetail.payments[i-1]?.date || null
            });
          }
          
          return (
            <div className="space-y-6">
              {/* Información del Cliente y Crédito */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cliente</p>
                    <p className="font-bold text-gray-900">{client?.fullName}</p>
                    <p className="text-sm text-gray-600 font-mono">{client?.cedula}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tipo de Crédito</p>
                    <p className="font-bold text-gray-900 capitalize">{showDetail.type} - {showDetail.modality}</p>
                    <p className="text-sm text-gray-600">{showDetail.term} meses • Inicio: {formatDate(showDetail.startDate)}</p>
                    <p className="text-sm text-purple-600 font-medium">Día de cobro: {showDetail.preferredDay || 'Lunes'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Monto Principal</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculo.montoSinInteres)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tasa de Interés</p>
                    <p className="text-2xl font-bold text-purple-700">{calculo.etiquetaTasa}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total a Pagar</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculo.montoConInteres)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cuota (Entero)</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(Math.round(calculo.valorCuota))}</p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Progreso de Pago</span>
                  <span className="font-bold text-purple-700">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-700 h-4 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">✓ Pagado: {formatCurrency(paid)}</span>
                  <span className="text-red-600 font-medium">⏳ Pendiente: {formatCurrency(Math.round(remaining))}</span>
                </div>
              </div>

              {/* Tabla de Cuotas */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar size={20} className="text-purple-600" />
                  Tabla de Cuotas ({calculo.totalCuotas} cuotas de {formatCurrency(Math.round(calculo.valorCuota))}) - Día de cobro: {showDetail.preferredDay || 'Lunes'}
                </h4>
                <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-purple-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-purple-900">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-purple-900">Fecha de Cobro</th>
                        <th className="px-3 py-2 text-right font-semibold text-purple-900">Monto Cuota</th>
                        <th className="px-3 py-2 text-center font-semibold text-purple-900">Estado</th>
                        <th className="px-3 py-2 text-left font-semibold text-purple-900">Fecha de Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((cuota) => (
                        <tr key={cuota.number} className={`border-t ${cuota.paid ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-3 py-2 font-medium">{cuota.number}</td>
                          <td className="px-3 py-2">{formatDate(cuota.date)}</td>
                          <td className="px-3 py-2 text-right font-bold">{formatCurrency(cuota.amount)}</td>
                          <td className="px-3 py-2 text-center">
                            {cuota.paid ? (
                              <Badge variant="success">✓ Pagada</Badge>
                            ) : (
                              <Badge variant="warning">Pendiente</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {cuota.paymentDate ? formatDate(cuota.paymentDate) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Historial de Pagos */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600" />
                  Historial de Pagos Realizados
                </h4>
                {showDetail.payments.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {showDetail.payments.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                            <p className="text-xs text-gray-600">{formatDate(p.date)} • {p.method}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{p.receiptNumber}</p>
                          <Badge variant={p.synced ? 'success' : 'warning'}>
                            {p.synced ? '✓ Sincronizado' : '⏳ Pendiente'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <p className="text-gray-400 text-sm">Sin pagos registrados</p>
                  </div>
                )}
              </div>

              {/* Garantías */}
              {showDetail.guarantees && showDetail.guarantees.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Garantías</h4>
                  <div className="flex flex-wrap gap-2">
                    {showDetail.guarantees.map((g, i) => <Badge key={i} variant="info">{g}</Badge>)}
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {showDetail.observations && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Observaciones</h4>
                  <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    {showDetail.observations}
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
