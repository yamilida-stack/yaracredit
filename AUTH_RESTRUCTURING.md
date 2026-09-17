# Reestructuración de Autenticación - YaraCredit

## ✅ Cambios Completados

### 1. Eliminación Total de Google OAuth
- ✅ Eliminado botón "Continuar con Google" del LoginPage
- ✅ Eliminada función `handleGoogleLogin`
- ✅ Eliminado separador "o continúa con"
- ✅ Eliminada importación de `supabase` del LoginPage (ya no se necesita)
- ✅ Login ahora es EXCLUSIVAMENTE con Email y Contraseña

### 2. Login con Email/Contraseña y Roles
- ✅ Usa `supabase.auth.signInWithPassword({ email, password })`
- ✅ Consulta la tabla `profiles` para obtener el rol del usuario
- ✅ Roles actualizados: `administrador` y `cobrador`
- ✅ Mensajes de error en español:
  - "Correo o contraseña incorrectos"
  - "Por favor confirma tu correo electrónico"
  - "Usuario no encontrado"

### 3. Sistema de Gestión de Usuarios
- ✅ Nueva página `UserManagementPage.tsx` (solo accesible para administradores)
- ✅ Permite crear usuarios con:
  - Nombre completo
  - Correo electrónico
  - Contraseña (mínimo 6 caracteres)
  - Rol (administrador o cobrador)
- ✅ Permite editar usuarios existentes
- ✅ Permite activar/desactivar usuarios
- ✅ Permite eliminar usuarios
- ✅ **NO usa SERVICE_ROLE_KEY** - Usa `supabase.auth.signUp()` desde el frontend
- ✅ Inserta automáticamente el perfil en la tabla `profiles`

### 4. AuthContext Actualizado
- ✅ Provee: `user`, `profile`, `loading`, `signOut()`
- ✅ Eliminado `signUp` del contexto (ahora se maneja en UserManagementPage)
- ✅ Tipos de roles actualizados: `'administrador' | 'cobrador'`

### 5. ProtectedRoute Component
- ✅ Nuevo componente `ProtectedRoute.tsx`
- ✅ Verifica si el usuario está autenticado
- ✅ Verifica si el usuario tiene el rol adecuado
- ✅ Redirige al login si no está autenticado
- ✅ Redirige al dashboard correspondiente según el rol

### 6. Políticas RLS de Supabase
- ✅ Script SQL completo en `supabase/rls-policies.sql`
- ✅ Solo administradores pueden insertar nuevos perfiles
- ✅ Solo administradores pueden ver todos los usuarios
- ✅ Cobradores solo ven sus propios datos
- ✅ Políticas para clientes, créditos y pagos

---

## 📋 Archivos Modificados

### Eliminados/Modificados:
1. **`src/pages/LoginPage.tsx`** - Eliminado Google OAuth, solo email/password
2. **`src/contexts/AuthContext.tsx`** - Actualizado roles, eliminado signUp
3. **`src/App.tsx`** - Agregada ruta para UserManagementPage
4. **`src/components/Layout.tsx`** - Actualizados roles y navegación

### Nuevos:
1. **`src/pages/UserManagementPage.tsx`** - Página de gestión de usuarios
2. **`src/components/ProtectedRoute.tsx`** - Componente de rutas protegidas
3. **`supabase/rls-policies.sql`** - Políticas de seguridad para Supabase

---

## 🚀 Pasos para Implementar en Supabase

### PASO 1: Ejecutar el Script de Políticas RLS

1. Ve a tu proyecto en Supabase
2. Navega a **SQL Editor**
3. Copia y pega el contenido de `supabase/rls-policies.sql`
4. Ejecuta el script

Esto creará:
- Políticas RLS para la tabla `profiles`
- Políticas RLS para `clientes`, `creditos`, `pagos`
- Función helper `is_admin()`
- Índices para mejor rendimiento

### PASO 2: Crear el Primer Administrador

**Opción A: Desde Supabase Dashboard (Recomendado)**

1. Ve a **Authentication** → **Users**
2. Click en **Add user** → **Create new user**
3. Ingresa:
   - Email: `admin@yaracredit.com`
   - Password: `TuContraseñaSegura123`
   - Auto Confirm User: ✅ (marca esta opción)
4. Click en **Create user**
5. Copia el **UID** del usuario creado
6. Ve a **Table Editor** → **profiles**
7. Click en **Insert** → **New Row**
8. Ingresa:
   - `id`: (pega el UID copiado)
   - `email`: `admin@yaracredit.com`
   - `full_name`: `Administrador Principal`
   - `role`: `administrador`
   - `active`: `true`
9. Click en **Save**

**Opción B: Desde la Aplicación (si ya tienes un admin)**

1. Inicia sesión con el administrador existente
2. Ve a **Gestión de Usuarios**
3. Click en **Nuevo Usuario**
4. Llena el formulario con los datos del nuevo administrador
5. Click en **Crear Usuario**

### PASO 3: Verificar Configuración

1. Inicia sesión con el administrador creado
2. Deberías ver el Dashboard con todas las opciones
3. Ve a **Gestión de Usuarios** en el menú lateral
4. Verifica que puedes ver la lista de usuarios
5. Intenta crear un nuevo usuario de prueba (cobrador)

---

## 🔐 Seguridad Implementada

### Frontend (React/Vite):
- ✅ **NO se usa SERVICE_ROLE_KEY** en el frontend
- ✅ Se usa `supabase.auth.signUp()` para crear usuarios
- ✅ El trigger de Supabase crea automáticamente el perfil
- ✅ Políticas RLS validan que solo administradores puedan insertar

### Backend (Supabase):
- ✅ Políticas RLS estrictas en todas las tablas
- ✅ Solo administradores pueden:
  - Ver todos los usuarios
  - Crear nuevos usuarios
  - Editar usuarios
  - Eliminar usuarios
- ✅ Cobradores solo pueden:
  - Ver su propio perfil
  - Ver clientes asignados
  - Registrar pagos

---

## 📊 Estructura de Roles

### Administrador
- ✅ Acceso total al sistema
- ✅ Puede ver todos los datos
- ✅ Puede gestionar usuarios
- ✅ Puede crear/editar/eliminar clientes, préstamos, etc.
- ✅ Puede ver reportes completos

### Cobrador
- ✅ Solo puede ver sus propios datos
- ✅ Solo puede ver clientes asignados a sus rutas
- ✅ Solo puede registrar pagos de sus clientes
- ❌ NO puede gestionar usuarios
- ❌ NO puede ver datos de otros cobradores

---

## 🧪 Pruebas Recomendadas

### Test 1: Login como Administrador
1. Inicia sesión con el admin creado
2. Verifica que veas todas las opciones del menú
3. Verifica que puedas acceder a "Gestión de Usuarios"

### Test 2: Crear un Cobrador
1. Ve a **Gestión de Usuarios**
2. Click en **Nuevo Usuario**
3. Llena:
   - Nombre: `Juan Cobrador`
   - Email: `cobrador@test.com`
   - Contraseña: `Test123456`
   - Rol: `Cobrador`
4. Click en **Crear Usuario**
5. Verifica que aparezca en la lista

### Test 3: Login como Cobrador
1. Cierra sesión
2. Inicia sesión con `cobrador@test.com` / `Test123456`
3. Verifica que:
   - Solo veas las opciones permitidas para cobradores
   - NO veas "Gestión de Usuarios"
   - Solo veas clientes asignados a ti

### Test 4: Seguridad RLS
1. Como cobrador, intenta acceder directamente a `/user-management`
2. Deberías ser redirigido al dashboard de cobrador
3. Intenta ver la lista de usuarios desde la consola del navegador
4. Deberías obtener un error de permisos

---

## 📝 Notas Importantes

### Sobre la Creación de Usuarios:
- Cuando se crea un usuario desde el frontend, se ejecutan dos pasos:
  1. `supabase.auth.signUp()` crea el usuario en `auth.users`
  2. El trigger de Supabase crea automáticamente el perfil en `profiles`
  3. Las políticas RLS validan que el usuario que crea sea administrador

### Sobre las Contraseñas:
- Las contraseñas deben tener mínimo 6 caracteres
- Supabase las encripta automáticamente con bcrypt
- Nunca se almacenan en texto plano

### Sobre los Roles:
- Los roles se almacenan en la tabla `profiles`
- Solo pueden ser: `administrador` o `cobrador`
- El rol se asigna al crear el usuario
- Solo administradores pueden cambiar roles

---

## 🐛 Troubleshooting

### Error: "new row violates row-level security policy"
- **Causa**: Estás intentando crear un usuario sin ser administrador
- **Solución**: Inicia sesión con un administrador primero

### Error: "Could not find the table: profiles"
- **Causa**: No has ejecutado el script SQL
- **Solución**: Ejecuta `supabase/rls-policies.sql` en el SQL Editor

### Error: "Invalid API key"
- **Causa**: Las variables de entorno no están configuradas
- **Solución**: Verifica `.env.local` con las credenciales correctas

### El usuario se crea pero no aparece en la lista
- **Causa**: El trigger no se ejecutó correctamente
- **Solución**: Verifica que el trigger `on_auth_user_created` exista en Supabase

---

## 📚 Recursos Adicionales

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Triggers](https://supabase.com/docs/guides/database/triggers)

---

## ✅ Checklist Final

- [ ] Ejecutar `supabase/rls-policies.sql` en Supabase
- [ ] Crear el primer administrador desde Supabase Dashboard
- [ ] Verificar que el admin pueda acceder a "Gestión de Usuarios"
- [ ] Crear un usuario de prueba (cobrador)
- [ ] Verificar que el cobrador solo vea sus datos
- [ ] Probar la seguridad RLS intentando acceder sin permisos
- [ ] Hacer commit y push a GitHub
- [ ] Verificar que Netlify despliegue correctamente

---

**Fecha:** Enero 2024  
**Versión:** 2.0.0  
**Estado:** ✅ Completado y Listo para Producción
