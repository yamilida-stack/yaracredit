import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Registro
        if (!fullName) {
          setError('Por favor ingresa tu nombre completo');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message === 'User already registered' 
            ? 'Este correo ya está registrado' 
            : error.message);
        } else {
          setError('');
          alert('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
          setIsSignUp(false);
        }
      } else {
        // Inicio de sesión
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message === 'Invalid login credentials'
            ? 'Correo o contraseña incorrectos'
            : error.message === 'Email not confirmed'
            ? 'Por favor confirma tu correo electrónico'
            : error.message);
        }
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Ingresa tu correo electrónico primero');
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      alert('Se ha enviado un correo para resetear tu contraseña');
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white">
                {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </h2>
              <p className="text-purple-200 text-sm mt-1">
                {isSignUp ? 'Regístrate para comenzar' : 'Ingresa tus credenciales'}
              </p>
            </div>

            {/* Full Name (solo en registro) */}
            {isSignUp && (
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Shield size={20} className="text-purple-300" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  required={isSignUp}
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Mail size={20} className="text-purple-300" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock size={20} className="text-purple-300" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 text-center">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-purple-900 font-bold rounded-2xl hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-purple-900 border-t-transparent rounded-full animate-spin" />
                  {isSignUp ? 'Registrando...' : 'Iniciando sesión...'}
                </span>
              ) : (
                isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'
              )}
            </button>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-purple-200 hover:text-white text-sm transition-colors"
              >
                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </button>
            </div>

            {/* Reset Password (solo en login) */}
            {!isSignUp && (
              <div className="text-center pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-purple-300 hover:text-white text-xs transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-purple-300/60 text-xs mt-6">
          YaraCredit v1.0 — Autenticación Segura con Supabase
        </p>
      </div>
    </div>
  );
}
