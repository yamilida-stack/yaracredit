import { useState } from 'react';
import { useStore } from '../store';
import { Modal, Button, Input, Select, Card, Badge, formatCurrency, formatDate } from '../components/ui';
import { Receipt, MapPin, Phone, CheckCircle, Printer, Send, DollarSign, Clock } from 'lucide-react';
import type { PaymentMethod } from '../types';

export default function CollectionsPage() {
  const { loans, clients, routes, currentUser, addPayment, addNotification, users } = useStore();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<string>('');
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'efectivo' as PaymentMethod });
  const [showReceipt, setShowReceipt] = useState<string | null>(null);
  const [thermalSize, setThermalSize] = useState<'50mm' | '80mm'>('50mm');

  // Get loans for this collector
  const collectorId = currentUser?.id || '';
  const myRoutes = routes.filter(r => r.collectorId === collectorId);
  const myClientIds = myRoutes.flatMap(r => r.clientIds);
  const myLoans = loans.filter(l =>
    (l.assignedCollector === collectorId || myClientIds.includes(l.clientId)) &&
    (l.status === 'activo' || l.status === 'mora')
  );

  // If admin/gerente, show all
  const displayLoans = currentUser?.role === 'cobrador' ? myLoans : loans.filter(l => l.status === 'activo' || l.status === 'mora');

  const handleOpenPayment = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (loan) {
      setSelectedLoan(loanId);
      setPaymentForm({ amount: loan.installmentAmount.toString(), method: 'efectivo' });
      setShowPaymentModal(true);
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const loan = loans.find(l => l.id === selectedLoan);
    if (!loan) return;
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) {
      addNotification('error', 'Ingresa un monto válido');
      return;
    }
    const payment = addPayment({
      loanId: loan.id,
      clientId: loan.clientId,
      amount,
      method: paymentForm.method,
      date: new Date().toISOString().split('T')[0],
      collectorId: currentUser?.id || '',
      isLate: loan.status === 'mora',
    });
    addNotification('success', `Pago de ${formatCurrency(amount)} registrado`);
    setShowPaymentModal(false);
    setShowReceipt(payment.id);
  };

  const getReceiptData = (paymentId: string) => {
    for (const loan of loans) {
      const payment = loan.payments.find(p => p.id === paymentId);
      if (payment) {
        const client = clients.find(c => c.id === loan.clientId);
        const collector = users.find(u => u.id === payment.collectorId);
        const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
        return {
          payment, loan, client, collector,
          remaining: loan.totalAmount - paid,
        };
      }
    }
    return null;
  };

  const handlePrint = () => {
    addNotification('info', 'Enviando a impresora térmica Bluetooth...');
    setTimeout(() => addNotification('success', 'Recibo enviado a impresora'), 1000);
  };

  const handleWhatsApp = (phone: string) => {
    addNotification('success', `Recibo enviado por WhatsApp a ${phone}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {currentUser?.role === 'cobrador' ? 'Tu ruta de cobro del día' : 'Todos los cobros pendientes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">{displayLoans.length} préstamos activos</Badge>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <DollarSign size={20} className="mx-auto text-green-500 mb-1" />
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(displayLoans.reduce((s, l) => s + l.installmentAmount, 0))}
          </p>
          <p className="text-xs text-gray-500">Monto del día</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock size={20} className="mx-auto text-yellow-500 mb-1" />
          <p className="text-lg font-bold text-gray-900">
            {displayLoans.filter(l => l.status === 'mora').length}
          </p>
          <p className="text-xs text-gray-500">Vencidos</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle size={20} className="mx-auto text-blue-500 mb-1" />
          <p className="text-lg font-bold text-gray-900">
            {displayLoans.filter(l => l.payments.some(p => p.date === new Date().toISOString().split('T')[0])).length}
          </p>
          <p className="text-xs text-gray-500">Cobrados hoy</p>
        </Card>
        <Card className="p-4 text-center">
          <MapPin size={20} className="mx-auto text-purple-500 mb-1" />
          <p className="text-lg font-bold text-gray-900">{myRoutes.length}</p>
          <p className="text-xs text-gray-500">Rutas asignadas</p>
        </Card>
      </div>

      {/* Collection list */}
      <div className="space-y-3">
        {displayLoans.map(loan => {
          const client = clients.find(c => c.id === loan.clientId);
          const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
          const remaining = loan.totalAmount - paid;
          const todayPaid = loan.payments.some(p => p.date === new Date().toISOString().split('T')[0]);
          return (
            <Card key={loan.id} className={`p-4 ${todayPaid ? 'border-green-200 bg-green-50/30' : loan.status === 'mora' ? 'border-red-200 bg-red-50/30' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${todayPaid ? 'bg-green-100' : loan.status === 'mora' ? 'bg-red-100' : 'bg-purple-100'}`}>
                    {todayPaid ? <CheckCircle size={24} className="text-green-600" /> :
                     loan.status === 'mora' ? <Clock size={24} className="text-red-600" /> :
                     <DollarSign size={24} className="text-purple-600" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{client?.fullName}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant={loan.status === 'mora' ? 'danger' : 'success'}>{loan.status}</Badge>
                      <span className="text-xs text-gray-400">{loan.type} • Cuota: {formatCurrency(loan.installmentAmount)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {client?.address && <span className="flex items-center gap-1"><MapPin size={12} /> {client.address}</span>}
                      {client?.phone && <span className="flex items-center gap-1"><Phone size={12} /> {client.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Pendiente</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(remaining)}</p>
                  </div>
                  {!todayPaid && (
                    <Button size="sm" onClick={() => handleOpenPayment(loan.id)}>
                      <Receipt size={16} /> Cobrar
                    </Button>
                  )}
                  {todayPaid && (
                    <Badge variant="success">✓ Cobrado</Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {displayLoans.length === 0 && (
          <Card className="p-8 text-center">
            <Receipt size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay préstamos pendientes para cobrar</p>
          </Card>
        )}
      </div>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Registrar Pago">
        <form onSubmit={handlePayment} className="space-y-4">
          {selectedLoan && (() => {
            const loan = loans.find(l => l.id === selectedLoan);
            const client = clients.find(c => c.id === loan?.clientId);
            return (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900">{client?.fullName}</p>
                <p className="text-sm text-gray-500">Cuota: {formatCurrency(loan?.installmentAmount || 0)} • {loan?.type}</p>
              </div>
            );
          })()}
          <Input label="Monto a cobrar (RD$)" type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
          <Select label="Método de pago" options={[
            { value: 'efectivo', label: '💵 Efectivo' },
            { value: 'transferencia', label: '🏦 Transferencia' },
          ]} value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value as PaymentMethod})} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowPaymentModal(false)}>Cancelar</Button>
            <Button type="submit"><CheckCircle size={16} /> Registrar Pago</Button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={!!showReceipt} onClose={() => setShowReceipt(null)} title="Recibo de Pago" size="sm">
        {showReceipt && (() => {
          const data = getReceiptData(showReceipt);
          if (!data) return null;
          const { payment, loan, client, collector, remaining } = data;
          return (
            <div>
              {/* Receipt preview */}
              <div className={`border-2 border-dashed border-gray-300 rounded-xl p-4 ${thermalSize === '50mm' ? 'max-w-[200px] mx-auto' : 'max-w-[300px] mx-auto'} text-center font-mono text-xs`}>
                <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
                  <p className="font-bold text-sm">YARACREDIT</p>
                  <p>Sistema de Préstamos</p>
                  <p>RNC: 000-00000-0</p>
                </div>
                <div className="text-left space-y-1">
                  <p><strong>Recibo:</strong> {payment.receiptNumber}</p>
                  <p><strong>Fecha:</strong> {formatDate(payment.date)}</p>
                  <p><strong>Cliente:</strong> {client?.fullName}</p>
                  <p><strong>Cédula:</strong> {client?.cedula}</p>
                  <p><strong>Cobrador:</strong> {collector?.name}</p>
                  <hr className="border-dashed border-gray-300 my-2" />
                  <p><strong>Monto Pagado:</strong> {formatCurrency(payment.amount)}</p>
                  <p><strong>Método:</strong> {payment.method}</p>
                  <p><strong>Saldo Pendiente:</strong> {formatCurrency(remaining)}</p>
                  <hr className="border-dashed border-gray-300 my-2" />
                  <p className="text-center">¡Gracias por su pago!</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-gray-500">Tamaño:</span>
                  <button onClick={() => setThermalSize('50mm')} className={`px-2 py-1 rounded text-xs ${thermalSize === '50mm' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>50mm</button>
                  <button onClick={() => setThermalSize('80mm')} className={`px-2 py-1 rounded text-xs ${thermalSize === '80mm' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>80mm</button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={handlePrint}>
                    <Printer size={14} /> Imprimir
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleWhatsApp(client?.whatsapp || client?.phone || '')}>
                    <Send size={14} /> WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
