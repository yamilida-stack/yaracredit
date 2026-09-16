import { useState, useEffect } from 'react';
import { useSupabaseConnection } from '../hooks/useSupabase';
import { ConnectionStatus, FullPageLoader } from './LoadingStates';
import { supabase } from '../lib/supabaseClient';

interface DataSyncProviderProps {
  children: React.ReactNode;
}

export function DataSyncProvider({ children }: DataSyncProviderProps) {
  const connected = useSupabaseConnection();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Dar tiempo para verificar conexión
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (initializing) {
    return <FullPageLoader text="Verificando conexión con Supabase..." />;
  }

  return (
    <>
      {children}
      <ConnectionStatus connected={connected} />
    </>
  );
}

// Hook para sincronizar datos entre localStorage y Supabase
export function useDataSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const syncToSupabase = async () => {
    setSyncing(true);
    try {
      // Obtener datos de localStorage
      const storageData = JSON.parse(localStorage.getItem('yaracredit-storage') || '{}');
      const { state } = storageData;

      if (!state) {
        setSyncing(false);
        return;
      }

      // Sincronizar clientes
      if (state.clients && state.clients.length > 0) {
        for (const client of state.clients) {
          await supabase.from('clientes').upsert({
            id: client.id,
            nombre_completo: client.fullName,
            cedula: client.cedula,
            direccion: client.address,
            telefono: client.phone,
            whatsapp: client.whatsapp,
            email: client.email,
            garante: client.guarantor,
            garante_telefono: client.guarantorPhone,
            lat: client.lat,
            lng: client.lng,
          });
        }
      }

      // Sincronizar artículos
      if (state.articles && state.articles.length > 0) {
        for (const article of state.articles) {
          await supabase.from('inventario').upsert({
            id: article.id,
            nombre: article.name,
            descripcion: article.description,
            categoria: article.category,
            marca: article.brand,
            modelo: article.model,
            numero_serie: article.serialNumber,
            imei: article.imei,
            precio_costo: article.costPrice,
            precio_venta: article.salePrice,
            cantidad: article.quantity,
            stock_minimo: article.minStock,
          });
        }
      }

      setLastSync(new Date());
      console.log('✅ Datos sincronizados con Supabase');
    } catch (error) {
      console.error('❌ Error al sincronizar:', error);
    } finally {
      setSyncing(false);
    }
  };

  const syncFromSupabase = async () => {
    setSyncing(true);
    try {
      // Obtener datos de Supabase
      const { data: clientes } = await supabase.from('clientes').select('*');
      const { data: articulos } = await supabase.from('inventario').select('*');
      const { data: creditos } = await supabase.from('creditos').select('*');

      // Guardar en localStorage
      const currentData = JSON.parse(localStorage.getItem('yaracredit-storage') || '{}');
      const { state } = currentData;

      if (state) {
        if (clientes) state.clients = clientes;
        if (articulos) state.articles = articulos;
        if (creditos) state.loans = creditos;

        localStorage.setItem('yaracredit-storage', JSON.stringify({ state }));
      }

      setLastSync(new Date());
      console.log('✅ Datos importados desde Supabase');
    } catch (error) {
      console.error('❌ Error al importar:', error);
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncing,
    lastSync,
    syncToSupabase,
    syncFromSupabase,
  };
}
