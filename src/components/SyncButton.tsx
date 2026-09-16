import { useState } from 'react';
import { useDataSync } from './DataSyncProvider';
import { Button } from './ui';
import { RefreshCw, Upload, Download } from 'lucide-react';

export function SyncButton() {
  const { syncing, lastSync, syncToSupabase, syncFromSupabase } = useDataSync();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        disabled={syncing}
      >
        <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
        {syncing ? 'Sincronizando...' : 'Sincronizar'}
      </Button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500">
              {lastSync 
                ? `Última sincronización: ${lastSync.toLocaleTimeString()}`
                : 'No sincronizado'}
            </p>
          </div>
          
          <button
            onClick={() => {
              syncToSupabase();
              setShowMenu(false);
            }}
            disabled={syncing}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
          >
            <Upload size={16} className="text-purple-600" />
            <div>
              <p className="font-medium">Subir a Supabase</p>
              <p className="text-xs text-gray-500">Enviar datos locales a la nube</p>
            </div>
          </button>

          <button
            onClick={() => {
              syncFromSupabase();
              setShowMenu(false);
            }}
            disabled={syncing}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} className="text-blue-600" />
            <div>
              <p className="font-medium">Descargar de Supabase</p>
              <p className="text-xs text-gray-500">Importar datos de la nube</p>
            </div>
          </button>

          <div className="px-4 py-2 border-t border-gray-100 mt-2">
            <p className="text-xs text-gray-400">
              💡 Los datos se guardan localmente y se sincronizan con Supabase cuando hay conexión.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
