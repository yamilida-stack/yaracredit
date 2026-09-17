import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, Select, Table, Badge, Modal } from '../components/ui';
import { Plus, Users, Trash2, Edit2, UserCheck, UserX } from 'lucide-react';
import { useStore } from '../store';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'cobrador';
  active: boolean;
  created_at: string;
}

export default function UserManagementPage() {
  const { profile: currentProfile } = useAuth();
  const { addNotification } = useStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'cobrador' as 'admin' | 'cobrador',
  });

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      addNotification('error', 'Error al cargar usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm({
      full_name: '',
      email: '',
      password: '',
      role: 'cobrador',
    });
    setEditingUser(null);
    setShowModal(true);
  };

  const openEditModal = (user: UserProfile) => {
    setForm({
      full_name: user.full_name,
      email: user.email,
      password: '', // No mostrar contraseña actual
      role: user.role,
    });
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name || !form.email) {
      addNotification('error', 'Nombre y correo son obligatorios');
      return;
    }

    if (!editingUser && !form.password) {
      addNotification('error', 'La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    if (form.password && form.password.length < 6) {
      addNotification('error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      if (editingUser) {
        // Actualizar usuario existente
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: form.full_name,
            role: form.role,
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        // NOTA: Para cambiar la contraseña, el usuario debe usar la función de "Olvidé mi contraseña"
        // No se puede cambiar la contraseña de otro usuario desde el frontend sin SERVICE_ROLE_KEY
        
        if (form.password) {
          addNotification('warning', 'Para cambiar la contraseña, el usuario debe usar la opción "Olvidé mi contraseña"');
        }

        addNotification('success', 'Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        // 1. Crear usuario en auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.full_name,
              role: form.role,
            },
          },
        });

        if (authError) throw authError;

        // 2. Insertar perfil en la tabla profiles
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: form.email,
              full_name: form.full_name,
              role: form.role,
              active: true,
            });

          if (profileError) throw profileError;
        }

        addNotification('success', 'Usuario creado exitosamente');
      }

      setShowModal(false);
      fetchUsers(); // Recargar lista
    } catch (error: any) {
      addNotification('error', 'Error: ' + (error.message || 'Ocurrió un error'));
    }
  };

  const toggleUserStatus = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !user.active })
        .eq('id', user.id);

      if (error) throw error;

      addNotification('success', `Usuario ${user.active ? 'desactivado' : 'activado'}`);
      fetchUsers();
    } catch (error: any) {
      addNotification('error', 'Error al cambiar estado: ' + error.message);
    }
  };

  const deleteUser = async (user: UserProfile) => {
    if (!confirm(`¿Estás seguro de eliminar a ${user.full_name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      // Eliminar perfil
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      // Nota: El usuario en auth.users se elimina automáticamente por el trigger ON DELETE CASCADE

      addNotification('success', 'Usuario eliminado exitosamente');
      fetchUsers();
    } catch (error: any) {
      addNotification('error', 'Error al eliminar: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-500">Administra los usuarios del sistema</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={18} /> Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Users size={24} className="mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          <p className="text-xs text-gray-500">Total Usuarios</p>
        </Card>
        <Card className="p-4 text-center">
          <UserCheck size={24} className="mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-600">{users.filter(u => u.active).length}</p>
          <p className="text-xs text-gray-500">Activos</p>
        </Card>
        <Card className="p-4 text-center">
          <UserX size={24} className="mx-auto text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.active).length}</p>
          <p className="text-xs text-gray-500">Inactivos</p>
        </Card>
        <Card className="p-4 text-center">
          <Users size={24} className="mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'cobrador').length}</p>
          <p className="text-xs text-gray-500">Cobradores</p>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Cargando usuarios...</p>
          </div>
        ) : users.length > 0 ? (
          <Table headers={['Nombre', 'Correo', 'Rol', 'Estado', 'Creado', 'Acciones']}>
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-700 font-bold text-sm">
                        {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{user.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === 'admin' ? 'danger' : 'info'}>
                    {user.role === 'admin' ? 'Administrador' : 'Cobrador'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.active ? 'success' : 'default'}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('es-NI')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                      title={user.active ? 'Desactivar' : 'Activar'}
                    >
                      {user.active ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                    {user.id !== currentProfile?.id && (
                      <button
                        onClick={() => deleteUser(user)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay usuarios registrados</p>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre Completo"
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
            placeholder="Juan Pérez"
            required
          />
          <Input
            label="Correo Electrónico"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="juan@ejemplo.com"
            required
            disabled={!!editingUser}
          />
          <Input
            label={editingUser ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required={!editingUser}
          />
          <Select
            label="Rol"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'cobrador' })}
            options={[
              { value: 'cobrador', label: 'Cobrador' },
              { value: 'admin', label: 'Administrador' },
            ]}
          />
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            <strong>Permisos:</strong>
            <ul className="mt-1 list-disc list-inside">
              <li><strong>Administrador:</strong> Acceso total al sistema</li>
              <li><strong>Cobrador:</strong> Solo puede ver sus clientes y registrar cobros</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingUser ? 'Actualizar' : 'Crear'} Usuario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
