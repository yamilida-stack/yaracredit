import { useState } from 'react';
import { useStore } from '../store';
import { Modal, Button, Card, Badge, formatCurrency, formatDate } from '../components/ui';
import { FileText, Download, Eye, Printer, CheckCircle } from 'lucide-react';

export default function ContractsPage() {
  const { loans, clients, users } = useStore();
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [template, setTemplate] = useState('standard');

  const activeLoans = loans.filter(l => l.status === 'activo' || l.status === 'mora');

  const generateContractText = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    const client = clients.find(c => c.id === loan?.clientId);
    if (!loan || !client) return '';

    return `
CONTRATO DE PRÉSTAMO PERSONAL
==============================

Contrato No: ${loan.id.toUpperCase().slice(0, 8)}
Fecha: ${formatDate(loan.startDate)}

DATOS DEL PRESTATARIO:
Nombre: ${client.fullName}
Cédula: ${client.cedula}
Dirección: ${client.address}
Teléfono: ${client.phone}
${client.guarantor ? `Fiador: ${client.guarantor} - Tel: ${client.guarantorPhone}` : ''}

DATOS DEL PRÉSTAMO:
Monto: ${formatCurrency(loan.amount)}
Tipo: ${loan.type.charAt(0).toUpperCase() + loan.type.slice(1)}
Modalidad: ${loan.modality === 'efectivo' ? 'Efectivo' : 'Financiamiento de Artículo'}
Tasa de interés mensual: ${loan.interestRate}%
Plazo: ${loan.term} meses
Cuota: ${formatCurrency(loan.installmentAmount)}
Total a pagar: ${formatCurrency(loan.totalAmount)}
Intereses totales: ${formatCurrency(loan.totalInterest)}

CLÁUSULAS:
1. El prestatario se compromete a pagar la cuota establecida en la fecha acordada.
2. En caso de mora, se aplicarán recargos según la política de la empresa.
3. El prestatario autoriza la verificación de la información proporcionada.
4. Las garantías entregadas serán devueltas al cancelar el préstamo.
5. El incumplimiento faculta a la empresa a tomar las acciones legales correspondientes.

${loan.guarantees && loan.guarantees.length > 0 ? `GARANTÍAS: ${loan.guarantees.join(', ')}` : ''}

_________________________          _________________________
Firma del Prestatario               Firma del Representante
${client.fullName}                   YaraCredit

_________________________
Firma del Fiador
${client.guarantor || 'N/A'}
    `.trim();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Genera y gestiona contratos de préstamos</p>
        </div>
        <div className="flex gap-2">
          <select value={template} onChange={e => setTemplate(e.target.value)} className="px-3 py-2 border rounded-xl text-sm">
            <option value="standard">Plantilla Estándar</option>
            <option value="detailed">Plantilla Detallada</option>
            <option value="simple">Plantilla Simple</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeLoans.map(loan => {
          const client = clients.find(c => c.id === loan.clientId);
          return (
            <Card key={loan.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-purple-600" />
                </div>
                <Badge variant={loan.status === 'activo' ? 'success' : 'danger'}>{loan.status}</Badge>
              </div>
              <h4 className="font-bold text-gray-900">{client?.fullName}</h4>
              <p className="text-sm text-gray-500">{formatCurrency(loan.amount)} • {loan.type}</p>
              <p className="text-xs text-gray-400 mt-1">Inicio: {formatDate(loan.startDate)}</p>
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowPreview(loan.id)}>
                  <Eye size={14} /> Ver
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                  const text = generateContractText(loan.id);
                  const blob = new Blob([text], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `Contrato_${client?.fullName.replace(/\s/g, '_')}.txt`;
                  a.click(); URL.revokeObjectURL(url);
                }}>
                  <Download size={14} /> PDF
                </Button>
              </div>
            </Card>
          );
        })}
        {activeLoans.length === 0 && (
          <Card className="col-span-full p-8 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay préstamos activos para generar contratos</p>
          </Card>
        )}
      </div>

      {/* Preview Modal */}
      <Modal isOpen={!!showPreview} onClose={() => setShowPreview(null)} title="Vista Previa del Contrato" size="xl">
        {showPreview && (
          <div>
            <pre className="bg-gray-50 p-6 rounded-xl text-sm font-mono whitespace-pre-wrap border max-h-[60vh] overflow-y-auto">
              {generateContractText(showPreview)}
            </pre>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => { window.print(); }}>
                <Printer size={16} /> Imprimir
              </Button>
              <Button>
                <CheckCircle size={16} /> Firmar Digitalmente
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
