<script lang="ts">
  import TopNav from './components/TopNav.svelte';
  import ProductGrid from './components/pos/ProductGrid.svelte';
  import CartPanel from './components/pos/CartPanel.svelte';
  import VariantModal from './components/pos/VariantModal.svelte';
  import PaymentModal from './components/pos/PaymentModal.svelte';
  import ReceiptModal from './components/pos/ReceiptModal.svelte';
  import KitchenView from './components/kds/KitchenView.svelte';
  import ShiftManagement from './components/shift/ShiftManagement.svelte';
  import ModuleRegistryView from './components/modules/ModuleRegistryView.svelte';
  import SupabaseConfigModal from './components/settings/SupabaseConfigModal.svelte';

  import type {
    Order,
    OrderItem,
    OrderType,
    Payment,
    PaymentMethod,
    Product,
    ProductVariant
  } from '@arpos/shared-types';
  import { calculateOrderTotals } from '@arpos/utilities';
  import { posClient } from '@arpos/supabase-client';

  // Navigation State
  let activeView = $state<'pos' | 'kds' | 'shifts' | 'modules'>('pos');

  // Modals State
  let showConfigModal = $state<boolean>(false);
  let showPaymentModal = $state<boolean>(false);
  let variantModalProduct = $state<Product | null>(null);
  let completedOrderData = $state<{ order: Order; payment: Payment } | null>(null);

  // Cart State
  let cartItems = $state<OrderItem[]>([]);
  let orderType = $state<OrderType>('dine_in');
  let tableNumber = $state<string>('01');

  // Catalog
  const categories = posClient.getCategories();
  const products = posClient.getProducts();

  // Cart actions
  function handleAddToCart(product: Product, variant?: ProductVariant, notes?: string) {
    const unitPrice = variant ? variant.price : product.basePrice;
    const existingIndex = cartItems.findIndex(
      (it) => it.productId === product.id && it.variantId === variant?.id && it.notes === notes
    );

    if (existingIndex > -1) {
      cartItems[existingIndex].quantity += 1;
      cartItems[existingIndex].subtotal =
        cartItems[existingIndex].quantity * cartItems[existingIndex].unitPrice;
      cartItems = [...cartItems];
    } else {
      const newItem: OrderItem = {
        id: 'item-' + Date.now() + '-' + Math.random(),
        productId: product.id,
        productName: product.name,
        variantId: variant?.id,
        variantName: variant?.name,
        unitPrice,
        quantity: 1,
        subtotal: unitPrice,
        notes,
        modifiers: []
      };
      cartItems = [...cartItems, newItem];
    }
  }

  function handleUpdateQuantity(index: number, delta: number) {
    const item = cartItems[index];
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      cartItems = cartItems.filter((_, idx) => idx !== index);
    } else {
      item.quantity = newQty;
      item.subtotal = newQty * item.unitPrice;
      cartItems = [...cartItems];
    }
  }

  function handleRemoveItem(index: number) {
    cartItems = cartItems.filter((_, idx) => idx !== index);
  }

  function handleClearCart() {
    cartItems = [];
  }

  function handleConfirmVariant(variant: ProductVariant, notes: string) {
    if (variantModalProduct) {
      handleAddToCart(variantModalProduct, variant, notes);
      variantModalProduct = null;
    }
  }

  // Payment & Order Placement
  function handleConfirmPayment(method: PaymentMethod, tendered?: number) {
    try {
      const result = posClient.createOrderAndPay(
        cartItems,
        orderType,
        tableNumber,
        method,
        tendered
      );

      completedOrderData = { order: result.order, payment: result.payment };
      cartItems = [];
      showPaymentModal = false;
    } catch (err: any) {
      alert('Gagal memproses pembayaran: ' + err.message);
    }
  }

  let totals = $derived(calculateOrderTotals(cartItems, posClient.getRestaurant().settings));
</script>

<div class="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
  <!-- Top Navigation Bar -->
  <TopNav
    {activeView}
    onNavigate={(view) => (activeView = view)}
    onOpenConfig={() => (showConfigModal = true)}
  />

  <!-- Main View Area -->
  <main class="flex-1 flex overflow-hidden">
    {#if activeView === 'pos'}
      <!-- Cashier POS View -->
      <ProductGrid
        {categories}
        {products}
        onAddToCart={(prod) => handleAddToCart(prod)}
        onOpenVariants={(prod) => (variantModalProduct = prod)}
      />

      <!-- Interactive Right Cart Panel -->
      <CartPanel
        items={cartItems}
        {orderType}
        {tableNumber}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOpenPayment={() => (showPaymentModal = true)}
        onChangeOrderType={(type) => (orderType = type)}
        onChangeTable={(table) => (tableNumber = table)}
      />
    {:else if activeView === 'kds'}
      <!-- Kitchen Display System (KDS) -->
      <KitchenView />
    {:else if activeView === 'shifts'}
      <!-- Shift & Cash Drawer Reconciliation -->
      <ShiftManagement />
    {:else if activeView === 'modules'}
      <!-- Module Registry & Licensing -->
      <ModuleRegistryView />
    {/if}
  </main>
</div>

<!-- Variant Selection Modal -->
{#if variantModalProduct}
  <VariantModal
    product={variantModalProduct}
    onClose={() => (variantModalProduct = null)}
    onConfirm={handleConfirmVariant}
  />
{/if}

<!-- Payment Modal -->
{#if showPaymentModal}
  <PaymentModal
    totalAmount={totals.totalAmount}
    onClose={() => (showPaymentModal = false)}
    onConfirmPayment={handleConfirmPayment}
  />
{/if}

<!-- Receipt Modal -->
{#if completedOrderData}
  <ReceiptModal
    order={completedOrderData.order}
    payment={completedOrderData.payment}
    onClose={() => (completedOrderData = null)}
  />
{/if}

<!-- Supabase & Cloudflare Configuration Modal -->
{#if showConfigModal}
  <SupabaseConfigModal onClose={() => (showConfigModal = false)} />
{/if}
