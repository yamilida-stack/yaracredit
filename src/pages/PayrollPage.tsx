import { useState } from 'react';
import { useStore } from '../store';
import { Modal, Button, Input, Card, Table, Badge, formatCurrency } from '../components/ui';
import { UserCog, Plus, DollarSign, Download } from 'lucide-react';

export default function PayrollPage() {
  const { users, payrolls, generatePayroll, addNotification } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ userId: '', period: new Date().toISOString().slice(0, 7), baseSalary: '' });

  const collectors = users.filter(u => u.role === 'cobrador');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.baseSalary) { addNotification('error', 'Completa todos los campos'); return; }
    generatePayroll(form.userId, form.period, parseFloat(form.baseSalary));
    addNotification('success', 'Planilla generada');
    setShowModal(false);
  };

  const totalPayroll = payrolls.filter(p => !p.paid).reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Gestión de salarios y comisiones de cobradores</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download size={14} /> Exportar PDF</Button>
          <Button onClick={() => { setForm({ userId: collectors[0]?.id || '', period: new Date().toISOString().slice(0, 7), baseSalary: '' }); setShowModal(true); }}>
            <Plus size={18} /> Generar Planilla
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <DollarSign size={20} className="mx-auto text-purple-500 mb-1" />
          <p className="text-lg font-bold text-purple-700">{formatCurrency(totalPayroll)}</p>
          <p className="text-xs text-gray-500">Pendiente de Pago</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-lg font-bold text-gray-900">{collectors.length}</p>
          <p className="text-xs text-gray-500">Cobradores</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-lg font-bold text-green-600">{payrolls.filter(p => p.paid).length}</p>
          <p className="text-xs text-gray-500">Pagadas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-lg font-bold text-yellow-600">{payrolls.length}</p>
          <p className="text-xs text-gray-500">Total Generadas</p>
        </Card>
      </div>

      {/* Payroll table */}
      <Card>
        <Table headers={['Empleado', 'Período', 'Salario Base', 'Comisiones', 'Bonos', 'Deducciones', 'Total', 'Estado', 'Acciones']}>
          {payrolls.map(p => {
            const user = users.find(u => u.id === p.userId);
            return (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{user?.name}</td>
                <td className="px-4 py-3 text-sm">{p.period}</td>
                <td className="px-4 py-3 text-sm">{formatCurrency(p.baseSalary)}</td>
                <td className="px-4 py-3 text-sm text-green-600">{formatCurrency(p.commissions)}</td>
                <td className="px-4 py-3 text-sm">{formatCurrency(p.bonuses)}</td>
                <td className="px-4 py-3 text-sm text-red-600">{formatCurrency(p.deductions)}</td>
                <td className="px-4 py-3 text-sm font-bold">{formatCurrency(p.total)}</td>
                <td className="px-4 py-3">{p.paid ? <Badge variant="success">Pagado</Badge> : <Badge variant="warning">Pendiente</Badge>}</td>
                <td className="px-4 py-3">
                  {!p.paid && <Button size="sm" variant="ghost" onClick={() => addNotification('success', 'Pago registrado')}>Pagar</Button>}
                </td>
              </tr>
            );
          })}
          {payrolls.length === 0 && (
            <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No hay planillas generadas. Crea una para comenzar.</td></tr>
          )}
        </Table>
      </Card>

      {/* Generate modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Generar Planilla">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cobrador</label>
            <select value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} className="w-full px-4 py-2.5 border rounded-xl text-sm">
              {collectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="Período" type="month" value={form.period} onChange={e => setForm({...form, period: e.target.value})} />
          <Input label="Salario Base (RD$)" type="number" value={form.baseSalary} onChange={e => setForm({...form, baseSalary: e.target.value})} placeholder="15000" />
          <div className="bg-purple-50 rounded-xl p-4 text-sm">
            <p className="font-medium text-purple-900">Las comisiones se calculan automáticamente (5% sobre cobros realizados en el período)</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit"><UserCog size={16} /> Generar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
