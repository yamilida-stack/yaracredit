import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFOptions {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  data: (string | number)[][];
  footer?: string;
  includeLogo?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export function generatePDF({
  title,
  subtitle,
  filename,
  headers,
  data,
  footer,
  includeLogo = true,
  orientation = 'portrait'
}: PDFOptions): void {
  const doc = new jsPDF(orientation);
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yPos = 20;

  // Logo (si está habilitado)
  if (includeLogo) {
    // Crear un logo simple con texto estilizado
    doc.setFillColor(109, 40, 217); // Color morado de YaraCredit
    doc.rect(20, yPos - 5, 30, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Y', 30, yPos + 5);
    doc.setTextColor(0, 0, 0);
    
    // Nombre de la empresa al lado del logo
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('YaraCredit', 55, yPos + 5);
    
    yPos += 20;
  }

  // Título
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Subtítulo (si existe)
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  }

  // Fecha de generación
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  const fechaGeneracion = new Date().toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generado: ${fechaGeneracion}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Línea separadora
  doc.setDrawColor(109, 40, 217);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // Tabla de datos
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: yPos,
    theme: 'striped',
    headStyles: {
      fillColor: [109, 40, 217],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 30]
    },
    alternateRowStyles: {
      fillColor: [245, 243, 255]
    },
    margin: { top: 20, left: 20, right: 20 },
    didDrawPage: (data) => {
      // Pie de página con número de página
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
  });

  // Footer personalizado (si existe)
  if (footer) {
    const finalY = (doc as any).lastAutoTable.finalY || yPos;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(footer, 20, finalY + 15);
  }

  // Descargar el PDF
  doc.save(`${filename}.pdf`);
}

// Función auxiliar para exportar reportes de clientes
export function exportClientsPDF(clients: any[]): void {
  const headers = ['Nombre', 'Cédula', 'Teléfono', 'Dirección', 'Email'];
  const data = clients.map(client => [
    client.fullName || '',
    client.cedula || '',
    client.phone || '',
    client.address || '',
    client.email || ''
  ]);

  generatePDF({
    title: 'Reporte de Clientes',
    subtitle: `Total: ${clients.length} clientes`,
    filename: `clientes_${new Date().toISOString().split('T')[0]}`,
    headers,
    data,
    footer: 'YaraCredit - Sistema de Gestión de Préstamos'
  });
}

// Función auxiliar para exportar reportes de préstamos
export function exportLoansPDF(loans: any[], clients: any[]): void {
  const headers = ['Cliente', 'Monto', 'Tasa', 'Plazo', 'Cuota', 'Total', 'Estado'];
  const data = loans.map(loan => {
    const client = clients.find(c => c.id === loan.clientId);
    return [
      client?.fullName || 'N/A',
      `C$ ${loan.amount.toLocaleString('es-NI')}`,
      `${loan.interestRate}%`,
      `${loan.term} meses`,
      `C$ ${loan.installmentAmount.toLocaleString('es-NI')}`,
      `C$ ${loan.totalAmount.toLocaleString('es-NI')}`,
      loan.status
    ];
  });

  const totalMonto = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalInteres = loans.reduce((sum, l) => sum + l.totalInterest, 0);

  generatePDF({
    title: 'Reporte de Préstamos',
    subtitle: `Total: ${loans.length} préstamos`,
    filename: `prestamos_${new Date().toISOString().split('T')[0]}`,
    headers,
    data,
    footer: `Monto Total: C$ ${totalMonto.toLocaleString('es-NI')} | Interés Total: C$ ${totalInteres.toLocaleString('es-NI')}`
  });
}

// Función auxiliar para exportar recibos de pago
export function exportReceiptPDF(payment: any, client: any, loan: any, collector: any): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yPos = 20;

  // Logo
  doc.setFillColor(109, 40, 217);
  doc.rect(20, yPos - 5, 30, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Y', 30, yPos + 5);
  doc.setTextColor(0, 0, 0);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('YaraCredit', 55, yPos + 5);
  yPos += 20;

  // Título del recibo
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO DE PAGO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Información del recibo
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Recibo No: ${payment.receiptNumber}`, 20, yPos);
  yPos += 7;
  doc.text(`Fecha: ${new Date(payment.date).toLocaleDateString('es-NI')}`, 20, yPos);
  yPos += 15;

  // Información del cliente
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE:', 20, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${client.fullName}`, 20, yPos);
  yPos += 7;
  doc.text(`Cédula: ${client.cedula}`, 20, yPos);
  yPos += 7;
  doc.text(`Teléfono: ${client.phone}`, 20, yPos);
  yPos += 15;

  // Información del pago
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES DEL PAGO:', 20, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Monto Pagado: C$ ${payment.amount.toLocaleString('es-NI')}`, 20, yPos);
  yPos += 7;
  doc.text(`Método de Pago: ${payment.method}`, 20, yPos);
  yPos += 7;
  doc.text(`Préstamo: C$ ${loan.amount.toLocaleString('es-NI')} a ${loan.interestRate}% mensual`, 20, yPos);
  yPos += 15;

  // Saldo pendiente
  const paid = loan.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const remaining = loan.totalAmount - paid;
  
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN:', 20, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Total del Préstamo: C$ ${loan.totalAmount.toLocaleString('es-NI')}`, 20, yPos);
  yPos += 7;
  doc.text(`Total Pagado: C$ ${paid.toLocaleString('es-NI')}`, 20, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(`Saldo Pendiente: C$ ${remaining.toLocaleString('es-NI')}`, 20, yPos);
  yPos += 20;

  // Línea de firma
  doc.setDrawColor(0, 0, 0);
  doc.line(20, yPos, 80, yPos);
  doc.line(pageWidth - 80, yPos, pageWidth - 20, yPos);
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma del Cobrador', 35, yPos);
  doc.text('Firma del Cliente', pageWidth - 65, yPos);

  // Descargar
  doc.save(`recibo_${payment.receiptNumber}_${client.fullName.replace(/\s/g, '_')}.pdf`);
}

// Función auxiliar para exportar contratos
export function exportContractPDF(loan: any, client: any): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yPos = 20;

  // Logo
  doc.setFillColor(109, 40, 217);
  doc.rect(20, yPos - 5, 30, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Y', 30, yPos + 5);
  doc.setTextColor(0, 0, 0);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('YaraCredit', 55, yPos + 5);
  yPos += 20;

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE PRÉSTAMO PERSONAL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Número de contrato
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contrato No: ${loan.id.toUpperCase().slice(0, 8)}`, 20, yPos);
  doc.text(`Fecha: ${new Date(loan.startDate).toLocaleDateString('es-NI')}`, pageWidth - 70, yPos);
  yPos += 15;

  // Datos del prestatario
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL PRESTATARIO:', 20, yPos);
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${client.fullName}`, 20, yPos);
  yPos += 6;
  doc.text(`Cédula: ${client.cedula}`, 20, yPos);
  yPos += 6;
  doc.text(`Dirección: ${client.address}`, 20, yPos);
  yPos += 6;
  doc.text(`Teléfono: ${client.phone}`, 20, yPos);
  yPos += 6;
  if (client.guarantor) {
    doc.text(`Fiador: ${client.guarantor} - Tel: ${client.guarantorPhone}`, 20, yPos);
    yPos += 6;
  }
  yPos += 10;

  // Datos del préstamo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL PRÉSTAMO:', 20, yPos);
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Monto: C$ ${loan.amount.toLocaleString('es-NI')}`, 20, yPos);
  yPos += 6;
  doc.text(`Tipo: ${loan.type.charAt(0).toUpperCase() + loan.type.slice(1)}`, 20, yPos);
  yPos += 6;
  doc.text(`Modalidad: ${loan.modality === 'efectivo' ? 'Efectivo' : 'Financiamiento de Artículo'}`, 20, yPos);
  yPos += 6;
  doc.text(`Tasa de interés mensual: ${loan.interestRate}%`, 20, yPos);
  yPos += 6;
  doc.text(`Plazo: ${loan.term} meses`, 20, yPos);
  yPos += 6;
  doc.text(`Cuota: C$ ${loan.installmentAmount.toLocaleString('es-NI')}`, 20, yPos);
  yPos += 6;
  doc.text(`Total a pagar: C$ ${loan.totalAmount.toLocaleString('es-NI')}`, 20, yPos);
  yPos += 6;
  doc.text(`Intereses totales: C$ ${loan.totalInterest.toLocaleString('es-NI')}`, 20, yPos);
  yPos += 15;

  // Cláusulas
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CLÁUSULAS:', 20, yPos);
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const clauses = [
    '1. El prestatario se compromete a pagar la cuota establecida en la fecha acordada.',
    '2. En caso de mora, se aplicarán recargos según la política de la empresa.',
    '3. El prestatario autoriza la verificación de la información proporcionada.',
    '4. Las garantías entregadas serán devueltas al cancelar el préstamo.',
    '5. El incumplimiento faculta a la empresa a tomar las acciones legales correspondientes.'
  ];

  clauses.forEach(clause => {
    const lines = doc.splitTextToSize(clause, pageWidth - 40);
    doc.text(lines, 20, yPos);
    yPos += lines.length * 5 + 2;
  });

  yPos += 10;

  // Garantías
  if (loan.guarantees && loan.guarantees.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('GARANTÍAS:', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(loan.guarantees.join(', '), 20, yPos);
    yPos += 15;
  }

  // Firmas
  doc.setDrawColor(0, 0, 0);
  doc.line(20, yPos, 80, yPos);
  doc.line(pageWidth - 80, yPos, pageWidth - 20, yPos);
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma del Prestatario', 35, yPos);
  doc.text('Firma del Representante', pageWidth - 70, yPos);
  yPos += 4;
  doc.text(client.fullName, 35, yPos);
  doc.text('YaraCredit', pageWidth - 60, yPos);

  if (client.guarantor) {
    yPos += 15;
    doc.line(20, yPos, 80, yPos);
    yPos += 5;
    doc.text('Firma del Fiador', 35, yPos);
    yPos += 4;
    doc.text(client.guarantor, 35, yPos);
  }

  // Descargar
  doc.save(`contrato_${loan.id.slice(0, 8)}_${client.fullName.replace(/\s/g, '_')}.pdf`);
}
