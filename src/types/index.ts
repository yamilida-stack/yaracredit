// ==================== ROLES & AUTH ====================
export type Role = 'admin' | 'gerente' | 'cobrador' | 'solo_lectura';

export interface User {
  id: string;
  name: string;
  pin: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

// ==================== CLIENTES ====================
export interface Client {
  id: string;
  fullName: string;
  cedula: string;
  address: string;
  phone: string;
  whatsapp: string;
  email?: string;
  guarantor?: string;
  guarantorPhone?: string;
  lat?: number;
  lng?: number;
  occupation?: string;
  monthlyIncome?: number;
  references?: string;
  observations?: string;
  riskLevel?: 'bajo' | 'medio' | 'alto';
  createdAt: string;
  notes?: string;
}

// ==================== PRÉSTAMOS ====================
export type LoanType = 'semanal' | 'quincenal' | 'mensual';
export type LoanModality = 'efectivo' | 'articulo';
export type LoanStatus = 'activo' | 'cancelado' | 'mora' | 'refinanciado';

export interface Loan {
  id: string;
  clientId: string;
  type: LoanType;
  modality: LoanModality;
  amount: number;
  interestRate: number; // porcentaje mensual
  term: number; // número de cuotas
  installmentAmount: number;
  totalAmount: number;
  totalInterest: number;
  startDate: string;
  endDate?: string;
  status: LoanStatus;
  assignedCollector?: string;
  articleId?: string;
  articleSerial?: string;
  guarantees?: string[];
  payments: Payment[];
  observations?: string;
  purpose?: string;
  lateFeeApplied?: number;
  createdAt: string;
  notes?: string;
}

// ==================== PAGOS ====================
export type PaymentMethod = 'efectivo' | 'transferencia';

export interface Payment {
  id: string;
  loanId: string;
  clientId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  collectorId: string;
  receiptNumber: string;
  isLate: boolean;
  lat?: number;
  lng?: number;
  synced: boolean;
}

// ==================== STOCK ====================
export interface Article {
  id: string;
  name: string;
  description: string;
  category: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
  minStock: number;
  serialNumber?: string;
  imei?: string;
  brand?: string;
  model?: string;
  observations?: string;
  createdAt: string;
}

// ==================== CONFIG ====================
export interface AppSettings {
  darkMode: boolean;
  companyName: string;
  companyRnc: string;
  companyAddress: string;
  companyPhone: string;
  companyLogo?: string;
  currency: string;
  defaultInterestRate: number;
  defaultTerm: number;
  thermalSize: '50mm' | '80mm';
  commissionRate: number;
  lateFeePercent: number;
  gracePeriodDays: number;
  whatsappMessageTemplate: string;
  receiptHeader: string;
  receiptFooter: string;
  autoBackup: boolean;
  notificationsEnabled: boolean;
}

// ==================== CAJA ====================
export type CashMovementType = 'ingreso' | 'egreso';
export type ExpenseCategory = 'planilla' | 'comisiones' | 'bonos' | 'depreciacion' | 'operativos' | 'otros';

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number;
  description: string;
  category?: ExpenseCategory;
  date: string;
  userId: string;
  relatedPaymentId?: string;
}

export interface CashRegister {
  id: string;
  date: string;
  openingBalance: number;
  closingBalance?: number;
  totalIncome: number;
  totalExpenses: number;
  closed: boolean;
  closedBy?: string;
  closedAt?: string;
}

// ==================== RUTAS ====================
export interface Route {
  id: string;
  name: string;
  collectorId: string;
  clientIds: string[];
  active: boolean;
  createdAt: string;
}

// ==================== PLANILLA ====================
export interface Payroll {
  id: string;
  userId: string;
  period: string;
  baseSalary: number;
  commissions: number;
  overtime: number;
  bonuses: number;
  deductions: number;
  total: number;
  paid: boolean;
  paidAt?: string;
}

// ==================== DASHBOARD ====================
export interface DashboardKPIs {
  totalPortfolio: number;
  activeLoans: number;
  overdueLoans: number;
  collectedToday: number;
  collectedThisWeek: number;
  collectedThisMonth: number;
  overdueRate: number;
  cashBalance: number;
}

// ==================== RECEIPT ====================
export interface Receipt {
  id: string;
  paymentId: string;
  loanId: string;
  clientId: string;
  amount: number;
  receiptNumber: string;
  date: string;
  collectorName: string;
  clientName: string;
  remainingBalance: number;
  thermalSize: '50mm' | '80mm';
}

// ==================== NOTIFICATIONS ====================
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
}
