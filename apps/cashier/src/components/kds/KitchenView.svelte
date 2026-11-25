<script lang="ts">
  import {
    ChefHat,
    Clock,
    CheckCircle2,
    Flame,
    Utensils,
    Layers
  } from '@lucide/svelte';
  import type { KitchenTicket } from '@arpos/shared-types';
  import { posClient, DEMO_KITCHEN_STATIONS } from '@arpos/supabase-client';

  let tickets = $state<KitchenTicket[]>(posClient.getKitchenTickets());
  let selectedStation = $state<string>('all');

  function reloadTickets() {
    tickets = posClient.getKitchenTickets();
  }

  function updateStatus(ticketId: string, status: 'preparing' | 'ready' | 'completed') {
    posClient.updateKitchenTicketStatus(ticketId, status);
    reloadTickets();
  }

  let activeTickets = $derived(
    tickets.filter((t) => {
      const isNotDone = t.status !== 'completed';
      const matchStation = selectedStation === 'all' || t.stationId === selectedStation;
      return isNotDone && matchStation;
    })
  );

  function getElapsedMinutes(createdAt: string): number {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diffMs / (1000 * 60));
  }
</script>

<div class="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
  <!-- KDS Top Navigation & Filters -->
  <div class="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <div class="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
        <ChefHat class="w-5 h-5" />
      </div>
      <div>
        <h2 class="text-sm font-bold text-white tracking-tight">Kitchen Display System (KDS)</h2>
        <p class="text-xs text-slate-400">Antrian Masak Dapur & Bar ({activeTickets.length} pesanan aktif)</p>
      </div>
    </div>

    <!-- Station Filter -->
    <div class="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
      <button
        onclick={() => (selectedStation = 'all')}
        class="px-3 py-1 rounded-lg text-xs font-semibold transition {selectedStation === 'all'
          ? 'bg-amber-600 text-white shadow-sm'
          : 'text-slate-400 hover:text-white'}"
      >
        Semua Station
      </button>

      {#each DEMO_KITCHEN_STATIONS as st}
        <button
          onclick={() => (selectedStation = st.id)}
          class="px-3 py-1 rounded-lg text-xs font-semibold transition {selectedStation === st.id
            ? 'bg-amber-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-white'}"
        >
          {st.name}
        </button>
      {/each}
    </div>
  </div>

  <!-- Tickets Grid Screen -->
  <div class="flex-1 overflow-y-auto p-4">
    {#if activeTickets.length === 0}
      <div class="flex flex-col items-center justify-center h-80 text-slate-500 text-center">
        <Utensils class="w-16 h-16 mb-3 stroke-1 text-slate-600" />
        <h3 class="text-base font-bold text-slate-400">Tidak ada pesanan aktif di dapur</h3>
        <p class="text-xs text-slate-600 mt-1">Pesanan baru dari POS atau QR Table akan otomatis muncul di sini</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each activeTickets as ticket}
          {@const elapsed = getElapsedMinutes(ticket.createdAt)}
          <div
            class="bg-slate-900 border-2 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg transition-all {ticket.status ===
            'ready'
              ? 'border-emerald-500 bg-emerald-950/20'
              : ticket.status === 'preparing'
              ? 'border-amber-500 bg-amber-950/20'
              : 'border-slate-700'}"
          >
            <!-- Card Header -->
            <div
              class="p-3 border-b flex items-center justify-between {ticket.status === 'ready'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : ticket.status === 'preparing'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-800 text-slate-200 border-slate-700'}"
            >
              <div>
                <span class="text-xs font-extrabold uppercase tracking-wider">{ticket.orderNumber}</span>
                {#if ticket.tableNumber}
                  <p class="text-sm font-black">MEJA: {ticket.tableNumber}</p>
                {:else}
                  <p class="text-xs font-bold">{ticket.orderType.toUpperCase()}</p>
                {/if}
              </div>

              <!-- Timer Badge -->
              <div class="flex items-center gap-1 text-xs font-bold bg-black/30 px-2 py-1 rounded-md">
                <Clock class="w-3.5 h-3.5" />
                <span>{elapsed}m</span>
              </div>
            </div>

            <!-- Card Items List -->
            <div class="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
              {#each ticket.items as it}
                <div class="pb-2 border-b border-slate-800/80 last:border-0 last:pb-0">
                  <div class="flex items-start justify-between gap-2">
                    <span class="text-sm font-bold text-slate-100">
                      <span class="text-amber-400 font-extrabold mr-1.5">{it.quantity}x</span>
                      {it.productName}
                    </span>
                  </div>
                  {#if it.variantName}
                    <p class="text-[11px] text-blue-400 font-medium pl-6">({it.variantName})</p>
                  {/if}
                  {#if it.notes}
                    <p class="text-[11px] text-amber-300 italic pl-6 mt-0.5">Note: {it.notes}</p>
                  {/if}
                </div>
              {/each}
            </div>

            <!-- Card Footer Action Buttons -->
            <div class="p-3 border-t border-slate-800 bg-slate-900/90">
              {#if ticket.status === 'queued'}
                <button
                  onclick={() => updateStatus(ticket.id, 'preparing')}
                  class="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/30 transition active:scale-95"
                >
                  <Flame class="w-4 h-4" />
                  <span>Mulai Masak</span>
                </button>
              {:else if ticket.status === 'preparing'}
                <button
                  onclick={() => updateStatus(ticket.id, 'ready')}
                  class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition active:scale-95"
                >
                  <CheckCircle2 class="w-4 h-4" />
                  <span>Siap Saji</span>
                </button>
              {:else if ticket.status === 'ready'}
                <button
                  onclick={() => updateStatus(ticket.id, 'completed')}
                  class="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Layers class="w-4 h-4" />
                  <span>Selesai / Sudah Diantar</span>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
