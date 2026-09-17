-- ============================================
-- YARACREDIT - ESQUEMA DE BASE DE DATOS
-- Ejecutar este script en Supabase SQL Editor
-- ============================================

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  pin TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'gerente', 'cobrador', 'solo_lectura')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  cedula TEXT NOT NULL UNIQUE,
  direccion TEXT,
  telefono TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  garante TEXT,
  garante_telefono TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  ocupacion TEXT,
  ingreso_mensual DECIMAL(12, 2),
  referencias TEXT,
  observaciones TEXT,
  nivel_riesgo TEXT CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Inventario/Artículos
CREATE TABLE IF NOT EXISTS inventario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,
  imei TEXT,
  precio_costo DECIMAL(12, 2) NOT NULL,
  precio_venta DECIMAL(12, 2) NOT NULL,
  cantidad INTEGER DEFAULT 1,
  stock_minimo INTEGER DEFAULT 1,
  estado TEXT DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Entregado', 'Reservado')),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Créditos/Préstamos
CREATE TABLE IF NOT EXISTS creditos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('semanal', 'quincenal', 'mensual')),
  modalidad TEXT NOT NULL CHECK (modalidad IN ('efectivo', 'articulo')),
  monto_principal DECIMAL(12, 2) NOT NULL,
  tasa_mensual DECIMAL(5, 2) NOT NULL,
  plazo_meses INTEGER NOT NULL,
  monto_interes DECIMAL(12, 2) NOT NULL,
  monto_total DECIMAL(12, 2) NOT NULL,
  valor_cuota DECIMAL(12, 2) NOT NULL,
  total_cuotas INTEGER NOT NULL,
  monto_pagado DECIMAL(12, 2) DEFAULT 0,
  fecha_inicio DATE NOT NULL,
  dia_cobro_preferido TEXT,
  estado TEXT DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'MORA', 'CANCELADO', 'REFINANCIADO')),
  cobrador_asignado UUID REFERENCES usuarios(id),
  articulo_id UUID REFERENCES inventario(id),
  garantias TEXT[],
  proposito TEXT,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Cuotas
CREATE TABLE IF NOT EXISTS cuotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credito_id UUID REFERENCES creditos(id) ON DELETE CASCADE,
  numero_cuota INTEGER NOT NULL,
  fecha_cobro DATE NOT NULL,
  monto_cuota DECIMAL(12, 2) NOT NULL,
  monto_pagado DECIMAL(12, 2) DEFAULT 0,
  estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PAGADO', 'PARCIAL', 'VENCIDO')),
  fecha_pago DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Pagos
CREATE TABLE IF NOT EXISTS pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credito_id UUID REFERENCES creditos(id) ON DELETE CASCADE,
  cuota_id UUID REFERENCES cuotas(id),
  cliente_id UUID REFERENCES clientes(id),
  monto DECIMAL(12, 2) NOT NULL,
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'transferencia')),
  numero_recibo TEXT UNIQUE,
  cobrador_id UUID REFERENCES usuarios(id),
  es_mora BOOLEAN DEFAULT false,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  sincronizado BOOLEAN DEFAULT false,
  fecha_pago DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Rutas
CREATE TABLE IF NOT EXISTS rutas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  cobrador_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  clientes_ids UUID[] DEFAULT '{}',
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Movimientos de Caja
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  monto DECIMAL(12, 2) NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  usuario_id UUID REFERENCES usuarios(id),
  pago_id UUID REFERENCES pagos(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Arqueo de Caja
CREATE TABLE IF NOT EXISTS arqueos_caja (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  balance_apertura DECIMAL(12, 2) NOT NULL,
  balance_cierre DECIMAL(12, 2),
  total_ingresos DECIMAL(12, 2) DEFAULT 0,
  total_egresos DECIMAL(12, 2) DEFAULT 0,
  cerrado BOOLEAN DEFAULT false,
  cerrado_por UUID REFERENCES usuarios(id),
  cerrado_en TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Planilla
CREATE TABLE IF NOT EXISTS planillas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  salario_base DECIMAL(12, 2) NOT NULL,
  comisiones DECIMAL(12, 2) DEFAULT 0,
  horas_extras DECIMAL(12, 2) DEFAULT 0,
  bonos DECIMAL(12, 2) DEFAULT 0,
  deducciones DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  pagado BOOLEAN DEFAULT false,
  fecha_pago DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON clientes(cedula);
CREATE INDEX IF NOT EXISTS idx_creditos_cliente ON creditos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_creditos_estado ON creditos(estado);
CREATE INDEX IF NOT EXISTS idx_cuotas_credito ON cuotas(credito_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_fecha ON cuotas(fecha_cobro);
CREATE INDEX IF NOT EXISTS idx_pagos_credito ON pagos(credito_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_inventario_estado ON inventario(estado);

-- Función para generar número de recibo automático
CREATE OR REPLACE FUNCTION generar_numero_recibo()
RETURNS TEXT AS $$
DECLARE
  nuevo_numero TEXT;
  ultimo_numero INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_recibo FROM 3) AS INTEGER)), 0) + 1
  INTO ultimo_numero
  FROM pagos;
  
  nuevo_numero := 'R-' || LPAD(ultimo_numero::TEXT, 4, '0');
  RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar monto_pagado en créditos automáticamente
CREATE OR REPLACE FUNCTION actualizar_monto_pagado_credito()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creditos
  SET monto_pagado = (
    SELECT COALESCE(SUM(monto), 0)
    FROM pagos
    WHERE credito_id = NEW.credito_id
  ),
  estado = CASE
    WHEN (SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE credito_id = NEW.credito_id) >= monto_total
    THEN 'CANCELADO'
    ELSE estado
  END
  WHERE id = NEW.credito_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_monto_pagado
AFTER INSERT OR UPDATE ON pagos
FOR EACH ROW
EXECUTE FUNCTION actualizar_monto_pagado_credito();

-- Datos de ejemplo (opcional)
INSERT INTO usuarios (nombre, pin, rol) VALUES
  ('Admin Principal', '1234', 'admin'),
  ('María García', '2345', 'gerente'),
  ('Carlos López', '3456', 'cobrador'),
  ('Ana Martínez', '4567', 'cobrador')
ON CONFLICT DO NOTHING;
