import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Modal, Button, Card, Badge, Input, Select, formatCurrency, formatDate } from '../components/ui';
import { FileText, Download, Eye, Printer, CheckCircle, Edit2, Send } from 'lucide-react';
import { exportContractPDF } from '../utils/pdfGenerator';
import type { Loan, Client } from '../types';

export default function ContractsPage() {
  const { loans, clients, users, updateLoan, addNotification } = useStore();
  const { profile } = useAuth();
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<Loan | null>(null);
  const [template, setTemplate] = useState('standard');
  const [editForm, setEditForm] = useState({
    amount: '',
    interestRate: '',
    term: '',
    clientId: '',
  });
  const [localLoans, setLocalLoans] = useState<Loan[]>([]);
  const [localClients, setLocalClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar préstamos y clientes desde Supabase
  useEffect(() => {
    loadLoans();
    loadClients();
  }, []);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prestamos')
        .select(`
          *,
          clientes!inner(*),
          cuotas(*),
          cobros(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear datos de Supabase al formato de Loan
      const mappedLoans: Loan[] = (data || []).map(loan => ({
        id: loan.id,
        clientId: loan.cliente_id,
        type: 'mensual',
        modality: 'efectivo',
        amount: loan.monto,
        interestRate: loan.tasa_interes,
        term: loan.plazo_meses,
        installmentAmount: loan.monto_total / loan.plazo_meses,
        totalAmount: loan.monto_total,
        totalInterest: loan.monto_total - loan.monto,
        startDate: loan.fecha_inicio,
        status: loan.estado.toLowerCase(),
        assignedCollector: loan.cobrador_id,
        articleId: undefined,
        guarantees: undefined,
        observations: undefined,
        purpose: undefined,
        preferredDay: loan.dia_cobro,
        payments: (loan.cobros || []).map((p: any) => ({
          id: p.id,
          loanId: p.prestamo_id,
          clientId: '',
          amount: p.monto,
          method: p.metodo_pago,
          date: p.fecha_cobro,
          collectorId: p.creado_por,
          receiptNumber: p.nota?.replace('Recibo: ', '') || '',
          isLate: false,
          synced: true,
        })),
        createdAt: loan.created_at,
      }));

      setLocalLoans(mappedLoans);
    } catch (error: any) {
      console.error('Error al cargar préstamos:', error);
      addNotification('error', 'Error al cargar préstamos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      
      const mappedClients: Client[] = (data || []).map(client => ({
        id: client.id,
        fullName: client.nombre,
        cedula: client.cedula,
        address: client.direccion || '',
        phone: client.telefono,
        whatsapp: client.telefono,
        email: client.email,
        guarantor: undefined,
        guarantorPhone: undefined,
        lat: undefined,
        lng: undefined,
        occupation: undefined,
        monthlyIncome: undefined,
        references: undefined,
        observations: undefined,
        riskLevel: undefined,
        createdAt: client.created_at,
      }));

      setLocalClients(mappedClients);
    } catch (error: any) {
      console.error('Error al cargar clientes:', error);
      addNotification('error', 'Error al cargar clientes: ' + error.message);
    }
  };

  const activeLoans = localLoans.filter(l => l.status === 'activo' || l.status === 'mora');

  // Función para abrir modal de edición
  const openEditModal = (loan: Loan) => {
    const client = localClients.find(c => c.id === loan.clientId);
    console.log('=== ABRIENDO MODAL DE EDICIÓN ===');
    console.log('Préstamo:', loan);
    console.log('Cliente:', client);
    setEditForm({
      amount: loan.amount.toString(),
      interestRate: loan.interestRate.toString(),
      term: loan.term.toString(),
      clientId: loan.clientId,
    });
    setShowEditModal(loan);
  };

  // Función para guardar cambios del contrato
  const handleSaveEdit = async () => {
    if (!showEditModal) return;

    try {
      const amount = parseFloat(editForm.amount);
      const interestRate = parseFloat(editForm.interestRate);
      const term = parseInt(editForm.term);
      
      // Calcular totales
      const totalInterest = amount * (interestRate / 100) * term;
      const totalAmount = amount + totalInterest;
      const installmentAmount = totalAmount / term;

      console.log('=== GUARDANDO CAMBIOS DEL CONTRATO ===');
      console.log('Préstamo ID:', showEditModal.id);
      console.log('Datos actualizados:', { amount, interestRate, term, totalAmount });

      // Actualizar en Supabase
      const { error } = await supabase
        .from('prestamos')
        .update({
          monto: amount,
          tasa_interes: interestRate,
          plazo_meses: term,
          monto_total: totalAmount,
          saldo_pendiente: totalAmount,
          cliente_id: editForm.clientId,
        })
        .eq('id', showEditModal.id);

      if (error) throw error;

      addNotification('success', 'Contrato actualizado exitosamente');
      setShowEditModal(null);
      
      // Recargar los datos desde Supabase
      await loadLoans();
    } catch (error: any) {
      console.error('Error al actualizar contrato:', error);
      addNotification('error', `Error al actualizar: ${error.message}`);
    }
  };

  // Función para compartir contrato por WhatsApp
  const shareContractWhatsApp = (loanId: string) => {
    const loan = localLoans.find(l => l.id === loanId);
    const client = localClients.find(c => c.id === loan?.clientId);
    
    console.log('=== COMPARTIENDO CONTRATO POR WHATSAPP ===');
    console.log('Préstamo:', loan);
    console.log('Cliente:', client);
    
    if (!loan || !client) {
      addNotification('error', 'No se encontraron los datos del contrato');
      return;
    }

    const message = `*CONTRATO DE PRÉSTAMO - YaraCredit*%0A%0A` +
      `*Cliente:* ${client.fullName}%0A` +
      `*Cédula:* ${client.cedula}%0A%0A` +
      `*Monto del Préstamo:* ${formatCurrency(loan.amount)}%0A` +
      `*Tasa de Interés:* ${loan.interestRate}% mensual%0A` +
      `*Plazo:* ${loan.term} meses%0A` +
      `*Total a Pagar:* ${formatCurrency(loan.totalAmount)}%0A%0A` +
      `*Fecha de Inicio:* ${formatDate(loan.startDate)}%0A` +
      `*Cuota:* ${formatCurrency(loan.installmentAmount)}%0A` +
      `*Frecuencia:* ${loan.type}%0A%0A` +
      `*Contrato No:* ${loan.id.toUpperCase().slice(0, 8)}`;

    const phone = client.whatsapp || client.phone;
    if (!phone) {
      addNotification('error', 'El cliente no tiene número de WhatsApp registrado');
      return;
    }

    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`;
    console.log('Abriendo WhatsApp:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
    addNotification('success', 'Abriendo WhatsApp para enviar contrato');
  };

  const generateContractText = (loanId: string) => {
    const loan = localLoans.find(l => l.id === loanId);
    const client = localClients.find(c => c.id === loan?.clientId);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contratos...</p>
        </div>
      </div>
    );
  }

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

      {activeLoans.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay contratos activos para mostrar</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeLoans.map(loan => {
            const client = localClients.find(c => c.id === loan.clientId);
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
                    if (loan && client) {
                      exportContractPDF(loan, client);
                    }
                  }}>
                    <Download size={14} /> PDF
                  </Button>
                </div>
                <div className="flex gap-2 mt-2">
                  {profile?.role === 'admin' && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditModal(loan)}>
                      <Edit2 size={14} /> Editar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => shareContractWhatsApp(loan.id)}>
                    <Send size={14} /> WhatsApp
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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

      {/* Edit Contract Modal */}
      <Modal isOpen={!!showEditModal} onClose={() => setShowEditModal(null)} title="Editar Contrato" size="lg">
        {showEditModal && (() => {
          const client = localClients.find(c => c.id === showEditModal.clientId);
          return (
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-xl">
                <p className="text-sm font-medium text-purple-900">Cliente: {client?.fullName}</p>
                <p className="text-xs text-purple-700">Cédula: {client?.cedula}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Monto del Préstamo (C$)"
                  type="number"
                  value={editForm.amount}
                  onChange={e => setEditForm({...editForm, amount: e.target.value})}
                />
                <Input
                  label="Tasa de Interés Mensual (%)"
                  type="number"
                  value={editForm.interestRate}
                  onChange={e => setEditForm({...editForm, interestRate: e.target.value})}
                />
                <Input
                  label="Plazo (meses)"
                  type="number"
                  value={editForm.term}
                  onChange={e => setEditForm({...editForm, term: e.target.value})}
                />
                <Select
                  label="Cliente"
                  value={editForm.clientId}
                  onChange={e => setEditForm({...editForm, clientId: e.target.value})}
                  options={localClients.map(c => ({ value: c.id, label: `${c.fullName} - ${c.cedula}` }))}
                />
              </div>

              {editForm.amount && editForm.interestRate && editForm.term && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">Resumen Actualizado:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-blue-700">Monto: <span className="font-bold">{formatCurrency(parseFloat(editForm.amount))}</span></p>
                    <p className="text-blue-700">Tasa: <span className="font-bold">{editForm.interestRate}% mensual</span></p>
                    <p className="text-blue-700">Plazo: <span className="font-bold">{editForm.term} meses</span></p>
                    <p className="text-blue-700">Interés Total: <span className="font-bold">{formatCurrency(parseFloat(editForm.amount) * (parseFloat(editForm.interestRate) / 100) * parseInt(editForm.term))}</span></p>
                    <p className="text-blue-700">Total a Pagar: <span className="font-bold text-lg">{formatCurrency(parseFloat(editForm.amount) + (parseFloat(editForm.amount) * (parseFloat(editForm.interestRate) / 100) * parseInt(editForm.term)))}</span></p>
                    <p className="text-blue-700">Cuota: <span className="font-bold text-lg">{formatCurrency((parseFloat(editForm.amount) + (parseFloat(editForm.amount) * (parseFloat(editForm.interestRate) / 100) * parseInt(editForm.term))) / parseInt(editForm.term))}</span></p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="secondary" onClick={() => setShowEditModal(null)}>Cancelar</Button>
                <Button onClick={handleSaveEdit}>
                  <CheckCircle size={16} /> Guardar Cambios
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
