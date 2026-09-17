import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { normalizeRole, type Role } from '../types';
import { FullPageLoader } from './LoadingStates';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const currentRole = profile ? normalizeRole(profile.role) : null;

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return <FullPageLoader text="Verificando sesión..." />;
  }

  // Si no está autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se especificaron roles permitidos, verificar que el usuario tenga uno de esos roles
  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    // Redirigir según el rol del usuario
    if (currentRole === 'admin') {
      return <Navigate to="/dashboard-admin" replace />;
    } else if (currentRole === 'cobrador') {
      return <Navigate to="/dashboard-cobrador" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
}
