<script lang="ts">
  import {
    Trash2,
    Plus,
    Minus,
    ShoppingBag,
    UtensilsCrossed,
    Package,
    CreditCard,
    FileText
  } from 'lucide-svelte';
  import type { OrderItem, OrderType } from '@arpos/shared-types';
  import { formatCurrency, calculateOrderTotals } from '@arpos/utilities';
  import { posClient } from '@arpos/supabase-client';

  let {
    items = [],
    orderType = 'dine_in',
    tableNumber = '',
    onUpdateQuantity,
    onRemoveItem,
    onClearCart,
    onOpenPayment,
    onChangeOrderType,
    onChangeTable
  }: {
    items: OrderItem[];
    orderType: OrderType;
    tableNumber: string;
    onUpdateQuantity: (index: number, delta: number) => void;
    onRemoveItem: (index: number) => void;
    onClearCart: () => void;
    onOpenPayment: () => void;
    onChangeOrderType: (type: OrderType) => void;
    onChangeTable: (table: string) => void;
  } = $props();

  const settings = posClient.getRestaurant().settings;

  let totals = $derived(calculateOrderTotals(items, settings));
</script>

<aside class="w-full sm:w-96 bg-slate-850 border-l border-slate-700/80 flex flex-col h-full bg-slate-900 shadow-xl select-none">
  <!-- Order Header & Mode Toggle -->
  <div class="p-3 border-b border-slate-800 bg-slate-900/90">
    <div class="flex items-center justify-between mb-2.5">
      <h2 class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
        <ShoppingBag class="w-4 h-4 text-blue-400" />
        Keranjang Pesanan ({items.reduce((s, i) => s + i.quantity, 0)})
      </h2>
      {#if items.length > 0}
        <button
          onclick={onClearCart}
          class="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <Trash2 class="w-3 h-3" /> Bersihkan
        </button>
      {/if}
    </div>

    <!-- Dine In / Take Away Switcher -->
    <div class="grid grid-cols-2 gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 mb-2">
      <button
        onclick={() => onChangeOrderType('dine_in')}
        class="flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition {orderType === 'dine_in'
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-200'}"
      >
        <UtensilsCrossed class="w-3.5 h-3.5" />
        Dine In (Makan Sini)
      </button>

      <button
        onclick={() => onChangeOrderType('takeaway')}
        class="flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition {orderType === 'takeaway'
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-200'}"
      >
        <Package class="w-3.5 h-3.5" />
        Take Away (Bungkus)
      </button>
    </div>

    <!-- Table Number Input (for Dine In) -->
    {#if orderType === 'dine_in'}
      <div class="flex items-center gap-2">
        <label for="table-num" class="text-xs text-slate-400 font-medium whitespace-nowrap">Nomor Meja:</label>
        <input
          id="table-num"
          type="text"
          value={tableNumber}
          oninput={(e) => onChangeTable((e.target as HTMLInputElement).value)}
          placeholder="Misal: Meja 05"
          class="flex-1 bg-slate-800 text-slate-100 text-xs px-2.5 py-1.5 rounded-md border border-slate-700 focus:outline-none focus:border-blue-500"
        />
      </div>
    {/if}
  </div>

  <!-- Cart Items Scroll Area -->
  <div class="flex-1 overflow-y-auto p-3 space-y-2">
    {#if items.length === 0}
      <div class="flex flex-col items-center justify-center h-48 text-slate-500 text-center">
        <ShoppingBag class="w-10 h-10 mb-2 stroke-1 text-slate-600" />
        <p class="text-xs font-medium text-slate-400">Keranjang masih kosong</p>
        <p class="text-[11px] text-slate-600 mt-0.5">Pilih menu dari katalog di sebelah kiri</p>
      </div>
    {:else}
      {#each items as item, index}
        <div class="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 flex flex-col gap-1.5">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-xs font-bold text-slate-100">{item.productName}</p>
              {#if item.variantName}
                <p class="text-[10px] text-blue-400 font-medium">Varian: {item.variantName}</p>
              {/if}
              {#if item.notes}
                <p class="text-[10px] text-amber-300 italic flex items-center gap-1 mt-0.5">
                  <FileText class="w-2.5 h-2.5 inline" /> {item.notes}
                </p>
              {/if}
            </div>
            <p class="text-xs font-bold text-emerald-400">{formatCurrency(item.subtotal)}</p>
          </div>

          <!-- Quantity Stepper -->
          <div class="flex items-center justify-between pt-1 border-t border-slate-700/40">
            <span class="text-[11px] text-slate-400">{formatCurrency(item.unitPrice)} / porsi</span>
            <div class="flex items-center gap-1 bg-slate-900 rounded-md p-0.5 border border-slate-700">
              <button
                onclick={() => onUpdateQuantity(index, -1)}
                class="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Minus class="w-3 h-3" />
              </button>
              <span class="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
              <button
                onclick={() => onUpdateQuantity(index, 1)}
                class="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Plus class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Bill Summary & Checkout Button -->
  <div class="p-3 border-t border-slate-800 bg-slate-900/95 space-y-2">
    <div class="space-y-1 text-xs">
      <div class="flex justify-between text-slate-400">
        <span>Subtotal</span>
        <span class="text-slate-200">{formatCurrency(totals.subtotal)}</span>
      </div>

      {#if settings.serviceChargeEnabled && totals.serviceChargeAmount > 0}
        <div class="flex justify-between text-slate-400">
          <span>Service Charge ({settings.serviceChargePercent}%)</span>
          <span class="text-slate-200">{formatCurrency(totals.serviceChargeAmount)}</span>
        </div>
      {/if}

      {#if settings.taxEnabled && totals.taxAmount > 0}
        <div class="flex justify-between text-slate-400">
          <span>PB1 / Pajak Resto ({settings.taxRatePercent}%)</span>
          <span class="text-slate-200">{formatCurrency(totals.taxAmount)}</span>
        </div>
      {/if}

      <div class="pt-1.5 border-t border-slate-700 flex justify-between items-baseline">
        <span class="text-sm font-bold text-white">Total Tagihan</span>
        <span class="text-base font-extrabold text-emerald-400">{formatCurrency(totals.totalAmount)}</span>
      </div>
    </div>

    <!-- Pay Button -->
    <button
      disabled={items.length === 0}
      onclick={onOpenPayment}
      class="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all {items.length > 0
        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 cursor-pointer active:scale-[0.99]'
        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}"
    >
      <CreditCard class="w-4 h-4" />
      <span>Bayar Pesanan ({formatCurrency(totals.totalAmount)})</span>
    </button>
  </div>
</aside>
