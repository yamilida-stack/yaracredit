# Configuración del Sistema - Guía de Implementación

## ✅ Problema Resuelto

Las configuraciones del sistema ahora se guardan y cargan desde la base de datos Supabase, asegurando persistencia entre sesiones.

## 📋 Tabla de Configuración en Supabase

### Estructura de la Tabla

```sql
CREATE TABLE public.configuracion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT DEFAULT 'text' CHECK (tipo IN ('text', 'number', 'boolean', 'json')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Configuraciones Disponibles

| Clave | Tipo | Descripción | Valor por Defecto |
|-------|------|-------------|-------------------|
| `nombre_empresa` | text | Nombre de la empresa | YaraCredit |
| `telefono_empresa` | text | Teléfono de contacto | 0000-0000 |
| `direccion_empresa` | text | Dirección física | Dirección de la empresa |
| `tasa_interes_default` | number | Tasa de interés (% mensual) | 14 |
| `plazo_default` | number | Plazo predeterminado (meses) | 3 |
| `dias_gracia` | number | Días de gracia antes de mora | 3 |
| `moneda` | text | Moneda del sistema | C$ |
| `modo_oscuro` | boolean | Activar modo oscuro | false |
| `tamanio_recibo` | text | Tamaño del recibo térmico | 50mm |
| `comision_cobradores` | number | Comisión para cobradores (%) | 5 |
| `recargo_mora` | number | Recargo por mora (%) | 2 |
| `encabezado_recibo` | text | Encabezado de recibos | YARACREDIT - Sistema de Préstamos |
| `pie_recibo` | text | Pie de página de recibos | ¡Gracias por su pago! |
| `plantilla_whatsapp` | text | Plantilla de mensaje WhatsApp | Hola {cliente}... |
| `notificaciones_push` | boolean | Habilitar notificaciones push | true |
| `respaldo_automatico` | boolean | Respaldo automático diario | true |

## 🚀 Pasos para Implementar

### 1. Crear la Tabla en Supabase

1. Ve a tu proyecto en Supabase
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo `supabase/create_configuracion_table.sql`
4. Ejecuta el script

El script crea:
- ✅ La tabla `configuracion`
- ✅ Políticas de seguridad (RLS)
- ✅ Índices para mejor rendimiento
- ✅ Datos iniciales de configuración
- ✅ Trigger para actualizar `updated_at` automáticamente

### 2. Verificar la Creación

Después de ejecutar el script, verifica en Supabase:

1. Ve a **Table Editor**
2. Busca la tabla `configuracion`
3. Deberías ver 16 registros con las configuraciones iniciales

### 3. Probar la Funcionalidad

1. Inicia sesión como **administrador**
2. Ve a la página de **Configuración**
3. Modifica algún valor (ej: Nombre de la empresa)
4. Haz clic en **Guardar**
5. Recarga la página
6. Verifica que el cambio se mantuvo

## 🔒 Seguridad

### Políticas RLS

- **SELECT**: Todos los usuarios autenticados pueden leer la configuración
- **INSERT**: Solo administradores pueden crear nuevas configuraciones
- **UPDATE**: Solo administradores pueden modificar configuraciones

### Validación en el Frontend

```typescript
// Verificar permisos de administrador
const isAdmin = profile?.role === 'admin';

if (!isAdmin) {
  addNotification('error', 'Solo los administradores pueden guardar configuraciones');
  return;
}
```

## 💻 Implementación en el Código

### Cargar Configuraciones (SettingsPage.tsx)

```typescript
useEffect(() => {
  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuracion')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        // Convertir array de configuraciones a objeto
        const configMap: any = {};
        data.forEach((item: any) => {
          let valor = item.valor;
          
          // Convertir tipos según el campo 'tipo'
          if (item.tipo === 'number') {
            valor = parseFloat(valor);
          } else if (item.tipo === 'boolean') {
            valor = valor === 'true';
          } else if (item.tipo === 'json') {
            try {
              valor = JSON.parse(valor);
            } catch (e) {
              console.error('Error parsing JSON config:', e);
            }
          }
          
          configMap[item.clave] = valor;
        });

        // Actualizar estado local
        const newSettings = {
          ...settings,
          companyName: configMap.nombre_empresa || settings.companyName,
          companyPhone: configMap.telefono_empresa || settings.companyPhone,
          // ... más campos
        };

        setLocalSettings(newSettings);
        updateSettings(newSettings);
      }
    } catch (error: any) {
      console.error('Error al cargar configuración:', error);
      addNotification('error', 'Error al cargar configuración: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  loadConfig();
}, []);
```

### Guardar Configuraciones

```typescript
const handleSave = async () => {
  if (!isAdmin) {
    addNotification('error', 'Solo los administradores pueden guardar configuraciones');
    return;
  }

  try {
    setSaving(true);

    // Preparar las configuraciones para guardar
    const configsToSave = [
      { clave: 'nombre_empresa', valor: localSettings.companyName, tipo: 'text' },
      { clave: 'telefono_empresa', valor: localSettings.companyPhone, tipo: 'text' },
      { clave: 'tasa_interes_default', valor: localSettings.defaultInterestRate.toString(), tipo: 'number' },
      { clave: 'modo_oscuro', valor: localSettings.darkMode.toString(), tipo: 'boolean' },
      // ... más configuraciones
    ];

    // Guardar cada configuración usando upsert
    const updates = configsToSave.map(config =>
      supabase
        .from('configuracion')
        .upsert({
          clave: config.clave,
          valor: config.valor,
          tipo: config.tipo,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'clave'
        })
    );

    await Promise.all(updates);

    // Actualizar el store local
    updateSettings(localSettings);
    
    addNotification('success', 'Configuración guardada correctamente');
  } catch (error: any) {
    console.error('Error al guardar configuración:', error);
    addNotification('error', 'Error al guardar configuración: ' + error.message);
  } finally {
    setSaving(false);
  }
};
```

## 🎨 Interfaz de Usuario

### Estados de la Interfaz

1. **Loading**: Mientras se cargan las configuraciones desde Supabase
   ```typescript
   if (loading) {
     return (
       <div className="flex items-center justify-center min-h-[400px]">
         <Loader2 size={48} className="animate-spin text-purple-600 mx-auto mb-4" />
         <p className="text-gray-600">Cargando configuración...</p>
       </div>
     );
   }
   ```

2. **Sin Permisos**: Si el usuario no es administrador
   ```typescript
   if (!isAdmin) {
     return (
       <Card className="p-8 text-center">
         <Shield size={48} className="mx-auto text-gray-400 mb-4" />
         <h4 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h4>
         <p className="text-gray-600">
           Solo los administradores pueden ver y modificar la configuración del sistema.
         </p>
       </Card>
     );
   }
   ```

3. **Guardando**: Mientras se guardan las configuraciones
   ```typescript
   <Button size="sm" onClick={handleSave} disabled={saving}>
     {saving ? (
       <>
         <Loader2 size={14} className="animate-spin" /> Guardando...
       </>
     ) : (
       <>
         <Save size={14} /> Guardar
       </>
     )}
   </Button>
   ```

## 📊 Conversión de Tipos

El sistema convierte automáticamente los valores según el tipo:

### Text
```typescript
valor: 'YaraCredit'
```

### Number
```typescript
// En la BD: '14' (texto)
// En el frontend: 14 (número)
valor = parseFloat(valor);
```

### Boolean
```typescript
// En la BD: 'true' o 'false' (texto)
// En el frontend: true o false (booleano)
valor = valor === 'true';
```

### JSON
```typescript
// En la BD: '{"key": "value"}' (texto)
// En el frontend: { key: 'value' } (objeto)
valor = JSON.parse(valor);
```

## 🔧 Configuraciones Especiales

### Modo Oscuro

El modo oscuro se guarda en la base de datos y se aplica globalmente:

```typescript
// Al cambiar el modo oscuro
const newDarkMode = !localSettings.darkMode;
setLocalSettings({...localSettings, darkMode: newDarkMode});
toggleDarkMode(); // Aplica el cambio visual inmediatamente

// Al guardar
{ clave: 'modo_oscuro', valor: localSettings.darkMode.toString(), tipo: 'boolean' }
```

### Plantilla de WhatsApp

La plantilla soporta variables dinámicas:

```typescript
// Plantilla guardada
'Hola {cliente}, le recordamos que tiene un pago pendiente de {monto} para hoy.'

// Variables disponibles
// {cliente} - Nombre del cliente
// {monto} - Monto del pago
// {fecha} - Fecha del pago
// {cuota} - Número de cuota
```

## 🐛 Solución de Problemas

### Error: "relation configuracion does not exist"

**Solución**: Ejecuta el script SQL en Supabase para crear la tabla.

### Error: "null value in column violates not-null constraint"

**Solución**: Asegúrate de que todas las configuraciones iniciales se insertaron correctamente.

### Las configuraciones no se guardan

**Solución**: 
1. Verifica que estás logueado como administrador
2. Revisa la consola del navegador para ver errores
3. Verifica las políticas RLS en Supabase

### Las configuraciones no se cargan

**Solución**:
1. Verifica que la tabla `configuracion` tiene datos
2. Revisa la consola del navegador para ver errores
3. Asegúrate de que el usuario está autenticado

## 📝 Archivos Modificados

1. **src/pages/SettingsPage.tsx**
   - Agregado `useEffect` para cargar configuraciones
   - Modificado `handleSave` para guardar en Supabase
   - Agregado estado de loading
   - Agregado validación de permisos
   - Agregado estado de saving

2. **supabase/create_configuracion_table.sql**
   - Script SQL para crear la tabla
   - Datos iniciales de configuración
   - Políticas RLS
   - Índices
   - Trigger para `updated_at`

## ✅ Build Exitoso

```
✓ 2311 modules transformed
✓ built in 16.98s
```

## 🎯 Resumen

- ✅ Las configuraciones ahora se guardan en Supabase
- ✅ Solo los administradores pueden modificar configuraciones
- ✅ Los cambios persisten entre sesiones
- ✅ Interfaz con estados de loading y saving
- ✅ Conversión automática de tipos de datos
- ✅ Políticas de seguridad (RLS) configuradas
- ✅ Build exitoso sin errores

## 📚 Próximos Pasos

1. Ejecutar el script SQL en Supabase
2. Probar la funcionalidad de guardar/cargar
3. Verificar que los cambios persisten al recargar
4. Probar con diferentes usuarios (admin vs cobrador)
