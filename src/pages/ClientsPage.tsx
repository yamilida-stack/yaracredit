import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Modal, Button, Input, Select, Card, Table, Badge, formatCurrency, formatDate, EmptyState } from '../components/ui';
import { Plus, Search, MapPin, Phone, User, Edit2, Trash2, Eye, Users, Download } from 'lucide-react';
import { exportClientsPDF } from '../utils/pdfGenerator';
import type { Client } from '../types';

export default function ClientsPage() {
  const { loans, routes, currentUser, addNotification } = useStore();
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Cargar clientes desde Supabase
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear datos de Supabase al formato de Client
      // Solo usamos las columnas que existen en la tabla
      const mappedClients: Client[] = (data || []).map(client => ({
        id: client.id,
        fullName: client.nombre,
        cedula: client.cedula,
        address: client.direccion || '',
        phone: client.telefono,
        whatsapp: client.telefono, // Usar el mismo teléfono como WhatsApp
        email: client.email,
        guarantor: undefined, // No existe en la BD
        guarantorPhone: undefined, // No existe en la BD
        lat: undefined, // No existe en la BD
        lng: undefined, // No existe en la BD
        occupation: undefined, // No existe en la BD
        monthlyIncome: undefined, // No existe en la BD
        references: undefined, // No existe en la BD
        observations: undefined, // No existe en la BD
        riskLevel: undefined, // No existe en la BD
        createdAt: client.created_at,
      }));

      setClients(mappedClients);
    } catch (error: any) {
      console.error('Error al cargar clientes:', error);
      addNotification('error', 'Error al cargar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Client | null>(null);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({
    fullName: '', cedula: '', address: '', phone: '', whatsapp: '', email: '', guarantor: '', guarantorPhone: '', lat: '', lng: '', occupation: '', monthlyIncome: '', references: '', observations: ''
  });

  // Filtrar clientes según el rol del usuario
  const filtered = clients.filter(c => {
    // Filtro de búsqueda
    const matchSearch = c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.cedula.includes(search) ||
      c.phone.includes(search);
    
    // Filtro por rol: si es cobrador, solo mostrar clientes de sus rutas
    let matchRole = true;
    if (currentUser?.role === 'cobrador') {
      const collectorId = currentUser.id;
      const myRoutes = routes.filter(r => r.collectorId === collectorId);
      const myClientIds = myRoutes.flatMap(r => r.clientIds);
      matchRole = myClientIds.includes(c.id);
    }
    
    return matchSearch && matchRole;
  });

  const openCreate = () => {
    setForm({ fullName: '', cedula: '', address: '', phone: '', whatsapp: '', email: '', guarantor: '', guarantorPhone: '', lat: '', lng: '', occupation: '', monthlyIncome: '', references: '', observations: '' });
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (client: Client) => {
    setForm({
      fullName: client.fullName, cedula: client.cedula, address: client.address,
      phone: client.phone, whatsapp: client.whatsapp, email: client.email || '',
      guarantor: client.guarantor || '', guarantorPhone: client.guarantorPhone || '',
      lat: client.lat?.toString() || '', lng: client.lng?.toString() || '',
      occupation: client.occupation || '', monthlyIncome: client.monthlyIncome?.toString() || '',
      references: client.references || '', observations: client.observations || ''
    });
    setEditing(client);
    setShowModal(true);
  };

  const handleEditClient = async (id: string, updatedData: Record<string, unknown>) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update(updatedData)
        .eq('id', id);

      if (error) throw error;
      await loadClients();
      return true;
    } catch (error: any) {
      console.error('Error al editar cliente:', error);
      window.alert(error.message);
      return false;
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      addNotification('success', 'Cliente eliminado exitosamente');
      await loadClients();
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error);
      window.alert(error.message);
      addNotification('error', 'Error al eliminar cliente: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.cedula || !form.phone) {
      addNotification('error', 'Nombre, cédula y teléfono son obligatorios');
      return;
    }

    // Solo enviar las columnas que existen en la tabla de Supabase
    const clientData = {
      nombre: form.fullName,
      cedula: form.cedula,
      telefono: form.phone,
      email: form.email || null,
      direccion: form.address,
      // Los siguientes campos NO existen en la tabla y se ignoran:
      // - whatsapp
      // - garante
      // - garante_telefono
      // - ocupacion
      // - ingreso_mensual
      // - lat
      // - lng
      // - referencias
      // - observaciones
      // - nivel_riesgo
    };

    console.log('=== DEPURACIÓN CREACIÓN/EDICIÓN DE CLIENTE ===');
    console.log('Datos a enviar a Supabase:', clientData);
    console.log('Profile ID:', profile?.id);

    try {
      if (editing) {
        const updated = await handleEditClient(editing.id, clientData);
        if (!updated) return;
        addNotification('success', 'Cliente actualizado exitosamente');
      } else {
        // Crear nuevo cliente
        console.log('Creando nuevo cliente');
        const { error } = await supabase
          .from('clientes')
          .insert([{ ...clientData, creado_por: profile?.id || null }]);

        if (error) throw error;
        addNotification('success', 'Cliente creado exitosamente');
      }

      if (!editing) {
        await loadClients();
      }
      setShowModal(false);
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
      window.alert(error.message);
      addNotification('error', 'Error: ' + error.message);
    }
  };

  const getClientLoans = (clientId: string) => loans.filter(l => l.clientId === clientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportClientsPDF(filtered)}>
            <Download size={18} /> Exportar PDF
          </Button>
          {profile?.role !== 'solo_lectura' && (
            <Button onClick={openCreate}><Plus size={18} /> Nuevo Cliente</Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{clients.length}</p>
          <p className="text-xs text-gray-500">Total Clientes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{clients.filter(c => getClientLoans(c.id).some(l => l.status === 'activo')).length}</p>
          <p className="text-xs text-gray-500">Con Préstamo Activo</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{clients.filter(c => getClientLoans(c.id).some(l => l.status === 'mora')).length}</p>
          <p className="text-xs text-gray-500">En Mora</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{clients.filter(c => c.guarantor).length}</p>
          <p className="text-xs text-gray-500">Con Garante</p>
        </Card>
      </div>

      {/* Table */}
      <Card>
        {filtered.length > 0 ? (
          <Table headers={['Cliente', 'Cédula', 'Teléfono', 'Dirección', 'Estado', 'Acciones']}>
            {filtered.map(client => {
              const clientLoans = getClientLoans(client.id);
              const hasActive = clientLoans.some(l => l.status === 'activo');
              const hasOverdue = clientLoans.some(l => l.status === 'mora');
              return (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.fullName}</p>
                        {client.guarantor && <p className="text-xs text-gray-400">Garante: {client.guarantor}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{client.cedula}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone size={14} /> {client.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600 max-w-[200px] truncate">
                      <MapPin size={14} /> {client.address}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {hasOverdue ? <Badge variant="danger">Mora</Badge> :
                     hasActive ? <Badge variant="success">Activo</Badge> :
                     <Badge variant="default">Sin préstamo</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowDetail(client)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="Ver detalle">
                        <Eye size={16} />
                      </button>
                      {currentUser?.role !== 'solo_lectura' && (
                        <>
                          <button onClick={() => openEdit(client)} className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600" title="Editar">
                            <Edit2 size={16} />
                          </button>
                          {profile?.role === 'admin' && (
                            <button onClick={() => handleDeleteClient(client.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600" title="Eliminar">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <EmptyState icon={<Users size={40} className="text-gray-300" />} title="No hay clientes" description="Agrega tu primer cliente para comenzar" action={<Button onClick={openCreate}><Plus size={16} /> Agregar</Button>} />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Cliente' : 'Nuevo Cliente'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre Completo *" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Juan Pérez Rodríguez" />
            <Input label="Cédula *" value={form.cedula} onChange={e => setForm({...form, cedula: e.target.value})} placeholder="001-1234567-8" />
            <Input label="Teléfono *" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="809-555-0000" />
            <Input label="WhatsApp" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="809-555-0000" />
            <Input label="Correo" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@ejemplo.com" type="email" />
            <Input label="Dirección" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Calle, Sector, Ciudad" />
            <Input label="Fiador/Garante" value={form.guarantor} onChange={e => setForm({...form, guarantor: e.target.value})} placeholder="Nombre del garante" />
            <Input label="Tel. Garante" value={form.guarantorPhone} onChange={e => setForm({...form, guarantorPhone: e.target.value})} placeholder="809-555-0000" />
            <Input label="Ocupación" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} placeholder="Ej: Comerciante, Empleado..." />
            <Input label="Ingreso Mensual (C$)" value={form.monthlyIncome} onChange={e => setForm({...form, monthlyIncome: e.target.value})} type="number" placeholder="15000" />
            <Input label="Latitud GPS" value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} placeholder="18.4861" type="number" step="any" />
            <Input label="Longitud GPS" value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} placeholder="-69.9312" type="number" step="any" />
            <div className="sm:col-span-2">
              <Input label="Referencias" value={form.references} onChange={e => setForm({...form, references: e.target.value})} placeholder="Personas que pueden referenciar al cliente" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                value={form.observations}
                onChange={e => setForm({...form, observations: e.target.value})}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Notas sobre el cliente, historial, comportamiento de pago..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">{editing ? 'Actualizar' : 'Crear Cliente'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Detalle del Cliente" size="lg">
        {showDetail && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                <User size={32} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{showDetail.fullName}</h3>
                <p className="text-sm text-gray-500">Cliente desde {formatDate(showDetail.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Cédula:</span><p className="font-medium">{showDetail.cedula}</p></div>
              <div><span className="text-gray-500">Teléfono:</span><p className="font-medium">{showDetail.phone}</p></div>
              <div><span className="text-gray-500">WhatsApp:</span><p className="font-medium">{showDetail.whatsapp}</p></div>
              <div><span className="text-gray-500">Email:</span><p className="font-medium">{showDetail.email || 'N/A'}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Dirección:</span><p className="font-medium">{showDetail.address}</p></div>
              {showDetail.guarantor && <div><span className="text-gray-500">Garante:</span><p className="font-medium">{showDetail.guarantor} ({showDetail.guarantorPhone})</p></div>}
              {showDetail.lat && <div><span className="text-gray-500">GPS:</span><p className="font-medium">{showDetail.lat}, {showDetail.lng}</p></div>}
            </div>

            {/* Loan history */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Historial de Préstamos</h4>
              {getClientLoans(showDetail.id).length > 0 ? (
                <div className="space-y-2">
                  {getClientLoans(showDetail.id).map(l => (
                    <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium">{formatCurrency(l.amount)} - {l.type}</p>
                        <p className="text-xs text-gray-400">{l.payments.length} pagos • Inicio: {formatDate(l.startDate)}</p>
                      </div>
                      <Badge variant={l.status === 'activo' ? 'success' : l.status === 'mora' ? 'danger' : l.status === 'cancelado' ? 'info' : 'warning'}>
                        {l.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin préstamos registrados</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
