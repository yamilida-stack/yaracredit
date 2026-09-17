import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function ConnectionAlert() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <WifiOff size={20} />
        <span className="font-medium">⚠️ Sin conexión a internet. Conéctate para continuar trabajando.</span>
      </div>
    </div>
  );
}
