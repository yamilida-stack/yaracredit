import { supabase } from '../lib/supabaseClient';
import type { Client, Loan, Payment, Article, User, Route, CashMovement } from '../types';

// ============================================
// CLIENTES
// ============================================
export async function fetchClientes(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createCliente(client: Omit<Client, 'id' | 'createdAt'>, createdBy?: string): Promise<Client> {
  // Solo enviar las columnas que existen en la tabla de Supabase
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre: client.fullName,
      cedula: client.cedula,
      telefono: client.phone,
      email: client.email || null,
      direccion: client.address,
      creado_por: createdBy || null,
      // Los siguientes campos NO existen en la tabla y se ignoran:
      // - whatsapp
      // - garante
      // - garante_telefono
      // - ocupacion
      // - ingreso_mensual
      // - lat
      // - lng
      // - referencias
      // - observaciones
      // - nivel_riesgo
    })
    .select()
    .single();
  
  if (error) throw error;
  return mapClienteFromDB(data);
}

export async function updateCliente(id: string, updates: Partial<Client>): Promise<void> {
  const dbUpdates: any = {};
  
  // Solo actualizar las columnas que existen en la tabla de Supabase
  if (updates.fullName) dbUpdates.nombre = updates.fullName;
  if (updates.cedula) dbUpdates.cedula = updates.cedula;
  if (updates.address) dbUpdates.direccion = updates.address;
  if (updates.phone) dbUpdates.telefono = updates.phone;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  
  // Los siguientes campos NO existen en la tabla y se ignoran:
  // - whatsapp
  // - garante
  // - garante_telefono
  // - ocupacion
  // - ingreso_mensual
  // - lat
  // - lng
  // - referencias
  // - observaciones
  // - nivel_riesgo

  const { error } = await supabase
    .from('clientes')
    .update(dbUpdates)
    .eq('id', id);
  
  if (error) throw error;
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

function mapClienteFromDB(db: any): Client {
  // Solo mapear las columnas que existen en la tabla de Supabase
  return {
    id: db.id,
    fullName: db.nombre,
    cedula: db.cedula,
    address: db.direccion || '',
    phone: db.telefono,
    whatsapp: db.telefono, // Usar el mismo teléfono como WhatsApp
    email: db.email,
    guarantor: undefined, // No existe en la BD
    guarantorPhone: undefined, // No existe en la BD
    lat: undefined, // No existe en la BD
    lng: undefined, // No existe en la BD
    occupation: undefined, // No existe en la BD
    monthlyIncome: undefined, // No existe en la BD
    references: undefined, // No existe en la BD
    observations: undefined, // No existe en la BD
    riskLevel: undefined, // No existe en la BD
    createdAt: db.created_at,
  };
}

// ============================================
// INVENTARIO / ARTÍCULOS
// ============================================
export async function fetchInventario(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('inventario')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(mapArticleFromDB);
}

export async function createArticle(article: Omit<Article, 'id' | 'createdAt'>): Promise<Article> {
  const { data, error } = await supabase
    .from('inventario')
    .insert({
      nombre: article.name,
      descripcion: article.description,
      categoria: article.category,
      marca: article.brand,
      modelo: article.model,
      numero_serie: article.serialNumber,
      imei: article.imei,
      precio_costo: article.costPrice,
      precio_venta: article.salePrice,
      cantidad: article.quantity,
      stock_minimo: article.minStock,
      observaciones: article.observations,
    })
    .select()
    .single();
  
  if (error) throw error;
  return mapArticleFromDB(data);
}

export async function updateArticleStatus(id: string, status: 'Disponible' | 'Entregado' | 'Reservado'): Promise<void> {
  const { error } = await supabase
    .from('inventario')
    .update({ estado: status })
    .eq('id', id);
  
  if (error) throw error;
}

function mapArticleFromDB(db: any): Article {
  return {
    id: db.id,
    name: db.nombre,
    description: db.descripcion || '',
    category: db.categoria || '',
    brand: db.marca,
    model: db.modelo,
    serialNumber: db.numero_serie,
    imei: db.imei,
    costPrice: db.precio_costo,
    salePrice: db.precio_venta,
    quantity: db.cantidad,
    minStock: db.stock_minimo,
    observations: db.observaciones,
    createdAt: db.created_at,
  };
}

// ============================================
// CRÉDITOS / PRÉSTAMOS
// ============================================
export async function fetchCreditos(): Promise<Loan[]> {
  const { data, error } = await supabase
    .from('prestamos')
    .select(`
      *,
      clientes!inner(*),
      cuotas(*),
      cobros(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(mapCreditoFromDB);
}

export async function createCredito(
  loan: Omit<Loan, 'id' | 'createdAt' | 'payments'>,
  cuotas: Array<{ numero: number; fecha: string; monto: number }>
): Promise<Loan> {
  // Calcular fecha_fin (último cobro)
  let fechaFin = loan.startDate;
  if (cuotas.length > 0) {
    fechaFin = cuotas[cuotas.length - 1].fecha;
  }
  
  console.log('=== CREANDO CRÉDITO EN SUPABASE SERVICE ===');
  console.log('Fecha inicio:', loan.startDate);
  console.log('Fecha fin calculada:', fechaFin);
  console.log('Número de cuotas:', cuotas.length);

  // 1. Insertar crédito
  const payload = {
    cliente_id: loan.clientId,
    cobrador_id: loan.assignedCollector,
    monto: loan.amount,
    tasa_interes: loan.interestRate,
    plazo_meses: loan.term,
    monto_total: loan.totalAmount,
    saldo_pendiente: loan.totalAmount,
    estado: loan.status,
    dia_cobro: loan.preferredDay?.toLowerCase(),
    fecha_inicio: loan.startDate,
    fecha_fin: fechaFin,
  };
  
  console.log('Payload a enviar:', payload);

  const { data: prestamoData, error: prestamoError } = await supabase
    .from('prestamos')
    .insert(payload)
    .select()
    .single();
  
  if (prestamoError) throw prestamoError;

  // 2. Insertar cuotas
  if (cuotas.length > 0) {
    const cuotasToInsert = cuotas.map(c => ({
      prestamo_id: prestamoData.id,
      numero_cuota: c.numero,
      fecha_vencimiento: c.fecha,
      monto: c.monto,
    }));

    const { error: cuotasError } = await supabase
      .from('cuotas')
      .insert(cuotasToInsert);
    
    if (cuotasError) throw cuotasError;
  }

  // 3. Si es artículo, actualizar estado del inventario
  if (loan.modality === 'articulo' && loan.articleId) {
    await updateArticleStatus(loan.articleId, 'Entregado');
  }

  return mapCreditoFromDB({ ...prestamoData, cuotas: [], cobros: [] });
}

export async function updateCreditoStatus(id: string, status: 'ACTIVO' | 'MORA' | 'CANCELADO'): Promise<void> {
  const { error } = await supabase
    .from('prestamos')
    .update({ estado: status })
    .eq('id', id);
  
  if (error) throw error;
}

function mapCreditoFromDB(db: any): Loan {
  return {
    id: db.id,
    clientId: db.cliente_id,
    type: 'mensual', // Valor por defecto, ya no viene de la BD
    modality: 'efectivo', // Valor por defecto, ya no viene de la BD
    amount: db.monto,
    interestRate: db.tasa_interes,
    term: db.plazo_meses,
    installmentAmount: db.monto_total / db.plazo_meses, // Calcular cuota
    totalAmount: db.monto_total,
    totalInterest: db.monto_total - db.monto, // Calcular interés
    startDate: db.fecha_inicio,
    status: db.estado.toLowerCase(),
    assignedCollector: db.cobrador_id,
    articleId: undefined, // Ya no se guarda en la BD
    guarantees: undefined, // Ya no se guarda en la BD
    observations: undefined, // Ya no se guarda en la BD
    purpose: undefined, // Ya no se guarda en la BD
    preferredDay: db.dia_cobro,
    payments: (db.cobros || []).map(mapPagoFromDB),
    createdAt: db.created_at,
  };
}

// ============================================
// PAGOS
// ============================================
export async function registerPayment(payment: {
  creditoId: string;
  cuotaId?: string;
  clientId: string;
  amount: number;
  method: 'efectivo' | 'transferencia';
  collectorId: string;
  isLate: boolean;
  date: string;
}): Promise<Payment> {
  console.log('=== REGISTRANDO PAGO EN SUPABASE ===');
  console.log('Datos del pago:', payment);

  try {
    // 1. Generar número de recibo simple
    const numeroRecibo = `R-${String(Date.now()).slice(-6)}`;
    console.log('Número de recibo generado:', numeroRecibo);
    
    // 2. Insertar cobro directamente en la tabla cobros
    const { data, error } = await supabase
      .from('cobros')
      .insert({
        prestamo_id: payment.creditoId,
        monto: payment.amount,
        fecha_cobro: payment.date,
        metodo_pago: payment.method,
        nota: `Recibo: ${numeroRecibo}`,
        creado_por: payment.collectorId,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error al insertar cobro:', error);
      throw error;
    }

    console.log('Cobro insertado exitosamente:', data);

    // 3. Actualizar cuota si existe
    if (payment.cuotaId) {
      console.log('Actualizando cuota:', payment.cuotaId);
      const { error: cuotaError } = await supabase
        .from('cuotas')
        .update({
          estado: 'pagada',
          fecha_pago: payment.date,
        })
        .eq('id', payment.cuotaId);
      
      if (cuotaError) {
        console.error('Error al actualizar cuota:', cuotaError);
      }
    }

    // 4. Actualizar saldo pendiente del préstamo
    console.log('Actualizando saldo del préstamo:', payment.creditoId);
    const { data: prestamoActual, error: prestamoError } = await supabase
      .from('prestamos')
      .select('saldo_pendiente')
      .eq('id', payment.creditoId)
      .single();
    
    if (!prestamoError && prestamoActual) {
      const nuevoSaldo = Math.max(0, prestamoActual.saldo_pendiente - payment.amount);
      const nuevoEstado = nuevoSaldo === 0 ? 'pagado' : 'activo';
      
      await supabase
        .from('prestamos')
        .update({
          saldo_pendiente: nuevoSaldo,
          estado: nuevoEstado,
        })
        .eq('id', payment.creditoId);
      
      console.log('Saldo actualizado:', nuevoSaldo, 'Estado:', nuevoEstado);
    }

    console.log('Pago registrado exitosamente');
    return mapPagoFromDB(data);
  } catch (error: any) {
    console.error('Error completo al registrar pago:', error);
    throw error;
  }
}
function mapPagoFromDB(db: any): Payment {
  return {
    id: db.id,
    loanId: db.prestamo_id,
    clientId: '', // Ya no viene de la BD
    amount: db.monto,
    method: db.metodo_pago,
    date: db.fecha_cobro,
    collectorId: db.creado_por,
    receiptNumber: db.nota?.replace('Recibo: ', '') || '',
    isLate: false, // Ya no viene de la BD
    lat: undefined, // Ya no viene de la BD
    lng: undefined, // Ya no viene de la BD
    synced: true,
  };
}

// ============================================
// USUARIOS
// ============================================
export async function fetchUsuarios(): Promise<User[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(mapUserFromDB);
}

function mapUserFromDB(db: any): User {
  return {
    id: db.id,
    name: db.nombre,
    pin: db.pin,
    role: db.rol,
    active: db.activo,
    createdAt: db.created_at,
  };
}

// ============================================
// RUTAS
// ============================================
export async function fetchRutas(): Promise<Route[]> {
  const { data, error } = await supabase
    .from('rutas')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(mapRouteFromDB);
}

function mapRouteFromDB(db: any): Route {
  return {
    id: db.id,
    name: db.nombre,
    collectorId: db.cobrador_id,
    clientIds: db.clientes_ids || [],
    active: db.activa,
    createdAt: db.created_at,
  };
}

// ============================================
// CAJA
// ============================================
export async function fetchMovimientosCaja(fecha?: string): Promise<CashMovement[]> {
  let query = supabase.from('movimientos_caja').select('*');
  
  if (fecha) {
    query = query.eq('fecha', fecha);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(mapMovimientoFromDB);
}

function mapMovimientoFromDB(db: any): CashMovement {
  return {
    id: db.id,
    type: db.tipo,
    amount: db.monto,
    description: db.descripcion,
    category: db.categoria,
    date: db.fecha,
    userId: db.usuario_id,
    relatedPaymentId: db.pago_id,
  };
}
