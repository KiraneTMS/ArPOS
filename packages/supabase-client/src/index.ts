import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  CashierShift,
  CashMovement,
  Category,
  KitchenTicket,
  ModuleId,
  Order,
  OrderItem,
  Payment,
  PaymentMethod,
  Product,
  Restaurant,
  ShiftCashInput,
} from '@arpos/shared-types';
import {
  calculateDiscrepancy,
  calculateExpectedCash,
  calculateOrderTotals,
  generateOrderNumber,
  validateModuleDependencies,
} from '@arpos/utilities';
import {
  DEMO_CATEGORIES,
  DEMO_MODULES,
  DEMO_PRODUCTS,
  DEMO_RESTAURANT,
  INITIAL_DEMO_SHIFT,
} from './seed-data';

export * from './seed-data';

// --- State Store Keys for Browser Persistence ---
const STORAGE_PREFIX = 'arpos_';

export class ArPosClient {
  private supabase: SupabaseClient | null = null;
  private isLiveMode = false;

  constructor() {
    this.initSupabase();
  }

  public initSupabase(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL);
    const key = supabaseKey || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY);

    if (url && key && url.startsWith('http')) {
      try {
        this.supabase = createClient(url, key);
        this.isLiveMode = true;
      } catch (err) {
        console.warn('Could not initialize live Supabase, running in local/demo mode:', err);
        this.isLiveMode = false;
      }
    } else {
      this.isLiveMode = false;
    }
  }

  public isUsingLiveSupabase(): boolean {
    return this.isLiveMode;
  }

  // --- Local / Offline State Helpers ---
  private getItem<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  }

  // ==========================================
  // MODULE REGISTRY OPERATIONS
  // ==========================================

  public getEnabledModules(): ModuleId[] {
    return this.getItem<ModuleId[]>('enabled_modules', DEMO_MODULES);
  }

  public toggleModule(moduleId: ModuleId): { success: boolean; message?: string } {
    const current = this.getEnabledModules();
    const isCurrentlyEnabled = current.includes(moduleId);

    if (isCurrentlyEnabled) {
      if (moduleId === 'core') {
        return { success: false, message: 'Core platform module cannot be disabled.' };
      }
      const updated = current.filter((m) => m !== moduleId);
      this.setItem('enabled_modules', updated);
      return { success: true };
    } else {
      // Check dependencies
      const validation = validateModuleDependencies(current, moduleId);
      if (!validation.valid) {
        return {
          success: false,
          message: `Cannot enable: requires ${validation.missingDependencies.join(', ')}`
        };
      }
      this.setItem('enabled_modules', [...current, moduleId]);
      return { success: true };
    }
  }

  public isModuleEnabled(moduleId: ModuleId): boolean {
    return this.getEnabledModules().includes(moduleId);
  }

  // ==========================================
  // RESTAURANT SETTINGS & CATALOG
  // ==========================================

  public getRestaurant(): Restaurant {
    return this.getItem<Restaurant>('restaurant', DEMO_RESTAURANT);
  }

  public getCategories(): Category[] {
    return this.getItem<Category[]>('categories', DEMO_CATEGORIES);
  }

  public getProducts(): Product[] {
    return this.getItem<Product[]>('products', DEMO_PRODUCTS);
  }

  // ==========================================
  // CASHIER SHIFT & CASH DRAWER OPERATIONS
  // ==========================================

  public getCurrentShift(): CashierShift | null {
    return this.getItem<CashierShift | null>('current_shift', INITIAL_DEMO_SHIFT);
  }

  public openShift(cashierName: string, openingCash: number): CashierShift {
    const newShift: CashierShift = {
      id: 'shift-' + Date.now(),
      restaurantId: DEMO_RESTAURANT.id,
      branchId: 'br-demo-01',
      cashierId: 'user-' + Date.now(),
      cashierName,
      deviceCode: 'POS-TERM-01',
      status: 'open',
      openedAt: new Date().toISOString(),
      openingCash,
      cashSales: 0,
      totalCashIn: 0,
      totalCashOut: 0,
      totalCashRefunds: 0,
      totalCashDrops: 0,
      expectedCash: openingCash
    };
    this.setItem('current_shift', newShift);
    return newShift;
  }

  public recordCashMovement(
    type: 'cash_in' | 'cash_out' | 'cash_drop' | 'petty_cash',
    amount: number,
    reason: string
  ): { movement: CashMovement; updatedShift: CashierShift } {
    const shift = this.getCurrentShift();
    if (!shift || shift.status !== 'open') {
      throw new Error('No open cashier shift found.');
    }

    const movement: CashMovement = {
      id: 'cm-' + Date.now(),
      shiftId: shift.id,
      restaurantId: shift.restaurantId,
      type,
      amount,
      reason,
      createdAt: new Date().toISOString()
    };

    // Update shift numbers
    if (type === 'cash_in') shift.totalCashIn += amount;
    if (type === 'cash_out' || type === 'petty_cash') shift.totalCashOut += amount;
    if (type === 'cash_drop') shift.totalCashDrops += amount;

    shift.expectedCash = calculateExpectedCash(shift);
    this.setItem('current_shift', shift);

    const movements = this.getItem<CashMovement[]>('cash_movements', []);
    this.setItem('cash_movements', [movement, ...movements]);

    return { movement, updatedShift: shift };
  }

  public closeShift(actualCountedCash: number, notes?: string): CashierShift {
    const shift = this.getCurrentShift();
    if (!shift) throw new Error('No open shift to close.');

    shift.expectedCash = calculateExpectedCash(shift);
    shift.actualCash = actualCountedCash;
    const { discrepancy } = calculateDiscrepancy(shift.expectedCash, actualCountedCash);
    shift.discrepancy = discrepancy;
    shift.status = 'closed';
    shift.closedAt = new Date().toISOString();
    shift.closingNotes = notes;

    this.setItem('current_shift', shift);

    // Save into shift history
    const history = this.getItem<CashierShift[]>('shift_history', []);
    this.setItem('shift_history', [shift, ...history]);

    return shift;
  }

  // ==========================================
  // ORDER & PAYMENT PROCESSING
  // ==========================================

  public createOrderAndPay(
    items: OrderItem[],
    orderType: 'dine_in' | 'takeaway',
    tableNumber: string | undefined,
    paymentMethod: PaymentMethod,
    tenderedAmount?: number
  ): { order: Order; payment: Payment; ticket?: KitchenTicket } {
    const restaurant = this.getRestaurant();
    const shift = this.getCurrentShift();
    const totals = calculateOrderTotals(items, restaurant.settings);

    const orderId = 'ord-' + Date.now();
    const orderNumber = generateOrderNumber();

    const order: Order = {
      id: orderId,
      restaurantId: restaurant.id,
      branchId: 'br-demo-01',
      shiftId: shift?.id,
      cashierId: shift?.cashierId,
      orderNumber,
      tableNumber,
      orderType,
      orderSource: 'pos_cashier',
      status: this.isModuleEnabled('kitchen_display') ? 'in_kitchen' : 'completed',
      items,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      serviceChargeAmount: totals.serviceChargeAmount,
      totalAmount: totals.totalAmount,
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: this.isModuleEnabled('kitchen_display') ? undefined : new Date().toISOString()
    };

    // Calculate change if cash
    let changeAmount = 0;
    if (paymentMethod === 'cash') {
      const tendered = tenderedAmount || totals.totalAmount;
      changeAmount = Math.max(0, tendered - totals.totalAmount);
    }

    const payment: Payment = {
      id: 'pay-' + Date.now(),
      orderId,
      restaurantId: restaurant.id,
      branchId: 'br-demo-01',
      shiftId: shift?.id,
      method: paymentMethod,
      amount: totals.totalAmount,
      tenderedAmount: paymentMethod === 'cash' ? tenderedAmount : totals.totalAmount,
      changeAmount: paymentMethod === 'cash' ? changeAmount : 0,
      status: 'successful',
      createdAt: new Date().toISOString()
    };

    // Update active shift sales if cash
    if (shift && shift.status === 'open' && paymentMethod === 'cash') {
      shift.cashSales += totals.totalAmount;
      shift.expectedCash = calculateExpectedCash(shift);
      this.setItem('current_shift', shift);
    }

    // Save order
    const orders = this.getItem<Order[]>('orders', []);
    this.setItem('orders', [order, ...orders]);

    // Send to Kitchen Ticket queue if kitchen_display module is enabled!
    let ticket: KitchenTicket | undefined;
    if (this.isModuleEnabled('kitchen_display')) {
      ticket = {
        id: 'tkt-' + Date.now(),
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        orderType: order.orderType,
        source: 'pos_cashier',
        status: 'queued',
        items: order.items.map((it, idx) => ({
          id: `tkti-${order.id}-${idx}`,
          ticketId: 'tkt-' + Date.now(),
          orderItemId: it.id,
          productName: it.productName,
          variantName: it.variantName,
          quantity: it.quantity,
          notes: it.notes,
          modifiersSummary: it.modifiers?.map((m) => m.optionName).join(', '),
          status: 'pending'
        })),
        createdAt: new Date().toISOString()
      };

      const tickets = this.getItem<KitchenTicket[]>('kitchen_tickets', []);
      this.setItem('kitchen_tickets', [ticket, ...tickets]);
    }

    return { order, payment, ticket };
  }

  // ==========================================
  // KITCHEN DISPLAY (KDS) QUEUE
  // ==========================================

  public getKitchenTickets(): KitchenTicket[] {
    return this.getItem<KitchenTicket[]>('kitchen_tickets', []);
  }

  public updateKitchenTicketStatus(ticketId: string, status: 'preparing' | 'ready' | 'completed'): void {
    const tickets = this.getKitchenTickets();
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status,
          startedAt: status === 'preparing' ? new Date().toISOString() : t.startedAt,
          readyAt: status === 'ready' ? new Date().toISOString() : t.readyAt
        };
      }
      return t;
    });
    this.setItem('kitchen_tickets', updated);
  }
}

export const posClient = new ArPosClient();
