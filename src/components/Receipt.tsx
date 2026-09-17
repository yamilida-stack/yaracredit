import { formatCurrency, formatDate } from './ui';

interface ReceiptProps {
  payment: {
    receiptNumber: string;
    date: string;
    amount: number;
    method: string;
  };
  client: {
    fullName: string;
    cedula: string;
  } | undefined;
  collector: {
    name: string;
  } | undefined;
  remaining: number;
  thermalSize?: '58mm' | '80mm';
}

export default function Receipt({ payment, client, collector, remaining, thermalSize = '58mm' }: ReceiptProps) {
  return (
    <div className={`receipt-print receipt-preview ${thermalSize === '58mm' ? 'receipt-58mm' : 'receipt-80mm'}`}>
      <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
        <p className="font-bold text-sm">YARACREDIT</p>
        <p className="text-xs">Sistema de Préstamos</p>
        <p className="text-xs">RNC: 000-00000-0</p>
      </div>
      
      <div className="text-left space-y-1">
        <p><strong>Recibo:</strong> {payment.receiptNumber}</p>
        <p><strong>Fecha:</strong> {formatDate(payment.date)}</p>
        <p><strong>Cliente:</strong> {client?.fullName}</p>
        <p><strong>Cédula:</strong> {client?.cedula}</p>
        <p><strong>Cobrador:</strong> {collector?.name}</p>
        
        <hr className="border-dashed border-gray-400 my-2" />
        
        <p><strong>Monto Pagado:</strong> {formatCurrency(payment.amount)}</p>
        <p><strong>Método:</strong> {payment.method}</p>
        <p><strong>Saldo Pendiente:</strong> {formatCurrency(remaining)}</p>
        
        <hr className="border-dashed border-gray-400 my-2" />
        
        <p className="text-center font-semibold">¡Gracias por su pago!</p>
      </div>
    </div>
  );
}
