-- ============================================
-- TABLA DE CONFIGURACIÓN DEL SISTEMA
-- ============================================

CREATE TABLE IF NOT EXISTS public.configuracion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT DEFAULT 'text' CHECK (tipo IN ('text', 'number', 'boolean', 'json')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios autenticados pueden ver configuración" 
  ON public.configuracion 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Solo administradores pueden insertar configuración" 
  ON public.configuracion 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Solo administradores pueden actualizar configuración" 
  ON public.configuracion 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON public.configuracion(clave);
CREATE INDEX IF NOT EXISTS idx_configuracion_updated_at ON public.configuracion(updated_at);

-- ============================================
-- DATOS INICIALES DE CONFIGURACIÓN
-- ============================================

INSERT INTO public.configuracion (clave, valor, descripcion, tipo) VALUES
  ('nombre_empresa', 'YaraCredit', 'Nombre de la empresa', 'text'),
  ('telefono_empresa', '0000-0000', 'Teléfono de contacto de la empresa', 'text'),
  ('direccion_empresa', 'Dirección de la empresa', 'Dirección física de la empresa', 'text'),
  ('tasa_interes_default', '14', 'Tasa de interés predeterminada (% mensual)', 'number'),
  ('plazo_default', '3', 'Plazo predeterminado en meses', 'number'),
  ('dias_gracia', '3', 'Días de gracia antes de aplicar recargo por mora', 'number'),
  ('moneda', 'C$', 'Moneda utilizada en el sistema', 'text'),
  ('modo_oscuro', 'false', 'Activar modo oscuro en la interfaz', 'boolean'),
  ('tamanio_recibo', '50mm', 'Tamaño del recibo térmico (50mm u 80mm)', 'text'),
  ('comision_cobradores', '5', 'Porcentaje de comisión para cobradores', 'number'),
  ('recargo_mora', '2', 'Porcentaje de recargo por mora', 'number'),
  ('encabezado_recibo', 'YARACREDIT - Sistema de Préstamos', 'Texto del encabezado en los recibos', 'text'),
  ('pie_recibo', '¡Gracias por su pago!', 'Texto del pie de página en los recibos', 'text'),
  ('plantilla_whatsapp', 'Hola {cliente}, le recordamos que tiene un pago pendiente de {monto} para hoy. Gracias por su preferencia.', 'Plantilla de mensaje para WhatsApp', 'text'),
  ('notificaciones_push', 'true', 'Habilitar notificaciones push', 'boolean'),
  ('respaldo_automatico', 'true', 'Habilitar respaldo automático diario', 'boolean')
ON CONFLICT (clave) DO NOTHING;

-- ============================================
-- FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION public.update_configuracion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trigger_update_configuracion_updated_at ON public.configuracion;
CREATE TRIGGER trigger_update_configuracion_updated_at
  BEFORE UPDATE ON public.configuracion
  FOR EACH ROW
  EXECUTE FUNCTION public.update_configuracion_updated_at();

-- ============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE public.configuracion IS 'Tabla de configuración global del sistema YaraCredit';
COMMENT ON COLUMN public.configuracion.clave IS 'Clave única de la configuración (ej: nombre_empresa, tasa_interes_default)';
COMMENT ON COLUMN public.configuracion.valor IS 'Valor de la configuración (almacenado como texto)';
COMMENT ON COLUMN public.configuracion.descripcion IS 'Descripción de qué representa esta configuración';
COMMENT ON COLUMN public.configuracion.tipo IS 'Tipo de dato: text, number, boolean, json';
COMMENT ON COLUMN public.configuracion.updated_at IS 'Fecha y hora de la última actualización';
COMMENT ON COLUMN public.configuracion.created_at IS 'Fecha y hora de creación del registro';
