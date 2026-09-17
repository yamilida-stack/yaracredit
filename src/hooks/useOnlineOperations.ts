import { useOnlineStatus } from './useOnlineStatus';
import { useStore } from '../store';

export function useOnlineOperations() {
  const isOnline = useOnlineStatus();
  const { addNotification } = useStore();

  const checkConnection = (operationName: string): boolean => {
    if (!isOnline) {
      addNotification('error', `Conexión a internet requerida para ${operationName}`);
      return false;
    }
    return true;
  };

  const withConnectionCheck = async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T | null> => {
    if (!checkConnection(operationName)) {
      return null;
    }

    try {
      return await operation();
    } catch (error: any) {
      // Verificar si es un error de conexión
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') ||
          error.message?.includes('fetch')) {
        addNotification('error', `Conexión a internet requerida para ${operationName}`);
      } else {
        addNotification('error', `Error al ${operationName}: ${error.message}`);
      }
      return null;
    }
  };

  return {
    isOnline,
    checkConnection,
    withConnectionCheck,
  };
}
