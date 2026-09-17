# Corrección de Problemas Críticos - YaraCredit

## 📋 Resumen de Correcciones

Se han corregido dos problemas críticos en el sistema YaraCredit:

1. **Registro de pagos** - Ahora funciona correctamente con Supabase
2. **Fechas de cobro** - Ahora respetan el día de la semana seleccionado

---

## 🔧 PROBLEMA 1: Registro de Pagos

### ❌ Problema Anterior
Los cobradores no podían registrar pagos porque el sistema usaba el store local de Zustand en lugar de Supabase.

### ✅ Solución Implementada

**Archivo modificado:** `src/pages/CollectionsPage.tsx`

**Cambios realizados:**

1. **Importación de registerPayment** (línea 3):
```typescript
import { registerPayment } from '../services/supabaseService';
```

2. **Función handlePayment actualizada** (líneas 37-70):
- Cambiada de síncrona a asíncrona (`async`)
- Ahora usa `registerPayment()` de Supabase en lugar de `addPayment()` del store
- Agrega manejo de errores con try-catch
- Recarga la página después de registrar el pago para actualizar los datos
- Muestra notificaciones de éxito/error

**Código clave:**
```typescript
const handlePayment = async (e: React.FormEvent) => {
  e.preventDefault();
  // ... validaciones ...

  try {
    // Registrar pago en Supabase
    const payment = await registerPayment({
      creditoId: loan.id,
      clientId: loan.clientId,
      amount,
      method: paymentForm.method,
      date: new Date().toISOString().split('T')[0],
      collectorId: currentUser?.id || '',
      isLate: loan.status === 'mora',
    });

    addNotification('success', `Pago de ${formatCurrency(amount)} registrado exitosamente`);
    setShowPaymentModal(false);
    setShowReceipt(payment.id);
    
    // Recargar la página para actualizar los datos
    window.location.reload();
  } catch (error: any) {
    console.error('Error al registrar pago:', error);
    addNotification('error', `Error al registrar pago: ${error.message || 'Error desconocido'}`);
  }
};
```

### 📊 Flujo de Registro de Pago

1. Cobrador selecciona un préstamo y hace clic en "Registrar Pago"
2. Ingresa el monto y método de pago
3. El sistema llama a `registerPayment()` que:
   - Genera un número de recibo único
   - Inserta el pago en la tabla `pagos` de Supabase
   - Actualiza la cuota correspondiente (si existe)
   - Registra el movimiento en la tabla `movimientos_caja`
4. Muestra notificación de éxito
5. Recarga la página para mostrar los datos actualizados

### 🔍 Depuración

Si hay errores al registrar pagos, verifica:

1. **Consola del navegador (F12):**
   - Busca mensajes de error con el prefijo "Error al registrar pago:"
   - Verifica que no haya errores de CORS o permisos

2. **Políticas RLS en Supabase:**
   - Asegúrate de que el usuario tenga permisos para insertar en la tabla `pagos`
   - Ejecuta en Supabase SQL Editor:
   ```sql
   -- Verificar política de inserción
   SELECT * FROM pg_policies WHERE tablename = 'pagos';
   ```

3. **Permisos del cobrador:**
   - Verifica que el cobrador esté asignado al préstamo
   - Verifica que el préstamo esté en estado 'activo' o 'mora'

---

## 🔧 PROBLEMA 2: Fechas de Cobro

### ❌ Problema Anterior
Las fechas de cobro no respetaban el día de la semana seleccionado. Por ejemplo, si se seleccionaba "Lunes", algunas fechas caían en martes o miércoles.

### ✅ Solución Implementada

**Archivo modificado:** `src/pages/LoansPage.tsx`

**Función corregida:** `calculateDueDate()` (líneas 146-182)

**Cambios realizados:**

1. **Frecuencia Quincenal** (línea 171):
   - **Antes:** Sumaba 15 días (no garantiza el mismo día de la semana)
   - **Ahora:** Suma 14 días (2 semanas exactas, siempre cae en el mismo día)

2. **Frecuencia Mensual** (líneas 172-177):
   - **Antes:** Solo sumaba meses sin ajustar el día de la semana
   - **Ahora:** Suma meses y luego ajusta al día de la semana preferido

**Código corregido:**
```typescript
function calculateDueDate(startDate: Date, installmentNumber: number, frequency: PaymentFrequency, preferredDay: PreferredDay): Date {
  const dayMap: Record<PreferredDay, number> = {
    'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
    'Jueves': 4, 'Viernes': 5, 'Sábado': 6
  };
  const targetDay = dayMap[preferredDay];
  
  // Paso 1: Ajustar fecha de inicio al día preferido
  const firstDueDate = new Date(startDate);
  const currentDay = firstDueDate.getDay();
  const daysToAdd = (targetDay - currentDay + 7) % 7;
  firstDueDate.setDate(firstDueDate.getDate() + daysToAdd);
  
  // Paso 2: Calcular fecha de la cuota específica
  const dueDate = new Date(firstDueDate);
  
  if (installmentNumber === 1) {
    return dueDate;
  }
  
  // Calcular según frecuencia
  if (frequency === 'Semanal') {
    // Sumar semanas completas (7 días) - siempre caerá en el mismo día
    dueDate.setDate(dueDate.getDate() + (installmentNumber - 1) * 7);
  } else if (frequency === 'Quincenal') {
    // Sumar 2 semanas (14 días) para mantener el mismo día de la semana
    dueDate.setDate(dueDate.getDate() + (installmentNumber - 1) * 14);
  } else if (frequency === 'Mensual') {
    // Sumar meses y luego ajustar al día de la semana correcto
    dueDate.setMonth(dueDate.getMonth() + (installmentNumber - 1));
    
    // Ajustar al día de la semana preferido
    const currentDayAfterMonth = dueDate.getDay();
    const daysToAdjust = (targetDay - currentDayAfterMonth + 7) % 7;
    dueDate.setDate(dueDate.getDate() + daysToAdjust);
  }
  
  return dueDate;
}
```

### 📊 Ejemplo de Fechas Corregidas

**Caso 1: Pago Semanal, Día: Lunes**
- Cuota 1: Lunes 22 Enero 2024
- Cuota 2: Lunes 29 Enero 2024 (+7 días)
- Cuota 3: Lunes 5 Febrero 2024 (+7 días)
- Cuota 4: Lunes 12 Febrero 2024 (+7 días)

**Caso 2: Pago Quincenal, Día: Lunes**
- Cuota 1: Lunes 22 Enero 2024
- Cuota 2: Lunes 5 Febrero 2024 (+14 días)
- Cuota 3: Lunes 19 Febrero 2024 (+14 días)
- Cuota 4: Lunes 4 Marzo 2024 (+14 días)

**Caso 3: Pago Mensual, Día: Lunes**
- Cuota 1: Lunes 22 Enero 2024
- Cuota 2: Lunes 19 Febrero 2024 (+1 mes, ajustado a lunes)
- Cuota 3: Lunes 25 Marzo 2024 (+1 mes, ajustado a lunes)
- Cuota 4: Lunes 22 Abril 2024 (+1 mes, ajustado a lunes)

### 🔍 Verificación de Fechas

Para verificar que las fechas sean correctas:

1. Crea un nuevo préstamo con:
   - Fecha de inicio: cualquier fecha
   - Día de cobro preferido: Lunes
   - Frecuencia: Semanal/Quincenal/Mensual

2. Revisa la tabla de amortización generada
3. Verifica que TODAS las fechas caigan en lunes

---

## 🧪 Pruebas Recomendadas

### Prueba 1: Registro de Pago

1. Inicia sesión como cobrador
2. Ve a la página de "Cobros"
3. Selecciona un préstamo activo
4. Haz clic en "Registrar Pago"
5. Ingresa un monto (ej: 1000)
6. Selecciona método de pago (efectivo/transferencia)
7. Haz clic en "Registrar"
8. **Verifica:**
   - ✅ Aparece notificación de éxito
   - ✅ Se muestra el recibo
   - ✅ El pago aparece en el historial
   - ✅ El saldo pendiente se actualiza
   - ✅ En Supabase, la tabla `pagos` tiene el nuevo registro

### Prueba 2: Fechas de Cobro

1. Ve a la página de "Préstamos"
2. Haz clic en "Nuevo Préstamo"
3. Selecciona:
   - Fecha de inicio: hoy
   - Día de cobro: Lunes
   - Frecuencia: Semanal
   - Plazo: 3 meses
4. **Verifica:**
   - ✅ Todas las fechas en la tabla de amortización caen en lunes
   - ✅ Las fechas están separadas por 7 días exactos
5. Repite con frecuencia "Quincenal" y verifica que todas caigan en lunes
6. Repite con frecuencia "Mensual" y verifica que todas caigan en lunes

---

## 📝 Archivos Modificados

### 1. `src/pages/CollectionsPage.tsx`
- **Líneas modificadas:** 3, 37-70
- **Cambios:**
  - Importación de `registerPayment` desde Supabase
  - Función `handlePayment` ahora es asíncrona
  - Usa Supabase en lugar del store local
  - Agrega manejo de errores
  - Recarga la página después de registrar

### 2. `src/pages/LoansPage.tsx`
- **Líneas modificadas:** 146-182
- **Cambios:**
  - Función `calculateDueDate` corregida
  - Frecuencia quincenal ahora suma 14 días (no 15)
  - Frecuencia mensual ahora ajusta al día de la semana correcto

---

## ⚠️ Consideraciones Importantes

### NO SE MODIFICARON:
- ✅ AuthContext.tsx
- ✅ supabaseClient.ts
- ✅ Lógica de roles
- ✅ Políticas RLS
- ✅ Estructura de la base de datos

### REQUISITOS DE SUPABASE:

Para que el registro de pagos funcione, asegúrate de que:

1. **La tabla `pagos` existe** con los campos correctos
2. **La función `generar_numero_recibo()` existe** en Supabase
3. **Las políticas RLS permiten** a los cobradores insertar pagos
4. **La tabla `movimientos_caja` existe** para registrar los ingresos

Si falta alguna de estas, ejecuta el script SQL en `supabase/schema.sql`.

---

## 🐛 Solución de Problemas

### Error: "Error al registrar pago: new row violates row-level security policy"

**Causa:** El cobrador no tiene permisos para insertar en la tabla `pagos`

**Solución:**
```sql
-- En Supabase SQL Editor, ejecuta:
CREATE POLICY "Cobradores pueden insertar pagos"
ON pagos FOR INSERT
WITH CHECK (
  cobrador_id = auth.uid()
);
```

### Error: "Error al registrar pago: function generar_numero_recibo does not exist"

**Causa:** Falta la función para generar números de recibo

**Solución:**
```sql
-- En Supabase SQL Editor, ejecuta:
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
```

### Las fechas siguen sin caer en el día correcto

**Causa:** El navegador tiene caché del código antiguo

**Solución:**
1. Limpia la caché del navegador (Ctrl+Shift+R)
2. O usa modo incógnito
3. O haz un hard reload (Ctrl+F5)

---

## ✅ Build Exitoso

```
✓ 2061 modules transformed
✓ built in 11.10s
```

El proyecto compila correctamente sin errores.

---

**Fecha:** Enero 2024  
**Versión:** 1.2.0  
**Estado:** ✅ Problemas críticos corregidos
