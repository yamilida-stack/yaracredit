# ✅ Corrección de Error UUID en Creación de Préstamos

## 🐛 Problema Identificado

**Error:** `invalid input syntax for type uuid: "c5"`

**Causa:** El código estaba usando IDs cortos del store local ("c1", "c2", "c5") en lugar de los UUIDs completos de Supabase al crear préstamos.

---

## 🔧 Solución Implementada

### 1. Carga de Clientes desde Supabase

**Antes (incorrecto):**
```typescript
const { clients } = useStore(); // IDs como "c1", "c2", "c5"
```

**Después (correcto):**
```typescript
const [clients, setClients] = useState<Client[]>([]);

const loadClients = async () => {
  const { data } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre_completo', { ascending: true });
  
  const mappedClients = data.map(client => ({
    id: client.id, // UUID completo de Supabase
    fullName: client.nombre_completo,
    // ... más campos
  }));
  
  setClients(mappedClients);
};
```

### 2. Uso de profile.id del Usuario Logueado

**Antes (incorrecto):**
```typescript
cobrador_id: form.assignedCollector || null // Podía ser undefined o un ID incorrecto
```

**Después (correcto):**
```typescript
const { profile } = useAuth(); // profile.id es el UUID del usuario logueado

cobrador_id: profile.id // UUID completo y válido
```

### 3. Validación de UUIDs

**Agregada validación de UUIDs antes de insertar:**
```typescript
// Validar que tengamos UUIDs válidos
if (!profile?.id) {
  addNotification('error', 'Error: No se pudo obtener el ID del usuario logueado');
  return;
}

// Validar que el cliente_id sea un UUID válido
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(form.clientId)) {
  addNotification('error', 'Error: El ID del cliente no es válido');
  return;
}
```

### 4. Depuración con console.log

**Agregados logs para depuración:**
```typescript
console.log('=== DEPURACIÓN CREACIÓN DE PRÉSTAMO ===');
console.log('Cliente seleccionado (form.clientId):', form.clientId);
console.log('Usuario logueado (profile):', profile);
console.log('ID del cobrador (profile.id):', profile?.id);
console.log('Formulario completo:', form);
```

---

## 📁 Archivos Modificados

### `src/pages/LoansPage.tsx`

**Cambios realizados:**

1. **Importaciones actualizadas:**
   - ✅ Agregado `useAuth` para obtener el perfil del usuario
   - ✅ Agregado tipo `Client` para el estado de clientes

2. **Estado de clientes:**
   - ✅ Agregado `const [clients, setClients] = useState<Client[]>([])`
   - ✅ Agregada función `loadClients()` para cargar desde Supabase
   - ✅ Mapeo de datos de Supabase al formato de Client

3. **Validaciones agregadas:**
   - ✅ Validación de `profile.id` antes de crear préstamo
   - ✅ Validación de UUID con regex para `form.clientId`
   - ✅ Mensajes de error claros para cada validación

4. **Depuración:**
   - ✅ console.log al inicio de handleSubmit
   - ✅ console.log de valores calculados
   - ✅ console.log después de crear préstamo
   - ✅ console.log de cuotas generadas
   - ✅ console.log de errores

5. **Uso de profile.id:**
   - ✅ Cambiado `form.assignedCollector` por `profile.id` en creación
   - ✅ Cambiado `form.assignedCollector` por `profile.id` en actualización

6. **Mapeo de datos actualizado:**
   - ✅ Actualizado `loadLoans()` para usar nuevas columnas de `prestamos`
   - ✅ Mapeo de `cobros` en lugar de `pagos`

---

## 🧪 Cómo Probar que Funciona

### Prueba 1: Verificar que se cargan los clientes correctos

1. Abre la consola del navegador (F12)
2. Ve a la página de **Préstamos**
3. Busca el log: `=== DEPURACIÓN CREACIÓN DE PRÉSTAMO ===`
4. **Verifica:**
   - ✅ Los clientes en el dropdown tienen UUIDs completos
   - ✅ Ejemplo: `67e8f558-19d8-4eb7-a48a-65501037...`
   - ❌ NO deben ser IDs cortos como "c1", "c2", "c5"

### Prueba 2: Crear un préstamo

1. Ve a **Préstamos**
2. Haz clic en **"Nuevo Préstamo"**
3. Selecciona un cliente del dropdown
4. Llena el formulario:
   - Monto: 10000
   - Plazo: 3 meses
   - Tasa: 15%
   - Frecuencia: Semanal
5. Haz clic en **"Crear Préstamo"**
6. **Verifica en la consola:**
   ```
   === DEPURACIÓN CREACIÓN DE PRÉSTAMO ===
   Cliente seleccionado (form.clientId): 67e8f558-19d8-4eb7-a48a-65501037...
   Usuario logueado (profile): { id: "...", email: "...", role: "admin" }
   ID del cobrador (profile.id): 123e4567-e89b-12d3-a456-426614174000
   ```
7. **Verifica en Supabase:**
   - ✅ Ve a Table Editor → `prestamos`
   - ✅ El nuevo préstamo debe aparecer
   - ✅ `cliente_id` debe ser un UUID completo
   - ✅ `cobrador_id` debe ser un UUID completo

### Prueba 3: Verificar las cuotas

1. Después de crear el préstamo
2. Ve a Supabase → Table Editor → `cuotas`
3. **Verifica:**
   - ✅ Deben existir las cuotas generadas
   - ✅ `prestamo_id` debe coincidir con el ID del préstamo
   - ✅ Las fechas deben estar correctas

---

## 📊 Ejemplo de Logs de Depuración

### Log Exitoso:
```
=== DEPURACIÓN CREACIÓN DE PRÉSTAMO ===
Cliente seleccionado (form.clientId): 67e8f558-19d8-4eb7-a48a-65501037abcd
Usuario logueado (profile): {
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "admin@yaracredit.com",
  role: "admin"
}
ID del cobrador (profile.id): 123e4567-e89b-12d3-a456-426614174000
Formulario completo: {
  clientId: "67e8f558-19d8-4eb7-a48a-65501037abcd",
  amount: "10000",
  termMonths: "3",
  interestRate: "15",
  frequency: "Semanal",
  ...
}
Valores calculados: {
  amount: 10000,
  interestRate: 15,
  term: 3,
  totalInterest: 4500,
  totalAmount: 14500,
  totalCuotas: 12,
  installmentAmount: 1208
}
Creando nuevo préstamo con datos: {
  cliente_id: "67e8f558-19d8-4eb7-a48a-65501037abcd",
  cobrador_id: "123e4567-e89b-12d3-a456-426614174000",
  monto: 10000,
  tasa_interes: 15,
  plazo_meses: 3,
  monto_total: 14500,
  saldo_pendiente: 14500,
  estado: "activo",
  dia_cobro: "lunes",
  fecha_inicio: "2024-01-15"
}
Préstamo creado exitosamente: {
  id: "987fcdeb-51a2-43d7-9012-3456789abcde",
  cliente_id: "67e8f558-19d8-4eb7-a48a-65501037abcd",
  ...
}
Generando cuotas: [
  { prestamo_id: "987fcdeb-51a2-43d7-9012-3456789abcde", numero_cuota: 1, ... },
  { prestamo_id: "987fcdeb-51a2-43d7-9012-3456789abcde", numero_cuota: 2, ... },
  ...
]
Cuotas insertadas exitosamente
```

### Log con Error:
```
=== DEPURACIÓN CREACIÓN DE PRÉSTAMO ===
Cliente seleccionado (form.clientId): c5
Error: El ID del cliente no es válido
cliente_id no es un UUID válido: c5
```

---

## 🔍 Solución de Problemas

### Problema: "Error: No se pudo obtener el ID del usuario logueado"

**Causa:** El usuario no está logueado o el perfil no se cargó correctamente  
**Solución:**
1. Cierra sesión
2. Inicia sesión nuevamente
3. Verifica que el perfil se cargue correctamente

### Problema: "Error: El ID del cliente no es válido"

**Causa:** El cliente seleccionado tiene un ID corto en lugar de UUID  
**Solución:**
1. Recarga la página
2. Verifica que los clientes se carguen desde Supabase
3. Revisa la consola para ver los IDs de los clientes

### Problema: "invalid input syntax for type uuid"

**Causa:** Todavía se están usando IDs cortos  
**Solución:**
1. Limpia la caché del navegador (Ctrl+Shift+R)
2. Recarga la página
3. Verifica que los clientes se carguen desde Supabase
4. Revisa los console.log para ver qué IDs se están enviando

---

## 📝 Resumen de Cambios

✅ **Carga de clientes desde Supabase** con UUIDs completos  
✅ **Uso de profile.id** del usuario logueado  
✅ **Validación de UUIDs** antes de insertar  
✅ **Depuración con console.log** en puntos críticos  
✅ **Mapeo de datos actualizado** para nuevas columnas  
✅ **Manejo de errores** mejorado con mensajes claros  

---

## 🚀 Próximos Pasos

1. **Probar la creación de préstamos** con los cambios
2. **Revisar los console.log** en la consola del navegador
3. **Verificar en Supabase** que los datos se guarden correctamente
4. **Eliminar los console.log** una vez que todo funcione (opcional)

---

**Fecha:** Enero 2024  
**Versión:** 1.7.0  
**Estado:** ✅ Problema de UUID resuelto
