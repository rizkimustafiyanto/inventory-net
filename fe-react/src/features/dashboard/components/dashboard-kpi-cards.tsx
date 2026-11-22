"use client"

import { Package, Layers, AlertTriangle, XCircle } from "lucide-react"
import { Card } from "@/components/ui"
import type { StockSummary } from "@/types"

interface DashboardKpiCardsProps {
  summary: StockSummary | null
}

export function DashboardKpiCards({ summary }: DashboardKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Macam Produk */}
      <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Macam Produk
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
              <Package className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
              {summary?.totalProducts ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">SKU Terdaftar</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span className="size-1.5 rounded-full bg-indigo-500" />
          <span>Item aktif dalam katalog</span>
        </div>
      </Card>

      {/* 2. Total Stok Fisik */}
      <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Stok Fisik
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400">
              <Layers className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
              {summary?.totalItemsInStock ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Unit</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span className="size-1.5 rounded-full bg-sky-500" />
          <span>Fisik barang di gudang</span>
        </div>
      </Card>

      {/* 3. Stok Menipis */}
      <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-amber-200/80 bg-amber-50/20 p-5 shadow-xs transition hover:shadow-sm dark:border-amber-900/40 dark:bg-amber-950/15">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Stok Menipis
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              <AlertTriangle className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-amber-700 tabular-nums dark:text-amber-300">
              {summary?.lowStockCount ?? 0}
            </span>
            <span className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70">Produk</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 border-t border-amber-200/50 pt-3 text-xs text-amber-700/80 dark:border-amber-900/40 dark:text-amber-400/80">
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span>Di bawah batas minimum</span>
        </div>
      </Card>

      {/* 4. Stok Habis */}
      <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-rose-200/80 bg-rose-50/20 p-5 shadow-xs transition hover:shadow-sm dark:border-rose-900/40 dark:bg-rose-950/15">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Stok Habis
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-100/80 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
              <XCircle className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-rose-700 tabular-nums dark:text-rose-300">
              {summary?.outOfStockCount ?? 0}
            </span>
            <span className="text-xs font-medium text-rose-700/70 dark:text-rose-400/70">Produk</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 border-t border-rose-200/50 pt-3 text-xs text-rose-700/80 dark:border-rose-900/40 dark:text-rose-400/80">
          <span className="size-1.5 rounded-full bg-rose-500" />
          <span>Perlu restock segera</span>
        </div>
      </Card>
    </div>
  )
}
