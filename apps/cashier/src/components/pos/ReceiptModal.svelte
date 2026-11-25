<script lang="ts">
  import { Printer, CheckCircle, X } from 'lucide-svelte';
  import type { Order, Payment } from '@arpos/shared-types';
  import { formatCurrency } from '@arpos/utilities';
  import { posClient } from '@arpos/supabase-client';

  let {
    order,
    payment,
    onClose
  }: {
    order: Order;
    payment: Payment;
    onClose: () => void;
  } = $props();

  const restaurant = posClient.getRestaurant();

  function printReceipt() {
    window.print();
  }
</script>

<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
    <!-- Header -->
    <div class="p-3 border-b border-slate-700 bg-slate-850 flex items-center justify-between">
      <div class="flex items-center gap-2 text-emerald-400">
        <CheckCircle class="w-4 h-4" />
        <span class="text-xs font-bold">Transaksi Sukses</span>
      </div>
      <button
        onclick={onClose}
        class="w-7 h-7 rounded-lg bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Thermal Receipt Simulation Paper -->
    <div class="p-4 overflow-y-auto bg-slate-900 flex justify-center">
      <div class="bg-white text-slate-900 font-mono text-[11px] p-5 rounded shadow-md w-72 leading-tight select-text border border-slate-300">
        <!-- Receipt Header -->
        <div class="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
          <p class="font-extrabold text-xs uppercase tracking-wider">{restaurant.name}</p>
          <p class="text-[10px] text-slate-600">{restaurant.address}</p>
          <p class="text-[10px] text-slate-600">NPWP: {restaurant.taxId}</p>
        </div>

        <!-- Receipt Meta -->
        <div class="py-2.5 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
          <div class="flex justify-between">
            <span>No: {order.orderNumber}</span>
            <span>{order.orderType.toUpperCase()}</span>
          </div>
          {#if order.tableNumber}
            <div class="flex justify-between font-bold">
              <span>Meja: {order.tableNumber}</span>
            </div>
          {/if}
          <div class="flex justify-between text-slate-600">
            <span>{new Date(order.createdAt).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <!-- Items Table -->
        <div class="py-2.5 border-b border-dashed border-slate-400 space-y-2">
          {#each order.items as item}
            <div>
              <div class="flex justify-between font-bold">
                <span>{item.productName}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
              <div class="flex justify-between text-[10px] text-slate-600">
                <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                {#if item.variantName}
                  <span>({item.variantName})</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <!-- Financial Summary -->
        <div class="py-2.5 border-b border-dashed border-slate-400 space-y-1">
          <div class="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {#if order.serviceChargeAmount > 0}
            <div class="flex justify-between">
              <span>Service Charge</span>
              <span>{formatCurrency(order.serviceChargeAmount)}</span>
            </div>
          {/if}
          {#if order.taxAmount > 0}
            <div class="flex justify-between">
              <span>PB1 (Pajak Resto)</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
          {/if}
          <div class="flex justify-between font-extrabold text-xs pt-1 border-t border-slate-300">
            <span>TOTAL</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        <!-- Payment Breakdown -->
        <div class="pt-2.5 space-y-1 text-[10px]">
          <div class="flex justify-between">
            <span class="uppercase">Bayar ({payment.method})</span>
            <span>{formatCurrency(payment.tenderedAmount || order.totalAmount)}</span>
          </div>
          {#if payment.changeAmount && payment.changeAmount > 0}
            <div class="flex justify-between font-bold">
              <span>Kembalian</span>
              <span>{formatCurrency(payment.changeAmount)}</span>
            </div>
          {/if}
        </div>

        <!-- Footer -->
        <div class="mt-4 pt-3 border-t border-dashed border-slate-400 text-center text-[9px] text-slate-500 whitespace-pre-line">
          {restaurant.settings.receiptFooter || 'Terima kasih atas kunjungan Anda!'}
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="p-3 border-t border-slate-700 bg-slate-850 flex items-center gap-2">
      <button
        onclick={printReceipt}
        class="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center justify-center gap-2"
      >
        <Printer class="w-4 h-4" />
        <span>Cetak Struk</span>
      </button>

      <button
        onclick={onClose}
        class="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/30"
      >
        <span>Pesanan Baru</span>
      </button>
    </div>
  </div>
</div>
