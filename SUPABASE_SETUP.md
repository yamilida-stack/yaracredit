# Guía de Integración con Supabase

## 📋 Requisitos Previos

1. Cuenta en [Supabase](https://supabase.com)
2. Proyecto creado en Supabase
3. Variables de entorno configuradas

## 🚀 Pasos de Implementación

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Dónde encontrar estos valores:**
- Ve a tu proyecto en Supabase
- Settings → API
- Copia "Project URL" y "anon public" key

### 2. Crear las Tablas en Supabase

1. Ve a tu proyecto en Supabase
2. SQL Editor (menú lateral)
3. Copia y pega el contenido de `supabase/schema.sql`
4. Ejecuta el script

Esto creará todas las tablas necesarias:
- `usuarios` - Usuarios del sistema
- `clientes` - Clientes
- `inventario` - Artículos/Productos
- `creditos` - Préstamos
- `cuotas` - Cuotas de cada préstamo
- `pagos` - Pagos realizados
- `rutas` - Rutas de cobradores
- `movimientos_caja` - Movimientos de caja
- `arqueos_caja` - Arqueos diarios
- `planillas` - Planilla de empleados

### 3. Verificar la Conexión

La aplicación ya está configurada para usar Supabase. Los componentes usan los hooks personalizados:

```typescript
import { useClientes, useCreditos, useInventario } from './hooks/useSupabase';

function MiComponente() {
  const { data: clientes, loading, error } = useClientes();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  
  return <div>{/* Renderizar clientes */}</div>;
}
```

### 4. Estructura de Archivos

```
src/
├── lib/
│   └── supabaseClient.ts          # Cliente de Supabase
├── services/
│   └── supabaseService.ts         # Funciones CRUD
├── hooks/
│   └── useSupabase.ts             # Hooks personalizados
├── components/
│   └── LoadingStates.tsx          # Componentes de carga
└── types/
    └── index.ts                   # Tipos TypeScript
```

## 📊 Tablas Principales

### Clientes
```sql
clientes (
  id UUID,
  nombre_completo TEXT,
  cedula TEXT UNIQUE,
  direccion TEXT,
  telefono TEXT,
  whatsapp TEXT,
  email TEXT,
  garante TEXT,
  garante_telefono TEXT,
  lat DECIMAL,
  lng DECIMAL,
  ocupacion TEXT,
  ingreso_mensual DECIMAL,
  referencias TEXT,
  observaciones TEXT,
  nivel_riesgo TEXT,
  created_at TIMESTAMP
)
```

### Créditos
```sql
creditos (
  id UUID,
  cliente_id UUID → clientes,
  tipo TEXT (semanal/quincenal/mensual),
  modalidad TEXT (efectivo/articulo),
  monto_principal DECIMAL,
  tasa_mensual DECIMAL,
  plazo_meses INTEGER,
  monto_interes DECIMAL,
  monto_total DECIMAL,
  valor_cuota DECIMAL,
  total_cuotas INTEGER,
  monto_pagado DECIMAL,
  fecha_inicio DATE,
  dia_cobro_preferido TEXT,
  estado TEXT (ACTIVO/MORA/CANCELADO),
  cobrador_asignado UUID → usuarios,
  articulo_id UUID → inventario,
  garantias TEXT[],
  proposito TEXT,
  observaciones TEXT,
  created_at TIMESTAMP
)
```

### Cuotas
```sql
cuotas (
  id UUID,
  credito_id UUID → creditos,
  numero_cuota INTEGER,
  fecha_cobro DATE,
  monto_cuota DECIMAL,
  monto_pagado DECIMAL,
  estado TEXT (PENDIENTE/PAGADO/PARCIAL/VENCIDO),
  fecha_pago DATE,
  created_at TIMESTAMP
)
```

### Pagos
```sql
pagos (
  id UUID,
  credito_id UUID → creditos,
  cuota_id UUID → cuotas,
  cliente_id UUID → clientes,
  monto DECIMAL,
  metodo_pago TEXT (efectivo/transferencia),
  numero_recibo TEXT UNIQUE,
  cobrador_id UUID → usuarios,
  es_mora BOOLEAN,
  lat DECIMAL,
  lng DECIMAL,
  sincronizado BOOLEAN,
  fecha_pago DATE,
  created_at TIMESTAMP
)
```

## 🔧 Funciones CRUD Disponibles

### Clientes
```typescript
// Obtener todos
const clientes = await fetchClientes();

// Crear
const nuevoCliente = await createCliente({
  fullName: 'Juan Pérez',
  cedula: '001-1234567-8',
  phone: '809-555-0101',
  // ... otros campos
});

// Actualizar
await updateCliente(id, { phone: '809-555-9999' });

// Eliminar
await deleteCliente(id);
```

### Créditos
```typescript
// Obtener todos con relaciones
const creditos = await fetchCreditos();

// Crear crédito con cuotas
const cuotas = [
  { numero: 1, fecha: '2024-01-15', monto: 1208 },
  { numero: 2, fecha: '2024-01-22', monto: 1208 },
  // ... más cuotas
];

await createCredito({
  clientId: 'uuid-cliente',
  type: 'semanal',
  modality: 'efectivo',
  amount: 10000,
  interestRate: 15,
  term: 3,
  installmentAmount: 1208,
  totalAmount: 14500,
  totalInterest: 4500,
  startDate: '2024-01-01',
  status: 'activo',
  // ... otros campos
}, cuotas);

// Actualizar estado
await updateCreditoStatus(id, 'CANCELADO');
```

### Pagos
```typescript
// Registrar pago
await registerPayment({
  creditoId: 'uuid-credito',
  cuotaId: 'uuid-cuota',
  clientId: 'uuid-cliente',
  amount: 1208,
  method: 'efectivo',
  collectorId: 'uuid-cobrador',
  isLate: false,
  date: '2024-01-15',
});
```

### Inventario
```typescript
// Obtener artículos
const articulos = await fetchInventario();

// Crear artículo
await createArticle({
  name: 'Refrigerador Samsung',
  description: '12 pies cúbicos',
  category: 'Electrodomésticos',
  costPrice: 25000,
  salePrice: 35000,
  quantity: 5,
  minStock: 2,
  serialNumber: 'SAM-2024-001',
  // ... otros campos
});

// Actualizar estado (al entregar en crédito)
await updateArticleStatus(id, 'Entregado');
```

## 🔄 Sincronización en Tiempo Real

Supabase soporta suscripciones en tiempo real:

```typescript
import { useRealtimeSubscription } from './hooks/useSupabase';

function MiComponente() {
  // Suscribirse a cambios en la tabla creditos
  useRealtimeSubscription('creditos', (payload) => {
    console.log('Cambio detectado:', payload);
    // Refrescar datos
    refetch();
  });
  
  // ...
}
```

## 📱 Uso en Componentes

### Ejemplo: Lista de Clientes con Loading

```typescript
import { useClientes } from '../hooks/useSupabase';
import { TableSkeleton, ErrorState } from '../components/LoadingStates';

function ClientesPage() {
  const { data: clientes, loading, error, refetch } = useClientes();

  if (loading) {
    return <TableSkeleton rows={10} cols={5} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <div>
      {clientes.map(cliente => (
        <div key={cliente.id}>{cliente.fullName}</div>
      ))}
    </div>
  );
}
```

### Ejemplo: Crear Crédito

```typescript
import { createCredito } from '../services/supabaseService';
import { useState } from 'react';

function NuevoCredito() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      // Calcular cuotas
      const cuotas = generarCuotas(formData);
      
      // Crear crédito en Supabase
      await createCredito(formData, cuotas);
      
      alert('Crédito creado exitosamente');
    } catch (error) {
      alert('Error al crear crédito: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
      <button disabled={loading}>
        {loading ? 'Creando...' : 'Crear Crédito'}
      </button>
    </form>
  );
}
```

## 🔐 Seguridad y Políticas RLS

Supabase usa Row Level Security (RLS). Para desarrollo, puedes desactivarlo:

```sql
-- Desactivar RLS para todas las tablas (solo desarrollo)
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE creditos DISABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE rutas DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja DISABLE ROW LEVEL SECURITY;
ALTER TABLE arqueos_caja DISABLE ROW LEVEL SECURITY;
ALTER TABLE planillas DISABLE ROW LEVEL SECURITY;
```

**Para producción**, configura políticas RLS apropiadas basadas en roles.

## 📊 Migración de Datos

Si ya tienes datos en localStorage, puedes migrarlos:

```typescript
import { createCliente, createCredito } from './services/supabaseService';

async function migrarDatos() {
  // Migrar clientes
  const clientesLocales = JSON.parse(localStorage.getItem('yaracredit-storage') || '{}');
  
  for (const cliente of clientesLocales.clients || []) {
    await createCliente(cliente);
  }
  
  // Migrar créditos
  for (const credito of clientesLocales.loans || []) {
    const cuotas = generarCuotasDesdeCredito(credito);
    await createCredito(credito, cuotas);
  }
}
```

## 🐛 Troubleshooting

### Error: "relation does not exist"
- Ejecuta el script `supabase/schema.sql` en el SQL Editor

### Error: "Invalid API key"
- Verifica que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén correctas
- Reinicia el servidor de desarrollo

### Error: "new row violates row-level security policy"
- Desactiva RLS temporalmente para desarrollo (ver sección de seguridad)

### Los datos no se actualizan
- Verifica que estás usando `refetch()` después de crear/actualizar datos
- Revisa la consola del navegador para errores

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de React + Supabase](https://supabase.com/docs/guides/with-react)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ Checklist de Implementación

- [ ] Crear proyecto en Supabase
- [ ] Configurar variables de entorno (.env)
- [ ] Ejecutar schema.sql en SQL Editor
- [ ] Verificar que las tablas se crearon correctamente
- [ ] Probar la conexión desde la aplicación
- [ ] Crear algunos datos de prueba
- [ ] Verificar que los componentes muestran los datos
- [ ] Probar creación de clientes, créditos y pagos
- [ ] Configurar RLS para producción (opcional)

---

**¿Necesitas ayuda?** Revisa la documentación de Supabase o contacta al equipo de desarrollo.
