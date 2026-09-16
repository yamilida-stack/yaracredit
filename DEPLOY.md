# Guía Rápida de Despliegue

## 🚀 Despliegue en 3 Pasos

### 1. Preparar el Proyecto

```bash
# Clonar o descargar el proyecto
cd yaracredit

# Instalar dependencias
npm install

# Probar localmente
npm run dev
```

### 2. Build para Producción

```bash
npm run build
```

Esto genera la carpeta `dist/` lista para desplegar.

### 3. Desplegar

#### Opción A: Vercel (Más Fácil)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar (sigue las instrucciones)
vercel
```

O conecta tu repositorio de GitHub en [vercel.com](https://vercel.com) y se desplegará automáticamente.

#### Opción B: Netlify

1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta `dist/` al dashboard
3. ¡Listo! Tu sitio estará en línea

O usa Netlify CLI:
```bash
npm i -g netlify-cli
netlify deploy --prod
```

#### Opción C: GitHub Pages

```bash
# Instalar gh-pages
npm install -D gh-pages

# Agregar al package.json:
"homepage": "https://tu-usuario.github.io/yaracredit",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

# Desplegar
npm run deploy
```

#### Opción D: Servidor Propio (VPS/Hosting)

```bash
# Build
npm run build

# Sube la carpeta dist/ a tu servidor
scp -r dist/* usuario@tu-servidor.com:/var/www/yaracredit/
```

Configura nginx:
```nginx
server {
    listen 80;
    server_name yaracredit.com;
    root /var/www/yaracredit;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 📱 Instalar como PWA

Una vez desplegado:

### En Android:
1. Abre Chrome y navega a tu URL
2. Toca el menú (⋮)
3. Selecciona "Agregar a pantalla principal"

### En iOS:
1. Abre Safari y navega a tu URL
2. Toca el botón Compartir
3. Selecciona "Agregar a pantalla principal"

### En Desktop:
1. Abre Chrome/Edge
2. Busca el icono de instalación en la barra de direcciones
3. O usa Menú → Instalar aplicación

## 🔧 Configuración Post-Despliegue

### 1. Configurar Datos de Empresa

Ve a **Configuración → General** y actualiza:
- Nombre de la empresa
- RNC/Identificación fiscal
- Dirección
- Teléfono
- Moneda

### 2. Configurar Tasas de Interés

Ve a **Configuración → Préstamos** y ajusta:
- Tasa de interés predeterminada
- Plazo predeterminado
- Comisión de cobradores
- Recargo por mora

### 3. Crear Usuarios

Ve a **Usuarios** y crea los usuarios necesarios:
- Admin (acceso total)
- Gerente (todo menos usuarios)
- Cobradores (solo sus rutas)

### 4. Configurar Respaldo

Ve a **Configuración → Respaldo** y:
- Activa el respaldo automático
- Exporta un respaldo inicial
- Guarda el archivo en un lugar seguro

## 🔐 Seguridad

### Recomendaciones:

1. **Usa HTTPS**: Obligatorio para PWA y service workers
2. **Cambia los PINs**: Los PINs de demo son solo para pruebas
3. **Respalda regularmente**: Exporta datos cada semana
4. **Limita accesos**: Usa roles apropiados para cada usuario
5. **Actualiza periódicamente**: Mantén la app actualizada

### HTTPS Gratis con Let's Encrypt:

```bash
# En tu servidor VPS
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yaracredit.com
```

## 📊 Monitoreo

### Vercel:
- Dashboard con analytics
- Logs en tiempo real
- Métricas de rendimiento

### Netlify:
- Analytics integrados
- Logs de despliegue
- Formularios y funciones

### Propio:
- Configura Google Analytics
- Usa Sentry para errores
- Monitorea con UptimeRobot

## 🆘 Problemas Comunes

### La app no carga después del despliegue
- Verifica que el servidor redirija a `index.html`
- Revisa la consola del navegador (F12)
- Limpia la caché del navegador

### El service worker no se registra
- Asegúrate de estar en HTTPS
- Verifica que `sw.js` sea accesible
- Revisa la consola del navegador

### Los datos no se guardan
- Verifica que localStorage esté habilitado
- No uses modo incóognito
- Revisa el espacio disponible en el navegador

### La PWA no se instala
- Debe estar en HTTPS
- El manifest.json debe ser válido
- El service worker debe estar registrado

## 📞 Soporte

Si tienes problemas:

1. Revisa la consola del navegador (F12 → Console)
2. Verifica los logs del servidor
3. Consulta el README.md completo
4. Revisa la documentación de Vercel/Netlify

## ✅ Checklist Pre-Lanzamiento

- [ ] Build exitoso (`npm run build`)
- [ ] Probado en localhost
- [ ] Desplegado en servidor
- [ ] HTTPS configurado
- [ ] Datos de empresa actualizados
- [ ] Usuarios creados
- [ ] PINs cambiados
- [ ] Respaldo inicial exportado
- [ ] PWA instalable
- [ ] Service worker funcionando
- [ ] Probado en móvil
- [ ] Probado en desktop
- [ ] Documentación leída por el equipo

---

**¡Listo para producir!** 🎉

Tu sistema YaraCredit está listo para ser usado en producción.
