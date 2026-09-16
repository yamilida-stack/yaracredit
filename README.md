# YaraCredit - Sistema de Gestión de Préstamos

Sistema completo de gestión de préstamos personales con cobradores en campo. Diseñado para funcionar offline y sincronizar cuando haya conexión.

## 🚀 Características Principales

### Módulos Implementados

1. **Autenticación y Roles**
   - Login con PIN/código
   - Roles: Admin, Gerente, Cobrador, Solo Lectura
   - Multi-dispositivo con sesión persistente

2. **Gestión de Clientes**
   - Datos completos con geolocalización GPS
   - Historial de préstamos
   - Búsqueda rápida por nombre/cédula/teléfono
   - Observaciones y referencias

3. **Préstamos**
   - Tipos: Semanal, Quincenal, Mensual
   - Interés mensual configurable (ej: 14% mensual)
   - Modalidades: Efectivo o Financiamiento de Artículos
   - Cálculo automático de cuotas
   - Observaciones y propósito del préstamo

4. **Cobros y Rutas**
   - Cobradores asignados a rutas
   - Registro de pagos en campo
   - Generación de recibos térmicos (50mm/80mm)
   - Envío por WhatsApp

5. **Stock de Artículos**
   - Control de inventario
   - Número de serie e IMEI
   - Marca, modelo y observaciones
   - Alertas de stock bajo

6. **Dispositivos Financiados**
   - Control de artículos financiados
   - Seguimiento de pagos
   - Series e IMEI registrados

7. **Score de Riesgo con IA**
   - Análisis predictivo de clientes
   - Evaluación de historial de pagos
   - Recomendaciones automáticas

8. **Caja y Contabilidad**
   - Control de caja diaria
   - Arqueo obligatorio
   - Registro de ingresos y egresos
   - Categorías de gastos

9. **Planilla**
   - Cálculo automático de salarios
   - Comisiones por cobro (configurable)
   - Historial de pagos

10. **Reportes**
    - Cartera total y por estado
    - Morosidad y días vencidos
    - Rendimiento por cobrador
    - Flujo de caja
    - Gráficos interactivos

11. **Configuración**
    - Modo oscuro
    - Datos de empresa
    - Tasas de interés predeterminadas
    - Formato de recibos
    - Respaldo de datos

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Estado**: Zustand con persistencia
- **Gráficos**: Recharts
- **Iconos**: Lucide React
- **Fechas**: date-fns
- **PWA**: Service Worker + Manifest

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 🚢 Despliegue

### Opción 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

### Opción 2: Netlify

```bash
# Build
npm run build

# Subir carpeta dist/ a Netlify
```

### Opción 3: GitHub Pages

```bash
# Instalar gh-pages
npm install -D gh-pages

# Agregar a package.json:
# "deploy": "npm run build && gh-pages -d dist"

# Desplegar
npm run deploy
```

### Opción 4: Servidor Propio

```bash
# Build
npm run build

# Copiar carpeta dist/ a tu servidor web
# Configurar nginx/apache para servir archivos estáticos
```

### Configuración Nginx

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔐 Usuarios de Demostración

| PIN  | Rol          | Nombre           |
|------|--------------|------------------|
| 1234 | Admin        | Admin Principal  |
| 2345 | Gerente      | María García     |
| 3456 | Cobrador     | Carlos López     |
| 4567 | Cobrador     | Ana Martínez     |
| 5678 | Solo Lectura | Pedro Sánchez    |

## 📱 PWA - Instalación en Dispositivos

### Android
1. Abre la app en Chrome
2. Toca el menú (⋮)
3. Selecciona "Agregar a pantalla principal"

### iOS
1. Abre la app en Safari
2. Toca el botón Compartir
3. Selecciona "Agregar a pantalla principal"

### Desktop
1. Abre en Chrome/Edge
2. Busca el icono de instalación en la barra de direcciones
3. O usa el menú → "Instalar aplicación"

## 💾 Respaldo de Datos

Los datos se almacenan localmente en el navegador (localStorage). Para respaldar:

1. Ve a **Configuración → Respaldo**
2. Haz clic en **Exportar Datos**
3. Guarda el archivo JSON

Para restaurar:
1. Ve a **Configuración → Respaldo**
2. Haz clic en **Importar Datos**
3. Selecciona el archivo JSON

## 🔧 Configuración

### Variables de Entorno (Opcional)

Crea un archivo `.env` en la raíz:

```env
VITE_APP_NAME=YaraCredit
VITE_API_URL=https://api.tu-dominio.com
VITE_SUPABASE_URL=tu-url-supabase
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### Personalización

Edita `src/store/index.ts` para cambiar:
- Datos iniciales de clientes/préstamos
- Tasas de interés predeterminadas
- Comisiones de cobradores

## 📊 Base de Datos

Actualmente usa localStorage para persistencia. Para producción con múltiples dispositivos:

### Integrar Supabase

```bash
npm install @supabase/supabase-js
```

Configura en `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

## 🎨 Personalización de Marca

Edita estos archivos:
- `index.html` - Título y meta tags
- `public/manifest.json` - Nombre y colores de la app
- `src/pages/LoginPage.tsx` - Logo en login
- `src/components/Layout.tsx` - Logo en sidebar

## 📝 Notas Importantes

### Cálculo de Intereses
- El interés es MENSUAL
- Si son 3 meses al 14%, el total es 14% × 3 = 42%
- Fórmula: `Interés Total = Monto × (Tasa/100) × Meses`

### Cobros Semanales
- Excluyen domingos automáticamente
- 4 cobros por mes (semanal × 4 semanas)

### Refinanciamiento
- Si tiene ≤2 cuotas pagadas: paga lo vencido y recibe diferencia
- Si tiene >2 cuotas pagadas: no aplica refinanciamiento

## 🐛 Troubleshooting

### La app no carga después del build
- Verifica que el servidor esté configurado para redirigir todas las rutas a `index.html`
- En producción, usa `try_files $uri $uri/ /index.html;` en nginx

### Los datos no se guardan
- Verifica que el navegador soporte localStorage
- Limpia la caché del navegador
- Revisa la consola del navegador (F12)

### El service worker no se registra
- Asegúrate de estar en HTTPS (requerido para SW)
- En localhost funciona sin HTTPS
- Verifica que `sw.js` esté accesible en `/sw.js`

## 📄 Licencia

Este proyecto es privado y confidencial.

## 🤝 Soporte

Para soporte técnico o consultas:
- Email: soporte@yaracredit.com
- Documentación: https://docs.yaracredit.com

---

**YaraCredit v1.0** - Sistema de Gestión de Préstamos
Desarrollado con ❤️ para prestamistas y financieras
