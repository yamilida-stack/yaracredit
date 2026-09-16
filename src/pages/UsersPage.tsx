import { useState } from 'react';
import { useStore } from '../store';
import { Modal, Button, Input, Select, Card, Table, Badge } from '../components/ui';
import { Plus, Users, Shield, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Role } from '../types';

export default function UsersPage() {
  const { users, addNotification } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', pin: '', role: 'cobrador' as Role });

  const roleLabels: Record<Role, string> = { admin: 'Administrador', gerente: 'Gerente', cobrador: 'Cobrador', solo_lectura: 'Solo Lectura' };
  const roleColors: Record<Role, string> = { admin: 'danger', gerente: 'warning', cobrador: 'info', solo_lectura: 'default' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.pin) { addNotification('error', 'Completa nombre y PIN'); return; }
    // In a real app, this would call a store action
    addNotification('success', 'Usuario creado (demo - se guarda en localStorage)');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Gestiona los usuarios y permisos del sistema</p>
        <Button onClick={() => { setForm({ name: '', pin: '', role: 'cobrador' }); setShowModal(true); }}>
          <Plus size={18} /> Nuevo Usuario
        </Button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['admin', 'gerente', 'cobrador', 'solo_lectura'] as Role[]).map(role => (
          <Card key={role} className="p-4 text-center">
            <Shield size={20} className="mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === role).length}</p>
            <p className="text-xs text-gray-500">{roleLabels[role]}</p>
          </Card>
        ))}
      </div>

      <Card>
        <Table headers={['Usuario', 'PIN', 'Rol', 'Estado', 'Creado', 'Acciones']}>
          {users.map(user => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-700 font-bold text-xs">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm font-mono text-gray-500">{'•'.repeat(user.pin.length)}</td>
              <td className="px-4 py-3"><Badge variant={roleColors[user.role] as any}>{roleLabels[user.role]}</Badge></td>
              <td className="px-4 py-3">
                <Badge variant={user.active ? 'success' : 'default'}>{user.active ? 'Activo' : 'Inactivo'}</Badge>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{user.createdAt}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600"><Edit2 size={16} /></button>
                  <button onClick={() => addNotification('info', `Usuario ${user.active ? 'desactivado' : 'activado'}`)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600">
                    {user.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Usuario">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre Completo" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nombre del usuario" />
          <Input label="PIN de Acceso" type="password" maxLength={6} value={form.pin} onChange={e => setForm({...form, pin: e.target.value})} placeholder="4-6 dígitos" />
          <Select label="Rol" options={[
            { value: 'admin', label: 'Administrador (acceso total)' },
            { value: 'gerente', label: 'Gerente (todo menos usuarios)' },
            { value: 'cobrador', label: 'Cobrador (solo sus clientes/cobros)' },
            { value: 'solo_lectura', label: 'Solo Lectura' },
          ]} value={form.role} onChange={e => setForm({...form, role: e.target.value as Role})} />
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
            <strong>Permisos del rol:</strong>
            <ul className="mt-1 list-disc list-inside">
              {form.role === 'admin' && <li>Acceso total: todo el sistema</li>}
              {form.role === 'gerente' && <li>Acceso: todo excepto gestión de usuarios</li>}
              {form.role === 'cobrador' && <li>Acceso: Dashboard, Clientes, Préstamos, Cobros</li>}
              {form.role === 'solo_lectura' && <li>Acceso: Dashboard, Clientes, Préstamos, Reportes (solo lectura)</li>}
            </ul>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit"><Users size={16} /> Crear Usuario</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
