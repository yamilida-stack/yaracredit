import { useState } from 'react';
import { useStore } from '../store';
import { Card, Badge, Button, formatCurrency, formatDate, Modal, Select } from '../components/ui';
import { Smartphone, Monitor, Laptop, Truck, Package, Eye, CheckCircle, AlertTriangle, Clock, DollarSign } from 'lucide-react';

export default function FinancedDevicesPage() {
  const { loans, articles, clients } = useStore();
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  // Get loans with articles
  const financedLoans = loans.filter(l => l.modality === 'articulo' && l.articleId);

  const filtered = financedLoans.filter(l => {
    if (filter === 'all') return true;
    return l.status === filter;
  });

  const getDeviceIcon = (category: string) => {
    switch (category) {
      case 'Electrónica': return <Smartphone size={24} className="text-blue-500" />;
      case 'Electrodomésticos': return <Monitor size={24} className="text-purple-500" />;
      case 'Vehículos': return <Truck size={24} className="text-green-500" />;
      default: return <Package size={24} className="text-gray-500" />;
    }
  };

  const totalFinanced = financedLoans.reduce((s, l) => s + l.amount, 0);
  const totalPending = financedLoans.reduce((s, l) => s + (l.totalAmount - l.payments.reduce((ps, p) => ps + p.amount, 0)), 0);
  const activeDevices = financedLoans.filter(l => l.status === 'activo').length;
  const overdueDevices = financedLoans.filter(l => l.status === 'mora').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Control de dispositivos financiados a clientes</p>
        </div>
        <Select options={[
          { value: 'all', label: 'Todos' },
          { value: 'activo', label: 'Activos' },
          { value: 'mora', label: 'En Mora' },
          { value: 'cancelado', label: 'Cancelados' },
        ]} value={filter} onChange={e => setFilter(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Package size={20} className="mx-auto text-purple-500 mb-1" />
          <p className="text-2xl font-bold text-purple-700">{financedLoans.length}</p>
          <p className="text-xs text-gray-500">Dispositivos Financiados</p>
        </Card>
        <Card className="p-4 text-center">
          <DollarSign size={20} className="mx-auto text-green-500 mb-1" />
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalFinanced)}</p>
          <p className="text-xs text-gray-500">Total Financiado</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock size={20} className="mx-auto text-yellow-500 mb-1" />
          <p className="text-lg font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-gray-500">Pendiente por Cobrar</p>
        </Card>
        <Card className="p-4 text-center">
          <AlertTriangle size={20} className="mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold text-red-600">{overdueDevices}</p>
          <p className="text-xs text-gray-500">En Mora</p>
        </Card>
      </div>

      {/* Devices list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(loan => {
          const article = articles.find(a => a.id === loan.articleId);
          const client = clients.find(c => c.id === loan.clientId);
          const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
          const remaining = loan.totalAmount - paid;
          const progress = (paid / loan.totalAmount) * 100;

          return (
            <Card key={loan.id} className={`p-5 ${loan.status === 'mora' ? 'border-red-200 bg-red-50/30' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    {article ? getDeviceIcon(article.category) : <Package size={24} className="text-gray-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{article?.name || 'Artículo'}</h4>
                    <p className="text-xs text-gray-500">{article?.brand} {article?.model}</p>
                  </div>
                </div>
                <Badge variant={loan.status === 'activo' ? 'success' : loan.status === 'mora' ? 'danger' : 'info'}>
                  {loan.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cliente:</span>
                  <span className="font-medium">{client?.fullName}</span>
                </div>
                {article?.serialNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Serie:</span>
                    <span className="font-mono text-xs">{article.serialNumber}</span>
                  </div>
                )}
                {article?.imei && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">IMEI:</span>
                    <span className="font-mono text-xs">{article.imei}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor:</span>
                  <span className="font-bold">{formatCurrency(loan.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pendiente:</span>
                  <span className="font-bold text-red-600">{formatCurrency(remaining)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Progreso</span>
                  <span className="font-medium">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${loan.status === 'mora' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowDetail(loan.id)}>
                  <Eye size={14} /> Detalle
                </Button>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="col-span-full p-8 text-center">
            <Smartphone size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay dispositivos financiados</p>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Detalle del Dispositivo" size="lg">
        {showDetail && (() => {
          const loan = loans.find(l => l.id === showDetail);
          if (!loan) return null;
          const article = articles.find(a => a.id === loan.articleId);
          const client = clients.find(c => c.id === loan.clientId);
          const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
          const remaining = loan.totalAmount - paid;
          const progress = (paid / loan.totalAmount) * 100;

          return (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                  {article ? getDeviceIcon(article.category) : <Package size={32} className="text-purple-600" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{article?.name}</h3>
                  <p className="text-sm text-gray-500">{article?.brand} {article?.model}</p>
                  <Badge variant={loan.status === 'activo' ? 'success' : loan.status === 'mora' ? 'danger' : 'info'}>
                    {loan.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Cliente:</span><p className="font-medium">{client?.fullName}</p></div>
                <div><span className="text-gray-500">Cédula:</span><p className="font-medium">{client?.cedula}</p></div>
                {article?.serialNumber && <div><span className="text-gray-500">Número de Serie:</span><p className="font-mono font-medium">{article.serialNumber}</p></div>}
                {article?.imei && <div><span className="text-gray-500">IMEI:</span><p className="font-mono font-medium">{article.imei}</p></div>}
                <div><span className="text-gray-500">Valor Financiado:</span><p className="font-bold text-lg">{formatCurrency(loan.amount)}</p></div>
                <div><span className="text-gray-500">Total a Pagar:</span><p className="font-bold text-lg">{formatCurrency(loan.totalAmount)}</p></div>
                <div><span className="text-gray-500">Pagado:</span><p className="font-bold text-green-600">{formatCurrency(paid)}</p></div>
                <div><span className="text-gray-500">Pendiente:</span><p className="font-bold text-red-600">{formatCurrency(remaining)}</p></div>
                <div><span className="text-gray-500">Cuota:</span><p className="font-medium">{formatCurrency(loan.installmentAmount)} ({loan.type})</p></div>
                <div><span className="text-gray-500">Fecha Inicio:</span><p className="font-medium">{formatDate(loan.startDate)}</p></div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progreso de pago</span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-700 h-3 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Payments */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Historial de Pagos</h4>
                {loan.payments.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {loan.payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                        <span>{p.receiptNumber} - {formatDate(p.date)}</span>
                        <span className="font-medium text-green-600">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Sin pagos registrados</p>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
