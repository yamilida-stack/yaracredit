# Configuración de Autenticación con Supabase Auth

## 📋 Resumen de Cambios

Se ha migrado el sistema de autenticación de PINs locales a autenticación real con Supabase Auth usando correo electrónico y contraseña.

## 🔧 Archivos Modificados

### 1. **supabase/profiles.sql** (NUEVO)
Script SQL para crear la tabla `profiles` vinculada a `auth.users` con:
- Trigger automático para crear perfil cuando se registra un usuario
- Políticas de seguridad (RLS)
- Índices para optimización

### 2. **src/contexts/AuthContext.tsx** (NUEVO)
Contexto de autenticación con:
- Listener de cambios de estado con `supabase.auth.onAuthStateChange()`
- Funciones: `signIn`, `signUp`, `signOut`, `resetPassword`
- Manejo de perfil de usuario desde la tabla `profiles`
- Sesión persistente

### 3. **src/pages/LoginPage.tsx** (MODIFICADO)
- ✅ Eliminado sistema de PINs
- ✅ Formulario de correo y contraseña
- ✅ Opción de registro de nuevos usuarios
- ✅ Recuperación de contraseña
- ✅ Mensajes de error claros

### 4. **src/App.tsx** (MODIFICADO)
- ✅ Integrado `AuthProvider` como wrapper principal
- ✅ Verificación de autenticación antes de mostrar la app
- ✅ Pantalla de carga mientras verifica sesión

### 5. **src/components/Layout.tsx** (MODIFICADO)
- ✅ Usa `useAuth()` en lugar del store para obtener usuario
- ✅ Botón de cerrar sesión funcional con `signOut()`
- ✅ Muestra información del perfil (nombre, rol)

## 🚀 Pasos de Configuración

### Paso 1: Crear Tabla de Perfiles en Supabase

1. Ve a tu proyecto en Supabase
2. Navega a **SQL Editor**
3. Copia y pega el contenido de `supabase/profiles.sql`
4. Ejecuta el script

Esto creará:
- Tabla `profiles` vinculada a `auth.users`
- Trigger automático para crear perfiles
- Políticas de seguridad RLS

### Paso 2: Configurar URLs de Redirección

1. Ve a **Authentication** → **URL Configuration**
2. Agrega estas URLs:
   - **Site URL**: `https://yaracredit.netlify.app` (o tu dominio)
   - **Redirect URLs**: 
     - `https://yaracredit.netlify.app/**`
     - `http://localhost:3000/**` (para desarrollo)

### Paso 3: Habilitar Proveedores de Autenticación

1. Ve a **Authentication** → **Providers**
2. Asegúrate de que **Email** esté habilitado
3. Opcionalmente configura:
   - Confirmación de email (recomendado para producción)
   - Plantillas de emails personalizados

### Paso 4: Crear Usuarios de Prueba

**Opción A: Desde el Panel de Supabase**
1. Ve a **Authentication** → **Users**
2. Click en **Add user** → **Create new user**
3. Ingresa email, contraseña y metadata:
   ```json
   {
     "full_name": "Admin Principal",
     "role": "admin"
   }
   ```

**Opción B: Desde la Aplicación**
1. Abre la app
2. Click en "¿No tienes cuenta? Regístrate"
3. Completa el formulario
4. El usuario se creará con rol `cobrador` por defecto

### Paso 5: Asignar Roles a Usuarios

Para cambiar el rol de un usuario existente:

```sql
-- En Supabase SQL Editor
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@yaracredit.com';
```

## 👥 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso total: todo el sistema |
| **gerente** | Todo excepto gestión de usuarios |
| **cobrador** | Dashboard, Clientes, Préstamos, Cobros, Dispositivos |
| **solo_lectura** | Dashboard, Clientes, Préstamos, Reportes (solo lectura) |

## 🔐 Flujo de Autenticación

### Inicio de Sesión
```typescript
const { signIn } = useAuth();
const { error } = await signIn(email, password);
```

### Registro
```typescript
const { signUp } = useAuth();
const { error } = await signUp(email, password, fullName, role);
```

### Cerrar Sesión
```typescript
const { signOut } = useAuth();
await signOut();
```

### Recuperar Contraseña
```typescript
const { resetPassword } = useAuth();
const { error } = await resetPassword(email);
```

## 📊 Estructura de Datos

### Tabla `profiles`
```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'gerente', 'cobrador', 'solo_lectura')),
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Uso en Componentes
```typescript
import { useAuth } from '../contexts/AuthContext';

function MiComponente() {
  const { user, profile, signOut } = useAuth();
  
  // user: objeto User de Supabase
  // profile: datos adicionales (nombre, rol, etc.)
  
  if (profile?.role === 'admin') {
    // Mostrar opciones de admin
  }
}
```

## 🔄 Migración desde PINs

El sistema anterior usaba PINs locales almacenados en localStorage. Ahora:

| Antes (PINs) | Ahora (Supabase Auth) |
|--------------|----------------------|
| PIN de 4-6 dígitos | Email + contraseña |
| Almacenado en localStorage | Almacenado en Supabase |
| Sin recuperación | Recuperación por email |
| Sin registro | Registro self-service |
| Sin roles dinámicos | Roles desde base de datos |

## 🛡️ Seguridad

### Políticas RLS Implementadas
- ✅ Usuarios pueden ver su propio perfil
- ✅ Usuarios pueden actualizar su propio perfil
- ✅ Solo admins pueden ver todos los perfiles

### Recomendaciones
1. **Habilitar confirmación de email** en producción
2. **Usar contraseñas fuertes** (mínimo 6 caracteres)
3. **Configurar rate limiting** en Supabase
4. **Monitorear intentos fallidos** en el dashboard

## 🐛 Troubleshooting

### Error: "Email not confirmed"
- El usuario debe confirmar su email
- Revisa la bandeja de entrada (y spam)
- O desactiva la confirmación en Supabase → Authentication → Settings

### Error: "Invalid login credentials"
- Verifica email y contraseña
- Asegúrate de que el usuario existe en Supabase

### El perfil no se crea automáticamente
- Verifica que el trigger esté configurado
- Revisa la consola del navegador para errores
- Ejecuta manualmente: `SELECT * FROM profiles;`

### No puedo cerrar sesión
- Limpia el localStorage: `localStorage.clear()`
- Recarga la página
- Verifica que `signOut()` se esté ejecutando

## 📝 Próximos Pasos

1. ✅ Ejecutar `supabase/profiles.sql` en Supabase
2. ✅ Configurar URLs de redirección
3. ✅ Crear usuarios de prueba
4. ✅ Probar el flujo completo (login, logout, registro)
5. ✅ Hacer commit y push a GitHub
6. ✅ Desplegar en Netlify

## 🔗 Recursos

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Nota**: El sistema de PINs locales aún existe en el store para compatibilidad, pero ya no se usa en la interfaz. Puedes eliminarlo completamente en una futura iteración.
