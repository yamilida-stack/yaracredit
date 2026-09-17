import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function ConnectionAlert() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-4 shadow-lg animate-pulse">
      <div className="flex items-center justify-center gap-3">
        <WifiOff size={24} className="animate-pulse" />
        <div className="text-center">
          <p className="font-bold text-lg">⚠️ Sin conexión a internet</p>
          <p className="text-sm">Conexión a internet requerida para realizar operaciones</p>
        </div>
      </div>
    </div>
  );
}
