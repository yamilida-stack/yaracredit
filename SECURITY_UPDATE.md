# Actualización de Seguridad y Usabilidad - YaraCredit

## Resumen de Cambios

Se han implementado tres mejoras fundamentales en YaraCredit para mejorar la seguridad y experiencia de usuario.

## 1. Autenticación por Correo y Contraseña (Supabase Auth)

### Cambios Realizados
- ✅ Reemplazado sistema de login basado en PINs por autenticación real con Supabase Auth
- ✅ Implementado `supabase.auth.signInWithPassword({ email, password })`
- ✅ Removidos todos los botones de PINs de prueba de la interfaz
- ✅ Integrado listener de sesión con `onAuthStateChange`
- ✅ Consulta automática de tabla `profiles` para obtener rol del usuario

### Archivos Modificados
- `src/pages/LoginPage.tsx` - Nuevo formulario de email/contraseña
- `src/contexts/AuthContext.tsx` - Contexto de autenticación con Supabase
- `src/App.tsx` - Integración de AuthProvider
- `src/components/Layout.tsx` - Uso de useAuth() para obtener usuario y rol

### Flujo de Autenticación
```typescript
// Login
const { signIn } = useAuth();
await signIn(email, password);

// Obtener usuario y rol
const { user, profile } = useAuth();
// profile.role: 'admin' | 'gerente' | 'cobrador' | 'solo_lectura'

// Logout
const { signOut } = useAuth();
await signOut();
```

### Configuración en Supabase
1. Crear tabla `profiles` (ver `supabase/profiles.sql`)
2. Configurar trigger para crear perfil automáticamente
3. Habilitar autenticación por email en Supabase Dashboard

## 2. Control de Recibos por WhatsApp

### Cambios Realizados
- ✅ WhatsApp ahora es **opcional** (no se envía automáticamente)
- ✅ Botón "Compartir por WhatsApp" genera mensaje formateado al hacer clic
- ✅ Mensaje incluye todos los datos del recibo de forma profesional
- ✅ Abre WhatsApp Web/App con mensaje pre-llenado

### Formato del Mensaje WhatsApp
```
*YARACREDIT - Recibo de Pago*

*Recibo:* R-0001
*Fecha:* 15 ene 2024

*Cliente:* Juan Pérez
*Cédula:* 001-1234567-8

*Monto Pagado:* C$ 1,208.00
*Método:* efectivo
*Saldo Pendiente:* C$ 13,292.00

*Cobrador:* Carlos López

¡Gracias por su pago!
```

### Código de Implementación
```typescript
const handleWhatsApp = (phone: string, paymentData: any) => {
  const message = `*YARACREDIT - Recibo de Pago*%0A%0A` +
    `*Recibo:* ${payment.receiptNumber}%0A` +
    `*Fecha:* ${formatDate(payment.date)}%0A%0A` +
    `*Cliente:* ${client.fullName}%0A` +
    `*Cédula:* ${client.cedula}%0A%0A` +
    `*Monto Pagado:* ${formatCurrency(payment.amount)}%0A` +
    `*Método:* ${payment.method}%0A` +
    `*Saldo Pendiente:* ${formatCurrency(remaining)}%0A%0A` +
    `*Cobrador:* ${collector.name}%0A%0A` +
    `¡Gracias por su pago!`;

  const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`;
  window.open(whatsappUrl, '_blank');
};
```

### Archivos Modificados
- `src/pages/CollectionsPage.tsx` - handleWhatsApp() actualizado

## 3. Módulo de Impresión de Recibos

### Cambios Realizados
- ✅ Estilos CSS `@media print` para tickets térmicos 58mm y 80mm
- ✅ Componente `Receipt` reutilizable para impresión
- ✅ Botón "Imprimir" usa `window.print()` nativo del navegador
- ✅ Formato optimizado para impresoras térmicas Bluetooth

### Estilos de Impresión
```css
@media print {
  body * { visibility: hidden; }
  
  .receipt-print,
  .receipt-print * { visibility: visible; }
  
  .receipt-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 58mm;  /* o 80mm */
    padding: 2mm;
    font-family: 'Courier New', monospace;
    font-size: 10px;
  }
  
  @page {
    size: 58mm auto;
    margin: 0;
  }
}
```

### Componente Receipt
```typescript
import Receipt from '../components/Receipt';

<ReceiptComponent 
  payment={payment}
  client={client}
  collector={collector}
  remaining={remaining}
  thermalSize="58mm"  // o "80mm"
/>
```

### Archivos Creados/Modificados
- `src/components/Receipt.tsx` - Componente de recibo reutilizable
- `src/index.css` - Estilos @media print para tickets térmicos
- `src/pages/CollectionsPage.tsx` - Integración de Receipt y handlePrint()

## Instrucciones de Uso

### Para Cobradores

1. **Registrar Pago**
   - Seleccionar cliente de la lista
   - Ingresar monto y método de pago
   - Click en "Registrar Pago"

2. **Imprimir Recibo**
   - En el modal de confirmación, seleccionar tamaño (58mm/80mm)
   - Click en "Imprimir"
   - Seleccionar impresora térmica Bluetooth
   - El recibo se imprime automáticamente

3. **Compartir por WhatsApp** (Opcional)
   - Click en "Compartir por WhatsApp"
   - Se abre WhatsApp con mensaje pre-llenado
   - Seleccionar contacto y enviar

### Para Administradores

1. **Configurar Supabase Auth**
   ```bash
   # Ejecutar script SQL en Supabase
   # Ver: supabase/profiles.sql
   ```

2. **Crear Usuarios**
   - Ir a Supabase Dashboard → Authentication
   - Crear usuario con email y contraseña
   - Asignar rol en tabla `profiles`

3. **Probar Impresión**
   - Conectar impresora térmica Bluetooth
   - Registrar pago de prueba
   - Verificar que el recibo se imprima correctamente

## Configuración de Impresoras Térmicas

### Impresoras Compatibles
- Xprinter XP-58
- Rongta RP58
- MUNBYN MJ58
- Cualquier impresora térmica 58mm/80mm con Bluetooth/USB

### Configuración en Windows
1. Conectar impresora vía Bluetooth/USB
2. Instalar driver genérico de impresora térmica
3. Configurar como impresora predeterminada
4. En YaraCredit, click "Imprimir" → Seleccionar impresora

### Configuración en Android
1. Emparejar impresora vía Bluetooth
2. Usar app de impresión del fabricante
3. En YaraCredit, click "Imprimir" → Seleccionar impresora Bluetooth

## Seguridad

### Autenticación
- ✅ Contraseñas encriptadas con bcrypt (Supabase Auth)
- ✅ Tokens JWT para sesiones
- ✅ Refresh tokens automáticos
- ✅ Protección contra brute force

### Roles y Permisos
| Rol | Acceso |
|-----|--------|
| admin | Todo el sistema |
| gerente | Todo excepto gestión de usuarios |
| cobrador | Solo sus clientes y cobros |
| solo_lectura | Solo lectura de datos |

### WhatsApp
- ✅ Mensajes enviados solo cuando el usuario lo solicita
- ✅ No se almacenan mensajes en el servidor
- ✅ WhatsApp Web API oficial (no requiere tokens)

## Testing

### Probar Autenticación
```bash
npm run dev
# Ir a http://localhost:3000
# Intentar login con email/contraseña
# Verificar que se cargue el perfil y rol
```

### Probar Impresión
```bash
# Registrar un pago
# Click en "Imprimir"
# Verificar que se abra el diálogo de impresión
# Verificar formato del ticket (58mm/80mm)
```

### Probar WhatsApp
```bash
# Registrar un pago
# Click en "Compartir por WhatsApp"
# Verificar que se abra WhatsApp Web
# Verificar mensaje formateado correctamente
```

## Próximos Pasos

1. ✅ Desplegar cambios a producción
2. ⏳ Configurar impresoras térmicas en campo
3. ⏳ Capacitar cobradores en nuevo flujo
4. ⏳ Monitorear uso de WhatsApp
5. ⏳ Recopilar feedback de usuarios

## Documentación Adicional

- [AUTH_SETUP.md](./AUTH_SETUP.md) - Configuración completa de Supabase Auth
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [WhatsApp API](https://api.whatsapp.com/send)

---

**Fecha de Actualización:** Enero 2024  
**Versión:** 1.1.0  
**Estado:** ✅ Completado y Desplegado
