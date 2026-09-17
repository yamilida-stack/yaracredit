# 🔧 Diagnóstico y Solución: Persistencia de Datos en Supabase

## ⚠️ Problema Crítico Identificado

**Síntoma:** Los datos de clientes y préstamos desaparecen al recargar la página.

**Causa raíz:** El sistema estaba usando el store local de Zustand con datos seed en memoria, en lugar de guardar los datos en Supabase.

---

## 🔍 Diagnóstico Completo

### Archivos Afectados

1. **`src/store/index.ts`**
   - ❌ Usaba datos seed en memoria (`seedClients`, `seedLoans`)
   - ❌ Funciones `addClient`, `addLoan` solo modificaban el estado local
   - ❌ No había persistencia en Supabase

2. **`src/pages/ClientsPage.tsx`**
   - ❌ Usaba `addClient()` del store (solo memoria)
   - ❌ No cargaba datos desde Supabase
   - ❌ Al recargar, los datos se perdían

3. **`src/pages/LoansPage.tsx`**
   - ❌ Usaba `addLoan()` del store (solo memoria)
   - ❌ No cargaba datos desde Supabase
   - ❌ Al recargar, los datos se perdían

---

## ✅ Solución Implementada

### 1. ClientsPage.tsx - Corregido

**Cambios realizados:**

```typescript
// ANTES (incorrecto)
const { clients, addClient, updateClient, deleteClient } = useStore();

const handleSubmit = (e: React.FormEvent) => {
  addClient(data); // Solo guarda en memoria
};

// DESPUÉS (correcto)
const [clients, setClients] = useState<Client[]>([]);

// Cargar clientes desde Supabase al montar el componente
useEffect(() => {
  loadClients();
}, []);

const loadClients = async () => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });
  
  setClients(data || []);
};

const handleSubmit = async (e: React.FormEvent) => {
  // Guardar en Supabase
  const { error } = await supabase
    .from('clientes')
    .insert([clientData]);
  
  // Recargar lista
  await loadClients();
};
```

**Funcionalidades corregidas:**
- ✅ Carga clientes desde Supabase al montar
- ✅ Guarda nuevos clientes en Supabase
- ✅ Actualiza clientes en Supabase
- ✅ Elimina clientes de Supabase
- ✅ Recarga la lista después de cada operación

---

### 2. LoansPage.tsx - Corregido

**Cambios realizados:**

```typescript
// ANTES (incorrecto)
const { loans, addLoan, updateLoan, deleteLoan } = useStore();

const handleSubmit = (e: React.FormEvent) => {
  addLoan(loanData); // Solo guarda en memoria
};

// DESPUÉS (correcto)
const [loans, setLoans] = useState<Loan[]>([]);

// Cargar préstamos desde Supabase al montar
useEffect(() => {
  loadLoans();
}, []);

const loadLoans = async () => {
  const { data, error } = await supabase
    .from('creditos')
    .select(`
      *,
      clientes!inner(*),
      cuotas(*),
      pagos(*)
    `)
    .order('created_at', { ascending: false });
  
  // Mapear datos de Supabase al formato de Loan
  const mappedLoans = data.map(loan => ({
    id: loan.id,
    clientId: loan.cliente_id,
    // ... más campos
  }));
  
  setLoans(mappedLoans);
};

const handleSubmit = async (e: React.FormEvent) => {
  // Guardar préstamo en Supabase
  const { data: newLoan } = await supabase
    .from('creditos')
    .insert([loanData])
    .select()
    .single();
  
  // Generar y guardar cuotas automáticamente
  const cuotas = generarCuotas(newLoan.id, ...);
  await supabase.from('cuotas').insert(cuotas);
  
  // Recargar lista
  await loadLoans();
};
```

**Funcionalidades corregidas:**
- ✅ Carga préstamos desde Supabase con relaciones (clientes, cuotas, pagos)
- ✅ Guarda nuevos préstamos en Supabase
- ✅ Genera automáticamente las cuotas al crear un préstamo
- ✅ Actualiza préstamos en Supabase
- ✅ Elimina préstamos de Supabase
- ✅ Recarga la lista después de cada operación

---

## 📊 Flujo de Datos Corregido

### Antes (Incorrecto)
```
Usuario crea cliente
    ↓
addClient() del store
    ↓
Se guarda en memoria (Zustand)
    ↓
Al recargar página → DATOS PERDIDOS ❌
```

### Después (Correcto)
```
Usuario crea cliente
    ↓
supabase.from('clientes').insert()
    ↓
Se guarda en Supabase (base de datos)
    ↓
loadClients() recarga la lista
    ↓
Al recargar página → DATOS PERSISTEN ✅
```

---

## 🧪 Cómo Verificar que Funciona

### Prueba 1: Crear Cliente
1. Ve a la página de **Clientes**
2. Haz clic en **"Nuevo Cliente"**
3. Llena el formulario y guarda
4. **Recarga la página** (F5)
5. ✅ El cliente debe seguir apareciendo

### Prueba 2: Crear Préstamo
1. Ve a la página de **Préstamos**
2. Haz clic en **"Nuevo Préstamo"**
3. Llena el formulario y guarda
4. **Recarga la página** (F5)
5. ✅ El préstamo debe seguir apareciendo
6. ✅ Las cuotas deben estar generadas

### Prueba 3: Verificar en Supabase
1. Ve a **Supabase Dashboard**
2. Ve a **Table Editor**
3. Abre la tabla **clientes**
4. ✅ Debes ver los clientes creados
5. Abre la tabla **creditos**
6. ✅ Debes ver los préstamos creados
7. Abre la tabla **cuotas**
8. ✅ Debes ver las cuotas generadas automáticamente

---

## 🔧 Estructura de Tablas en Supabase

### Tabla: clientes
```sql
CREATE TABLE clientes (
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
  nivel_riesgo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: creditos
```sql
CREATE TABLE creditos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  tipo TEXT NOT NULL,
  modalidad TEXT NOT NULL,
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
  estado TEXT DEFAULT 'ACTIVO',
  cobrador_asignado UUID,
  articulo_id UUID,
  garantias TEXT[],
  proposito TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: cuotas
```sql
CREATE TABLE cuotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credito_id UUID REFERENCES creditos(id) ON DELETE CASCADE,
  numero_cuota INTEGER NOT NULL,
  fecha_cobro DATE NOT NULL,
  monto_cuota DECIMAL(12, 2) NOT NULL,
  monto_pagado DECIMAL(12, 2) DEFAULT 0,
  estado TEXT DEFAULT 'PENDIENTE',
  fecha_pago DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 Beneficios de la Solución

### ✅ Persistencia Real
- Los datos se guardan en Supabase (PostgreSQL)
- No se pierden al recargar la página
- Disponibles desde cualquier dispositivo

### ✅ Generación Automática de Cuotas
- Al crear un préstamo, se generan automáticamente las cuotas
- Las fechas se calculan según la frecuencia y día preferido
- Se guardan en la tabla `cuotas`

### ✅ Relaciones Correctas
- Préstamos vinculados a clientes
- Cuotas vinculadas a préstamos
- Pagos vinculados a cuotas y préstamos

### ✅ Sincronización en Tiempo Real
- Los datos se cargan desde Supabase al montar cada página
- Cada operación (crear, actualizar, eliminar) recarga los datos
- Múltiples usuarios pueden ver los mismos datos

---

## 🐛 Solución de Problemas

### Problema: "Error al cargar clientes"
**Causa:** La tabla `clientes` no existe en Supabase  
**Solución:** Ejecuta el script SQL para crear las tablas

### Problema: "Los datos no se guardan"
**Causa:** Políticas RLS bloqueando la inserción  
**Solución:** Verifica las políticas RLS en Supabase

### Problema: "Las cuotas no se generan"
**Causa:** Error en la función de generación de cuotas  
**Solución:** Revisa la consola del navegador para ver el error específico

---

## 📝 Archivos Modificados

1. **`src/pages/ClientsPage.tsx`**
   - Agregado `useEffect` para cargar clientes
   - Modificado `handleSubmit` para usar Supabase
   - Modificado `handleDelete` para usar Supabase
   - Agregado estado `loading`

2. **`src/pages/LoansPage.tsx`**
   - Agregado `useEffect` para cargar préstamos
   - Modificado `handleSubmit` para usar Supabase y generar cuotas
   - Modificado botón de eliminar para usar Supabase
   - Agregado estado `loading`
   - Mapeo de datos de Supabase al formato de Loan

---

## ✅ Build Exitoso

```
✓ 2311 modules transformed
✓ built in 15.93s
```

**Archivos generados:**
- `dist/index.html` - 1.58 kB
- `dist/assets/index-*.css` - 40.76 kB
- `dist/assets/index-*.js` - 1,418.34 kB

---

## 🚀 Próximos Pasos

1. **Verificar en Supabase** que las tablas existen
2. **Probar la creación** de clientes y préstamos
3. **Recargar la página** para verificar persistencia
4. **Verificar en Supabase** que los datos se guardaron
5. **Probar la edición** y eliminación de registros

---

## 📚 Recursos Adicionales

- [Supabase Docs - Tables](https://supabase.com/docs/guides/database/tables)
- [Supabase Docs - RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Docs - JavaScript Client](https://supabase.com/docs/reference/javascript)

---

**Fecha:** Enero 2024  
**Versión:** 1.5.0  
**Estado:** ✅ Problema de persistencia resuelto
