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

export async function createCliente(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre_completo: client.fullName,
      cedula: client.cedula,
      direccion: client.address,
      telefono: client.phone,
      whatsapp: client.whatsapp,
      email: client.email,
      garante: client.guarantor,
      garante_telefono: client.guarantorPhone,
      lat: client.lat,
      lng: client.lng,
      ocupacion: client.occupation,
      ingreso_mensual: client.monthlyIncome,
      referencias: client.references,
      observaciones: client.observations,
      nivel_riesgo: client.riskLevel,
    })
    .select()
    .single();
  
  if (error) throw error;
  return mapClienteFromDB(data);
}

export async function updateCliente(id: string, updates: Partial<Client>): Promise<void> {
  const dbUpdates: any = {};
  if (updates.fullName) dbUpdates.nombre_completo = updates.fullName;
  if (updates.cedula) dbUpdates.cedula = updates.cedula;
  if (updates.address) dbUpdates.direccion = updates.address;
  if (updates.phone) dbUpdates.telefono = updates.phone;
  if (updates.whatsapp) dbUpdates.whatsapp = updates.whatsapp;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.guarantor !== undefined) dbUpdates.garante = updates.guarantor;
  if (updates.guarantorPhone !== undefined) dbUpdates.garante_telefono = updates.guarantorPhone;
  if (updates.observations !== undefined) dbUpdates.observaciones = updates.observations;

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
  return {
    id: db.id,
    fullName: db.nombre_completo,
    cedula: db.cedula,
    address: db.direccion || '',
    phone: db.telefono,
    whatsapp: db.whatsapp || db.telefono,
    email: db.email,
    guarantor: db.garante,
    guarantorPhone: db.garante_telefono,
    lat: db.lat,
    lng: db.lng,
    occupation: db.ocupacion,
    monthlyIncome: db.ingreso_mensual,
    references: db.referencias,
    observations: db.observaciones,
    riskLevel: db.nivel_riesgo,
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
    .from('creditos')
    .select(`
      *,
      clientes!inner(*),
      cuotas(*),
      pagos(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(mapCreditoFromDB);
}

export async function createCredito(
  loan: Omit<Loan, 'id' | 'createdAt' | 'payments'>,
  cuotas: Array<{ numero: number; fecha: string; monto: number }>
): Promise<Loan> {
  // 1. Insertar crédito
  const { data: creditoData, error: creditoError } = await supabase
    .from('creditos')
    .insert({
      cliente_id: loan.clientId,
      tipo: loan.type,
      modalidad: loan.modality,
      monto_principal: loan.amount,
      tasa_mensual: loan.interestRate,
      plazo_meses: loan.term,
      monto_interes: loan.totalInterest,
      monto_total: loan.totalAmount,
      valor_cuota: loan.installmentAmount,
      total_cuotas: cuotas.length,
      fecha_inicio: loan.startDate,
      dia_cobro_preferido: loan.preferredDay,
      estado: loan.status.toUpperCase(),
      cobrador_asignado: loan.assignedCollector,
      articulo_id: loan.articleId,
      garantias: loan.guarantees,
      proposito: loan.purpose,
      observaciones: loan.observations,
    })
    .select()
    .single();
  
  if (creditoError) throw creditoError;

  // 2. Insertar cuotas
  if (cuotas.length > 0) {
    const cuotasToInsert = cuotas.map(c => ({
      credito_id: creditoData.id,
      numero_cuota: c.numero,
      fecha_cobro: c.fecha,
      monto_cuota: c.monto,
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

  return mapCreditoFromDB({ ...creditoData, cuotas: [], pagos: [] });
}

export async function updateCreditoStatus(id: string, status: 'ACTIVO' | 'MORA' | 'CANCELADO'): Promise<void> {
  const { error } = await supabase
    .from('creditos')
    .update({ estado: status })
    .eq('id', id);
  
  if (error) throw error;
}

function mapCreditoFromDB(db: any): Loan {
  return {
    id: db.id,
    clientId: db.cliente_id,
    type: db.tipo,
    modality: db.modalidad,
    amount: db.monto_principal,
    interestRate: db.tasa_mensual,
    term: db.plazo_meses,
    installmentAmount: db.valor_cuota,
    totalAmount: db.monto_total,
    totalInterest: db.monto_interes,
    startDate: db.fecha_inicio,
    status: db.estado.toLowerCase(),
    assignedCollector: db.cobrador_asignado,
    articleId: db.articulo_id,
    guarantees: db.garantias,
    observations: db.observaciones,
    purpose: db.proposito,
    preferredDay: db.dia_cobro_preferido,
    payments: (db.pagos || []).map(mapPagoFromDB),
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
  // 1. Generar número de recibo
  const { data: reciboData } = await supabase.rpc('generar_numero_recibo');
  const numeroRecibo = reciboData || `R-${String(Date.now()).slice(-4)}`;

  // 2. Insertar pago
  const { data, error } = await supabase
    .from('pagos')
    .insert({
      credito_id: payment.creditoId,
      cuota_id: payment.cuotaId,
      cliente_id: payment.clientId,
      monto: payment.amount,
      metodo_pago: payment.method,
      numero_recibo: numeroRecibo,
      cobrador_id: payment.collectorId,
      es_mora: payment.isLate,
      fecha_pago: payment.date,
      sincronizado: true,
    })
    .select()
    .single();
  
  if (error) throw error;

  // 3. Actualizar cuota si existe
  if (payment.cuotaId) {
    await supabase
      .from('cuotas')
      .update({
        monto_pagado: payment.amount,
        estado: 'PAGADO',
        fecha_pago: payment.date,
      })
      .eq('id', payment.cuotaId);
  }

  // 4. Registrar movimiento de caja (ingreso)
  await supabase.from('movimientos_caja').insert({
    tipo: 'ingreso',
    monto: payment.amount,
    descripcion: `Pago cuota - Recibo ${numeroRecibo}`,
    usuario_id: payment.collectorId,
    pago_id: data.id,
    fecha: payment.date,
  });

  return mapPagoFromDB(data);
}

function mapPagoFromDB(db: any): Payment {
  return {
    id: db.id,
    loanId: db.credito_id,
    clientId: db.cliente_id,
    amount: db.monto,
    method: db.metodo_pago,
    date: db.fecha_pago,
    collectorId: db.cobrador_id,
    receiptNumber: db.numero_recibo,
    isLate: db.es_mora,
    lat: db.lat,
    lng: db.lng,
    synced: db.sincronizado,
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
