<script lang="ts">
  import {
    X,
    Banknote,
    QrCode,
    CreditCard,
    CheckCircle2
  } from 'lucide-svelte';
  import type { PaymentMethod } from '@arpos/shared-types';
  import { formatCurrency } from '@arpos/utilities';

  let {
    totalAmount = 0,
    onClose,
    onConfirmPayment
  }: {
    totalAmount: number;
    onClose: () => void;
    onConfirmPayment: (method: PaymentMethod, tendered?: number) => void;
  } = $props();

  let selectedMethod = $state<PaymentMethod>('cash');
  let tenderedInput = $state<number>(totalAmount);

  let changeAmount = $derived(
    selectedMethod === 'cash' ? Math.max(0, tenderedInput - totalAmount) : 0
  );

  let isSufficient = $derived(
    selectedMethod !== 'cash' || tenderedInput >= totalAmount
  );

  function setQuickTender(amount: number) {
    tenderedInput = amount;
  }
</script>

<div class="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
    <!-- Header -->
    <div class="p-4 border-b border-slate-700 bg-slate-850 flex items-center justify-between">
      <div>
        <h3 class="text-base font-bold text-white">Pembayaran Kasir</h3>
        <p class="text-xs text-slate-400">Total Tagihan: <span class="font-bold text-emerald-400">{formatCurrency(totalAmount)}</span></p>
      </div>
      <button
        onclick={onClose}
        class="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Body -->
    <div class="p-4 overflow-y-auto space-y-4">
      <!-- Payment Methods Grid -->
      <div>
        <span class="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">Metode Pembayaran:</span>
        <div class="grid grid-cols-3 gap-2">
          <button
            onclick={() => (selectedMethod = 'cash')}
            class="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition {selectedMethod === 'cash'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
              : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-900'}"
          >
            <Banknote class="w-5 h-5 {selectedMethod === 'cash' ? 'text-blue-400' : 'text-slate-400'}" />
            <span class="text-xs font-semibold">Tunai / Cash</span>
          </button>

          <button
            onclick={() => (selectedMethod = 'qris')}
            class="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition {selectedMethod === 'qris'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
              : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-900'}"
          >
            <QrCode class="w-5 h-5 {selectedMethod === 'qris' ? 'text-blue-400' : 'text-slate-400'}" />
            <span class="text-xs font-semibold">QRIS Dinamis</span>
          </button>

          <button
            onclick={() => (selectedMethod = 'debit_card')}
            class="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition {selectedMethod === 'debit_card'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
              : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-900'}"
          >
            <CreditCard class="w-5 h-5 {selectedMethod === 'debit_card' ? 'text-blue-400' : 'text-slate-400'}" />
            <span class="text-xs font-semibold">Kartu Debit / EDC</span>
          </button>
        </div>
      </div>

      <!-- Cash Tender Input & Change -->
      {#if selectedMethod === 'cash'}
        <div class="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 space-y-3">
          <div>
            <label for="cash-tender" class="text-xs font-medium text-slate-400 block mb-1">Nominal Uang Diterima (Rp):</label>
            <input
              id="cash-tender"
              type="number"
              bind:value={tenderedInput}
              class="w-full bg-slate-800 text-emerald-400 text-lg font-bold px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Quick Cash Buttons -->
          <div class="grid grid-cols-4 gap-1.5">
            <button
              onclick={() => setQuickTender(totalAmount)}
              class="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 border border-slate-700"
            >
              Uang Pas
            </button>
            <button
              onclick={() => setQuickTender(50000)}
              class="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 border border-slate-700"
            >
              50.000
            </button>
            <button
              onclick={() => setQuickTender(100000)}
              class="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 border border-slate-700"
            >
              100.000
            </button>
            <button
              onclick={() => setQuickTender(200000)}
              class="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 border border-slate-700"
            >
              200.000
            </button>
          </div>

          <!-- Change Calculation Display -->
          <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400">Kembalian:</span>
            <span class="text-base font-extrabold {changeAmount >= 0 ? 'text-amber-400' : 'text-red-400'}">
              {formatCurrency(changeAmount)}
            </span>
          </div>
        </div>
      {:else if selectedMethod === 'qris'}
        <!-- QRIS Simulation -->
        <div class="bg-white rounded-xl p-4 flex flex-col items-center justify-center text-slate-900 shadow-inner">
          <span class="text-xs font-black tracking-widest text-red-600 mb-1">QRIS STANDAR PEMBAYARAN NASIONAL</span>
          <div class="w-44 h-44 bg-slate-100 border-2 border-dashed border-slate-400 rounded-xl flex items-center justify-center p-2 relative my-2">
            <QrCode class="w-36 h-36 text-slate-900" />
          </div>
          <p class="text-xs font-bold text-slate-700">Scan dengan BCA, GoPay, OVO, ShopeePay, Dana</p>
          <p class="text-[11px] text-slate-500 mt-1">Total: <span class="font-bold text-slate-900">{formatCurrency(totalAmount)}</span></p>
        </div>
      {:else}
        <!-- Card / EDC Info -->
        <div class="bg-slate-900/60 rounded-xl p-4 border border-slate-700 text-center">
          <CreditCard class="w-10 h-10 text-blue-400 mx-auto mb-2" />
          <p class="text-xs font-bold text-slate-200">Gesek atau Masukkan Kartu pada Mesin EDC</p>
          <p class="text-[11px] text-slate-400 mt-1">Pastikan slip EDC telah keluar dan berstatus APPROVAL.</p>
        </div>
      {/if}
    </div>

    <!-- Confirm Button -->
    <div class="p-4 border-t border-slate-700 bg-slate-850 flex items-center justify-between">
      <button
        onclick={onClose}
        class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
      >
        Batal
      </button>

      <button
        disabled={!isSufficient}
        onclick={() => onConfirmPayment(selectedMethod, selectedMethod === 'cash' ? tenderedInput : totalAmount)}
        class="px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all {isSufficient
          ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 cursor-pointer active:scale-95'
          : 'bg-slate-800 text-slate-500 cursor-not-allowed'}"
      >
        <CheckCircle2 class="w-4 h-4" />
        <span>Selesaikan Transaksi</span>
      </button>
    </div>
  </div>
</div>
