import { supabase } from '../lib/supabaseClient';

/**
 * Wrapper para operaciones de Supabase con verificación de conexión
 * Asegura que todas las operaciones vayan directamente a Supabase en tiempo real
 */

// Verificar si hay conexión a internet
const checkConnection = (): boolean => {
  if (!navigator.onLine) {
    throw new Error('Conexión a internet requerida para realizar esta operación.');
  }
  return true;
};

// Wrapper para operaciones SELECT
export const supabaseSelect = async (table: string, query?: string) => {
  checkConnection();
  
  let request = supabase.from(table).select(query || '*');
  const { data, error } = await request;
  
  if (error) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Conexión a internet requerida para realizar esta operación.');
    }
    throw error;
  }
  
  return { data, error };
};

// Wrapper para operaciones INSERT
export const supabaseInsert = async (table: string, values: any | any[]) => {
  checkConnection();
  
  const { data, error } = await supabase.from(table).insert(values).select();
  
  if (error) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Conexión a internet requerida para realizar esta operación.');
    }
    throw error;
  }
  
  return { data, error };
};

// Wrapper para operaciones UPDATE
export const supabaseUpdate = async (table: string, values: any, matchColumn: string, matchValue: any) => {
  checkConnection();
  
  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq(matchColumn, matchValue)
    .select();
  
  if (error) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Conexión a internet requerida para realizar esta operación.');
    }
    throw error;
  }
  
  return { data, error };
};

// Wrapper para operaciones DELETE
export const supabaseDelete = async (table: string, matchColumn: string, matchValue: any) => {
  checkConnection();
  
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq(matchColumn, matchValue);
  
  if (error) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Conexión a internet requerida para realizar esta operación.');
    }
    throw error;
  }
  
  return { data, error };
};

// Wrapper para operaciones UPSERT
export const supabaseUpsert = async (table: string, values: any | any[], onConflict?: string) => {
  checkConnection();
  
  const { data, error } = await supabase
    .from(table)
    .upsert(values, onConflict ? { onConflict } : undefined)
    .select();
  
  if (error) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Conexión a internet requerida para realizar esta operación.');
    }
    throw error;
  }
  
  return { data, error };
};

// Función helper para verificar conexión antes de cualquier operación
export const requireConnection = () => {
  if (!navigator.onLine) {
    throw new Error('Conexión a internet requerida para realizar esta operación.');
  }
};
