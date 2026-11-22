"use client"

import { Coins, PackageCheck, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui"

interface ReportKpiCardsProps {
  totalValuation: number
  totalClosingItems: number
  totalStockIn: number
  totalStockOut: number
  totalSkus: number
}

export function ReportKpiCards({
  totalValuation,
  totalClosingItems,
  totalStockIn,
  totalStockOut,
  totalSkus,
}: ReportKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Valuasi Total Aset */}
      <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Valuasi Total Aset
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
              <Coins className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 tabular-nums dark:text-emerald-400">
              Rp {totalValuation.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>Nilai fisik seluruh stok aktif</span>
        </div>
      </Card>

      {/* 2. Total Stok Fisik */}
      <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Stok Fisik
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
              <PackageCheck className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
              {totalClosingItems}
            </span>
            <span className="text-xs font-medium text-slate-400">Unit</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span className="size-1.5 rounded-full bg-indigo-500" />
          <span>{totalSkus} jenis SKU terdata</span>
        </div>
      </Card>

      {/* 3. Akumulasi Masuk */}
      <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              Akumulasi Masuk (+)
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400">
              <TrendingUp className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sky-600 tabular-nums dark:text-sky-400">
              +{totalStockIn}
            </span>
            <span className="text-xs font-medium text-sky-600/70">Unit</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 border-t border-sky-100 pt-3 text-xs text-sky-600 dark:border-slate-800 dark:text-sky-400">
          <span className="size-1.5 rounded-full bg-sky-500" />
          <span>Total restock barang masuk</span>
        </div>
      </Card>

      {/* 4. Akumulasi Keluar */}
      <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Akumulasi Keluar (-)
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400">
              <TrendingUp className="size-5 rotate-180" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-600 tabular-nums dark:text-rose-400">
              -{totalStockOut}
            </span>
            <span className="text-xs font-medium text-rose-600/70">Unit</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 border-t border-rose-100 pt-3 text-xs text-rose-600 dark:border-slate-800 dark:text-rose-400">
          <span className="size-1.5 rounded-full bg-rose-500" />
          <span>Total penjualan / pemakaian</span>
        </div>
      </Card>
    </div>
  )
}
