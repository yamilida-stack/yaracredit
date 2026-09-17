# Corrección de Mapeo de Campos - Tabla Clientes

## Problema

El formulario de clientes tenía campos que no existen en la tabla de Supabase, causando errores al intentar guardar datos.

## Columnas que SÍ existen en la tabla `clientes`:

```sql
- id (uuid)
- nombre (text)
- telefono (text)
- email (text)
- direccion (text)
- cedula (text)
- creado_por (uuid, referencia a profiles)
- created_at
- updated_at
```

## Columnas que NO existen en la tabla (y se ignoran):

- whatsapp
- garante
- garante_telefono
- ocupacion
- ingreso_mensual
- lat
- lng
- referencias
- observaciones
- nivel_riesgo

## Cambios Realizados

### 1. ClientsPage.tsx

#### Antes (incorrecto):
```typescript
const clientData = {
  nombre: form.fullName,
  cedula: form.cedula,
  direccion: form.address,
  telefono: form.phone,
  whatsapp: form.whatsapp || form.phone,
  email: form.email || null,
  garante: form.guarantor || null,
  garante_telefono: form.guarantorPhone || null,
  lat: form.lat ? parseFloat(form.lat) : null,
  lng: form.lng ? parseFloat(form.lng) : null,
  ocupacion: form.occupation || null,
  ingreso_mensual: form.monthlyIncome ? parseFloat(form.monthlyIncome) : null,
  referencias: form.references || null,
  observaciones: form.observations || null,
};
```

#### Después (correcto):
```typescript
const clientData = {
  nombre: form.fullName,
  cedula: form.cedula,
  telefono: form.phone,
  email: form.email || null,
  direccion: form.address,
  creado_por: profile?.id || null,
  // Los siguientes campos NO existen en la tabla y se ignoran
};
```

#### Mapeo de carga (loadClients):
```typescript
const mappedClients: Client[] = (data || []).map(client => ({
  id: client.id,
  fullName: client.nombre,
  cedula: client.cedula,
  address: client.direccion || '',
  phone: client.telefono,
  whatsapp: client.telefono, // Usar el mismo teléfono como WhatsApp
  email: client.email,
  guarantor: undefined, // No existe en la BD
  guarantorPhone: undefined, // No existe en la BD
  lat: undefined, // No existe en la BD
  lng: undefined, // No existe en la BD
  occupation: undefined, // No existe en la BD
  monthlyIncome: undefined, // No existe en la BD
  references: undefined, // No existe en la BD
  observations: undefined, // No existe en la BD
  riskLevel: undefined, // No existe en la BD
  createdAt: client.created_at,
}));
```

### 2. supabaseService.ts

#### createCliente:
```typescript
export async function createCliente(client: Omit<Client, 'id' | 'createdAt'>, createdBy?: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre: client.fullName,
      cedula: client.cedula,
      telefono: client.phone,
      email: client.email || null,
      direccion: client.address,
      creado_por: createdBy || null,
    })
    .select()
    .single();
  
  if (error) throw error;
  return mapClienteFromDB(data);
}
```

#### updateCliente:
```typescript
export async function updateCliente(id: string, updates: Partial<Client>): Promise<void> {
  const dbUpdates: any = {};
  
  // Solo actualizar las columnas que existen en la tabla de Supabase
  if (updates.fullName) dbUpdates.nombre = updates.fullName;
  if (updates.cedula) dbUpdates.cedula = updates.cedula;
  if (updates.address) dbUpdates.direccion = updates.address;
  if (updates.phone) dbUpdates.telefono = updates.phone;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  
  const { error } = await supabase
    .from('clientes')
    .update(dbUpdates)
    .eq('id', id);
  
  if (error) throw error;
}
```

#### mapClienteFromDB:
```typescript
function mapClienteFromDB(db: any): Client {
  return {
    id: db.id,
    fullName: db.nombre,
    cedula: db.cedula,
    address: db.direccion || '',
    phone: db.telefono,
    whatsapp: db.telefono, // Usar el mismo teléfono como WhatsApp
    email: db.email,
    guarantor: undefined, // No existe en la BD
    guarantorPhone: undefined, // No existe en la BD
    lat: undefined, // No existe en la BD
    lng: undefined, // No existe en la BD
    occupation: undefined, // No existe en la BD
    monthlyIncome: undefined, // No existe en la BD
    references: undefined, // No existe en la BD
    observations: undefined, // No existe en la BD
    riskLevel: undefined, // No existe en la BD
    createdAt: db.created_at,
  };
}
```

## Resultado

Ahora el sistema solo envía las columnas que existen en la tabla de Supabase, evitando errores de "column does not exist".

Los campos adicionales del formulario (whatsapp, garante, ocupación, etc.) se mantienen en la interfaz pero no se guardan en la base de datos hasta que se agreguen esas columnas a la tabla.

## Build Status

✅ Build exitoso: 2311 modules transformed, built in 16.66s
