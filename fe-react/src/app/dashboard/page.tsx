"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Package,
  Layers,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  PlusCircle,
  ArrowLeftRight,
} from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { stockService } from "@/features/stocks/services/stock.service"
import { productService } from "@/features/products/services/product.service"
import type { StockSummary, StockMovement, Product } from "@/types"

export default function DashboardPage() {
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [sumRes, movRes, lowRes] = await Promise.all([
        stockService.getSummary(),
        stockService.getMovements(undefined, 1, 5),
        productService.getPaged({ pageNumber: 1, pageSize: 5, lowStockOnly: true }),
      ])

      if (sumRes.success && sumRes.data) setSummary(sumRes.data)
      if (movRes.success && movRes.data) setRecentMovements(movRes.data)
      if (lowRes.success && lowRes.data) setLowStockProducts(lowRes.data)
    } catch {
      toast.error("Gagal memuat data ringkasan inventaris")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <DashboardShell title="Ringkasan Inventaris">
      <div className="space-y-6">
        {/* Top Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-slate-200 p-5 shadow-xs dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Macam Produk</span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Package className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary?.totalProducts ?? 0}
              </div>
              <p className="text-xs text-slate-500">Item terdaftar dalam katalog</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 p-5 shadow-xs dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Stok Fisik</span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                <Layers className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary?.totalItemsInStock ?? 0}
              </div>
              <p className="text-xs text-slate-500">Unit barang di gudang</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-amber-200 bg-amber-50/30 p-5 shadow-xs dark:border-amber-950 dark:bg-amber-950/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Stok Menipis</span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                <AlertTriangle className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {summary?.lowStockCount ?? 0}
              </div>
              <p className="text-xs text-amber-600/80">Di bawah batas minimum</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-rose-200 bg-rose-50/30 p-5 shadow-xs dark:border-rose-950 dark:bg-rose-950/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Stok Habis</span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300">
                <XCircle className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                {summary?.outOfStockCount ?? 0}
              </div>
              <p className="text-xs text-rose-600/80">Perlu restock segera</p>
            </div>
          </Card>
        </div>

        {/* Quick Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Aksi Cepat:</span>
            <Link href="/dashboard/stocks">
              <Button size="sm" className="gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                <ArrowLeftRight className="size-3.5" />
                Catat Mutasi Stok
              </Button>
            </Link>
            <Link href="/dashboard/products">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl">
                <PlusCircle className="size-3.5" />
                Tambah Produk
              </Button>
            </Link>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={fetchData}
            disabled={loading}
            className="gap-1.5 text-slate-500"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Segarkan Data
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Low Stock Alerts */}
          <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Peringatan Stok Menipis</h3>
              </div>
              <Link href="/dashboard/products?lowStock=true" className="text-xs text-indigo-600 hover:underline">
                Lihat Semua
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Semua stok produk dalam kondisi aman.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-xs font-mono text-slate-400">{p.sku} • {p.categoryName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${p.stockQuantity === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>
                        Sisa: {p.stockQuantity} (Min: {p.minStockLevel})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Stock Movements */}
          <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="size-4 text-sky-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Mutasi Terakhir</h3>
              </div>
              <Link href="/dashboard/stocks" className="text-xs text-indigo-600 hover:underline">
                Selengkapnya
              </Link>
            </div>

            {recentMovements.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Belum ada riwayat mutasi barang.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentMovements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${m.type === 1 ? "bg-emerald-100 text-emerald-700" : m.type === 2 ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
                        {m.type === 1 ? <ArrowDownRight className="size-4" /> : m.type === 2 ? <ArrowUpRight className="size-4" /> : <RefreshCw className="size-3.5" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{m.productName}</p>
                        <p className="text-xs text-slate-400">{m.reason || "Tanpa keterangan"} • {new Date(m.createdAt).toLocaleDateString("id-ID")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={m.type === 1 ? "default" : m.type === 2 ? "destructive" : "secondary"}>
                        {m.type === 1 ? `+${m.quantity}` : m.type === 2 ? `-${m.quantity}` : `Koreksi: ${m.stockAfter}`}
                      </Badge>
                      <p className="text-[11px] text-slate-400 mt-0.5">{m.stockBefore} → {m.stockAfter}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
