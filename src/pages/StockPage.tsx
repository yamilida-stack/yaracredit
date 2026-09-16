import { useState } from 'react';
import { useStore } from '../store';
import { Modal, Button, Input, Select, Card, Table, Badge, formatCurrency, EmptyState } from '../components/ui';
import { Plus, Search, Package, AlertTriangle, Edit2, Trash2 } from 'lucide-react';

export default function StockPage() {
  const { articles, addArticle, updateArticle, deleteArticle, currentUser, addNotification } = useStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', category: '', costPrice: '', salePrice: '', quantity: '', minStock: '2' });

  const filtered = articles.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()));
  const lowStock = articles.filter(a => a.quantity <= a.minStock);

  const openCreate = () => {
    setForm({ name: '', description: '', category: '', costPrice: '', salePrice: '', quantity: '', minStock: '2' });
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (id: string) => {
    const article = articles.find(a => a.id === id);
    if (article) {
      setForm({ name: article.name, description: article.description, category: article.category, costPrice: article.costPrice.toString(), salePrice: article.salePrice.toString(), quantity: article.quantity.toString(), minStock: article.minStock.toString() });
      setEditing(id);
      setShowModal(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: form.name, description: form.description, category: form.category, costPrice: parseFloat(form.costPrice), salePrice: parseFloat(form.salePrice), quantity: parseInt(form.quantity), minStock: parseInt(form.minStock) };
    if (editing) { updateArticle(editing, data); addNotification('success', 'Artículo actualizado'); }
    else { addArticle(data); addNotification('success', 'Artículo creado'); }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">Alerta: {lowStock.length} artículo(s) con stock bajo</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {lowStock.map(a => <Badge key={a.id} variant="warning">{a.name} ({a.quantity})</Badge>)}
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar artículo..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        {currentUser?.role !== 'solo_lectura' && <Button onClick={openCreate}><Plus size={18} /> Nuevo Artículo</Button>}
      </div>

      <Card>
        {filtered.length > 0 ? (
          <Table headers={['Artículo', 'Categoría', 'Costo', 'Venta', 'Stock', 'Estado', 'Acciones']}>
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><p className="text-sm font-medium">{a.name}</p><p className="text-xs text-gray-400">{a.description}</p></td>
                <td className="px-4 py-3"><Badge variant="info">{a.category}</Badge></td>
                <td className="px-4 py-3 text-sm">{formatCurrency(a.costPrice)}</td>
                <td className="px-4 py-3 text-sm font-medium">{formatCurrency(a.salePrice)}</td>
                <td className="px-4 py-3 text-sm font-bold">{a.quantity}</td>
                <td className="px-4 py-3">{a.quantity <= a.minStock ? <Badge variant="danger">Bajo</Badge> : <Badge variant="success">OK</Badge>}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {currentUser?.role !== 'solo_lectura' && (
                      <>
                        <button onClick={() => openEdit(a.id)} className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600"><Edit2 size={16} /></button>
                        {currentUser?.role === 'admin' && <button onClick={() => { deleteArticle(a.id); addNotification('success', 'Eliminado'); }} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 size={16} /></button>}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : <EmptyState icon={<Package size={40} className="text-gray-300" />} title="Sin artículos" description="Agrega artículos al inventario" action={<Button onClick={openCreate}><Plus size={16} /> Agregar</Button>} />}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Artículo' : 'Nuevo Artículo'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <Input label="Descripción" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <Select label="Categoría" options={[{ value: 'Electrodomésticos', label: 'Electrodomésticos' }, { value: 'Electrónica', label: 'Electrónica' }, { value: 'Vehículos', label: 'Vehículos' }, { value: 'Muebles', label: 'Muebles' }, { value: 'Otros', label: 'Otros' }]} value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio Costo" type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} />
            <Input label="Precio Venta *" type="number" value={form.salePrice} onChange={e => setForm({...form, salePrice: e.target.value})} />
            <Input label="Cantidad" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            <Input label="Stock Mínimo" type="number" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">{editing ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
