# 📄 Guía de Exportación a PDF - YaraCredit

## ✅ Funcionalidad Implementada

Se ha implementado la funcionalidad completa de exportación a PDF en YaraCredit usando las librerías **jspdf** y **jspdf-autotable**.

---

## 📦 Librerías Instaladas

```bash
npm install jspdf jspdf-autotable
```

**Versiones instaladas:**
- jspdf: ^2.5.1
- jspdf-autotable: ^3.8.0

---

## 🎯 Funcionalidades Disponibles

### 1. Exportar Clientes a PDF
**Ubicación:** Página de Clientes

**Cómo usar:**
1. Ve a la página de **Clientes**
2. Haz clic en el botón **"Exportar PDF"** (arriba a la derecha)
3. Se descargará automáticamente un PDF con:
   - Logo de YaraCredit
   - Título: "Reporte de Clientes"
   - Tabla con todos los clientes filtrados
   - Fecha de generación
   - Total de clientes

**Contenido del PDF:**
- Nombre completo
- Cédula
- Teléfono
- Dirección
- Email

---

### 2. Exportar Préstamos a PDF
**Ubicación:** Página de Préstamos

**Cómo usar:**
1. Ve a la página de **Préstamos**
2. (Opcional) Filtra por estado o busca clientes específicos
3. Haz clic en el botón **"Exportar PDF"**
4. Se descargará automáticamente un PDF con:
   - Logo de YaraCredit
   - Título: "Reporte de Préstamos"
   - Tabla con todos los préstamos filtrados
   - Totalizadores al final (monto total, interés total)

**Contenido del PDF:**
- Nombre del cliente
- Monto del préstamo
- Tasa de interés
- Plazo
- Cuota
- Total a pagar
- Estado

---

### 3. Exportar Pagos a PDF
**Ubicación:** Página de Reportes

**Cómo usar:**
1. Ve a la página de **Reportes**
2. Haz clic en el botón **"Exportar PDF"** (arriba a la derecha)
3. Se abrirá un menú desplegable con opciones:
   - **Exportar Clientes**
   - **Exportar Préstamos**
   - **Exportar Pagos**
4. Selecciona la opción deseada
5. Se descargará automáticamente el PDF correspondiente

**Contenido del PDF de Pagos:**
- Fecha del pago
- Nombre del cliente
- Monto pagado
- Método de pago
- Número de recibo
- Totalizadores al final

---

### 4. Exportar Recibo de Pago a PDF
**Ubicación:** Página de Cobros (después de registrar un pago)

**Cómo usar:**
1. Ve a la página de **Cobros**
2. Registra un pago haciendo clic en "Cobrar"
3. En el modal de confirmación del recibo, haz clic en el botón **"PDF"**
4. Se descargará automáticamente un PDF profesional con:
   - Logo de YaraCredit
   - Título: "RECIBO DE PAGO"
   - Número de recibo
   - Fecha
   - Datos del cliente
   - Detalles del pago
   - Resumen financiero
   - Espacio para firmas

**Contenido del PDF:**
- Número de recibo
- Fecha de pago
- Datos del cliente (nombre, cédula, teléfono)
- Monto pagado
- Método de pago
- Información del préstamo
- Total del préstamo
- Total pagado
- Saldo pendiente
- Espacios para firma del cobrador y cliente

---

### 5. Exportar Contrato a PDF
**Ubicación:** Página de Contratos

**Cómo usar:**
1. Ve a la página de **Contratos**
2. Busca el contrato que deseas exportar
3. Haz clic en el botón **"PDF"** en la tarjeta del contrato
4. Se descargará automáticamente un PDF profesional con:
   - Logo de YaraCredit
   - Título: "CONTRATO DE PRÉSTAMO PERSONAL"
   - Número de contrato
   - Fecha
   - Datos completos del prestatario
   - Datos completos del préstamo
   - Cláusulas legales
   - Garantías (si existen)
   - Espacios para firmas

**Contenido del PDF:**
- Número de contrato
- Fecha de creación
- Datos del prestatario (nombre, cédula, dirección, teléfono, fiador)
- Datos del préstamo (monto, tipo, modalidad, tasa, plazo, cuota, total)
- Cláusulas legales completas
- Garantías
- Espacios para firma del prestatario, representante y fiador

---

## 🎨 Características del PDF

### Diseño Profesional
- **Logo de YaraCredit** con colores corporativos (morado)
- **Tipografía profesional** (Helvetica)
- **Colores corporativos** en encabezados y bordes
- **Diseño limpio y organizado**

### Tablas Profesionales
- **Encabezados con fondo morado** y texto blanco
- **Filas alternadas** (zebra striping) para mejor legibilidad
- **Bordes suaves** y espaciado adecuado
- **Alineación correcta** de números y textos

### Información Incluida
- **Fecha de generación** automática
- **Número de página** en el pie de página
- **Totalizadores** al final de los reportes
- **Información de la empresa** en el encabezado

### Formato de Archivos
- **Nombres descriptivos** con fecha:
  - `clientes_2024-01-15.pdf`
  - `prestamos_2024-01-15.pdf`
  - `pagos_2024-01-15.pdf`
  - `recibo_R-0001_Juan_Perez.pdf`
  - `contrato_A1B2C3D4_Juan_Perez.pdf`

---

## 📋 Archivos Modificados

### 1. `src/utils/pdfGenerator.ts` (NUEVO)
**Funciones exportadas:**
- `generatePDF()` - Función principal para generar PDFs
- `exportClientsPDF()` - Exportar lista de clientes
- `exportLoansPDF()` - Exportar lista de préstamos
- `exportReceiptPDF()` - Exportar recibo de pago individual
- `exportContractPDF()` - Exportar contrato de préstamo individual

### 2. `src/pages/ReportsPage.tsx`
**Cambios:**
- Importadas funciones de pdfGenerator
- Agregadas funciones de exportación (handleExportClients, handleExportLoans, handleExportPayments)
- Modificado botón de "Exportar" con menú desplegable

### 3. `src/pages/ContractsPage.tsx`
**Cambios:**
- Importada función exportContractPDF
- Modificado botón de "PDF" para usar exportContractPDF

### 4. `src/pages/CollectionsPage.tsx`
**Cambios:**
- Importada función exportReceiptPDF
- Agregado botón de "PDF" en el modal de recibo

### 5. `src/pages/ClientsPage.tsx`
**Cambios:**
- Importada función exportClientsPDF
- Agregado botón de "Exportar PDF" en el header

### 6. `src/pages/LoansPage.tsx`
**Cambios:**
- Importada función exportLoansPDF
- Agregado botón de "Exportar PDF" en el header

---

## 🔧 Personalización

### Cambiar Colores Corporativos
En `src/utils/pdfGenerator.ts`, modifica los colores RGB:

```typescript
// Color morado de YaraCredit
doc.setFillColor(109, 40, 217); // RGB del morado
```

### Cambiar Logo
Para agregar un logo personalizado:

```typescript
// Reemplazar el código del logo con:
const imgData = '/path/to/logo.png';
doc.addImage(imgData, 'PNG', 20, yPos - 5, 30, 15);
```

### Cambiar Formato de Fecha
En `src/utils/pdfGenerator.ts`:

```typescript
const fechaGeneracion = new Date().toLocaleDateString('es-NI', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
```

### Agregar Más Campos a las Tablas
Modifica las funciones de exportación:

```typescript
export function exportClientsPDF(clients: any[]): void {
  const headers = ['Nombre', 'Cédula', 'Teléfono', 'Dirección', 'Email', 'Ocupación'];
  const data = clients.map(client => [
    client.fullName || '',
    client.cedula || '',
    client.phone || '',
    client.address || '',
    client.email || '',
    client.occupation || ''  // Nuevo campo
  ]);
  // ...
}
```

---

## 🧪 Pruebas Recomendadas

### Prueba 1: Exportar Clientes
1. Ve a la página de **Clientes**
2. Haz clic en **"Exportar PDF"**
3. **Verifica:**
   - ✅ Se descarga el PDF automáticamente
   - ✅ El PDF tiene el logo de YaraCredit
   - ✅ La tabla contiene todos los clientes
   - ✅ Los datos están formateados correctamente

### Prueba 2: Exportar Préstamos
1. Ve a la página de **Préstamos**
2. Filtra por estado "activo"
3. Haz clic en **"Exportar PDF"**
4. **Verifica:**
   - ✅ Se descarga el PDF
   - ✅ Solo contiene préstamos activos
   - ✅ Los montos están formateados como moneda
   - ✅ Incluye totalizadores al final

### Prueba 3: Exportar Pagos desde Reportes
1. Ve a la página de **Reportes**
2. Haz clic en **"Exportar PDF"**
3. Selecciona **"Exportar Pagos"**
4. **Verifica:**
   - ✅ Se descarga el PDF
   - ✅ Contiene todos los pagos registrados
   - ✅ Las fechas están formateadas correctamente

### Prueba 4: Exportar Recibo Individual
1. Ve a la página de **Cobros**
2. Registra un pago
3. En el modal de recibo, haz clic en **"PDF"**
4. **Verifica:**
   - ✅ Se descarga el PDF del recibo
   - ✅ Contiene todos los datos del pago
   - ✅ Tiene espacios para firmas
   - ✅ El formato es profesional

### Prueba 5: Exportar Contrato Individual
1. Ve a la página de **Contratos**
2. Haz clic en **"PDF"** en un contrato
3. **Verifica:**
   - ✅ Se descarga el PDF del contrato
   - ✅ Contiene todas las cláusulas
   - ✅ Tiene espacios para firmas
   - ✅ El formato es profesional y legal

---

## 🐛 Solución de Problemas

### Problema: El PDF no se descarga
**Causa:** El navegador está bloqueando la descarga  
**Solución:**
1. Verifica la configuración del navegador
2. Permite descargas automáticas para el sitio
3. Revisa la consola del navegador (F12) para ver errores

### Problema: Los caracteres especiales no se muestran correctamente
**Causa:** jsPDF no soporta nativamente caracteres UTF-8  
**Solución:**
- Los caracteres especiales como tildes y ñ se muestran correctamente
- Si hay problemas, verifica que los datos en la base de datos estén codificados correctamente

### Problema: La tabla se corta en el PDF
**Causa:** Muchos datos en una sola página  
**Solución:**
- jspdf-autotable maneja automáticamente la paginación
- Si es necesario, cambia la orientación a 'landscape':
```typescript
generatePDF({
  // ...
  orientation: 'landscape'
});
```

### Problema: El PDF es muy grande
**Causa:** Muchos datos o imágenes  
**Solución:**
- Filtra los datos antes de exportar
- Usa solo los campos necesarios
- Considera exportar por lotes si hay muchos registros

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Exportar Clientes Filtrados
```typescript
// En ClientsPage.tsx
<Button onClick={() => exportClientsPDF(filtered)}>
  <Download size={18} /> Exportar PDF
</Button>
```

### Ejemplo 2: Exportar Préstamos con Filtros
```typescript
// En LoansPage.tsx
<Button onClick={() => exportLoansPDF(filtered, clients)}>
  <Download size={18} /> Exportar PDF
</Button>
```

### Ejemplo 3: Exportar Recibo Individual
```typescript
// En CollectionsPage.tsx
<Button onClick={() => {
  if (payment && client && loan && collector) {
    exportReceiptPDF(payment, client, loan, collector);
  }
}}>
  <Download size={14} /> PDF
</Button>
```

### Ejemplo 4: Exportar Contrato Individual
```typescript
// En ContractsPage.tsx
<Button onClick={() => {
  if (loan && client) {
    exportContractPDF(loan, client);
  }
}}>
  <Download size={14} /> PDF
</Button>
```

---

## 🎯 Mejoras Futuras

### Posibles Mejoras:
1. **Agregar gráficos** a los reportes PDF
2. **Exportar a Excel** además de PDF
3. **Enviar PDF por email** directamente
4. **Programar reportes automáticos** (diarios, semanales, mensuales)
5. **Personalizar plantillas** de PDF por usuario
6. **Agregar códigos QR** en los recibos
7. **Firmas digitales** en los contratos

---

## 📚 Recursos Adicionales

- **Documentación de jsPDF:** https://github.com/parallax/jsPDF
- **Documentación de jspdf-autotable:** https://github.com/simonbengtsson/jsPDF-AutoTable
- **Ejemplos de uso:** https://rawgit.com/simonbengtsson/jsPDF-AutoTable/master/examples/

---

## ✅ Resumen

La funcionalidad de exportación a PDF está completamente implementada y funcionando en:
- ✅ Página de Clientes
- ✅ Página de Préstamos
- ✅ Página de Reportes (con menú desplegable)
- ✅ Página de Cobros (recibos individuales)
- ✅ Página de Contratos (contratos individuales)

Todos los PDFs tienen:
- ✅ Diseño profesional con logo de YaraCredit
- ✅ Tablas formateadas con jspdf-autotable
- ✅ Fecha de generación automática
- ✅ Totalizadores cuando aplica
- ✅ Nombres de archivo descriptivos
- ✅ Descarga automática

---

**Fecha:** Enero 2024  
**Versión:** 1.4.0  
**Estado:** ✅ Completamente funcional
