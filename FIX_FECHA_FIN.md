# Corrección de Error: fecha_fin en Préstamos

## Problema

Error al crear préstamo: "null value in column 'fecha_fin' of relation 'prestamos' violates not-null constraint"

La tabla `prestamos` en Supabase requiere el campo `fecha_fin` (fecha del último cobro), pero el código no lo estaba enviando.

## Solución Implementada

### 1. LoansPage.tsx

#### Cálculo de fecha_fin

Se agregó el cálculo de `fecha_fin` basado en la frecuencia de pago y el número de cuotas:

```typescript
// Calcular fecha_fin (último cobro)
const fechaInicio = new Date(form.startDate);
const fechaFin = new Date(fechaInicio);

if (frequency === 'semanal') {
  fechaFin.setDate(fechaFin.getDate() + (totalCuotas - 1) * 7);
} else if (frequency === 'quincenal') {
  fechaFin.setDate(fechaFin.getDate() + (totalCuotas - 1) * 14);
} else {
  fechaFin.setMonth(fechaFin.getMonth() + (totalCuotas - 1));
}

const fechaFinStr = fechaFin.toISOString().split('T')[0];
```

#### Inclusión en INSERT y UPDATE

Se agregó `fecha_fin: fechaFinStr` en:
- Creación de nuevo préstamo (línea 445)
- Actualización de préstamo existente (línea 412)

### 2. supabaseService.ts

#### Función createCredito

Se modificó la función `createCredito` para calcular y enviar `fecha_fin`:

```typescript
export async function createCredito(
  loan: Omit<Loan, 'id' | 'createdAt' | 'payments'>,
  cuotas: Array<{ numero: number; fecha: string; monto: number }>
): Promise<Loan> {
  // Calcular fecha_fin (último cobro)
  let fechaFin = loan.startDate;
  if (cuotas.length > 0) {
    fechaFin = cuotas[cuotas.length - 1].fecha;
  }

  // 1. Insertar crédito
  const { data: prestamoData, error: prestamoError } = await supabase
    .from('prestamos')
    .insert({
      cliente_id: loan.clientId,
      cobrador_id: loan.assignedCollector,
      monto: loan.amount,
      tasa_interes: loan.interestRate,
      plazo_meses: loan.term,
      monto_total: loan.totalAmount,
      saldo_pendiente: loan.totalAmount,
      estado: loan.status,
      dia_cobro: loan.preferredDay?.toLowerCase(),
      fecha_inicio: loan.startDate,
      fecha_fin: fechaFin, // ¡IMPORTANTE! Fecha del último cobro
    })
    .select()
    .single();
  
  // ... resto del código
}
```

## Lógica de Cálculo

### Ejemplos

#### Préstamo Semanal
- Fecha inicio: 2026-09-17
- Plazo: 3 meses
- Frecuencia: Semanal
- Total cuotas: 12 (3 meses × 4 semanas)
- **fecha_fin**: 2026-12-03 (11 semanas después de la fecha inicio)

#### Préstamo Quincenal
- Fecha inicio: 2026-09-17
- Plazo: 3 meses
- Frecuencia: Quincenal
- Total cuotas: 6 (3 meses × 2 quincenas)
- **fecha_fin**: 2026-11-19 (5 quincenas después de la fecha inicio)

#### Préstamo Mensual
- Fecha inicio: 2026-09-17
- Plazo: 3 meses
- Frecuencia: Mensual
- Total cuotas: 3
- **fecha_fin**: 2026-11-17 (2 meses después de la fecha inicio)

## Archivos Modificados

1. **src/pages/LoansPage.tsx**
   - Líneas 378-393: Cálculo de fecha_fin
   - Línea 412: Inclusión en UPDATE
   - Línea 445: Inclusión en INSERT

2. **src/services/supabaseService.ts**
   - Líneas 192-213: Cálculo e inclusión de fecha_fin en createCredito

## Resultado

✅ El error de "null value in column 'fecha_fin'" ha sido resuelto
✅ La fecha_fin se calcula automáticamente basada en la frecuencia y plazo
✅ El formato de fecha es correcto (YYYY-MM-DD)
✅ Build exitoso: 2311 modules transformed, built in 15.93s

## Pruebas

Para verificar que funciona correctamente:

1. Crear un nuevo préstamo con:
   - Fecha inicio: 2026-09-17
   - Plazo: 3 meses
   - Frecuencia: Semanal
   
2. Verificar en la consola del navegador:
   ```
   Valores calculados: {
     ...
     fecha_inicio: "2026-09-17",
     fecha_fin: "2026-12-03"
   }
   ```

3. Verificar en Supabase → Table Editor → prestamos:
   - El campo `fecha_fin` debe tener el valor "2026-12-03"

## Notas

- La fecha_fin representa la fecha del ÚLTIMO cobro
- Se calcula como: fecha_inicio + (totalCuotas - 1) × intervalo
- El intervalo depende de la frecuencia:
  - Semanal: 7 días
  - Quincenal: 14 días
  - Mensual: 1 mes
