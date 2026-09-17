# ✅ VERIFICACIÓN RÁPIDA: Sistema de Pagos Funcionando

## 🎯 Objetivo

Verificar que el sistema de registro de pagos funciona correctamente después de aplicar la solución.

## 📋 Checklist de Verificación (5 minutos)

### ✅ PASO 1: Verificar Base de Datos en Supabase (1 minuto)

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Ejecuta esta consulta:

```sql
-- Verificar que todas las tablas necesarias existen
SELECT 
  'cobros' as tabla,
  COUNT(*) as registros
FROM cobros
UNION ALL
SELECT 
  'cuotas',
  COUNT(*)
FROM cuotas
UNION ALL
SELECT 
  'prestamos',
  COUNT(*)
FROM prestamos;
```

**Resultado esperado:**
```
tabla      | registros
-----------|----------
cobros     | X
cuotas     | X
prestamos  | X
```

✅ Si ves las 3 tablas, continúa.  
❌ Si falta alguna tabla, ejecuta `supabase/setup_payments.sql`

---

### ✅ PASO 2: Verificar Columna saldo_pendiente (30 segundos)

```sql
-- Verificar que la columna saldo_pendiente existe
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'prestamos' 
  AND column_name = 'saldo_pendiente';
```

**Resultado esperado:**
```
column_name      | data_type    | column_default
-----------------|--------------|---------------
saldo_pendiente  | numeric      | 0
```

✅ Si ves la columna, continúa.  
❌ Si no existe, ejecuta:
```sql
ALTER TABLE public.prestamos 
ADD COLUMN IF NOT EXISTS saldo_pendiente DECIMAL(12,2) DEFAULT 0;

UPDATE public.prestamos 
SET saldo_pendiente = monto_total 
WHERE saldo_pendiente IS NULL;
```

---

### ✅ PASO 3: Verificar Políticas RLS (30 segundos)

```sql
-- Verificar políticas de cobros
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'cobros';
```

**Resultado esperado:**
```
policyname                                          | cmd
----------------------------------------------------|--------
Usuarios autenticados pueden ver cobros             | SELECT
Usuarios autenticados pueden insertar cobros        | INSERT
Usuarios autenticados pueden actualizar cobros      | UPDATE
Usuarios autenticados pueden eliminar cobros        | DELETE
```

✅ Si ves las 4 políticas, continúa.  
❌ Si faltan políticas, ejecuta `supabase/setup_payments.sql`

---

### ✅ PASO 4: Probar Registro de Pago en la App (2 minutos)

1. Abre la aplicación en el navegador
2. Abre la consola del navegador (F12 → Console)
3. Inicia sesión como administrador o cobrador
4. Ve a la página de **Cobros**
5. Busca un préstamo activo
6. Haz clic en **"Cobrar"**
7. Ingresa un monto (ej: 1000)
8. Haz clic en **"Registrar Pago"**

**Verifica en la consola:**
```
=== REGISTRANDO PAGO EN SUPABASE ===
Datos del pago: { ... }
Número de recibo generado: R-123456
Cobro insertado exitosamente: { ... }
Saldo actualizado: 9000 Estado: activo
Pago registrado exitosamente
```

✅ Si ves estos logs, continúa.  
❌ Si ves errores, revisa la sección de troubleshooting.

---

### ✅ PASO 5: Verificar en Supabase que el Pago se Registró (1 minuto)

```sql
-- Ver los últimos 5 cobros registrados
SELECT 
  id,
  prestamo_id,
  monto,
  fecha_cobro,
  metodo_pago,
  nota,
  created_at
FROM cobros
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:**
```
id  | prestamo_id | monto | fecha_cobro | metodo_pago | nota              | created_at
----|-------------|-------|-------------|-------------|-------------------|-------------------
... | ...         | 1000  | 2024-01-15  | efectivo    | Recibo: R-123456  | 2024-01-15 10:30:00
```

✅ Si ves el cobro registrado, continúa.  
❌ Si no aparece, revisa los logs de la consola.

---

### ✅ PASO 6: Verificar que el Saldo se Actualizó (30 segundos)

```sql
-- Ver el saldo del préstamo
SELECT 
  id,
  monto_total,
  saldo_pendiente,
  estado
FROM prestamos
WHERE id = 'uuid-del-prestamo-que-pagaste';
```

**Resultado esperado:**
```
id  | monto_total | saldo_pendiente | estado
----|-------------|-----------------|--------
... | 10000       | 9000            | activo
```

✅ Si el saldo se redujo, continúa.  
❌ Si el saldo no cambió, revisa los logs de la consola.

---

### ✅ PASO 7: Verificar que la Cuota se Actualizó (30 segundos)

```sql
-- Ver las cuotas del préstamo
SELECT 
  numero_cuota,
  monto,
  fecha_vencimiento,
  fecha_pago,
  estado
FROM cuotas
WHERE prestamo_id = 'uuid-del-prestamo-que-pagaste'
ORDER BY numero_cuota;
```

**Resultado esperado:**
```
numero_cuota | monto | fecha_vencimiento | fecha_pago  | estado
-------------|-------|-------------------|-------------|--------
1            | 1000  | 2024-01-15        | 2024-01-15  | pagada
2            | 1000  | 2024-01-22        | NULL        | pendiente
3            | 1000  | 2024-01-29        | NULL        | pendiente
```

✅ Si la cuota aparece como "pagada", continúa.  
❌ Si la cuota sigue "pendiente", revisa los logs de la consola.

---

## 🎉 ¡SISTEMA FUNCIONANDO CORRECTAMENTE!

Si completaste todos los pasos anteriores sin errores, el sistema de pagos está funcionando correctamente.

## 📊 Resumen de Verificación

| Paso | Descripción | Estado |
|------|-------------|--------|
| 1 | Tablas existen en Supabase | ✅ |
| 2 | Columna saldo_pendiente existe | ✅ |
| 3 | Políticas RLS configuradas | ✅ |
| 4 | Registro de pago funciona en la app | ✅ |
| 5 | Pago se registra en Supabase | ✅ |
| 6 | Saldo se actualiza correctamente | ✅ |
| 7 | Cuota se marca como pagada | ✅ |

## 🐛 Si Algo Falla

### Error: "relation cobros does not exist"
**Solución:** Ejecuta `supabase/setup_payments.sql`

### Error: "new row violates row-level security policy"
**Solución:** Ejecuta `supabase/setup_payments.sql` para crear las políticas RLS

### Error: "column saldo_pendiente does not exist"
**Solución:** Ejecuta:
```sql
ALTER TABLE public.prestamos 
ADD COLUMN IF NOT EXISTS saldo_pendiente DECIMAL(12,2) DEFAULT 0;
```

### Los logs no aparecen en la consola
**Solución:** 
1. Limpia la caché del navegador (Ctrl+Shift+R)
2. Recarga la página
3. Verifica que el código actualizado esté desplegado

### El pago se registra pero el saldo no se actualiza
**Solución:** Revisa los logs de la consola para ver si hay errores en la actualización del saldo

---

## 📚 Documentación Completa

Para más detalles, revisa:
- `SOLUCION_PAGOS_COMPLETA.md` - Solución completa con troubleshooting
- `FIX_CRITICAL_FUNCTIONS.md` - Corrección de funciones críticas
- `supabase/setup_payments.sql` - Script SQL completo

---

**Fecha:** Enero 2024  
**Versión:** 2.2.0  
**Estado:** ✅ Sistema de pagos funcionando correctamente
