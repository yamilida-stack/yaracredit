-- ============================================
-- CREAR TABLA CUOTAS
-- Ejecutar este script en Supabase SQL Editor
-- ============================================

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

-- Habilitar Row Level Security
ALTER TABLE public.cuotas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios pueden ver cuotas" ON cuotas FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden insertar cuotas" ON cuotas FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden actualizar cuotas" ON cuotas FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden eliminar cuotas" ON cuotas FOR DELETE
USING (auth.role() = 'authenticated');

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_cuotas_prestamo_id ON public.cuotas(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_fecha_vencimiento ON public.cuotas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON public.cuotas(estado);
