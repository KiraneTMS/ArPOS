<script lang="ts">
  import {
    X,
    Cloud,
    Database,
    Globe,
    CheckCircle2,
    Copy,
    ExternalLink
  } from 'lucide-svelte';
  import { posClient } from '@arpos/supabase-client';

  let { onClose }: { onClose: () => void } = $props();

  let supabaseUrl = $state<string>(localStorage.getItem('arpos_supabase_url') || '');
  let supabaseAnonKey = $state<string>(localStorage.getItem('arpos_supabase_anon_key') || '');
  let copied = $state<boolean>(false);
  let statusMessage = $state<string | null>(null);

  function handleSave() {
    if (supabaseUrl.trim() && supabaseAnonKey.trim()) {
      localStorage.setItem('arpos_supabase_url', supabaseUrl.trim());
      localStorage.setItem('arpos_supabase_anon_key', supabaseAnonKey.trim());
      posClient.initSupabase(supabaseUrl.trim(), supabaseAnonKey.trim());
      statusMessage = 'Koneksi Supabase berhasil disimpan! Silakan muat ulang halaman.';
    } else {
      localStorage.removeItem('arpos_supabase_url');
      localStorage.removeItem('arpos_supabase_anon_key');
      posClient.initSupabase('', '');
      statusMessage = 'Beralih ke mode offline / demo mock storage.';
    }
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  }
</script>

<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-slate-700 bg-slate-850 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
          <Cloud class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-base font-bold text-white">Integrasi Supabase & Cloudflare Pages</h3>
          <p class="text-xs text-slate-400">Pengaturan backend cloud prototype & hosting edge</p>
        </div>
      </div>
      <button
        onclick={onClose}
        class="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Body -->
    <div class="p-4 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
      <!-- Cloudflare Pages Status Card -->
      <div class="p-3 bg-slate-900 rounded-xl border border-slate-700/80 space-y-2">
        <div class="flex items-center gap-2 text-emerald-400 font-bold">
          <Globe class="w-4 h-4" />
          <span>Cloudflare Pages Ready</span>
        </div>
        <p class="text-slate-300 leading-relaxed">
          Aplikasi ArPOS terkompilasi sebagai Single Page Application (SPA) ringan yang dapat langsung di-deploy ke Cloudflare Pages dengan file routing <code class="text-blue-400 bg-slate-800 px-1 py-0.5 rounded">_redirects</code> otomatis.
        </p>
      </div>

      <!-- Supabase Configuration -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Database class="w-4 h-4 text-emerald-400" />
            Kredensial Supabase Proyek
          </label>
        </div>

        {#if statusMessage}
          <div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
            {statusMessage}
          </div>
        {/if}

        <div>
          <label for="supabase-project-url" class="text-slate-400 block mb-1">Supabase Project URL:</label>
          <input
            id="supabase-project-url"
            type="text"
            bind:value={supabaseUrl}
            placeholder="https://xyzcompany.supabase.co"
            class="w-full bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label for="supabase-anon-key" class="text-slate-400 block mb-1">Supabase Anon Key (Public API Key):</label>
          <input
            id="supabase-anon-key"
            type="password"
            bind:value={supabaseAnonKey}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            class="w-full bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <p class="text-[11px] text-slate-500 italic">
          * Jika dikosongkan, ArPOS otomatis berjalan dalam <strong>Demo Local Storage Mode</strong> dengan data dummy lengkap (makanan, minuman, shift, dan dapur).
        </p>
      </div>

      <!-- Schema Migration Guide -->
      <div class="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-1.5 text-blue-300">
        <p class="font-bold">Langkah Database Supabase:</p>
        <p class="text-[11px] leading-relaxed">
          File SQL skema telah disiapkan di <code class="text-white bg-slate-800 px-1 py-0.5 rounded">supabase/schema.sql</code>. Cukup salin isi file tersebut ke dalam <strong>Supabase SQL Editor</strong> dan tekan <strong>RUN</strong> untuk mengaktifkan seluruh tabel & Realtime Channels.
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="p-4 border-t border-slate-700 bg-slate-850 flex items-center justify-between">
      <button
        onclick={onClose}
        class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
      >
        Tutup
      </button>

      <button
        onclick={handleSave}
        class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition"
      >
        Simpan & Terapkan
      </button>
    </div>
  </div>
</div>
