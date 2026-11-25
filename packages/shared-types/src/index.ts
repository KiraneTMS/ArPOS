// ==========================================
// ArPOS Core Domain Types & Module Registry
// ==========================================

// --- Module Registry & Licensing ---
export type ModuleId =
  | 'core'
  | 'cashier_pos'
  | 'order_management'
  | 'payment_management'
  | 'cashier_shifts'
  | 'cash_management'
  | 'settlement'
  | 'reporting'
  | 'kitchen_display'
  | 'inventory'
  | 'staff'
  | 'qr_ordering';

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  category: 'core' | 'operations' | 'finance' | 'kitchen' | 'customer';
  isCore: boolean;
  requiredDependencies: ModuleId[];
  optionalDependencies: ModuleId[];
  defaultEnabled: boolean;
  icon: string;
}

export interface RestaurantModule {
  id: string;
  restaurantId: string;
  moduleId: ModuleId;
  isEnabled: boolean;
  settings?: Record<string, any>;
  enabledAt: string;
  updatedAt: string;
}

// --- Tenant & Branch ---
export interface Restaurant {
  id: string;
  code: string;
  name: string;
  legalName?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency: string; // e.g. "IDR", "USD"
  currencySymbol: string; // e.g. "Rp", "$"
  timezone: string;
  settings: RestaurantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantSettings {
  taxRatePercent: number; // e.g. 11 for 11% PB1/PPN
  taxEnabled: boolean;
  serviceChargePercent: number; // e.g. 5 for 5% service charge
  serviceChargeEnabled: boolean;
  allowSplitBill: boolean;
  allowOfflineOrders: boolean;
  blindShiftClosing: boolean; // Cashier doesn't see expected cash before counting
  receiptHeader?: string;
  receiptFooter?: string;
}

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

// --- Identity & RBAC ---
export type RoleName = 'owner' | 'administrator' | 'manager' | 'cashier' | 'kitchen_staff' | 'kitchen_manager';

export interface Role {
  id: string;
  restaurantId: string;
  name: RoleName;
  displayName: string;
  description: string;
  permissions: string[];
}

export interface User {
  id: string;
  restaurantId: string;
  branchId?: string;
  email: string;
  name: string;
  role: RoleName;
  pinCode?: string; // 4-6 digit quick PIN for POS register switching
  isActive: boolean;
  createdAt: string;
}

// --- Catalog ---
export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ModifierOption {
  id: string;
  modifierId: string;
  name: string;
  priceDelta: number; // In base units (e.g. Rupiah: +5000)
  isDefault: boolean;
}

export interface Modifier {
  id: string;
  restaurantId: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string; // e.g. "Regular", "Large"
  sku?: string;
  price: number; // In smallest currency unit (e.g. IDR whole number)
  isAvailable: boolean;
}

export interface Product {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  image?: string;
  basePrice: number; // in IDR/currency unit
  isAvailable: boolean;
  kitchenStationId?: string;
  variants: ProductVariant[];
  modifierIds: string[];
}

// --- Cart & Orders ---
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type OrderStatus = 'pending' | 'in_kitchen' | 'ready' | 'completed' | 'cancelled';
export type OrderSource = 'pos_cashier' | 'kds_manual' | 'qr_customer' | 'external_delivery';

export interface SelectedModifier {
  modifierId: string;
  modifierName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number; // (unitPrice + modifiers) * quantity
  notes?: string;
  modifiers: SelectedModifier[];
  kitchenStatus?: 'pending' | 'preparing' | 'ready' | 'served';
}

export interface Order {
  id: string;
  restaurantId: string;
  branchId: string;
  shiftId?: string;
  cashierId?: string;
  orderNumber: string; // e.g. "ORD-20261126-001"
  tableNumber?: string;
  customerName?: string;
  orderType: OrderType;
  orderSource: OrderSource;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'paid' | 'partially_paid' | 'refunded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// --- Payments ---
export type PaymentMethod = 'cash' | 'qris' | 'debit_card' | 'credit_card' | 'bank_transfer' | 'digital_wallet';

export interface Payment {
  id: string;
  orderId: string;
  restaurantId: string;
  branchId: string;
  shiftId?: string;
  method: PaymentMethod;
  amount: number;
  tenderedAmount?: number; // Cash handed over (e.g. 100,000 for 85,000 bill)
  changeAmount?: number;   // Change returned (e.g. 15,000)
  referenceNumber?: string; // Card approval code / QRIS Ref ID
  status: 'successful' | 'failed' | 'refunded';
  createdAt: string;
}

// --- Cashier Shifts & Cash Drawer Reconciliation ---
export type ShiftStatus = 'open' | 'closed' | 'reviewed';

export interface CashierShift {
  id: string;
  restaurantId: string;
  branchId: string;
  cashierId: string;
  cashierName: string;
  deviceCode: string;
  status: ShiftStatus;
  openedAt: string;
  closedAt?: string;
  
  // Financial numbers (all integer amounts)
  openingCash: number;        // Starting cash float
  cashSales: number;          // Total cash collected from completed orders
  totalCashIn: number;        // Extra cash deposited into drawer
  totalCashOut: number;       // Petty cash paid out (e.g. ice, groceries)
  totalCashRefunds: number;   // Cash refunded to customers
  totalCashDrops: number;     // Cash swept into safe during the day
  
  expectedCash: number;       // Opening + Sales + In - Out - Refunds - Drops
  actualCash?: number;        // Physical count entered by cashier at shift close
  discrepancy?: number;       // actualCash - expectedCash (negative = shortage, positive = overage)
  
  closingNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type CashMovementType = 'cash_in' | 'cash_out' | 'cash_drop' | 'petty_cash';

export interface CashMovement {
  id: string;
  shiftId: string;
  restaurantId: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  authorizedBy?: string;
  createdAt: string;
}

// --- Kitchen Display System (KDS) ---
export type KitchenTicketStatus = 'queued' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface KitchenStation {
  id: string;
  restaurantId: string;
  name: string; // e.g. "Main Kitchen", "Grill & Fryer", "Bar / Beverages"
  code: string;
}

export interface KitchenTicketItem {
  id: string;
  ticketId: string;
  orderItemId: string;
  productName: string;
  variantName?: string;
  quantity: number;
  notes?: string;
  modifiersSummary?: string;
  status: 'pending' | 'cooking' | 'done';
}

export interface KitchenTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  orderType: OrderType;
  source: OrderSource;
  status: KitchenTicketStatus;
  items: KitchenTicketItem[];
  stationId?: string;
  createdAt: string;
  startedAt?: string;
  readyAt?: string;
  elapsedSeconds?: number;
}
