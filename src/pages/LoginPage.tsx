import { useState } from 'react';
import { useStore } from '../store';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useStore(s => s.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const success = login(pin);
      if (!success) {
        setError('PIN incorrecto o usuario inactivo');
      }
      setLoading(false);
    }, 500);
  };

  const handlePinInput = (value: string) => {
    if (/^\d{0,6}$/.test(value)) {
      setPin(value);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl mb-4 border border-white/20">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">YaraCredit</h1>
          <p className="text-purple-200 mt-2">Sistema de Gestión de Préstamos</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white">Iniciar Sesión</h2>
              <p className="text-purple-200 text-sm mt-1">Ingresa tu PIN de acceso</p>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock size={20} className="text-purple-300" />
              </div>
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => handlePinInput(e.target.value)}
                placeholder="••••"
                maxLength={6}
                className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-white text-center text-2xl tracking-[0.5em] placeholder:text-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
              >
                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 text-center">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pin.length < 4 || loading}
              className="w-full py-4 bg-white text-purple-900 font-bold rounded-2xl hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-purple-900 border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>

          {/* Demo PINs */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-purple-200 text-xs text-center mb-3">PINs de demostración:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { pin: '1234', role: 'Admin' },
                { pin: '2345', role: 'Gerente' },
                { pin: '3456', role: 'Cobrador' },
                { pin: '5678', role: 'Solo lectura' },
              ].map(d => (
                <button
                  key={d.pin}
                  onClick={() => handlePinInput(d.pin)}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-purple-200 hover:text-white transition-all"
                >
                  <span className="font-mono">{d.pin}</span>
                  <span className="text-purple-400 ml-1">({d.role})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-purple-300/60 text-xs mt-6">
          YaraCredit v1.0 — Offline-First PWA
        </p>
      </div>
    </div>
  );
}
