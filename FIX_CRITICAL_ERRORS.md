# ✅ Corrección de Errores Críticos - Tabla Clientes y Cuotas

## 🐛 Errores Corregidos

### ERROR 1: Columna incorrecta en tabla clientes
**Problema:** El código buscaba `clientes.nombre_completo` pero la columna real se llama `nombre`.

**Solución:** Se cambiaron todas las referencias de `nombre_completo` a `nombre` en:
- ✅ `src/pages/ClientsPage.tsx`
- ✅ `src/pages/LoansPage.tsx`
- ✅ `src/services/supabaseService.ts`

### ERROR 2: Falta tabla 'cuotas'
**Problema:** El código intenta hacer JOIN entre 'prestamos' y 'cuotas', pero la tabla `cuotas` no existe.

**Solución:** Se creó el archivo SQL `supabase/create_cuotas_table.sql` con la estructura correcta.

---

## 📋 Pasos para Solucionar el ERROR 2

### PASO 1: Crear la tabla 'cuotas' en Supabase

1. Ve a **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia y pega el contenido del archivo `supabase/create_cuotas_table.sql`
4. Haz clic en **Run**

**O copia este SQL directamente:**

```sql
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

ALTER TABLE public.cuotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver cuotas" ON cuotas FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden insertar cuotas" ON cuotas FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden actualizar cuotas" ON cuotas FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden eliminar cuotas" ON cuotas FOR DELETE
USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_cuotas_prestamo_id ON public.cuotas(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_fecha_vencimiento ON public.cuotas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON public.cuotas(estado);
```

---

## 🔧 Cambios Realizados en el Código

### 1. Corrección de Columna 'nombre' en Clientes

**Archivos modificados:**
- `src/pages/ClientsPage.tsx` - Línea 90
- `src/pages/LoansPage.tsx` - Líneas 43, 50
- `src/services/supabaseService.ts` - Líneas 21, 46, 76

**Cambios:**
```typescript
// ANTES (incorrecto)
nombre_completo: form.fullName

// DESPUÉS (correcto)
nombre: form.fullName
```

### 2. Corrección de Columnas en Tabla 'cuotas'

**Archivos modificados:**
- `src/pages/LoansPage.tsx` - Líneas 471-476
- `src/services/supabaseService.ts` - Líneas 204-209, 294-302

**Cambios:**
```typescript
// ANTES (incorrecto)
cuotas.push({
  prestamo_id: newLoan.id,
  numero_cuota: i,
  fecha_cobro: dueDate.toISOString().split('T')[0],  // ❌ Incorrecto
  monto_cuota: installmentAmount,                     // ❌ Incorrecto
});

// DESPUÉS (correcto)
cuotas.push({
  prestamo_id: newLoan.id,
  numero_cuota: i,
  fecha_vencimiento: dueDate.toISOString().split('T')[0],  // ✅ Correcto
  monto: installmentAmount,                                 // ✅ Correcto
});
```

**Actualización de cuota al pagar:**
```typescript
// ANTES (incorrecto)
await supabase
  .from('cuotas')
  .update({
    monto_pagado: payment.amount,  // ❌ Esta columna no existe
    estado: 'PAGADO',               // ❌ Debe ser en minúsculas
    fecha_pago: payment.date,
  })

// DESPUÉS (correcto)
await supabase
  .from('cuotas')
  .update({
    estado: 'pagada',      // ✅ Correcto (en minúsculas)
    fecha_pago: payment.date,
  })
```

---

## 📊 Estructura Correcta de la Tabla 'cuotas'

```sql
CREATE TABLE public.cuotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prestamo_id UUID REFERENCES public.prestamos(id) ON DELETE CASCADE,
  numero_cuota INTEGER NOT NULL,
  monto DECIMAL(12,2) NOT NULL,              -- ✅ Nombre correcto
  fecha_vencimiento DATE NOT NULL,           -- ✅ Nombre correcto
  fecha_pago DATE,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'vencida')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columnas disponibles:**
- `id` - UUID automático
- `prestamo_id` - Referencia al préstamo
- `numero_cuota` - Número de la cuota (1, 2, 3...)
- `monto` - Monto de la cuota
- `fecha_vencimiento` - Fecha de vencimiento
- `fecha_pago` - Fecha de pago (NULL si no se ha pagado)
- `estado` - 'pendiente', 'pagada', o 'vencida'
- `created_at` - Fecha de creación

---

## 🧪 Cómo Verificar que Funciona

### Prueba 1: Crear Cliente
1. Ve a **Clientes**
2. Crea un nuevo cliente
3. **Verifica en Supabase:**
   - ✅ Ve a Table Editor → `clientes`
   - ✅ La columna `nombre` debe tener el valor correcto
   - ✅ NO debe haber error de columna

### Prueba 2: Crear Préstamo con Cuotas
1. Ve a **Préstamos**
2. Crea un nuevo préstamo
3. **Verifica en Supabase:**
   - ✅ Ve a Table Editor → `prestamos`
   - ✅ El préstamo debe estar creado
   - ✅ Ve a Table Editor → `cuotas`
   - ✅ Las cuotas deben estar generadas
   - ✅ Cada cuota debe tener:
     - `prestamo_id` correcto
     - `numero_cuota` (1, 2, 3...)
     - `monto` correcto
     - `fecha_vencimiento` correcto
     - `estado` = 'pendiente'

### Prueba 3: Registrar Pago
1. Ve a **Cobros**
2. Registra un pago
3. **Verifica en Supabase:**
   - ✅ Ve a Table Editor → `cobros`
   - ✅ El cobro debe estar registrado
   - ✅ Ve a Table Editor → `cuotas`
   - ✅ La cuota correspondiente debe tener:
     - `estado` = 'pagada'
     - `fecha_pago` con la fecha del pago

---

## 📁 Archivos Creados/Modificados

### Creados:
1. **`supabase/create_cuotas_table.sql`** - Script SQL para crear la tabla cuotas

### Modificados:
1. **`src/pages/ClientsPage.tsx`** - Corregido `nombre_completo` → `nombre`
2. **`src/pages/LoansPage.tsx`** - Corregidos nombres de columnas en cuotas
3. **`src/services/supabaseService.ts`** - Corregidos nombres de columnas en cuotas y clientes

---

## 🐛 Solución de Problemas

### Error: "column nombre_completo does not exist"
**Causa:** El código todavía usa `nombre_completo`  
**Solución:** Ya está corregido en el código. Recarga la página.

### Error: "relation cuotas does not exist"
**Causa:** La tabla `cuotas` no existe en Supabase  
**Solución:** Ejecuta el script SQL en `supabase/create_cuotas_table.sql`

### Error: "column fecha_cobro does not exist"
**Causa:** El código usa `fecha_cobro` pero la columna es `fecha_vencimiento`  
**Solución:** Ya está corregido en el código. Recarga la página.

### Error: "column monto_cuota does not exist"
**Causa:** El código usa `monto_cuota` pero la columna es `monto`  
**Solución:** Ya está corregido en el código. Recarga la página.

---

## ✅ Checklist de Verificación

- [ ] Ejecutar script SQL para crear tabla `cuotas`
- [ ] Verificar que la tabla `clientes` tenga columna `nombre` (no `nombre_completo`)
- [ ] Crear un cliente de prueba
- [ ] Crear un préstamo de prueba
- [ ] Verificar que se generen las cuotas automáticamente
- [ ] Registrar un pago de prueba
- [ ] Verificar que la cuota se actualice a 'pagada'
- [ ] Verificar en la consola del navegador que no haya errores

---

**Fecha:** Enero 2024  
**Versión:** 1.8.0  
**Estado:** ✅ Errores críticos corregidos
