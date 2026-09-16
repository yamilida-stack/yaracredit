import { useState } from 'react';
import { useStore } from './store';
import Layout from './components/Layout';
import { ToastContainer } from './components/ui';
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
import UsersPage from './pages/UsersPage';

function App() {
  const { currentUser, notifications, removeNotification } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Not logged in
  if (!currentUser) {
    return (
      <>
        <LoginPage />
        <ToastContainer notifications={notifications} onRemove={removeNotification} />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
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
      case 'users': return <UsersPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
      <ToastContainer notifications={notifications} onRemove={removeNotification} />
    </>
  );
}

export default App;
