import { useState } from 'react';
import { useStore } from '../store';
import { Modal, Button, Input, Select, Card, Badge, EmptyState } from '../components/ui';
import { Plus, Route as RouteIcon, Users, MapPin, Edit2, Trash2 } from 'lucide-react';

export default function RoutesPage() {
  const { routes, clients, users, addRoute, updateRoute, addNotification, currentUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', collectorId: '', clientIds: [] as string[] });

  const collectors = users.filter(u => u.role === 'cobrador');

  const openCreate = () => { setForm({ name: '', collectorId: '', clientIds: [] }); setShowModal(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.collectorId) { addNotification('error', 'Completa nombre y cobrador'); return; }
    addRoute({ name: form.name, collectorId: form.collectorId, clientIds: form.clientIds, active: true });
    addNotification('success', 'Ruta creada');
    setShowModal(false);
  };

  const toggleClient = (clientId: string) => {
    setForm(f => ({ ...f, clientIds: f.clientIds.includes(clientId) ? f.clientIds.filter(id => id !== clientId) : [...f.clientIds, clientId] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Asigna clientes a cobradores para organizar rutas de cobro</p>
        <Button onClick={openCreate}><Plus size={18} /> Nueva Ruta</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map(route => {
          const collector = users.find(u => u.id === route.collectorId);
          const routeClients = clients.filter(c => route.clientIds.includes(c.id));
          return (
            <Card key={route.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <RouteIcon size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{route.name}</h4>
                    <p className="text-xs text-gray-400">{collector?.name}</p>
                  </div>
                </div>
                <Badge variant={route.active ? 'success' : 'default'}>{route.active ? 'Activa' : 'Inactiva'}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={14} /> {routeClients.length} clientes
                </div>
                <div className="flex flex-wrap gap-1">
                  {routeClients.slice(0, 3).map(c => (
                    <span key={c.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{c.fullName.split(' ')[0]}</span>
                  ))}
                  {routeClients.length > 3 && <span className="text-xs text-gray-400">+{routeClients.length - 3} más</span>}
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <button onClick={() => { setForm({ name: route.name, collectorId: route.collectorId, clientIds: route.clientIds }); setShowModal(true); }} className="flex-1 text-center py-2 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg"><Edit2 size={14} className="inline mr-1" /> Editar</button>
                <button onClick={() => { updateRoute(route.id, { active: !route.active }); addNotification('success', 'Estado actualizado'); }} className="flex-1 text-center py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg">{route.active ? 'Desactivar' : 'Activar'}</button>
              </div>
            </Card>
          );
        })}
        {routes.length === 0 && (
          <div className="col-span-full">
            <EmptyState icon={<RouteIcon size={40} className="text-gray-300" />} title="Sin rutas" description="Crea rutas para organizar la cobranza" action={<Button onClick={openCreate}><Plus size={16} /> Crear Ruta</Button>} />
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Ruta" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre de la Ruta" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ruta Centro" />
          <Select label="Cobrador Asignado" options={[{ value: '', label: 'Seleccionar...' }, ...collectors.map(c => ({ value: c.id, label: c.name }))]} value={form.collectorId} onChange={e => setForm({...form, collectorId: e.target.value})} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Clientes en la ruta ({form.clientIds.length} seleccionados)</label>
            <div className="max-h-60 overflow-y-auto border rounded-xl p-3 space-y-2">
              {clients.map(c => (
                <label key={c.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${form.clientIds.includes(c.id) ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={form.clientIds.includes(c.id)} onChange={() => toggleClient(c.id)} className="rounded text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">{c.fullName}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} /> {c.address}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">Guardar Ruta</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
