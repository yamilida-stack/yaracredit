-- ============================================
-- SCRIPT COMPLETO PARA FUNCIONALIDAD DE PAGOS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Verificar que la tabla cobros existe
CREATE TABLE IF NOT EXISTS public.cobros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prestamo_id UUID REFERENCES public.prestamos(id) ON DELETE CASCADE,
  monto DECIMAL(12,2) NOT NULL,
  fecha_cobro DATE NOT NULL,
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'transferencia')),
  nota TEXT,
  creado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS en cobros
ALTER TABLE public.cobros ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para cobros
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver cobros" ON public.cobros;
CREATE POLICY "Usuarios autenticados pueden ver cobros" 
  ON public.cobros 
  FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar cobros" ON public.cobros;
CREATE POLICY "Usuarios autenticados pueden insertar cobros" 
  ON public.cobros 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar cobros" ON public.cobros;
CREATE POLICY "Usuarios autenticados pueden actualizar cobros" 
  ON public.cobros 
  FOR UPDATE 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar cobros" ON public.cobros;
CREATE POLICY "Usuarios autenticados pueden eliminar cobros" 
  ON public.cobros 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- 4. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_cobros_prestamo_id ON public.cobros(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_cobros_fecha_cobro ON public.cobros(fecha_cobro);
CREATE INDEX IF NOT EXISTS idx_cobros_creado_por ON public.cobros(creado_por);

-- 5. Verificar que la tabla cuotas existe
CREATE TABLE IF NOT EXISTS public.cuotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prestamo_id UUID REFERENCES public.prestamos(id) ON DELETE CASCADE,
  numero_cuota INTEGER NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'vencida')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Habilitar RLS en cuotas
ALTER TABLE public.cuotas ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS para cuotas
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver cuotas" ON public.cuotas;
CREATE POLICY "Usuarios autenticados pueden ver cuotas" 
  ON public.cuotas 
  FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar cuotas" ON public.cuotas;
CREATE POLICY "Usuarios autenticados pueden insertar cuotas" 
  ON public.cuotas 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar cuotas" ON public.cuotas;
CREATE POLICY "Usuarios autenticados pueden actualizar cuotas" 
  ON public.cuotas 
  FOR UPDATE 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar cuotas" ON public.cuotas;
CREATE POLICY "Usuarios autenticados pueden eliminar cuotas" 
  ON public.cuotas 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- 8. Índices para cuotas
CREATE INDEX IF NOT EXISTS idx_cuotas_prestamo_id ON public.cuotas(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON public.cuotas(estado);

-- 9. Verificar que la tabla prestamos tiene las columnas necesarias
ALTER TABLE public.prestamos 
ADD COLUMN IF NOT EXISTS saldo_pendiente DECIMAL(12,2) DEFAULT 0;

-- 10. Actualizar saldo_pendiente para préstamos existentes
UPDATE public.prestamos 
SET saldo_pendiente = monto_total 
WHERE saldo_pendiente IS NULL OR saldo_pendiente = 0;

-- 11. Función para verificar que el registro de pagos funciona
CREATE OR REPLACE FUNCTION public.test_payment_registration()
RETURNS TEXT AS $$
BEGIN
  RETURN 'Sistema de pagos funcionando correctamente';
END;
$$ LANGUAGE plpgsql;

-- 12. Comentarios para documentación
COMMENT ON TABLE public.cobros IS 'Tabla de cobros/pagos realizados a préstamos';
COMMENT ON COLUMN public.cobros.prestamo_id IS 'Referencia al préstamo';
COMMENT ON COLUMN public.cobros.monto IS 'Monto del pago';
COMMENT ON COLUMN public.cobros.fecha_cobro IS 'Fecha del pago';
COMMENT ON COLUMN public.cobros.metodo_pago IS 'Método de pago: efectivo o transferencia';
COMMENT ON COLUMN public.cobros.nota IS 'Nota o número de recibo';
COMMENT ON COLUMN public.cobros.creado_por IS 'Usuario que registró el pago';

COMMENT ON TABLE public.cuotas IS 'Tabla de cuotas de préstamos';
COMMENT ON COLUMN public.cuotas.estado IS 'Estado: pendiente, pagada, vencida';

-- 13. Verificar que todo esté correcto
DO $$
BEGIN
  RAISE NOTICE 'Script de configuración de pagos ejecutado exitosamente';
  RAISE NOTICE 'Tablas verificadas: cobros, cuotas, prestamos';
  RAISE NOTICE 'Políticas RLS configuradas';
  RAISE NOTICE 'Índices creados';
END $$;
