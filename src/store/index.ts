import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  User, Client, Loan, Payment, Article, CashMovement, CashRegister,
  Route, Payroll, Notification, Role, LoanType, LoanModality,
  LoanStatus, PaymentMethod, ExpenseCategory, AppSettings
} from '../types';

// ==================== SEED DATA ====================
const seedUsers: User[] = [
  { id: '1', name: 'Admin Principal', pin: '1234', role: 'admin', active: true, createdAt: '2024-01-01' },
  { id: '2', name: 'María García', pin: '2345', role: 'gerente', active: true, createdAt: '2024-01-01' },
  { id: '3', name: 'Carlos López', pin: '3456', role: 'cobrador', active: true, createdAt: '2024-01-01' },
  { id: '4', name: 'Ana Martínez', pin: '4567', role: 'cobrador', active: true, createdAt: '2024-01-15' },
  { id: '5', name: 'Pedro Sánchez', pin: '5678', role: 'solo_lectura', active: true, createdAt: '2024-02-01' },
];

const seedClients: Client[] = [
  { id: 'c1', fullName: 'Juan Pérez Rodríguez', cedula: '001-1234567-8', address: 'Calle Principal #45, Sector Centro', phone: '809-555-0101', whatsapp: '809-555-0101', email: 'juan@email.com', guarantor: 'María Pérez', guarantorPhone: '809-555-0102', lat: 18.4861, lng: -69.9312, createdAt: '2024-01-15' },
  { id: 'c2', fullName: 'Rosa María Fernández', cedula: '001-2345678-9', address: 'Av. Independencia #123, Apt 4B', phone: '809-555-0202', whatsapp: '809-555-0202', lat: 18.4802, lng: -69.9422, createdAt: '2024-01-20' },
  { id: 'c3', fullName: 'Miguel Ángel Santos', cedula: '001-3456789-0', address: 'Calle Duarte #78, Los Mina', phone: '809-555-0303', whatsapp: '809-555-0303', guarantor: 'Luis Santos', guarantorPhone: '809-555-0304', lat: 18.4919, lng: -69.8919, createdAt: '2024-02-01' },
  { id: 'c4', fullName: 'Carmen Lucía Reyes', cedula: '001-4567890-1', address: 'Calle 3ra #12, Villa Mella', phone: '809-555-0404', whatsapp: '809-555-0404', lat: 18.5219, lng: -69.9469, createdAt: '2024-02-10' },
  { id: 'c5', fullName: 'Roberto Díaz Moreno', cedula: '001-5678901-2', address: 'Av. San Vicente de Paúl #200', phone: '809-555-0505', whatsapp: '809-555-0505', guarantor: 'Elena Díaz', guarantorPhone: '809-555-0506', lat: 18.4731, lng: -69.9131, createdAt: '2024-02-15' },
  { id: 'c6', fullName: 'Luisa Fernanda Gómez', cedula: '001-6789012-3', address: 'Calle El Sol #56, Herrera', phone: '809-555-0606', whatsapp: '809-555-0606', lat: 18.4750, lng: -69.9750, createdAt: '2024-03-01' },
];

const seedArticles: Article[] = [
  { id: 'a1', name: 'Refrigerador Samsung 12ft', description: 'Refrigerador no frost 12 pies cúbicos', category: 'Electrodomésticos', costPrice: 25000, salePrice: 35000, quantity: 3, minStock: 2, brand: 'Samsung', model: 'RT12M333ES8', serialNumber: 'SAM-2024-001', createdAt: '2024-01-01' },
  { id: 'a2', name: 'Lavadora LG 22lb', description: 'Lavadora automática 22 libras', category: 'Electrodomésticos', costPrice: 18000, salePrice: 26000, quantity: 5, minStock: 2, brand: 'LG', model: 'WT22V', serialNumber: 'LG-2024-045', createdAt: '2024-01-01' },
  { id: 'a3', name: 'Smart TV 55"', description: 'Smart TV LED 55 pulgadas 4K', category: 'Electrónica', costPrice: 22000, salePrice: 32000, quantity: 4, minStock: 2, brand: 'TCL', model: '55P615', serialNumber: 'TCL-2024-112', createdAt: '2024-01-05' },
  { id: 'a4', name: 'Aire Acondicionado 12000BTU', description: 'Mini split inverter 12000 BTU', category: 'Electrodomésticos', costPrice: 28000, salePrice: 40000, quantity: 2, minStock: 1, brand: 'Midea', model: 'MSAGBU-12', serialNumber: 'MID-2024-008', createdAt: '2024-01-10' },
  { id: 'a5', name: 'Motocicleta Italika 150cc', description: 'Motocicleta nueva 150cc', category: 'Vehículos', costPrice: 65000, salePrice: 85000, quantity: 1, minStock: 1, brand: 'Italika', model: 'FT150', serialNumber: 'ITA-2024-001', imei: '353456789012345', createdAt: '2024-02-01' },
  { id: 'a6', name: 'iPhone 13 128GB', description: 'iPhone 13 nuevo sellado', category: 'Electrónica', costPrice: 35000, salePrice: 48000, quantity: 2, minStock: 1, brand: 'Apple', model: 'iPhone 13', serialNumber: 'APL-2024-567', imei: '356789012345678', createdAt: '2024-02-15' },
];

// Calculate loan installments - Interés MENSUAL
function calculateInstallment(amount: number, interestRate: number, term: number, type: LoanType): number {
  // interestRate es el % MENSUAL
  // Porcentaje de Interés Total = Interés Mensual × Plazo en meses
  const totalInterestPercent = interestRate * term;
  
  // Monto de Interés = Monto Principal × (Porcentaje Total / 100)
  const totalInterestAmount = amount * (totalInterestPercent / 100);
  
  // Total a Pagar = Monto Principal + Monto de Interés
  const totalAmount = amount + totalInterestAmount;
  
  // Cálculo de cuotas según modalidad
  let installments = term;
  if (type === 'semanal') installments = term * 4;
  else if (type === 'quincenal') installments = term * 2;
  
  return Math.ceil(totalAmount / installments);
}

function calculateTotalInterest(amount: number, interestRate: number, term: number): number {
  // Porcentaje de Interés Total = Interés Mensual × Plazo en meses
  const totalInterestPercent = interestRate * term;
  
  // Monto de Interés = Monto Principal × (Porcentaje Total / 100)
  return amount * (totalInterestPercent / 100);
}

const seedLoans: Loan[] = [
  {
    id: 'l1', clientId: 'c1', type: 'semanal', modality: 'efectivo', amount: 10000, interestRate: 45, term: 3,
    installmentAmount: calculateInstallment(10000, 45, 3, 'semanal'),
    totalAmount: 10000 + calculateTotalInterest(10000, 45, 3),
    totalInterest: calculateTotalInterest(10000, 45, 3),
    startDate: '2024-11-01', status: 'activo', assignedCollector: '3',
    payments: [
      { id: 'p1', loanId: 'l1', clientId: 'c1', amount: 1042, method: 'efectivo', date: '2024-11-08', collectorId: '3', receiptNumber: 'R-001', isLate: false, synced: true },
      { id: 'p2', loanId: 'l1', clientId: 'c1', amount: 1042, method: 'efectivo', date: '2024-11-15', collectorId: '3', receiptNumber: 'R-002', isLate: false, synced: true },
      { id: 'p3', loanId: 'l1', clientId: 'c1', amount: 1042, method: 'transferencia', date: '2024-11-22', collectorId: '3', receiptNumber: 'R-003', isLate: false, synced: true },
    ],
    createdAt: '2024-11-01'
  },
  {
    id: 'l2', clientId: 'c2', type: 'quincenal', modality: 'articulo', amount: 26000, interestRate: 45, term: 3,
    installmentAmount: calculateInstallment(26000, 45, 3, 'quincenal'),
    totalAmount: 26000 + calculateTotalInterest(26000, 45, 3),
    totalInterest: calculateTotalInterest(26000, 45, 3),
    startDate: '2024-10-15', status: 'activo', assignedCollector: '3', articleId: 'a2',
    payments: [
      { id: 'p4', loanId: 'l2', clientId: 'c2', amount: 5200, method: 'efectivo', date: '2024-10-30', collectorId: '3', receiptNumber: 'R-004', isLate: false, synced: true },
      { id: 'p5', loanId: 'l2', clientId: 'c2', amount: 5200, method: 'efectivo', date: '2024-11-15', collectorId: '3', receiptNumber: 'R-005', isLate: true, synced: true },
    ],
    createdAt: '2024-10-15'
  },
  {
    id: 'l3', clientId: 'c3', type: 'mensual', modality: 'efectivo', amount: 50000, interestRate: 45, term: 3,
    installmentAmount: calculateInstallment(50000, 45, 3, 'mensual'),
    totalAmount: 50000 + calculateTotalInterest(50000, 45, 3),
    totalInterest: calculateTotalInterest(50000, 45, 3),
    startDate: '2024-09-01', status: 'mora', assignedCollector: '4',
    payments: [
      { id: 'p6', loanId: 'l3', clientId: 'c3', amount: 21875, method: 'efectivo', date: '2024-10-01', collectorId: '4', receiptNumber: 'R-006', isLate: false, synced: true },
    ],
    createdAt: '2024-09-01'
  },
  {
    id: 'l4', clientId: 'c4', type: 'semanal', modality: 'efectivo', amount: 5000, interestRate: 45, term: 2,
    installmentAmount: calculateInstallment(5000, 45, 2, 'semanal'),
    totalAmount: 5000 + calculateTotalInterest(5000, 45, 2),
    totalInterest: calculateTotalInterest(5000, 45, 2),
    startDate: '2024-12-01', status: 'activo', assignedCollector: '4',
    payments: [],
    createdAt: '2024-12-01'
  },
  {
    id: 'l5', clientId: 'c5', type: 'quincenal', modality: 'articulo', amount: 32000, interestRate: 45, term: 4,
    installmentAmount: calculateInstallment(32000, 45, 4, 'quincenal'),
    totalAmount: 32000 + calculateTotalInterest(32000, 45, 4),
    totalInterest: calculateTotalInterest(32000, 45, 4),
    startDate: '2024-08-01', status: 'cancelado', assignedCollector: '3', articleId: 'a3',
    payments: Array.from({ length: 8 }, (_, i) => ({
      id: `p7_${i}`, loanId: 'l5', clientId: 'c5', amount: calculateInstallment(32000, 45, 4, 'quincenal'),
      method: 'efectivo' as PaymentMethod, date: `2024-${String(8 + Math.floor(i/2)).padStart(2,'0')}-${i%2===0?'01':'15'}`,
      collectorId: '3', receiptNumber: `R-${100+i}`, isLate: false, synced: true
    })),
    createdAt: '2024-08-01'
  },
];

const seedRoutes: Route[] = [
  { id: 'r1', name: 'Ruta Centro', collectorId: '3', clientIds: ['c1', 'c2'], active: true, createdAt: '2024-01-01' },
  { id: 'r2', name: 'Ruta Norte', collectorId: '4', clientIds: ['c3', 'c4', 'c6'], active: true, createdAt: '2024-01-01' },
];

const seedCashMovements: CashMovement[] = [
  { id: 'cm1', type: 'ingreso', amount: 3126, description: 'Cobros del día', date: '2024-12-01', userId: '3', category: undefined },
  { id: 'cm2', type: 'egreso', amount: 500, description: 'Gasolina cobradores', date: '2024-12-01', userId: '1', category: 'operativos' },
  { id: 'cm3', type: 'ingreso', amount: 5200, description: 'Cobro quincenal', date: '2024-12-01', userId: '3', category: undefined },
  { id: 'cm4', type: 'egreso', amount: 1500, description: 'Comisiones cobradores', date: '2024-12-01', userId: '1', category: 'comisiones' },
];

// ==================== STORE ====================
interface AppState {
  // Auth
  currentUser: User | null;
  users: User[];
  login: (pin: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Loans
  loans: Loan[];
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'payments' | 'installmentAmount' | 'totalAmount' | 'totalInterest'>) => Loan;
  updateLoan: (id: string, data: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;

  // Payments
  addPayment: (payment: Omit<Payment, 'id' | 'receiptNumber' | 'synced'>) => Payment;

  // Articles
  articles: Article[];
  addArticle: (article: Omit<Article, 'id' | 'createdAt'>) => void;
  updateArticle: (id: string, data: Partial<Article>) => void;
  deleteArticle: (id: string) => void;

  // Cash
  cashMovements: CashMovement[];
  cashRegisters: CashRegister[];
  addCashMovement: (movement: Omit<CashMovement, 'id'>) => void;
  openCashRegister: (openingBalance: number) => void;
  closeCashRegister: () => void;
  getCurrentCashRegister: () => CashRegister | null;

  // Routes
  routes: Route[];
  addRoute: (route: Omit<Route, 'id' | 'createdAt'>) => void;
  updateRoute: (id: string, data: Partial<Route>) => void;

  // Payroll
  payrolls: Payroll[];
  generatePayroll: (userId: string, period: string, baseSalary: number) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleDarkMode: () => void;

  // Helpers
  getClientsByCollector: (collectorId: string) => Client[];
  getLoansByClient: (clientId: string) => Loan[];
  getActiveLoans: () => Loan[];
  getOverdueLoans: () => Loan[];
  getPaymentsByDate: (date: string) => Payment[];
  getCommissionRate: () => number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      currentUser: null,
      users: seedUsers,
      login: (pin: string) => {
        const user = get().users.find(u => u.pin === pin && u.active);
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },
      logout: () => set({ currentUser: null }),
      addUser: (user) => set(state => ({
        users: [...state.users, { ...user, id: uuidv4(), createdAt: new Date().toISOString().split('T')[0] }]
      })),
      updateUser: (id, data) => set(state => ({
        users: state.users.map(u => u.id === id ? { ...u, ...data } : u)
      })),
      deleteUser: (id) => set(state => ({
        users: state.users.filter(u => u.id !== id)
      })),

      // Clients
      clients: seedClients,
      addClient: (client) => set(state => ({
        clients: [...state.clients, { ...client, id: uuidv4(), createdAt: new Date().toISOString().split('T')[0] }]
      })),
      updateClient: (id, data) => set(state => ({
        clients: state.clients.map(c => c.id === id ? { ...c, ...data } : c)
      })),
      deleteClient: (id) => set(state => ({
        clients: state.clients.filter(c => c.id !== id)
      })),

      // Loans
      loans: seedLoans,
      addLoan: (loanData) => {
        const installmentAmount = calculateInstallment(loanData.amount, loanData.interestRate, loanData.term, loanData.type);
        const totalInterest = calculateTotalInterest(loanData.amount, loanData.interestRate, loanData.term);
        const totalAmount = loanData.amount + totalInterest;
        const newLoan: Loan = {
          ...loanData,
          id: uuidv4(),
          installmentAmount,
          totalAmount,
          totalInterest,
          payments: [],
          createdAt: new Date().toISOString().split('T')[0],
        };
        set(state => ({ loans: [...state.loans, newLoan] }));
        return newLoan;
      },
      updateLoan: (id, data) => set(state => ({
        loans: state.loans.map(l => l.id === id ? { ...l, ...data } : l)
      })),
      deleteLoan: (id) => set(state => ({
        loans: state.loans.filter(l => l.id !== id)
      })),

      // Payments
      addPayment: (paymentData) => {
        const allPayments = get().loans.flatMap(l => l.payments);
        const receiptNumber = `R-${String(allPayments.length + 1).padStart(4, '0')}`;
        const payment: Payment = {
          ...paymentData,
          id: uuidv4(),
          receiptNumber,
          synced: false,
        };
        set(state => {
          const updatedLoans = state.loans.map(l => {
            if (l.id === paymentData.loanId) {
              const updatedPayments = [...l.payments, payment];
              const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
              const status: LoanStatus = totalPaid >= l.totalAmount ? 'cancelado' : l.status;
              return { ...l, payments: updatedPayments, status };
            }
            return l;
          });
          return { loans: updatedLoans };
        });
        return payment;
      },

      // Articles
      articles: seedArticles,
      addArticle: (article) => set(state => ({
        articles: [...state.articles, { ...article, id: uuidv4(), createdAt: new Date().toISOString().split('T')[0] }]
      })),
      updateArticle: (id, data) => set(state => ({
        articles: state.articles.map(a => a.id === id ? { ...a, ...data } : a)
      })),
      deleteArticle: (id) => set(state => ({
        articles: state.articles.filter(a => a.id !== id)
      })),

      // Cash
      cashMovements: seedCashMovements,
      cashRegisters: [],
      addCashMovement: (movement) => set(state => ({
        cashMovements: [...state.cashMovements, { ...movement, id: uuidv4() }]
      })),
      openCashRegister: (openingBalance) => {
        const today = new Date().toISOString().split('T')[0];
        const register: CashRegister = {
          id: uuidv4(),
          date: today,
          openingBalance,
          totalIncome: 0,
          totalExpenses: 0,
          closed: false,
        };
        set(state => ({ cashRegisters: [...state.cashRegisters, register] }));
      },
      closeCashRegister: () => {
        set(state => {
          const registers = [...state.cashRegisters];
          const open = registers.find(r => !r.closed);
          if (open) {
            open.closed = true;
            open.closingBalance = open.openingBalance + open.totalIncome - open.totalExpenses;
            open.closedBy = state.currentUser?.id;
            open.closedAt = new Date().toISOString();
          }
          return { cashRegisters: registers };
        });
      },
      getCurrentCashRegister: () => {
        return get().cashRegisters.find(r => !r.closed) || null;
      },

      // Routes
      routes: seedRoutes,
      addRoute: (route) => set(state => ({
        routes: [...state.routes, { ...route, id: uuidv4(), createdAt: new Date().toISOString().split('T')[0] }]
      })),
      updateRoute: (id, data) => set(state => ({
        routes: state.routes.map(r => r.id === id ? { ...r, ...data } : r)
      })),

      // Payroll
      payrolls: [],
      generatePayroll: (userId, period, baseSalary) => {
        const state = get();
        const userPayments = state.loans
          .filter(l => l.assignedCollector === userId)
          .flatMap(l => l.payments.filter(p => p.collectorId === userId && p.date.startsWith(period)));
        const totalCollected = userPayments.reduce((sum, p) => sum + p.amount, 0);
        const commissionRate = 0.05; // 5%
        const commissions = totalCollected * commissionRate;

        const payroll: Payroll = {
          id: uuidv4(),
          userId,
          period,
          baseSalary,
          commissions: Math.round(commissions),
          overtime: 0,
          bonuses: 0,
          deductions: 0,
          total: baseSalary + Math.round(commissions),
          paid: false,
        };
        set(state => ({ payrolls: [...state.payrolls, payroll] }));
      },

      // Notifications
      notifications: [],
      addNotification: (type, message) => {
        const notification: Notification = {
          id: uuidv4(),
          type,
          message,
          timestamp: Date.now(),
        };
        set(state => ({ notifications: [...state.notifications, notification] }));
        setTimeout(() => {
          set(state => ({ notifications: state.notifications.filter(n => n.id !== notification.id) }));
        }, 4000);
      },
      removeNotification: (id) => set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

      // Settings
      settings: {
        darkMode: false,
        companyName: 'YaraCredit',
        companyRnc: '000-00000-0',
        companyAddress: 'Dirección de la empresa',
        companyPhone: '0000-0000',
        currency: 'C$',
        defaultInterestRate: 14,
        defaultTerm: 3,
        thermalSize: '50mm',
        commissionRate: 5,
        lateFeePercent: 2,
        gracePeriodDays: 3,
        whatsappMessageTemplate: 'Hola {cliente}, le recordamos que tiene un pago pendiente de {monto} para hoy. Gracias por su preferencia.',
        receiptHeader: 'YARACREDIT - Sistema de Préstamos',
        receiptFooter: '¡Gracias por su pago!',
        autoBackup: true,
        notificationsEnabled: true,
      },
      updateSettings: (newSettings) => set(state => ({
        settings: { ...state.settings, ...newSettings }
      })),
      toggleDarkMode: () => set(state => {
        const newDarkMode = !state.settings.darkMode;
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { settings: { ...state.settings, darkMode: newDarkMode } };
      }),

      // Helpers
      getClientsByCollector: (collectorId) => {
        const state = get();
        const clientIds = state.routes
          .filter(r => r.collectorId === collectorId)
          .flatMap(r => r.clientIds);
        return state.clients.filter(c => clientIds.includes(c.id));
      },
      getLoansByClient: (clientId) => {
        return get().loans.filter(l => l.clientId === clientId);
      },
      getActiveLoans: () => {
        return get().loans.filter(l => l.status === 'activo' || l.status === 'mora');
      },
      getOverdueLoans: () => {
        return get().loans.filter(l => l.status === 'mora');
      },
      getPaymentsByDate: (date) => {
        return get().loans.flatMap(l => l.payments.filter(p => p.date === date));
      },
      getCommissionRate: () => 0.05,
    }),
    {
      name: 'yaracredit-storage',
    }
  )
);
