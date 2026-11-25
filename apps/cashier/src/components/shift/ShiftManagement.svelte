<script lang="ts">
  import {
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    Lock,
    Unlock,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    FileText
  } from 'lucide-svelte';
  import type { CashierShift } from '@arpos/shared-types';
  import { formatCurrency, calculateDiscrepancy } from '@arpos/utilities';
  import { posClient } from '@arpos/supabase-client';

  let currentShift = $state<CashierShift | null>(posClient.getCurrentShift());

  // Cash movement form state
  let movementType = $state<'cash_in' | 'cash_out' | 'cash_drop' | 'petty_cash'>('cash_in');
  let movementAmount = $state<number>(0);
  let movementReason = $state<string>('');
  let movementFeedback = $state<string | null>(null);

  // Blind shift close state
  let showCloseModal = $state<boolean>(false);
  let physicalCashCount = $state<number>(0);
  let closingNotes = $state<string>('');
  let closedShiftResult = $state<CashierShift | null>(null);

  // Open shift state (if closed)
  let newShiftCashierName = $state<string>('Budi Santoso');
  let newShiftOpeningFloat = $state<number>(300000);

  function reload() {
    currentShift = posClient.getCurrentShift();
  }

  function handleRecordCash() {
    if (movementAmount <= 0 || !movementReason.trim()) {
      movementFeedback = 'Mohon masukkan nominal dan alasan kas.';
      return;
    }

    try {
      const { updatedShift } = posClient.recordCashMovement(
        movementType,
        movementAmount,
        movementReason
      );
      currentShift = updatedShift;
      movementAmount = 0;
      movementReason = '';
      movementFeedback = 'Pencatatan kas berhasil disimpan ke jurnal kas drawer.';
      setTimeout(() => (movementFeedback = null), 4000);
    } catch (err: any) {
      movementFeedback = err.message;
    }
  }

  function handleCloseShift() {
    try {
      const result = posClient.closeShift(physicalCashCount, closingNotes);
      closedShiftResult = result;
      currentShift = result;
      showCloseModal = false;
    } catch (err: any) {
      alert(err.message);
    }
  }

  function handleOpenNewShift() {
    const shift = posClient.openShift(newShiftCashierName, newShiftOpeningFloat);
    currentShift = shift;
    closedShiftResult = null;
  }
</script>

<div class="flex-1 flex flex-col h-full bg-slate-900 overflow-y-auto p-4 select-none">
  <!-- Header -->
  <div class="max-w-5xl mx-auto w-full space-y-4">
    <div class="flex items-center justify-between pb-3 border-b border-slate-800">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
          <Wallet class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-base font-bold text-white">Manajemen Shift & Rekonsiliasi Laci Kas</h2>
          <p class="text-xs text-slate-400">Pencatatan uang masuk, kas kecil (petty cash), dan penutupan shift (blind closing)</p>
        </div>
      </div>

      {#if currentShift && currentShift.status === 'open'}
        <button
          onclick={() => (showCloseModal = true)}
          class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 transition"
        >
          <Lock class="w-4 h-4" />
          <span>Tutup Shift Kasir</span>
        </button>
      {/if}
    </div>

    {#if !currentShift || currentShift.status === 'closed'}
      <!-- Open New Shift Card -->
      <div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 max-w-lg mx-auto space-y-4 text-center">
        <div class="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto">
          <Unlock class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-base font-bold text-white">Laci Kas Belum Dibuka</h3>
          <p class="text-xs text-slate-400 mt-1">Buka shift baru untuk mulai melayani transaksi penjualan</p>
        </div>

        <div class="space-y-3 text-left">
          <div>
            <label for="cashier-name-input" class="text-xs font-semibold text-slate-300 block mb-1">Nama Kasir Bertugas:</label>
            <input
              id="cashier-name-input"
              type="text"
              bind:value={newShiftCashierName}
              class="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label for="modal-awal-input" class="text-xs font-semibold text-slate-300 block mb-1">Modal Awal / Float Kas (Rp):</label>
            <input
              id="modal-awal-input"
              type="number"
              bind:value={newShiftOpeningFloat}
              class="w-full bg-slate-900 text-emerald-400 font-bold text-sm px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onclick={handleOpenNewShift}
          class="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition"
        >
          Buka Shift Sekarang
        </button>
      </div>
    {:else}
      <!-- Active Shift Statistics Overview -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5">
          <p class="text-[11px] text-slate-400 font-semibold uppercase">Modal Awal (Float)</p>
          <p class="text-base font-extrabold text-slate-100 mt-1">{formatCurrency(currentShift.openingCash)}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">Saldo awal saat shift dibuka</p>
        </div>

        <div class="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5">
          <p class="text-[11px] text-slate-400 font-semibold uppercase">Total Penjualan Tunai</p>
          <p class="text-base font-extrabold text-emerald-400 mt-1">{formatCurrency(currentShift.cashSales)}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">Transaksi POS tunai</p>
        </div>

        <div class="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5">
          <p class="text-[11px] text-slate-400 font-semibold uppercase">Kas Masuk / Keluar</p>
          <p class="text-base font-extrabold text-blue-400 mt-1">
            +{formatCurrency(currentShift.totalCashIn)} / -{formatCurrency(currentShift.totalCashOut)}
          </p>
          <p class="text-[10px] text-slate-500 mt-0.5">Penambahan & pengeluaran kas kecil</p>
        </div>

        <div class="bg-gradient-to-br from-emerald-950/60 to-slate-800 border border-emerald-500/40 rounded-xl p-3.5">
          <p class="text-[11px] text-emerald-400 font-semibold uppercase">Ekspektasi Saldo di Laci</p>
          <p class="text-lg font-black text-emerald-400 mt-1">{formatCurrency(currentShift.expectedCash)}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Awal + Sales + In - Out</p>
        </div>
      </div>

      <!-- Cash Movement Form & Operations -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <!-- Form Pencatatan Kas Drawer -->
        <div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
          <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ArrowDownLeft class="w-4 h-4 text-blue-400" />
            Pencatatan Kas / Petty Cash
          </h3>

          {#if movementFeedback}
            <div class="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              {movementFeedback}
            </div>
          {/if}

          <!-- Type Selector -->
          <div class="grid grid-cols-3 gap-1.5">
            <button
              onclick={() => (movementType = 'cash_in')}
              class="py-1.5 px-2 rounded-lg text-xs font-semibold border transition {movementType === 'cash_in'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-900 border-slate-700 text-slate-400'}"
            >
              Kas Masuk (In)
            </button>

            <button
              onclick={() => (movementType = 'cash_out')}
              class="py-1.5 px-2 rounded-lg text-xs font-semibold border transition {movementType === 'cash_out'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-900 border-slate-700 text-slate-400'}"
            >
              Kas Keluar (Out)
            </button>

            <button
              onclick={() => (movementType = 'cash_drop')}
              class="py-1.5 px-2 rounded-lg text-xs font-semibold border transition {movementType === 'cash_drop'
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-slate-900 border-slate-700 text-slate-400'}"
            >
              Setor Brankas
            </button>
          </div>

          <!-- Nominal -->
          <div>
            <label for="cash-movement-amount" class="text-xs text-slate-400 block mb-1">Nominal (Rp):</label>
            <input
              id="cash-movement-amount"
              type="number"
              bind:value={movementAmount}
              placeholder="0"
              class="w-full bg-slate-900 text-white font-bold text-sm px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Alasan -->
          <div>
            <label for="cash-movement-reason" class="text-xs text-slate-400 block mb-1">Keterangan / Alasan:</label>
            <input
              id="cash-movement-reason"
              type="text"
              bind:value={movementReason}
              placeholder="Misal: Tambah uang kembalian pecahan 2.000 / Beli es batu kristal"
              class="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onclick={handleRecordCash}
            class="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Simpan Transaksi Kas
          </button>
        </div>

        <!-- Section Penjelasan Rumus Rekonsiliasi (Sesuai Dokumen ArPOS 10.2) -->
        <div class="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText class="w-4 h-4 text-emerald-400" />
              Formula Rekonsiliasi Kas (Sec 10.2)
            </h3>
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
              <p class="text-emerald-400 font-bold">Expected Cash =</p>
              <p class="pl-3">Opening Cash ({formatCurrency(currentShift.openingCash)})</p>
              <p class="pl-3">+ Cash Sales ({formatCurrency(currentShift.cashSales)})</p>
              <p class="pl-3">+ Total Cash In ({formatCurrency(currentShift.totalCashIn)})</p>
              <p class="pl-3">- Total Cash Out ({formatCurrency(currentShift.totalCashOut)})</p>
              <p class="pl-3">- Total Cash Drops ({formatCurrency(currentShift.totalCashDrops)})</p>
              <div class="pt-1 border-t border-slate-800 text-xs font-bold text-white flex justify-between">
                <span>= Saldo Akhir Laci:</span>
                <span class="text-emerald-400">{formatCurrency(currentShift.expectedCash)}</span>
              </div>
            </div>
          </div>

          <p class="text-[11px] text-slate-500 mt-4 italic">
            * Sistem ArPOS menerapkan "Blind Shift Closing", kasir wajib menghitung uang fisik tanpa melihat angka ekspektasi untuk menjaga integritas rekonsiliasi.
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Modal Blind Closing Shift -->
{#if showCloseModal}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
          <Lock class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-base font-bold text-white">Blind Shift Closing</h3>
          <p class="text-xs text-slate-400">Hitung fisik uang tunai di laci kasir</p>
        </div>
      </div>

      <div class="space-y-3">
        <div>
          <label for="physical-cash-count" class="text-xs font-semibold text-slate-300 block mb-1">
            Total Uang Fisik Hasil Hitungan Kasir (Rp):
          </label>
          <input
            id="physical-cash-count"
            type="number"
            bind:value={physicalCashCount}
            placeholder="0"
            class="w-full bg-slate-900 text-emerald-400 font-extrabold text-lg px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label for="shift-closing-notes" class="text-xs font-semibold text-slate-300 block mb-1">Catatan Penutupan (Opsional):</label>
          <textarea
            id="shift-closing-notes"
            bind:value={closingNotes}
            placeholder="Keterangan jika terdapat perbedaan fisik uang..."
            rows="2"
            class="w-full bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
          ></textarea>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2">
        <button
          onclick={() => (showCloseModal = false)}
          class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
        >
          Kembali
        </button>

        <button
          onclick={handleCloseShift}
          class="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 transition"
        >
          Konfirmasi Tutup Shift
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Modal Hasil Rekonsiliasi Setelah Tutup Shift -->
{#if closedShiftResult}
  <div class="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
      <div class="text-center space-y-1">
        <div class="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <h3 class="text-base font-bold text-white">Shift Berhasil Ditutup</h3>
        <p class="text-xs text-slate-400">Ringkasan Hasil Rekonsiliasi Laci Kas</p>
      </div>

      <div class="bg-slate-900 p-4 rounded-xl border border-slate-700/80 space-y-2 text-xs">
        <div class="flex justify-between text-slate-400">
          <span>Ekspektasi Sistem:</span>
          <span class="font-bold text-white">{formatCurrency(closedShiftResult.expectedCash)}</span>
        </div>
        <div class="flex justify-between text-slate-400">
          <span>Hasil Hitung Fisik Kasir:</span>
          <span class="font-bold text-emerald-400">{formatCurrency(closedShiftResult.actualCash || 0)}</span>
        </div>
        <div class="pt-2 border-t border-slate-800 flex justify-between items-center">
          <span class="font-bold text-slate-300">Status Selisih (Discrepancy):</span>
          {#if (closedShiftResult.discrepancy || 0) === 0}
            <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PAS / SESUAI (Rp 0)
            </span>
          {:else if (closedShiftResult.discrepancy || 0) > 0}
            <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              LEBIH +{formatCurrency(closedShiftResult.discrepancy || 0)}
            </span>
          {:else}
            <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              KURANG {formatCurrency(closedShiftResult.discrepancy || 0)}
            </span>
          {/if}
        </div>
      </div>

      <button
        onclick={() => (closedShiftResult = null)}
        class="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition"
      >
        Tutup & Selesai
      </button>
    </div>
  </div>
{/if}
