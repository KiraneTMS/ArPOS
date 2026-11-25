import type {
  Category,
  Product,
  Restaurant,
  CashierShift,
  KitchenStation,
  ModuleId,
} from '@arpos/shared-types';

export const DEMO_RESTAURANT: Restaurant = {
  id: 'res-demo-nusantara-01',
  code: 'BISTRO-NUSANTARA',
  name: 'Bistro Nusantara',
  legalName: 'PT Nusantara Kuliner Sejahtera',
  taxId: '01.234.567.8-901.000',
  phone: '+62 21 555 7890',
  email: 'hello@bistronusantara.id',
  address: 'Jl. Jend. Sudirman No. 45, Jakarta Pusat',
  currency: 'IDR',
  currencySymbol: 'Rp',
  timezone: 'Asia/Jakarta',
  settings: {
    taxRatePercent: 11,
    taxEnabled: true,
    serviceChargePercent: 5,
    serviceChargeEnabled: true,
    allowSplitBill: true,
    allowOfflineOrders: true,
    blindShiftClosing: true,
    receiptHeader: 'Bistro Nusantara\nJl. Sudirman No. 45, Jakarta Pusat',
    receiptFooter: 'Terima kasih atas kunjungan Anda!\nFollow IG: @bistro.nusantara'
  },
  createdAt: '2026-11-25T00:00:00Z',
  updatedAt: '2026-11-25T00:00:00Z'
};

export const DEMO_MODULES: ModuleId[] = [
  'core',
  'order_management',
  'payment_management',
  'cashier_pos',
  'cashier_shifts',
  'cash_management',
  'settlement',
  'kitchen_display',
  'reporting'
];

export const DEMO_CATEGORIES: Category[] = [
  { id: 'cat-main', restaurantId: DEMO_RESTAURANT.id, name: 'Makanan Utama', slug: 'makanan-utama', icon: 'Utensils', displayOrder: 1, isActive: true },
  { id: 'cat-drink', restaurantId: DEMO_RESTAURANT.id, name: 'Minuman & Kopi', slug: 'minuman-kopi', icon: 'Coffee', displayOrder: 2, isActive: true },
  { id: 'cat-snack', restaurantId: DEMO_RESTAURANT.id, name: 'Snack & Bites', slug: 'snack-bites', icon: 'Cookie', displayOrder: 3, isActive: true },
  { id: 'cat-dessert', restaurantId: DEMO_RESTAURANT.id, name: 'Dessert', slug: 'dessert', icon: 'IceCream', displayOrder: 4, isActive: true }
];

export const DEMO_KITCHEN_STATIONS: KitchenStation[] = [
  { id: 'station-kitchen', restaurantId: DEMO_RESTAURANT.id, name: 'Main Kitchen', code: 'KIT' },
  { id: 'station-bar', restaurantId: DEMO_RESTAURANT.id, name: 'Beverage Bar', code: 'BAR' }
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod-nasgor',
    restaurantId: DEMO_RESTAURANT.id,
    categoryId: 'cat-main',
    kitchenStationId: 'station-kitchen',
    name: 'Nasi Goreng Spesial ArPOS',
    description: 'Nasi goreng harum dengan suwiran ayam, udang, telur ceplok dan acar segar.',
    basePrice: 38000,
    isAvailable: true,
    variants: [
      { id: 'v-nasgor-reg', productId: 'prod-nasgor', name: 'Porsi Reguler', price: 38000, isAvailable: true },
      { id: 'v-nasgor-jumbo', productId: 'prod-nasgor', name: 'Porsi Jumbo', price: 46000, isAvailable: true }
    ],
    modifierIds: []
  },
  {
    id: 'prod-taliwang',
    restaurantId: DEMO_RESTAURANT.id,
    categoryId: 'cat-main',
    kitchenStationId: 'station-kitchen',
    name: 'Ayam Bakar Taliwang',
    description: 'Ayam bakar bumbu khas Taliwang dengan sambal plecing kangkung.',
    basePrice: 45000,
    isAvailable: true,
    variants: [],
    modifierIds: []
  },
  {
    id: 'prod-mie-ayam',
    restaurantId: DEMO_RESTAURANT.id,
    categoryId: 'cat-main',
    kitchenStationId: 'station-kitchen',
    name: 'Mie Ayam Jamur Pangsit',
    description: 'Mie kenyal gurih topping tumis jamur ayam dengan pangsit goreng renyah.',
    basePrice: 32000,
    isAvailable: true,
    variants: [],
    modifierIds: []
  },
  {
    id: 'prod-sate-ayam',
    restaurantId: DEMO_RESTAURANT.id,
    categoryId: 'cat-main',
    kitchenStationId: 'station-kitchen',
    name: 'Sate Ayam Madura (10 Tusuk)',
    description: 'Sate daging ayam lembut dengan lumuran bumbu kacang gurih dan lontong.',
    basePrice: 35000,
    isAvailable: true,
    variants: [],
    modifierIds: []
  },
  {
    id: 'prod-kopi-aren',
    restaurantId: DEMO_RESTAURANT.id,
    categoryId: 'cat-drink',
    kitchenStationId: 'station-bar',
    name: 'Kopi Susu Gula Aren',
    description: 'Espresso blend Arabica-Robusta dengan susu segar dan gula aren asli.',
    basePrice: 22000,
    isAvailable: true,
    variants: [
      { id: 'v-kopi-iced', productId: 'prod-kopi-aren', name: 'Iced (Dingin)', price: 22000, isAvailable: true },
      { id: 'v-kopi-hot', productId: 'prod-kopi-aren', name: 'Hot (Panas)', price: 20000, isAvailable: true }
    ],
    modifierIds: []
  },
  {
    id: 'prod-lemon-tea',
    restaurantId: DEMO_RESTAURANT.id,
    categoryId: 'cat-drink',
    kitchenStationId: 'station-bar',
    name: 'Iced Lemon Mint Tea',
    description: 'Teh melati segar dengan perasan lemon asli dan daun mint.',
    basePrice: 18000,
    isAvailable: true,
    variants: [],
    modifierIds: []
  },
  {
    id: 'prod-pisgor',
    restaurantId: DEMO_RESTAURANT.id,
    categoryId: 'cat-snack',
    kitchenStationId: 'station-kitchen',
    name: 'Pisang Goreng Keju Coklat',
    description: 'Pisang raja goreng krispi dengan taburan keju cheddar parut dan susu kental coklat.',
    basePrice: 20000,
    isAvailable: true,
    variants: [],
    modifierIds: []
  },
  {
    id: 'prod-roti-kaya',
    restaurantId: DEMO_RESTAURANT.id,
    categoryId: 'cat-dessert',
    kitchenStationId: 'station-kitchen',
    name: 'Roti Bakar Kaya Butter',
    description: 'Roti tebal panggang renyah dengan olesan selai srikaya dan butter melimpah.',
    basePrice: 24000,
    isAvailable: true,
    variants: [],
    modifierIds: []
  }
];

export const INITIAL_DEMO_SHIFT: CashierShift = {
  id: 'shift-demo-01',
  restaurantId: DEMO_RESTAURANT.id,
  branchId: 'br-demo-01',
  cashierId: 'user-cashier-01',
  cashierName: 'Siti Rahma (Cashier 1)',
  deviceCode: 'POS-TERMINAL-01',
  status: 'open',
  openedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  openingCash: 300000, // Rp 300.000 starting cash drawer
  cashSales: 154000,   // Demo cash sales
  totalCashIn: 50000,   // Change float replenishment
  totalCashOut: 25000,  // Petty cash purchase (ice cubes)
  totalCashRefunds: 0,
  totalCashDrops: 0,
  expectedCash: 300000 + 154000 + 50000 - 25000 // Rp 479.000
};
