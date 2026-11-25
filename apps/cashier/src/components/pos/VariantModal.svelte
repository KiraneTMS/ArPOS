<script lang="ts">
  import { X, Check } from 'lucide-svelte';
  import type { Product, ProductVariant } from '@arpos/shared-types';
  import { formatCurrency } from '@arpos/utilities';

  let {
    product,
    onClose,
    onConfirm
  }: {
    product: Product;
    onClose: () => void;
    onConfirm: (variant: ProductVariant, notes: string) => void;
  } = $props();

  let selectedVariant = $state<ProductVariant>(
    product.variants[0] || {
      id: 'default',
      productId: product.id,
      name: 'Standard',
      price: product.basePrice,
      isAvailable: true
    }
  );

  let notes = $state<string>('');
</script>

<div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
    <!-- Modal Header -->
    <div class="p-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-850">
      <div>
        <h3 class="text-base font-bold text-white">{product.name}</h3>
        <p class="text-xs text-slate-400">Pilih varian & catatan pesanan</p>
      </div>
      <button
        onclick={onClose}
        aria-label="Tutup modal"
        class="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Variants List -->
    <div class="p-4 space-y-3">
      <span class="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Varian Tersedia:</span>
      <div class="grid grid-cols-1 gap-2">
        {#each product.variants as variant}
          <button
            onclick={() => (selectedVariant = variant)}
            class="flex items-center justify-between p-3 rounded-xl border text-left transition {selectedVariant.id === variant.id
              ? 'bg-blue-600/15 border-blue-500 text-white'
              : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-900'}"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-4 h-4 rounded-full border flex items-center justify-center {selectedVariant.id === variant.id ? 'border-blue-500 bg-blue-500' : 'border-slate-500'}">
                {#if selectedVariant.id === variant.id}
                  <Check class="w-3 h-3 text-white" />
                {/if}
              </div>
              <span class="text-xs font-semibold">{variant.name}</span>
            </div>
            <span class="text-xs font-bold text-emerald-400">{formatCurrency(variant.price)}</span>
          </button>
        {/each}
      </div>

      <!-- Notes input -->
      <div class="pt-2">
        <label for="variant-notes" class="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Catatan Khusus (Opsional):</label>
        <input
          id="variant-notes"
          type="text"
          bind:value={notes}
          placeholder="Misal: Tanpa cabai, jangan pakai seledri..."
          class="w-full bg-slate-900 text-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>

    <!-- Confirm Button -->
    <div class="p-4 border-t border-slate-700 bg-slate-850 flex items-center justify-between">
      <div>
        <p class="text-[11px] text-slate-400">Total Harga</p>
        <p class="text-sm font-bold text-emerald-400">{formatCurrency(selectedVariant.price)}</p>
      </div>

      <button
        onclick={() => onConfirm(selectedVariant, notes)}
        class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition"
      >
        Tambah ke Keranjang
      </button>
    </div>
  </div>
</div>
