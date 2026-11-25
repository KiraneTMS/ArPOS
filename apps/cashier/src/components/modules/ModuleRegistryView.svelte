<script lang="ts">
  import {
    Layers,
    ShieldCheck,
    Check,
    AlertTriangle,
    Sliders,
    Sparkles,
    CheckCircle2
  } from '@lucide/svelte';
  import type { ModuleId } from '@arpos/shared-types';
  import { SYSTEM_MODULES, validateModuleDependencies } from '@arpos/utilities';
  import { posClient } from '@arpos/supabase-client';

  let enabledModules = $state<ModuleId[]>(posClient.getEnabledModules());
  let alertMessage = $state<string | null>(null);

  function toggle(moduleId: ModuleId) {
    alertMessage = null;
    const res = posClient.toggleModule(moduleId);
    if (!res.success) {
      alertMessage = res.message || 'Gagal mengubah status modul.';
    } else {
      enabledModules = posClient.getEnabledModules();
    }
  }

  function applyPreset(presetName: 'small' | 'full' | 'kitchen') {
    alertMessage = null;
    if (presetName === 'small') {
      const smallModules: ModuleId[] = ['core', 'order_management', 'payment_management', 'cashier_pos', 'reporting'];
      localStorage.setItem('arpos_enabled_modules', JSON.stringify(smallModules));
    } else if (presetName === 'full') {
      const all = SYSTEM_MODULES.map((m) => m.id);
      localStorage.setItem('arpos_enabled_modules', JSON.stringify(all));
    } else if (presetName === 'kitchen') {
      const kitchenOnly: ModuleId[] = ['core', 'order_management', 'kitchen_display'];
      localStorage.setItem('arpos_enabled_modules', JSON.stringify(kitchenOnly));
    }
    enabledModules = posClient.getEnabledModules();
  }
</script>

<div class="flex-1 flex flex-col h-full bg-slate-900 overflow-y-auto p-4 select-none">
  <div class="max-w-5xl mx-auto w-full space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
          <Layers class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-base font-bold text-white">Registry Modul & Konfigurasi Entitlement</h2>
          <p class="text-xs text-slate-400">Aktifkan atau nonaktifkan modul per-restoran dengan validasi dependency graph</p>
        </div>
      </div>

      <!-- Quick Preset Profile Buttons (Section 5.3) -->
      <div class="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
        <span class="text-[10px] text-slate-400 px-2 font-semibold uppercase flex items-center gap-1">
          <Sparkles class="w-3 h-3 text-amber-400" /> Profil:
        </span>
        <button
          onclick={() => applyPreset('small')}
          class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
        >
          Resto Kecil
        </button>
        <button
          onclick={() => applyPreset('kitchen')}
          class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
        >
          Hanya Dapur (KDS)
        </button>
        <button
          onclick={() => applyPreset('full')}
          class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition"
        >
          Full-Service
        </button>
      </div>
    </div>

    <!-- Alert Banner -->
    {#if alertMessage}
      <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
        <AlertTriangle class="w-4 h-4 text-red-400 shrink-0" />
        <span>{alertMessage}</span>
      </div>
    {/if}

    <!-- Modules Grid (12 Functional Modules) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {#each SYSTEM_MODULES as mod}
        {@const isEnabled = enabledModules.includes(mod.id)}
        <div
          class="bg-slate-800/70 border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-150 {isEnabled
            ? 'border-purple-500/40 bg-purple-950/10'
            : 'border-slate-700/60 opacity-75'}"
        >
          <div>
            <div class="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded {mod.category === 'core'
                  ? 'bg-blue-500/20 text-blue-400'
                  : mod.category === 'finance'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : mod.category === 'kitchen'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-700 text-slate-300'}">
                  {mod.category}
                </span>
                <h3 class="text-xs sm:text-sm font-bold text-white mt-1">{mod.name}</h3>
              </div>

              <!-- Toggle Switch -->
              <button
                type="button"
                aria-label="Aktifkan atau nonaktifkan modul {mod.name}"
                disabled={mod.isCore}
                onclick={() => toggle(mod.id)}
                class="w-11 h-6 flex items-center rounded-full p-1 transition duration-200 {isEnabled
                  ? 'bg-purple-600 justify-end'
                  : 'bg-slate-700 justify-start'} {mod.isCore ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}"
              >
                <div class="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            <p class="text-[11px] text-slate-400 leading-relaxed mb-3">
              {mod.description}
            </p>
          </div>

          <!-- Dependency Tags -->
          <div class="pt-2 border-t border-slate-700/50">
            {#if mod.requiredDependencies.length > 0}
              <div class="flex items-center gap-1 text-[10px] text-slate-400 flex-wrap">
                <span class="text-slate-500 font-semibold">Butuh:</span>
                {#each mod.requiredDependencies as dep}
                  <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                    {dep}
                  </span>
                {/each}
              </div>
            {:else}
              <span class="text-[10px] text-slate-500 italic">Tanpa dependency luar</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
