"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ArrowLeftRight,
  RefreshCw,
  Plus,
  X,
  Calendar,
  FileText,
  Search,
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

  // Filter & Search state (Server-Side)
  const [filterProductId, setFilterProductId] = useState<number | undefined>(undefined)
  const [filterType, setFilterType] = useState<number>(0) // 0: Semua, 1: In, 2: Out, 3: Adjustment
  const [search, setSearch] = useState("")

  // Pagination state (Server-Side)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined)

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false)
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
        stockService.getMovements({
          productId: filterProductId,
          type: filterType > 0 ? filterType : undefined,
          search: search.trim() || undefined,
          pageNumber: page,
          pageSize,
        }),
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
  }, [page, pageSize, filterProductId, filterType, search, selectedProductId])

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

  const openCreateModal = () => {
    if (products.length > 0 && (!selectedProductId || selectedProductId === 0)) {
      setSelectedProductId(products[0].id)
    }
    setQuantity(1)
    setReason("")
    setReferenceNumber("")
    setIsModalOpen(true)
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
        setIsModalOpen(false)
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
      <div className="space-y-6">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              leftIcon={<Search className="size-4" />}
              placeholder="Cari No. PO, alasan, SKU, petugas..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-64"
            />

            <NativeSelect
              value={filterProductId || ""}
              onChange={(e) => {
                setFilterProductId(e.target.value ? Number(e.target.value) : undefined)
                setPage(1)
              }}
              className="w-48"
            >
              <option value="">Semua Produk</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              value={filterType}
              onChange={(e) => {
                setFilterType(Number(e.target.value))
                setPage(1)
              }}
              className="w-40"
            >
              <option value={0}>Semua Tipe Mutasi</option>
              <option value={1}>+ Barang Masuk</option>
              <option value={2}>- Barang Keluar</option>
              <option value={3}>⚙ Koreksi Opname</option>
            </NativeSelect>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={loadData}
              disabled={loading}
              title="Segarkan Data"
              icon={<RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />}
            />
            <Button
              onClick={openCreateModal}
              leftIcon={<Plus className="size-4" />}
            >
              Catat Mutasi Baru
            </Button>
          </div>
        </div>

        {/* Full-width Tabel Riwayat Mutasi */}
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
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
                <TableEmpty
                  colSpan={6}
                  loading={loading}
                  message={
                    search || filterProductId || filterType > 0
                      ? "Tidak ada riwayat pergerakan stok yang cocok dengan filter."
                      : "Belum ada riwayat pergerakan stok."
                  }
                />
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
                    <TableCell wrap={false} className="text-xs text-muted-foreground">
                      {m.stockBefore} → <span className="font-semibold text-foreground">{m.stockAfter}</span>
                    </TableCell>
                    <TableCell wrap={true} className="max-w-[220px] text-xs text-muted-foreground">
                      <div>{m.reason || "—"}</div>
                      {m.referenceNumber && (
                        <div className="flex items-center gap-1 font-mono text-primary font-medium mt-0.5">
                          <FileText className="size-3" />
                          <span>{m.referenceNumber}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell wrap={false} className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        <span>{new Date(m.createdAt).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Oleh: {m.userName || "Petugas"}</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Server-Side Pagination */}
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

      {/* Pop-up Modal Catat Mutasi Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="w-full max-w-lg overflow-hidden rounded-3xl border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="size-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Catat Pergerakan Stok</h3>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsModalOpen(false)}
                icon={<X className="size-4" />}
                title="Tutup"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
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
                  placeholder="Contoh: Penerimaan Supplier / Pengeluaran Penjualan"
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

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  loading={submitting}
                >
                  Simpan Mutasi
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}
