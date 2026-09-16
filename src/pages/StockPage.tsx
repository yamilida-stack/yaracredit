import { useState } from 'react';
import { useStore } from '../store';
import { Modal, Button, Input, Select, Card, Table, Badge, formatCurrency, EmptyState } from '../components/ui';
import { Plus, Search, Package, AlertTriangle, Edit2, Trash2, Eye, Hash, Smartphone } from 'lucide-react';

export default function StockPage() {
  const { articles, addArticle, updateArticle, deleteArticle, currentUser, addNotification } = useStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', category: '', costPrice: '', salePrice: '',
    quantity: '', minStock: '2', serialNumber: '', imei: '', brand: '', model: '', observations: ''
  });

  const filtered = articles.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase()) ||
    (a.serialNumber && a.serialNumber.toLowerCase().includes(search.toLowerCase())) ||
    (a.imei && a.imei.includes(search))
  );
  const lowStock = articles.filter(a => a.quantity <= a.minStock);

  const openCreate = () => {
    setForm({ name: '', description: '', category: '', costPrice: '', salePrice: '', quantity: '', minStock: '2', serialNumber: '', imei: '', brand: '', model: '', observations: '' });
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (id: string) => {
    const article = articles.find(a => a.id === id);
    if (article) {
      setForm({
        name: article.name, description: article.description, category: article.category,
        costPrice: article.costPrice.toString(), salePrice: article.salePrice.toString(),
        quantity: article.quantity.toString(), minStock: article.minStock.toString(),
        serialNumber: article.serialNumber || '', imei: article.imei || '',
        brand: article.brand || '', model: article.model || '', observations: article.observations || ''
      });
      setEditing(id);
      setShowModal(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name, description: form.description, category: form.category,
      costPrice: parseFloat(form.costPrice), salePrice: parseFloat(form.salePrice),
      quantity: parseInt(form.quantity), minStock: parseInt(form.minStock),
      serialNumber: form.serialNumber || undefined,
      imei: form.imei || undefined,
      brand: form.brand || undefined,
      model: form.model || undefined,
      observations: form.observations || undefined,
    };
    if (editing) { updateArticle(editing, data); addNotification('success', 'Artículo actualizado'); }
    else { addArticle(data); addNotification('success', 'Artículo creado'); }
    setShowModal(false);
  };

  const detailArticle = showDetail ? articles.find(a => a.id === showDetail) : null;

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
          <input type="text" placeholder="Buscar por nombre, categoría, serie o IMEI..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        {currentUser?.role !== 'solo_lectura' && <Button onClick={openCreate}><Plus size={18} /> Nuevo Artículo</Button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{articles.length}</p>
          <p className="text-xs text-gray-500">Total Artículos</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{articles.reduce((s, a) => s + a.quantity, 0)}</p>
          <p className="text-xs text-gray-500">Unidades en Stock</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(articles.reduce((s, a) => s + (a.salePrice * a.quantity), 0))}</p>
          <p className="text-xs text-gray-500">Valor de Inventario</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{lowStock.length}</p>
          <p className="text-xs text-gray-500">Stock Bajo</p>
        </Card>
      </div>

      <Card>
        {filtered.length > 0 ? (
          <Table headers={['Artículo', 'Serie/IMEI', 'Categoría', 'Costo', 'Venta', 'Stock', 'Acciones']}>
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.brand} {a.model}</p>
                </td>
                <td className="px-4 py-3">
                  {a.serialNumber && <p className="text-xs font-mono text-gray-600 flex items-center gap-1"><Hash size={10} /> {a.serialNumber}</p>}
                  {a.imei && <p className="text-xs font-mono text-gray-600 flex items-center gap-1"><Smartphone size={10} /> {a.imei}</p>}
                  {!a.serialNumber && !a.imei && <span className="text-xs text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3"><Badge variant="info">{a.category}</Badge></td>
                <td className="px-4 py-3 text-sm">{formatCurrency(a.costPrice)}</td>
                <td className="px-4 py-3 text-sm font-medium">{formatCurrency(a.salePrice)}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-bold ${a.quantity <= a.minStock ? 'text-red-600' : 'text-gray-900'}`}>{a.quantity}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setShowDetail(a.id)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"><Eye size={16} /></button>
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

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Artículo' : 'Nuevo Artículo'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <Input label="Descripción" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <Input label="Marca" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="Ej: Samsung" />
            <Input label="Modelo" value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Ej: RT12M333" />
            <Select label="Categoría" options={[
              { value: 'Electrodomésticos', label: 'Electrodomésticos' },
              { value: 'Electrónica', label: 'Electrónica' },
              { value: 'Vehículos', label: 'Vehículos' },
              { value: 'Muebles', label: 'Muebles' },
              { value: 'Celulares', label: 'Celulares/Smartphones' },
              { value: 'Computadoras', label: 'Computadoras' },
              { value: 'Otros', label: 'Otros' }
            ]} value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
            <Input label="Número de Serie" value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} placeholder="Ej: SAM-2024-001" />
            <Input label="IMEI (solo celulares/dispositivos)" value={form.imei} onChange={e => setForm({...form, imei: e.target.value})} placeholder="Ej: 353456789012345" />
            <Input label="Precio Costo (C$)" type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} />
            <Input label="Precio Venta (C$) *" type="number" value={form.salePrice} onChange={e => setForm({...form, salePrice: e.target.value})} />
            <Input label="Cantidad Disponible" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            <Input label="Stock Mínimo (alerta)" type="number" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                value={form.observations}
                onChange={e => setForm({...form, observations: e.target.value})}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Notas adicionales sobre el artículo..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">{editing ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Detalle del Artículo" size="lg">
        {detailArticle && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Package size={32} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{detailArticle.name}</h3>
                <p className="text-sm text-gray-500">{detailArticle.brand} {detailArticle.model}</p>
                <Badge variant={detailArticle.quantity <= detailArticle.minStock ? 'danger' : 'success'}>
                  {detailArticle.quantity <= detailArticle.minStock ? 'Stock Bajo' : 'Disponible'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Categoría:</span><p className="font-medium">{detailArticle.category}</p></div>
              <div><span className="text-gray-500">Cantidad:</span><p className="font-bold text-lg">{detailArticle.quantity}</p></div>
              <div><span className="text-gray-500">Precio Costo:</span><p className="font-medium">{formatCurrency(detailArticle.costPrice)}</p></div>
              <div><span className="text-gray-500">Precio Venta:</span><p className="font-bold text-lg text-green-600">{formatCurrency(detailArticle.salePrice)}</p></div>
              {detailArticle.serialNumber && (
                <div><span className="text-gray-500">Número de Serie:</span><p className="font-mono font-medium">{detailArticle.serialNumber}</p></div>
              )}
              {detailArticle.imei && (
                <div><span className="text-gray-500">IMEI:</span><p className="font-mono font-medium">{detailArticle.imei}</p></div>
              )}
              <div className="col-span-2"><span className="text-gray-500">Descripción:</span><p className="font-medium">{detailArticle.description}</p></div>
              {detailArticle.observations && (
                <div className="col-span-2"><span className="text-gray-500">Observaciones:</span><p className="font-medium bg-yellow-50 p-2 rounded-lg">{detailArticle.observations}</p></div>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-400">Valor total en inventario: <span className="font-bold text-purple-700">{formatCurrency(detailArticle.salePrice * detailArticle.quantity)}</span></p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
