import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import { ToastContainer } from './components/ui';
import { useStore } from './store';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import LoansPage from './pages/LoansPage';
import CollectionsPage from './pages/CollectionsPage';
import RoutesPage from './pages/RoutesPage';
import StockPage from './pages/StockPage';
import CashPage from './pages/CashPage';
import ContractsPage from './pages/ContractsPage';
import PayrollPage from './pages/PayrollPage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';
import SettingsPage from './pages/SettingsPage';
import FinancedDevicesPage from './pages/FinancedDevicesPage';
import RiskScorePage from './pages/RiskScorePage';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { notifications, removeNotification, settings } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Aplicar modo oscuro
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    return (
      <>
        <LoginPage />
        <ToastContainer notifications={notifications} onRemove={removeNotification} />
      </>
    );
  }

  // Si hay usuario, mostrar la aplicación
  return (
    <div className={settings.darkMode ? 'dark' : ''}>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage(currentPage)}
      </Layout>
      <ToastContainer notifications={notifications} onRemove={removeNotification} />
    </div>
  );
}

function renderPage(page: string) {
  switch (page) {
    case 'dashboard': return <DashboardPage />;
    case 'clients': return <ClientsPage />;
    case 'loans': return <LoansPage />;
    case 'collections': return <CollectionsPage />;
    case 'routes': return <RoutesPage />;
    case 'stock': return <StockPage />;
    case 'cash': return <CashPage />;
    case 'contracts': return <ContractsPage />;
    case 'payroll': return <PayrollPage />;
    case 'reports': return <ReportsPage />;
    case 'user-management': return <UserManagementPage />;
    case 'settings': return <SettingsPage />;
    case 'financed-devices': return <FinancedDevicesPage />;
    case 'risk-score': return <RiskScorePage />;
    default: return <DashboardPage />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
