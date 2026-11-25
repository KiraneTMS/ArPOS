import type {
  ModuleDefinition,
  ModuleId,
  OrderItem,
  RestaurantSettings,
} from '@arpos/shared-types';

// ==========================================
// 1. MODULE REGISTRY & DEPENDENCY ENGINE
// ==========================================

export const SYSTEM_MODULES: ModuleDefinition[] = [
  {
    id: 'core',
    name: 'Core Platform',
    description: 'Tenant records, authentication, RBAC, device registry, and audit logging.',
    category: 'core',
    isCore: true,
    requiredDependencies: [],
    optionalDependencies: [],
    defaultEnabled: true,
    icon: 'ShieldCheck'
  },
  {
    id: 'order_management',
    name: 'Order Management',
    description: 'Order lifecycle, status tracking, cancellations, refunds, and routing.',
    category: 'operations',
    isCore: false,
    requiredDependencies: ['core'],
    optionalDependencies: [],
    defaultEnabled: true,
    icon: 'Receipt'
  },
  {
    id: 'payment_management',
    name: 'Payment Management',
    description: 'Payment methods (Cash, QRIS, Cards), split payments, and provider references.',
    category: 'finance',
    isCore: false,
    requiredDependencies: ['core', 'order_management'],
    optionalDependencies: [],
    defaultEnabled: true,
    icon: 'CreditCard'
  },
  {
    id: 'cashier_pos',
    name: 'Cashier POS Terminal',
    description: 'Product catalog browsing, modifiers, cart, dine-in/takeaway, and receipts.',
    category: 'operations',
    isCore: false,
    requiredDependencies: ['core', 'order_management', 'payment_management'],
    optionalDependencies: ['cashier_shifts', 'kitchen_display'],
    defaultEnabled: true,
    icon: 'ShoppingCart'
  },
  {
    id: 'cashier_shifts',
    name: 'Cashier & Shift Management',
    description: 'Shift opening, opening cash float, cashier assignment, and blind closing.',
    category: 'operations',
    isCore: false,
    requiredDependencies: ['core', 'cashier_pos'],
    optionalDependencies: ['cash_management', 'settlement'],
    defaultEnabled: true,
    icon: 'Clock'
  },
  {
    id: 'cash_management',
    name: 'Cash Drawer Management',
    description: 'Cash in, cash out, petty cash payouts, cash drops to safe, and cash audit trail.',
    category: 'finance',
    isCore: false,
    requiredDependencies: ['core', 'cashier_shifts'],
    optionalDependencies: ['settlement'],
    defaultEnabled: true,
    icon: 'Wallet'
  },
  {
    id: 'settlement',
    name: 'Settlement & Reconciliation',
    description: 'Expected vs actual cash reconciliation, payment discrepancies, and manager sign-off.',
    category: 'finance',
    isCore: false,
    requiredDependencies: ['core', 'payment_management', 'cashier_shifts', 'cash_management'],
    optionalDependencies: ['reporting'],
    defaultEnabled: true,
    icon: 'Scale'
  },
  {
    id: 'kitchen_display',
    name: 'Kitchen Display System (KDS)',
    description: 'Realtime preparation queues, station routing, and kitchen order progress.',
    category: 'kitchen',
    isCore: false,
    requiredDependencies: ['core', 'order_management'],
    optionalDependencies: [],
    defaultEnabled: true,
    icon: 'ChefHat'
  },
  {
    id: 'reporting',
    name: 'Reporting & Analytics',
    description: 'Sales summaries, product performance, shift reports, and cashier analytics.',
    category: 'finance',
    isCore: false,
    requiredDependencies: ['core', 'order_management'],
    optionalDependencies: ['settlement'],
    defaultEnabled: true,
    icon: 'BarChart3'
  },
  {
    id: 'inventory',
    name: 'Inventory & Stock Management',
    description: 'Ingredients, recipe deductions, stock movements, and low stock warnings.',
    category: 'operations',
    isCore: false,
    requiredDependencies: ['core'],
    optionalDependencies: ['order_management'],
    defaultEnabled: false,
    icon: 'Boxes'
  },
  {
    id: 'staff',
    name: 'Staff & Shift Scheduling',
    description: 'Employee roles, granular permissions, PIN codes, and activity history.',
    category: 'operations',
    isCore: false,
    requiredDependencies: ['core'],
    optionalDependencies: [],
    defaultEnabled: false,
    icon: 'Users'
  },
  {
    id: 'qr_ordering',
    name: 'QR / Table Self-Ordering',
    description: 'Customer digital menu, table QR scanning, and direct order ingestion.',
    category: 'customer',
    isCore: false,
    requiredDependencies: ['core', 'order_management'],
    optionalDependencies: ['kitchen_display'],
    defaultEnabled: false,
    icon: 'QrCode'
  }
];

export function getModuleDefinition(moduleId: ModuleId): ModuleDefinition | undefined {
  return SYSTEM_MODULES.find((m) => m.id === moduleId);
}

/**
 * Validates if a module can be safely enabled given the currently enabled modules.
 * Returns { valid: boolean, missingDependencies: ModuleId[] }
 */
export function validateModuleDependencies(
  enabledModuleIds: ModuleId[],
  targetModuleId: ModuleId
): { valid: boolean; missingDependencies: ModuleId[] } {
  const mod = getModuleDefinition(targetModuleId);
  if (!mod) {
    return { valid: false, missingDependencies: [] };
  }

  const missing = mod.requiredDependencies.filter((dep) => !enabledModuleIds.includes(dep));
  return {
    valid: missing.length === 0,
    missingDependencies: missing
  };
}

/**
 * Checks which currently enabled modules would be broken if `moduleToDisable` is turned off.
 */
export function getDependentModules(
  enabledModuleIds: ModuleId[],
  moduleToDisable: ModuleId
): ModuleId[] {
  return enabledModuleIds.filter((id) => {
    const def = getModuleDefinition(id);
    return def?.requiredDependencies.includes(moduleToDisable);
  });
}

// ==========================================
// 2. CASH DRAWER & SHIFT RECONCILIATION MATH
// ==========================================

export interface ShiftCashInput {
  openingCash: number;
  cashSales: number;
  totalCashIn: number;
  totalCashOut: number;
  totalCashRefunds: number;
  totalCashDrops: number;
}

/**
 * Formula from Section 10.2:
 * Expected cash = Opening cash + Cash sales + Cash in − Cash out − Cash refunds − Cash drops
 */
export function calculateExpectedCash(input: ShiftCashInput): number {
  const { openingCash, cashSales, totalCashIn, totalCashOut, totalCashRefunds, totalCashDrops } = input;
  return openingCash + cashSales + totalCashIn - totalCashOut - totalCashRefunds - totalCashDrops;
}

/**
 * Calculate discrepancy between physical cash counted and expected cash:
 * Discrepancy = Actual - Expected
 * > 0: Overage (more cash in drawer than recorded)
 * < 0: Shortage (less cash in drawer than recorded)
 * = 0: Perfect balance
 */
export function calculateDiscrepancy(expectedCash: number, actualCash: number): {
  discrepancy: number;
  status: 'exact' | 'overage' | 'shortage';
} {
  const discrepancy = actualCash - expectedCash;
  if (discrepancy === 0) return { discrepancy: 0, status: 'exact' };
  if (discrepancy > 0) return { discrepancy, status: 'overage' };
  return { discrepancy, status: 'shortage' };
}

// ==========================================
// 3. ORDER FINANCIAL TOTALS ENGINE
// ==========================================

export function calculateOrderTotals(
  items: OrderItem[],
  settings: RestaurantSettings,
  discountAmount: number = 0
): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  serviceChargeAmount: number;
  taxAmount: number;
  totalAmount: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const netSubtotal = Math.max(0, subtotal - discountAmount);

  let serviceChargeAmount = 0;
  if (settings.serviceChargeEnabled && settings.serviceChargePercent > 0) {
    serviceChargeAmount = Math.round((netSubtotal * settings.serviceChargePercent) / 100);
  }

  let taxAmount = 0;
  if (settings.taxEnabled && settings.taxRatePercent > 0) {
    // Tax is typically calculated on (netSubtotal + serviceCharge)
    const baseForTax = netSubtotal + serviceChargeAmount;
    taxAmount = Math.round((baseForTax * settings.taxRatePercent) / 100);
  }

  const totalAmount = netSubtotal + serviceChargeAmount + taxAmount;

  return {
    subtotal,
    discountAmount,
    taxableAmount: netSubtotal + serviceChargeAmount,
    serviceChargeAmount,
    taxAmount,
    totalAmount
  };
}

// ==========================================
// 4. FORMATTERS & ID GENERATION
// ==========================================

export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  if (currency === 'IDR') {
    return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function generateOrderNumber(prefix = 'ORD'): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomSuffix}`;
}
