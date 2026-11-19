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
import { DashboardShell } from "@/components/layout"
import { PaginationControl } from "@/components/shared"
import {
  Badge,
  Button,
  Card,
  FormField,
  Input,
  NativeSelect,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui"
import { stockService } from "@/features/stocks/services/stock.service"
import { productService } from "@/features/products/services/product.service"
import type { StockMovement, StockMovementType, Product, PaginationMeta } from "@/types"

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined)

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
        stockService.getMovements(undefined, page, pageSize),
        productService.getPaged({ pageSize: 100 }),
      ])

      if (movRes.success && movRes.data) {
        setMovements(movRes.data)
        if (movRes.meta) setMeta(movRes.meta)
      }
      if (prodRes.success && prodRes.data) {
        const prodItems = prodRes.data
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
  }, [page, pageSize, selectedProductId])

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
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Form Catat Mutasi */}
        <div className="w-full">
          <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <PlusCircle className="size-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white">Catat Pergerakan Stok</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Pilih Produk" required>
              <NativeSelect
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name} (Sisa: {p.stockQuantity})
                  </option>
                ))}
              </NativeSelect>
            </FormField>

            <FormField label="Tipe Pergerakan" required>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={movementType === 1 ? "success" : "outline"}
                  size="sm"
                  onClick={() => setMovementType(1)}
                  className="w-full text-xs"
                >
                  + Masuk
                </Button>
                <Button
                  type="button"
                  variant={movementType === 2 ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setMovementType(2)}
                  className="w-full text-xs"
                >
                  - Keluar
                </Button>
                <Button
                  type="button"
                  variant={movementType === 3 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMovementType(3)}
                  className="w-full text-xs"
                >
                  ⚙ Koreksi
                </Button>
              </div>
            </FormField>

            <FormField
              label={movementType === 3 ? "Stok Aktual Hasil Koreksi" : "Jumlah / Kuantitas"}
              required
            >
              <Input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </FormField>

            {/* Live preview */}
            {selectedProduct && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Stok Saat Ini:</span>
                  <span className="font-semibold text-foreground">{selectedProduct.stockQuantity}</span>
                </div>
                <div className="mt-1 flex justify-between text-muted-foreground">
                  <span>Estimasi Stok Baru:</span>
                  <span className="font-bold text-primary">{calculatePreviewStock()} unit</span>
                </div>
              </div>
            )}

            <FormField label="Alasan / Keterangan">
              <Input
                placeholder="Contoh: Penerimaan Supplier / Pembelian"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </FormField>

            <FormField label="No. Referensi / PO / Faktur">
              <Input
                placeholder="Contoh: PO-2026-008"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </FormField>

            <Button
              type="submit"
              loading={submitting}
              className="w-full py-5 font-semibold"
            >
              Simpan Mutasi
            </Button>
          </form>
        </Card>
      </div>

      {/* Tabel Riwayat Mutasi */}
      <div className="min-w-0 w-full">
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="size-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Riwayat Mutasi Stok Gudang</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="text-muted-foreground"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <Table minWidth="800px" wrapHeader={false} wrapBody={false}>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Sebelum → Sesudah</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableEmpty colSpan={6} loading={loading} message="Belum ada riwayat pergerakan stok." />
              ) : (
                movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell wrap={true} className="max-w-[200px]">
                      <div className="font-semibold text-foreground">{m.productName}</div>
                      <div className="text-xs font-mono text-muted-foreground">{m.productSku}</div>
                    </TableCell>
                    <TableCell wrap={false}>
                      <Badge
                        variant={m.type === 1 ? "success" : m.type === 2 ? "danger" : "info"}
                        className="text-xs"
                      >
                        {m.type === 1 ? "Masuk" : m.type === 2 ? "Keluar" : "Koreksi"}
                      </Badge>
                    </TableCell>
                    <TableCell wrap={false} className="font-bold text-foreground">
                      {m.type === 1 ? `+${m.quantity}` : m.type === 2 ? `-${m.quantity}` : m.quantity}
                    </TableCell>
                    <TableCell wrap={false} className="text-xs text-slate-500">
                      {m.stockBefore} → <span className="font-semibold text-slate-800 dark:text-slate-200">{m.stockAfter}</span>
                    </TableCell>
                    <TableCell wrap={true} className="max-w-[220px] text-xs text-slate-600 dark:text-slate-300">
                      <div>{m.reason || "—"}</div>
                      {m.referenceNumber && (
                        <div className="flex items-center gap-1 font-mono text-indigo-500">
                          <FileText className="size-3" />
                          <span>{m.referenceNumber}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell wrap={false} className="text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        <span>{new Date(m.createdAt).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Oleh: {m.userName || "Petugas"}</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <PaginationControl
            meta={meta}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
            disabled={loading}
          />
        </Card>
      </div>
    </div>
  </DashboardShell>
  )
}
