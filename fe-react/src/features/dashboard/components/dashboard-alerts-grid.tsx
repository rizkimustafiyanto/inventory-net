"use client"

import Link from "next/link"
import { AlertTriangle, ArrowLeftRight, ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react"
import { Badge, Card } from "@/components/ui"
import type { StockMovement, Product } from "@/types"

interface DashboardAlertsGridProps {
  lowStockProducts: Product[]
  recentMovements: StockMovement[]
}

export function DashboardAlertsGrid({
  lowStockProducts,
  recentMovements,
}: DashboardAlertsGridProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 1. Peringatan Stok Menipis */}
      <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Peringatan Stok Menipis</h3>
          </div>
          <Link
            href="/dashboard/products"
            className="text-xs text-indigo-600 transition hover:underline dark:text-indigo-400"
          >
            Lihat Semua
          </Link>
        </div>

        {lowStockProducts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Semua stok produk dalam kondisi aman.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                  <p className="text-xs font-mono text-slate-400">
                    {p.sku} • {p.categoryName}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${
                      p.stockQuantity === 0
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    Sisa: {p.stockQuantity} (Min: {p.minStockLevel})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 2. Mutasi Terakhir */}
      <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="size-4 text-sky-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Mutasi Terakhir</h3>
          </div>
          <Link
            href="/dashboard/stocks"
            className="text-xs text-indigo-600 transition hover:underline dark:text-indigo-400"
          >
            Selengkapnya
          </Link>
        </div>

        {recentMovements.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Belum ada riwayat mutasi barang.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentMovements.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      m.type === 1
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : m.type === 2
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {m.type === 1 ? (
                      <ArrowDownRight className="size-4" />
                    ) : m.type === 2 ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{m.productName}</p>
                    <p className="text-xs text-slate-400">
                      {m.reason || "Tanpa keterangan"} •{" "}
                      {new Date(m.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={m.type === 1 ? "success" : m.type === 2 ? "danger" : "info"}
                  >
                    {m.type === 1
                      ? `+${m.quantity}`
                      : m.type === 2
                      ? `-${m.quantity}`
                      : `Koreksi: ${m.stockAfter}`}
                  </Badge>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {m.stockBefore} → {m.stockAfter}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
