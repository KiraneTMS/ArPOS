<script lang="ts">
  import { Search, Plus, Utensils, Tag } from 'lucide-svelte';
  import type { Category, Product } from '@arpos/shared-types';
  import { formatCurrency } from '@arpos/utilities';

  let {
    categories = [],
    products = [],
    onAddToCart,
    onOpenVariants
  }: {
    categories: Category[];
    products: Product[];
    onAddToCart: (product: Product) => void;
    onOpenVariants: (product: Product) => void;
  } = $props();

  let selectedCategoryId = $state<string>('all');
  let searchQuery = $state<string>('');

  let filteredProducts = $derived(
    products.filter((p) => {
      const matchCat = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch && p.isAvailable;
    })
  );
</script>

<div class="flex-1 flex flex-col h-full overflow-hidden bg-slate-900/50">
  <!-- Top Search & Category Filter Bar -->
  <div class="p-3 border-b border-slate-800 bg-slate-900/70 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
    <!-- Categories Tabs -->
    <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
      <button
        onclick={() => (selectedCategoryId = 'all')}
        class="px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all {selectedCategoryId === 'all'
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
      >
        Semua Menu ({products.length})
      </button>

      {#each categories as cat}
        <button
          onclick={() => (selectedCategoryId = cat.id)}
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all {selectedCategoryId === cat.id
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
        >
          {cat.name}
        </button>
      {/each}
    </div>

    <!-- Search Input -->
    <div class="relative w-full sm:w-64">
      <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Cari menu makanan / minuman..."
        class="w-full bg-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  </div>

  <!-- Products Grid View -->
  <div class="flex-1 overflow-y-auto p-3">
    {#if filteredProducts.length === 0}
      <div class="flex flex-col items-center justify-center h-64 text-slate-500">
        <Utensils class="w-12 h-12 mb-2 stroke-1" />
        <p class="text-sm font-medium">Tidak ada menu yang cocok</p>
        <p class="text-xs text-slate-600">Coba ubah kata kunci pencarian atau kategori</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {#each filteredProducts as product}
          <button
            type="button"
            class="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-blue-500/50 rounded-xl p-3 flex flex-col justify-between transition-all duration-150 group shadow-sm hover:shadow-md cursor-pointer text-left w-full"
            onclick={() => {
              if (product.variants && product.variants.length > 0) {
                onOpenVariants(product);
              } else {
                onAddToCart(product);
              }
            }}
          >
            <div>
              <div class="flex items-start justify-between gap-1 mb-1.5">
                <h3 class="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </div>
              {#if product.description}
                <p class="text-[11px] text-slate-400 line-clamp-2 mb-2">
                  {product.description}
                </p>
              {/if}
            </div>

            <div class="pt-2 border-t border-slate-700/50 flex items-center justify-between mt-auto w-full">
              <div>
                {#if product.variants && product.variants.length > 0}
                  <span class="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-medium mb-1">
                    <Tag class="w-2.5 h-2.5" /> {product.variants.length} Varian
                  </span>
                {/if}
                <p class="text-xs sm:text-sm font-bold text-emerald-400">
                  {formatCurrency(product.basePrice)}
                </p>
              </div>

              <div
                class="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition shadow-sm group-hover:scale-105 shrink-0"
              >
                <Plus class="w-4 h-4" />
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
