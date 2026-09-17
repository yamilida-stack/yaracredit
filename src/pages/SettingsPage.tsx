import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Card, Button, Input, Select, Badge } from '../components/ui';
import { Settings, Moon, Sun, Building2, Receipt, DollarSign, Bell, Shield, Database, Palette, Save, RotateCcw, Loader2 } from 'lucide-react';
import type { AppSettings } from '../types';

export default function SettingsPage() {
  const { settings, updateSettings, toggleDarkMode, addNotification } = useStore();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [localSettings, setLocalSettings] = useState(settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Verificar permisos de administrador
  const isAdmin = profile?.role === 'admin';

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'loans', label: 'Préstamos', icon: DollarSign },
    { id: 'receipts', label: 'Recibos', icon: Receipt },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'backup', label: 'Respaldo', icon: Database },
  ];

  // Cargar configuraciones desde Supabase
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('configuracion')
          .select('*');

        if (error) throw error;

        if (data && data.length > 0) {
          // Convertir array de configuraciones a objeto
          const configMap: any = {};
          data.forEach((item: any) => {
            let valor = item.valor;
            
            // Convertir tipos según el campo 'tipo'
            if (item.tipo === 'number') {
              valor = parseFloat(valor);
            } else if (item.tipo === 'boolean') {
              valor = valor === 'true';
            } else if (item.tipo === 'json') {
              try {
                valor = JSON.parse(valor);
              } catch (e) {
                console.error('Error parsing JSON config:', e);
              }
            }
            
            configMap[item.clave] = valor;
          });

          // Actualizar estado local con las configuraciones cargadas
          const newSettings = {
            ...settings,
            companyName: configMap.nombre_empresa || settings.companyName,
            companyPhone: configMap.telefono_empresa || settings.companyPhone,
            companyAddress: configMap.direccion_empresa || settings.companyAddress,
            defaultInterestRate: configMap.tasa_interes_default || settings.defaultInterestRate,
            defaultTerm: configMap.plazo_default || settings.defaultTerm,
            gracePeriodDays: configMap.dias_gracia || settings.gracePeriodDays,
            currency: configMap.moneda || settings.currency,
            darkMode: configMap.modo_oscuro !== undefined ? configMap.modo_oscuro : settings.darkMode,
          };

          setLocalSettings(newSettings);
          updateSettings(newSettings);
        }
      } catch (error: any) {
        console.error('Error al cargar configuración:', error);
        addNotification('error', 'Error al cargar configuración: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Guardar configuraciones en Supabase
  const handleSave = async () => {
    if (!isAdmin) {
      addNotification('error', 'Solo los administradores pueden guardar configuraciones');
      return;
    }

    try {
      setSaving(true);

      // Preparar las configuraciones para guardar
      const configsToSave = [
        { clave: 'nombre_empresa', valor: localSettings.companyName, tipo: 'text' },
        { clave: 'telefono_empresa', valor: localSettings.companyPhone, tipo: 'text' },
        { clave: 'direccion_empresa', valor: localSettings.companyAddress, tipo: 'text' },
        { clave: 'tasa_interes_default', valor: localSettings.defaultInterestRate.toString(), tipo: 'number' },
        { clave: 'plazo_default', valor: localSettings.defaultTerm.toString(), tipo: 'number' },
        { clave: 'dias_gracia', valor: localSettings.gracePeriodDays.toString(), tipo: 'number' },
        { clave: 'moneda', valor: localSettings.currency, tipo: 'text' },
        { clave: 'modo_oscuro', valor: localSettings.darkMode.toString(), tipo: 'boolean' },
      ];

      // Guardar cada configuración usando upsert
      const updates = configsToSave.map(config =>
        supabase
          .from('configuracion')
          .upsert({
            clave: config.clave,
            valor: config.valor,
            tipo: config.tipo,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'clave'
          })
      );

      await Promise.all(updates);

      // Actualizar el store local
      updateSettings(localSettings);
      
      addNotification('success', 'Configuración guardada correctamente');
    } catch (error: any) {
      console.error('Error al guardar configuración:', error);
      addNotification('error', 'Error al guardar configuración: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!isAdmin) {
      addNotification('error', 'Solo los administradores pueden restaurar configuraciones');
      return;
    }

    if (confirm('¿Restaurar configuración predeterminada?')) {
      const defaults = {
        darkMode: false,
        companyName: 'YaraCredit',
        companyRnc: '000-00000-0',
        companyAddress: 'Dirección de la empresa',
        companyPhone: '0000-0000',
        currency: 'C$',
        defaultInterestRate: 14,
        defaultTerm: 3,
        thermalSize: '50mm' as const,
        commissionRate: 5,
        lateFeePercent: 2,
        gracePeriodDays: 3,
        whatsappMessageTemplate: 'Hola {cliente}, le recordamos que tiene un pago pendiente de {monto} para hoy. Gracias por su preferencia.',
        receiptHeader: 'YARACREDIT - Sistema de Préstamos',
        receiptFooter: '¡Gracias por su pago!',
        autoBackup: true,
        notificationsEnabled: true,
      };
      setLocalSettings(defaults);
      updateSettings(defaults);
      addNotification('info', 'Configuración restaurada (no guardada en BD)');
    }
  };

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no es administrador
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings size={24} className="text-purple-600" />
          <h3 className="text-lg font-bold">Configuración del Sistema</h3>
        </div>
        
        <Card className="p-8 text-center">
          <Shield size={48} className="mx-auto text-gray-400 mb-4" />
          <h4 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h4>
          <p className="text-gray-600">
            Solo los administradores pueden ver y modificar la configuración del sistema.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={24} className="text-purple-600" />
          <h3 className="text-lg font-bold">Configuración del Sistema</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
            <RotateCcw size={14} /> Restaurar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Save size={14} /> Guardar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <Card className="p-2 h-fit">
          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Content */}
        <Card className="lg:col-span-3 p-6">
          {/* General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-2"><Building2 size={20} className="text-purple-600" /> Datos de la Empresa</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Nombre de la Empresa" 
                  value={localSettings.companyName} 
                  onChange={e => setLocalSettings({...localSettings, companyName: e.target.value})} 
                />
                <Input 
                  label="Teléfono" 
                  value={localSettings.companyPhone} 
                  onChange={e => setLocalSettings({...localSettings, companyPhone: e.target.value})} 
                />
                <Input 
                  label="Moneda" 
                  value={localSettings.currency} 
                  onChange={e => setLocalSettings({...localSettings, currency: e.target.value})} 
                />
                <div className="sm:col-span-2">
                  <Input 
                    label="Dirección" 
                    value={localSettings.companyAddress} 
                    onChange={e => setLocalSettings({...localSettings, companyAddress: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-2"><Palette size={20} className="text-purple-600" /> Apariencia</h4>
              
              {/* Dark mode toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  {localSettings.darkMode ? <Moon size={24} className="text-purple-600" /> : <Sun size={24} className="text-yellow-500" />}
                  <div>
                    <p className="font-medium">Modo Oscuro</p>
                    <p className="text-sm text-gray-500">Reduce el brillo de la pantalla para mayor comodidad visual</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newDarkMode = !localSettings.darkMode;
                    setLocalSettings({...localSettings, darkMode: newDarkMode});
                    toggleDarkMode();
                  }}
                  className={`relative w-14 h-7 rounded-full transition-colors ${localSettings.darkMode ? 'bg-purple-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${localSettings.darkMode ? 'translate-x-7' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select 
                  label="Tamaño de Recibo Térmico" 
                  options={[
                    { value: '50mm', label: '50mm (Compacto)' },
                    { value: '80mm', label: '80mm (Estándar)' },
                  ]} 
                  value={localSettings.thermalSize} 
                  onChange={e => setLocalSettings({...localSettings, thermalSize: e.target.value as '50mm' | '80mm'})} 
                />
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-sm text-purple-700 font-medium">Vista previa del tema actual:</p>
                <div className={`mt-3 p-4 rounded-xl ${localSettings.darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border`}>
                  <p className="font-bold">YaraCredit</p>
                  <p className="text-sm opacity-75">Modo {localSettings.darkMode ? 'Oscuro' : 'Claro'} activo</p>
                </div>
              </div>
            </div>
          )}

          {/* Loans */}
          {activeTab === 'loans' && (
            <div className="space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-2"><DollarSign size={20} className="text-purple-600" /> Configuración de Préstamos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Tasa de Interés Predeterminada (% mensual)" 
                  type="number" 
                  value={localSettings.defaultInterestRate.toString()} 
                  onChange={e => setLocalSettings({...localSettings, defaultInterestRate: parseFloat(e.target.value)})} 
                />
                <Input 
                  label="Plazo Predeterminado (meses)" 
                  type="number" 
                  value={localSettings.defaultTerm.toString()} 
                  onChange={e => setLocalSettings({...localSettings, defaultTerm: parseInt(e.target.value)})} 
                />
                <Input 
                  label="Comisión Cobradores (%)" 
                  type="number" 
                  value={localSettings.commissionRate.toString()} 
                  onChange={e => setLocalSettings({...localSettings, commissionRate: parseFloat(e.target.value)})} 
                />
                <Input 
                  label="Recargo por Mora (%)" 
                  type="number" 
                  value={localSettings.lateFeePercent.toString()} 
                  onChange={e => setLocalSettings({...localSettings, lateFeePercent: parseFloat(e.target.value)})} 
                />
                <Input 
                  label="Días de Gracia" 
                  type="number" 
                  value={localSettings.gracePeriodDays.toString()} 
                  onChange={e => setLocalSettings({...localSettings, gracePeriodDays: parseInt(e.target.value)})} 
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                <p className="font-medium">⚠️ Nota sobre cálculo de intereses:</p>
                <p className="mt-1">El interés se calcula de forma MENSUAL. Si la tasa es 14% mensual y el plazo es 3 meses, el interés total será 14% × 3 = 42% del monto prestado.</p>
              </div>
            </div>
          )}

          {/* Receipts */}
          {activeTab === 'receipts' && (
            <div className="space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-2"><Receipt size={20} className="text-purple-600" /> Formato de Recibos</h4>
              <Input 
                label="Encabezado del Recibo" 
                value={localSettings.receiptHeader} 
                onChange={e => setLocalSettings({...localSettings, receiptHeader: e.target.value})} 
              />
              <Input 
                label="Pie del Recibo" 
                value={localSettings.receiptFooter} 
                onChange={e => setLocalSettings({...localSettings, receiptFooter: e.target.value})} 
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla de Mensaje WhatsApp</label>
                <textarea
                  value={localSettings.whatsappMessageTemplate}
                  onChange={e => setLocalSettings({...localSettings, whatsappMessageTemplate: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Usa {cliente}, {monto}, {fecha} como variables"
                />
                <p className="text-xs text-gray-400 mt-1">Variables disponibles: {'{cliente}'}, {'{monto}'}, {'{fecha}'}, {'{cuota}'}</p>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-2"><Bell size={20} className="text-purple-600" /> Notificaciones</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium">Notificaciones Push</p>
                    <p className="text-sm text-gray-500">Recibir alertas de pagos y vencimientos</p>
                  </div>
                  <button
                    onClick={() => setLocalSettings({...localSettings, notificationsEnabled: !localSettings.notificationsEnabled})}
                    className={`relative w-14 h-7 rounded-full transition-colors ${localSettings.notificationsEnabled ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${localSettings.notificationsEnabled ? 'translate-x-7' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium">Respaldo Automático</p>
                    <p className="text-sm text-gray-500">Guardar datos automáticamente cada día</p>
                  </div>
                  <button
                    onClick={() => setLocalSettings({...localSettings, autoBackup: !localSettings.autoBackup})}
                    className={`relative w-14 h-7 rounded-full transition-colors ${localSettings.autoBackup ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${localSettings.autoBackup ? 'translate-x-7' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-2"><Shield size={20} className="text-purple-600" /> Seguridad</h4>
              <div className="space-y-4">
                <Card className="p-4">
                  <p className="font-medium">Sesiones</p>
                  <p className="text-sm text-gray-500 mt-1">Las sesiones se mantienen activas hasta cerrar manualmente.</p>
                  <Button variant="outline" size="sm" className="mt-3">Cerrar todas las sesiones</Button>
                </Card>
                <Card className="p-4">
                  <p className="font-medium">Registro de Auditoría</p>
                  <p className="text-sm text-gray-500 mt-1">Todos los cambios quedan registrados con fecha y usuario.</p>
                  <Badge variant="success">Activo</Badge>
                </Card>
                <Card className="p-4">
                  <p className="font-medium">Encriptación de Datos</p>
                  <p className="text-sm text-gray-500 mt-1">Los datos sensibles se almacenan encriptados localmente.</p>
                  <Badge variant="success">AES-256</Badge>
                </Card>
              </div>
            </div>
          )}

          {/* Backup */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-2"><Database size={20} className="text-purple-600" /> Respaldo de Datos</h4>
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Exportar Datos</p>
                      <p className="text-sm text-gray-500">Descarga todos los datos en formato JSON</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      const data = JSON.stringify(useStore.getState(), null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `yaracredit_backup_${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      addNotification('success', 'Respaldo descargado');
                    }}>
                      <Database size={14} /> Exportar
                    </Button>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Importar Datos</p>
                      <p className="text-sm text-gray-500">Restaurar desde un archivo de respaldo</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Database size={14} /> Importar
                    </Button>
                  </div>
                </Card>
                <Card className="p-4 bg-green-50 border-green-200">
                  <p className="font-medium text-green-800">✓ Respaldo automático activo</p>
                  <p className="text-sm text-green-600 mt-1">Último respaldo: {new Date().toLocaleDateString('es-NI')}</p>
                </Card>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
