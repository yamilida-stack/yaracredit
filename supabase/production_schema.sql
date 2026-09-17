-- ============================================
-- TABLA DE PAGOS (PRODUCCIÓN)
-- ============================================

CREATE TABLE IF NOT EXISTS public.pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prestamo_id UUID REFERENCES public.prestamos(id) ON DELETE CASCADE,
  monto DECIMAL(12,2) NOT NULL,
  fecha DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios autenticados pueden ver pagos"
  ON public.pagos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar pagos"
  ON public.pagos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar pagos"
  ON public.pagos
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar pagos"
  ON public.pagos
  FOR DELETE
  TO authenticated
  USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pagos_prestamo_id ON public.pagos(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON public.pagos(fecha);

-- ============================================
-- TABLA DE CONFIGURACIONES (PRODUCCIÓN)
-- ============================================

CREATE TABLE IF NOT EXISTS public.configuraciones (
  id INTEGER PRIMARY KEY DEFAULT 1,
  nombre_empresa TEXT,
  telefono_empresa TEXT,
  direccion_empresa TEXT,
  tasa_interes_default DECIMAL(5,2),
  plazo_default INTEGER,
  dias_gracia INTEGER,
  moneda TEXT,
  modo_oscuro BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar registro inicial si no existe
INSERT INTO public.configuraciones (id, nombre_empresa, telefono_empresa, direccion_empresa, tasa_interes_default, plazo_default, dias_gracia, moneda, modo_oscuro)
VALUES (1, 'YaraCredit', '0000-0000', 'Dirección de la empresa', 14, 3, 3, 'C$', false)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.configuraciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios autenticados pueden ver configuraciones"
  ON public.configuraciones
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo administradores pueden actualizar configuraciones"
  ON public.configuraciones
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- ACTUALIZAR TABLA PRESTAMOS
-- ============================================

-- Agregar columna monto_restante si no existe
ALTER TABLE public.prestamos
ADD COLUMN IF NOT EXISTS monto_restante DECIMAL(12,2);

-- Inicializar monto_restante con monto_total para préstamos existentes
UPDATE public.prestamos
SET monto_restante = monto_total
WHERE monto_restante IS NULL;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE public.pagos IS 'Tabla de pagos realizados a préstamos';
COMMENT ON COLUMN public.pagos.prestamo_id IS 'Referencia al préstamo';
COMMENT ON COLUMN public.pagos.monto IS 'Monto del pago';
COMMENT ON COLUMN public.pagos.fecha IS 'Fecha del pago';

COMMENT ON TABLE public.configuraciones IS 'Configuración global del sistema';
COMMENT ON COLUMN public.configuraciones.nombre_empresa IS 'Nombre de la empresa';
COMMENT ON COLUMN public.configuraciones.telefono_empresa IS 'Teléfono de la empresa';
COMMENT ON COLUMN public.configuraciones.direccion_empresa IS 'Dirección de la empresa';
COMMENT ON COLUMN public.configuraciones.tasa_interes_default IS 'Tasa de interés predeterminada';
COMMENT ON COLUMN public.configuraciones.plazo_default IS 'Plazo predeterminado en meses';
COMMENT ON COLUMN public.configuraciones.dias_gracia IS 'Días de gracia';
COMMENT ON COLUMN public.configuraciones.moneda IS 'Moneda del sistema';
COMMENT ON COLUMN public.configuraciones.modo_oscuro IS 'Modo oscuro activado';
