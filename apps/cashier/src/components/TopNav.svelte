<script lang="ts">
  import {
    ShoppingCart,
    ChefHat,
    Wallet,
    Layers,
    Cloud,
    CheckCircle2,
    Clock,
    Store
  } from 'lucide-svelte';
  import { formatCurrency } from '@arpos/utilities';
  import { posClient } from '@arpos/supabase-client';

  let {
    activeView = 'pos',
    onNavigate,
    onOpenConfig
  }: {
    activeView: string;
    onNavigate: (view: 'pos' | 'kds' | 'shifts' | 'modules') => void;
    onOpenConfig: () => void;
  } = $props();

  const restaurant = posClient.getRestaurant();
  const shift = posClient.getCurrentShift();
  const isLive = posClient.isUsingLiveSupabase();

  let timeString = $state(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

  if (typeof window !== 'undefined') {
    setInterval(() => {
      timeString = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }, 10000);
  }
</script>

<header class="bg-slate-800/90 backdrop-blur border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between select-none">
  <!-- Brand & Restaurant Info -->
  <div class="flex items-center gap-3">
    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
      <Store class="w-5 h-5 text-white" />
    </div>
    <div>
      <div class="flex items-center gap-2">
        <h1 class="text-base font-bold text-white tracking-tight">{restaurant.name}</h1>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Terminal 01
        </span>
      </div>
      <p class="text-xs text-slate-400 flex items-center gap-1.5">
        <span>Kasir: {shift?.cashierName || 'No Cashier'}</span>
        <span class="text-slate-600">•</span>
        <span class="text-slate-400 flex items-center gap-1"><Clock class="w-3 h-3 inline" /> {timeString}</span>
      </p>
    </div>
  </div>

  <!-- Center Navigation Tabs -->
  <nav class="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700/60">
    <button
      onclick={() => onNavigate('pos')}
      class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 {activeView === 'pos' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
    >
      <ShoppingCart class="w-4 h-4" />
      <span>POS Kasir</span>
    </button>

    <button
      onclick={() => onNavigate('kds')}
      class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 {activeView === 'kds' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
    >
      <ChefHat class="w-4 h-4" />
      <span>Dapur (KDS)</span>
    </button>

    <button
      onclick={() => onNavigate('shifts')}
      class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 {activeView === 'shifts' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
    >
      <Wallet class="w-4 h-4" />
      <span>Kas & Shift</span>
    </button>

    <button
      onclick={() => onNavigate('modules')}
      class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 {activeView === 'modules' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
    >
      <Layers class="w-4 h-4" />
      <span>Modul Resto</span>
    </button>
  </nav>

  <!-- Right Actions: Cash Drawer Balance & Cloud Status -->
  <div class="flex items-center gap-3">
    <!-- Shift Balance Card -->
    <button
      onclick={() => onNavigate('shifts')}
      class="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 rounded-lg border border-slate-700/60 text-right transition cursor-pointer"
      title="Klik untuk kelola kas drawer"
    >
      <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
      <div>
        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Kas di Laci</p>
        <p class="text-xs font-bold text-emerald-400">
          {formatCurrency(shift?.expectedCash || 0)}
        </p>
      </div>
    </button>

    <!-- Supabase / Cloudflare Indicator -->
    <button
      onclick={onOpenConfig}
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition"
      title="Pengaturan Supabase & Cloudflare Pages"
    >
      <Cloud class="w-4 h-4 {isLive ? 'text-emerald-400' : 'text-amber-400'}" />
      <span class="hidden sm:inline">{isLive ? 'Supabase Live' : 'Demo Mode'}</span>
    </button>
  </div>
</header>
