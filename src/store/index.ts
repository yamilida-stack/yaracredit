import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  User, Client, Loan, Payment, Article, CashMovement, CashRegister,
  Route, Payroll, Notification, Role, LoanType, LoanModality,
  LoanStatus, PaymentMethod, ExpenseCategory, AppSettings
} from '../types';

// ==================== STORE LIMPIO - SIN DATOS DE EJEMPLO ====================
// Todos los datos se cargan desde Supabase en tiempo real

// --- FUNCIÓN DE CÁLCULO EXACTA DEL MODELO EXCEL/VBA ---
interface CalculoPrestamoParams {
  montoSinInteres: number; // Principal prestado
  tasaMensualPct: number;  // Ej: 15 para 15%
  plazoMeses: number;      // Ej: 3 meses
  frecuencia: 'semanal' | 'quincenal' | 'mensual';
}

function calcularPrestamo({
  montoSinInteres,
  tasaMensualPct,
  plazoMeses,
  frecuencia
}: CalculoPrestamoParams) {
  const principal = Number(montoSinInteres) || 0;
  const meses = Number(plazoMeses) || 0;
  const tasaMensualDecimal = (Number(tasaMensualPct) || 0) / 100;

  // 1. Ganancia total de interés (Monto Interés)
  // Fórmula: Principal * Tasa Mensual * Plazo en Meses
  const montoInteresTotal = principal * tasaMensualDecimal * meses;

  // 2. Monto Con Interés (Total a Pagar)
  const montoConInteres = principal + montoInteresTotal;

  // 3. Tasa Total del Período (Formato Texto para UI/Reportes)
  const tasaTotalPorcentaje = (tasaMensualDecimal * meses) * 100;
  const etiquetaTasa = `${tasaMensualPct}% MES (${tasaTotalPorcentaje}% TOTAL)`;

  // 4. Determinación de Cuotas
  let totalCuotas = meses;
  if (frecuencia === 'semanal') totalCuotas = meses * 4;
  if (frecuencia === 'quincenal') totalCuotas = meses * 2;

  // CUOTAS EN NÚMEROS ENTEROS
  const valorCuota = totalCuotas > 0 ? Math.round(montoConInteres / totalCuotas) : 0;

  return {
    montoSinInteres: principal,
    montoConInteres,
    montoInteresTotal,
    tasaTotalPorcentaje,
    etiquetaTasa,
    totalCuotas,
    valorCuota
  };
}

// Calculate loan installments - MODELO EXCEL/VBA (CUOTAS ENTERAS)
function calculateInstallment(amount: number, interestRate: number, term: number, type: LoanType): number {
  // Usar la función exacta del modelo Excel/VBA
  const { valorCuota } = calcularPrestamo({
    montoSinInteres: amount,
    tasaMensualPct: interestRate,
    plazoMeses: term,
    frecuencia: type
  });
  
  // REDONDEAR A NÚMERO ENTERO (hacia arriba para no perder dinero)
  return Math.ceil(valorCuota);
}

function calculateTotalInterest(amount: number, interestRate: number, term: number, type: LoanType = 'mensual'): number {
  // Usar la función exacta del modelo Excel/VBA
  const { montoInteresTotal } = calcularPrestamo({
    montoSinInteres: amount,
    tasaMensualPct: interestRate,
    plazoMeses: term,
    frecuencia: type
  });
  return montoInteresTotal;
}

function calculateTotalAmount(amount: number, interestRate: number, term: number, type: LoanType = 'mensual'): number {
  // Usar la función exacta del modelo Excel/VBA
  const { montoConInteres } = calcularPrestamo({
    montoSinInteres: amount,
    tasaMensualPct: interestRate,
    plazoMeses: term,
    frecuencia: type
  });
  return montoConInteres;
}

// Todos los datos se cargan desde Supabase - Arrays vacíos

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
  (set, get) => ({
      // Auth
      currentUser: null,
      users: [],
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
      clients: [],
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
      loans: [],
      addLoan: (loanData) => {
        const installmentAmount = calculateInstallment(loanData.amount, loanData.interestRate, loanData.term, loanData.type);
        const totalInterest = calculateTotalInterest(loanData.amount, loanData.interestRate, loanData.term, loanData.type);
        const totalAmount = calculateTotalAmount(loanData.amount, loanData.interestRate, loanData.term, loanData.type);
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
      articles: [],
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
      cashMovements: [],
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
      routes: [],
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
    })
);
