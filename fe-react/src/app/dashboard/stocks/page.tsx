"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  Loader2,
  Calendar,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { stockService } from "@/features/stocks/services/stock.service"
import { productService } from "@/features/products/services/product.service"
import type { StockMovement, StockMovementType } from "@/features/stocks/types"
import type { Product } from "@/features/products/types"

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [selectedProductId, setSelectedProductId] = useState<number>(0)
  const [movementType, setMovementType] = useState<StockMovementType>(1) // 1: In, 2: Out, 3: Adjustment
  const [quantity, setQuantity] = useState<number>(1)
  const [reason, setReason] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [movRes, prodRes] = await Promise.all([
        stockService.getMovements(undefined, 1, 50),
        productService.getPaged({ pageSize: 100 }),
      ])

      if (movRes.success && movRes.data) setMovements(movRes.data.items)
      if (prodRes.success && prodRes.data) {
        const prodItems = prodRes.data.items
        setProducts(prodItems)
        if (selectedProductId === 0 && prodItems.length > 0) {
          setSelectedProductId(prodItems[0].id)
        }
      }
    } catch {
      toast.error("Gagal memuat data mutasi stok")
    } finally {
      setLoading(false)
    }
  }, [selectedProductId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  const calculatePreviewStock = () => {
    if (!selectedProduct) return 0
    if (movementType === 1) return selectedProduct.stockQuantity + quantity
    if (movementType === 2) return Math.max(0, selectedProduct.stockQuantity - quantity)
    return quantity // Adjustment
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId) {
      toast.error("Pilih produk terlebih dahulu")
      return
    }

    if (quantity <= 0 && movementType !== 3) {
      toast.error("Jumlah harus lebih dari 0")
      return
    }

    if (movementType === 2 && selectedProduct && quantity > selectedProduct.stockQuantity) {
      toast.error(`Stok tidak mencukupi! Tersisa hanya ${selectedProduct.stockQuantity}`)
      return
    }

    try {
      setSubmitting(true)
      const res = await stockService.recordMovement({
        productId: selectedProductId,
        type: movementType,
        quantity,
        reason: reason.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
      })

      if (res.success) {
        toast.success("Mutasi stok berhasil dicatat!")
        setReason("")
        setReferenceNumber("")
        setQuantity(1)
        loadData()
      } else {
        toast.error(res.message || "Gagal mencatat mutasi")
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal mencatat mutasi stok"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell title="Mutasi & Pergerakan Stok">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Form Catat Mutasi */}
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <PlusCircle className="size-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white">Catat Pergerakan Stok</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Produk *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name} (Sisa: {p.stockQuantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tipe Pergerakan *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType(1)}
                  className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                    movementType === 1
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800"
                  }`}
                >
                  + Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType(2)}
                  className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                    movementType === 2
                      ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800"
                  }`}
                >
                  - Keluar
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType(3)}
                  className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                    movementType === 3
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800"
                  }`}
                >
                  ⚙ Koreksi
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {movementType === 3 ? "Stok Aktual Hasil Koreksi *" : "Jumlah / Kuantitas *"}
              </label>
              <Input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="rounded-xl"
                required
              />
            </div>

            {/* Live preview */}
            {selectedProduct && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex justify-between text-slate-500">
                  <span>Stok Saat Ini:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedProduct.stockQuantity}</span>
                </div>
                <div className="mt-1 flex justify-between text-slate-500">
                  <span>Estimasi Stok Baru:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{calculatePreviewStock()} unit</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Alasan / Keterangan</label>
              <Input
                placeholder="Contoh: Penerimaan Supplier / Pembelian"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">No. Referensi / PO / Faktur</label>
              <Input
                placeholder="Contoh: PO-2026-008"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 py-5 font-semibold hover:bg-indigo-700"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Simpan Mutasi"}
            </Button>
          </form>
        </Card>

        {/* Tabel Riwayat Mutasi */}
        <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="size-4 text-slate-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Riwayat Mutasi Stok Gudang</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="text-slate-500"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-3">Produk</th>
                  <th className="px-5 py-3">Tipe</th>
                  <th className="px-5 py-3">Jumlah</th>
                  <th className="px-5 py-3">Sebelum → Sesudah</th>
                  <th className="px-5 py-3">Keterangan</th>
                  <th className="px-5 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {loading ? "Memuat riwayat mutasi..." : "Belum ada riwayat pergerakan stok."}
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{m.productName}</div>
                        <div className="text-xs font-mono text-slate-400">{m.productSku}</div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={m.type === 1 ? "default" : m.type === 2 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {m.type === 1 ? "Masuk" : m.type === 2 ? "Keluar" : "Koreksi"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">
                        {m.type === 1 ? `+${m.quantity}` : m.type === 2 ? `-${m.quantity}` : m.quantity}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {m.stockBefore} → <span className="font-semibold text-slate-800 dark:text-slate-200">{m.stockAfter}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                        <div>{m.reason || "—"}</div>
                        {m.referenceNumber && (
                          <div className="flex items-center gap-1 font-mono text-indigo-500">
                            <FileText className="size-3" />
                            <span>{m.referenceNumber}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          <span>{new Date(m.createdAt).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">Oleh: {m.userName || "Petugas"}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
