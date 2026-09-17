import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FullPageLoader } from './LoadingStates';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'cobrador')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return <FullPageLoader text="Verificando sesión..." />;
  }

  // Si no está autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se especificaron roles permitidos, verificar que el usuario tenga uno de esos roles
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirigir según el rol del usuario
    if (profile.role === 'admin') {
      return <Navigate to="/dashboard-admin" replace />;
    } else if (profile.role === 'cobrador') {
      return <Navigate to="/dashboard-cobrador" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
}
