import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as supabaseService from '../services/supabaseService';
import type { Client, Loan, Article, User, Route, CashMovement } from '../types';

// Hook para manejar datos con Supabase
export function useSupabaseData<T>(
  fetchFn: () => Promise<T[]>,
  deps: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Hook específico para Clientes
export function useClientes() {
  return useSupabaseData<Client>(supabaseService.fetchClientes, []);
}

// Hook específico para Inventario
export function useInventario() {
  return useSupabaseData<Article>(supabaseService.fetchInventario, []);
}

// Hook específico para Créditos
export function useCreditos() {
  return useSupabaseData<Loan>(supabaseService.fetchCreditos, []);
}

// Hook específico para Usuarios
export function useUsuarios() {
  return useSupabaseData<User>(supabaseService.fetchUsuarios, []);
}

// Hook específico para Rutas
export function useRutas() {
  return useSupabaseData<Route>(supabaseService.fetchRutas, []);
}

// Hook para conexión en tiempo real
export function useRealtimeSubscription(table: string, callback: (payload: any) => void) {
  useEffect(() => {
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [table, callback]);
}

// Hook para verificar conexión
export function useSupabaseConnection() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const { data } = await supabase.from('usuarios').select('count').limit(1);
        setConnected(true);
      } catch {
        setConnected(false);
      }
    }
    check();
  }, []);

  return connected;
}
