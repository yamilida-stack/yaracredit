import { useState } from 'react';
import { useStore } from '../store';
import { Modal, Button, Input, Select, Card, Table, Badge, formatCurrency, formatDate } from '../components/ui';
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, Lock, Unlock, TrendingUp, TrendingDown } from 'lucide-react';
import type { ExpenseCategory } from '../types';

export default function CashPage() {
  const { cashMovements, cashRegisters, addCashMovement, openCashRegister, closeCashRegister, currentUser, addNotification } = useStore();
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [movementForm, setMovementForm] = useState({ type: 'ingreso' as 'ingreso' | 'egreso', amount: '', description: '', category: '' as ExpenseCategory | '' });
  const [openingBalance, setOpeningBalance] = useState('');
  const [filter, setFilter] = useState('today');

  const currentRegister = cashRegisters.find(r => !r.closed);
  const today = new Date().toISOString().split('T')[0];

  const filteredMovements = cashMovements.filter(m => {
    if (filter === 'today') return m.date === today;
    if (filter === 'week') { const d = new Date(m.date); const now = new Date(); return d >= new Date(now.setDate(now.getDate() - 7)); }
    return true;
  });

  const totalIncome = filteredMovements.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0);
  const totalExpenses = filteredMovements.filter(m => m.type === 'egreso').reduce((s, m) => s + m.amount, 0);
  const balance = (currentRegister?.openingBalance || 0) + totalIncome - totalExpenses;

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.amount || !movementForm.description) {
      addNotification('error', 'Completa todos los campos');
      return;
    }
    addCashMovement({
      type: movementForm.type,
      amount: parseFloat(movementForm.amount),
      description: movementForm.description,
      category: movementForm.category || undefined,
      date: today,
      userId: currentUser?.id || '',
    });
    addNotification('success', `${movementForm.type === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado`);
    setShowMovementModal(false);
    setMovementForm({ type: 'ingreso', amount: '', description: '', category: '' });
  };

  const handleOpenRegister = () => {
    if (!openingBalance) { addNotification('error', 'Ingresa el balance de apertura'); return; }
    openCashRegister(parseFloat(openingBalance));
    addNotification('success', 'Caja abierta');
    setShowOpenModal(false);
  };

  const handleCloseRegister = () => {
    closeCashRegister();
    addNotification('success', 'Caja cerrada exitosamente');
  };

  const categoryLabels: Record<string, string> = {
    planilla: 'Planilla', comisiones: 'Comisiones', bonos: 'Bonos', depreciacion: 'Depreciación', operativos: 'Operativos', otros: 'Otros'
  };

  return (
    <div className="space-y-6">
      {/* Cash register status */}
      <Card className={`p-6 ${currentRegister ? 'border-green-200 bg-green-50/30' : 'border-yellow-200 bg-yellow-50/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentRegister ? <Unlock size={24} className="text-green-600" /> : <Lock size={24} className="text-yellow-600" />}
            <div>
              <p className="font-bold text-gray-900">{currentRegister ? 'Caja Abierta' : 'Caja Cerrada'}</p>
              <p className="text-sm text-gray-500">{currentRegister ? `Apertura: ${formatCurrency(currentRegister.openingBalance)}` : 'Abre la caja para comenzar'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!currentRegister && <Button size="sm" onClick={() => setShowOpenModal(true)}>Abrir Caja</Button>}
            {currentRegister && <Button size="sm" variant="danger" onClick={handleCloseRegister}>Cerrar Caja</Button>}
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><ArrowDownCircle size={18} className="text-green-500" /><span className="text-xs text-gray-500">Ingresos</span></div>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><ArrowUpCircle size={18} className="text-red-500" /><span className="text-xs text-gray-500">Egresos</span></div>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Wallet size={18} className="text-purple-500" /><span className="text-xs text-gray-500">Balance</span></div>
          <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(balance)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={18} className="text-blue-500" /><span className="text-xs text-gray-500">Movimientos</span></div>
          <p className="text-xl font-bold text-blue-600">{filteredMovements.length}</p>
        </Card>
      </div>

      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Select options={[{ value: 'today', label: 'Hoy' }, { value: 'week', label: 'Esta semana' }, { value: 'all', label: 'Todo' }]} value={filter} onChange={e => setFilter(e.target.value)} />
        {currentRegister && <Button onClick={() => setShowMovementModal(true)}><Plus size={18} /> Nuevo Movimiento</Button>}
      </div>

      {/* Movements table */}
      <Card>
        <Table headers={['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Monto']}>
          {filteredMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(m => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{formatDate(m.date)}</td>
              <td className="px-4 py-3">
                <Badge variant={m.type === 'ingreso' ? 'success' : 'danger'}>{m.type === 'ingreso' ? '↑ Ingreso' : '↓ Egreso'}</Badge>
              </td>
              <td className="px-4 py-3 text-sm font-medium">{m.description}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{m.category ? categoryLabels[m.category] || m.category : '-'}</td>
              <td className={`px-4 py-3 text-sm font-bold ${m.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                {m.type === 'ingreso' ? '+' : '-'}{formatCurrency(m.amount)}
              </td>
            </tr>
          ))}
          {filteredMovements.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin movimientos en este período</td></tr>
          )}
        </Table>
      </Card>

      {/* Open cash register modal */}
      <Modal isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} title="Abrir Caja">
        <form onSubmit={(e) => { e.preventDefault(); handleOpenRegister(); }} className="space-y-4">
          <p className="text-sm text-gray-500">Ingresa el balance inicial de caja para hoy.</p>
          <Input label="Balance de apertura (RD$)" type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} placeholder="5000" />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowOpenModal(false)}>Cancelar</Button>
            <Button type="submit"><Unlock size={16} /> Abrir Caja</Button>
          </div>
        </form>
      </Modal>

      {/* Add movement modal */}
      <Modal isOpen={showMovementModal} onClose={() => setShowMovementModal(false)} title="Nuevo Movimiento">
        <form onSubmit={handleAddMovement} className="space-y-4">
          <Select label="Tipo" options={[{ value: 'ingreso', label: '↑ Ingreso' }, { value: 'egreso', label: '↓ Egreso' }]} value={movementForm.type} onChange={e => setMovementForm({...movementForm, type: e.target.value as 'ingreso' | 'egreso'})} />
          <Input label="Monto (RD$) *" type="number" value={movementForm.amount} onChange={e => setMovementForm({...movementForm, amount: e.target.value})} />
          <Input label="Descripción *" value={movementForm.description} onChange={e => setMovementForm({...movementForm, description: e.target.value})} placeholder="Concepto del movimiento" />
          {movementForm.type === 'egreso' && (
            <Select label="Categoría" options={[
              { value: '', label: 'Seleccionar...' },
              { value: 'planilla', label: 'Planilla' },
              { value: 'comisiones', label: 'Comisiones' },
              { value: 'bonos', label: 'Bonos' },
              { value: 'depreciacion', label: 'Depreciación' },
              { value: 'operativos', label: 'Operativos' },
              { value: 'otros', label: 'Otros' },
            ]} value={movementForm.category} onChange={e => setMovementForm({...movementForm, category: e.target.value as ExpenseCategory})} />
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowMovementModal(false)}>Cancelar</Button>
            <Button type="submit">Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
