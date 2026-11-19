"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Package,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { productService } from "@/features/products/services/product.service"
import { categoryService } from "@/features/categories/services/category.service"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { PaginationControl } from "@/components/shared/pagination-control"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui/table"
import type { Product, CreateProductPayload, Category, PaginationMeta } from "@/types"

export default function ProductsPage() {
  const { role } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Pagination state
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined)

  // Filters
  const [search, setSearch] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined)
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Modal create
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateProductPayload>({
    sku: "",
    name: "",
    description: "",
    price: 0,
    initialStock: 0,
    minStockLevel: 5,
    categoryId: 0,
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [prodRes, catRes] = await Promise.all([
        productService.getPaged({
          pageNumber: page,
          pageSize: 10,
          search: search.trim() || undefined,
          categoryId: selectedCategoryId,
          lowStockOnly: lowStockOnly || undefined,
        }),
        categoryService.getAll(),
      ])

      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data)
        if (prodRes.meta) setMeta(prodRes.meta)
      }
      if (catRes.success && catRes.data) {
        const catList = catRes.data
        setCategories(catList)
        if (form.categoryId === 0 && catList.length > 0) {
          setForm((prev) => ({ ...prev, categoryId: catList[0].id }))
        }
      }
    } catch {
      toast.error("Gagal memuat data produk")
    } finally {
      setLoading(false)
    }
  }, [page, search, selectedCategoryId, lowStockOnly, form.categoryId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.sku.trim() || !form.name.trim()) {
      toast.error("SKU dan Nama produk wajib diisi")
      return
    }

    try {
      setSubmitting(true)
      const res = await productService.create(form)
      if (res.success) {
        toast.success("Produk berhasil ditambahkan!")
        setIsModalOpen(false)
        setForm({
          sku: "",
          name: "",
          description: "",
          price: 0,
          initialStock: 0,
          minStockLevel: 5,
          categoryId: categories[0]?.id || 0,
        })
        loadData()
      } else {
        toast.error(res.message || "Gagal membuat produk")
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal menambahkan produk"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus produk "${name}"?`)) return

    try {
      const res = await productService.delete(id)
      if (res.success) {
        toast.success("Produk berhasil dihapus")
        loadData()
      } else {
        toast.error(res.message || "Gagal menghapus produk")
      }
    } catch {
      toast.error("Gagal menghapus produk")
    }
  }

  return (
    <DashboardShell title="Katalog Produk">
      <div className="space-y-6">
        {/* Filters and Add button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari SKU atau nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            <select
              value={selectedCategoryId || ""}
              onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-xs focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <Button
              variant={lowStockOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className="rounded-xl gap-1.5"
            >
              <AlertCircle className="size-3.5" />
              <span>Hanya Stok Tipis</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="rounded-xl gap-1.5 text-slate-500"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl gap-1.5 bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="size-4" />
              <span>Tambah Produk</span>
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Table minWidth="800px" wrapHeader={false} wrapBody={false}>
            <TableHeader>
              <TableRow>
                <TableHead>SKU & Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga Satuan</TableHead>
                <TableHead>Stok Saat Ini</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[88px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableEmpty colSpan={6} loading={loading} message="Tidak ada produk yang sesuai filter." />
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell wrap={true} className="max-w-[260px]">
                      <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-xs font-mono text-slate-400">{p.sku}</div>
                    </TableCell>
                    <TableCell wrap={false} className="text-slate-600 dark:text-slate-300">
                      {p.categoryName}
                    </TableCell>
                    <TableCell wrap={false} className="font-medium text-slate-900 dark:text-white">
                      Rp {p.price.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell wrap={false}>
                      <span className="font-bold text-slate-900 dark:text-white">{p.stockQuantity}</span>
                      <span className="text-xs text-slate-400"> (Min: {p.minStockLevel})</span>
                    </TableCell>
                    <TableCell wrap={false}>
                      {p.stockQuantity <= 0 ? (
                        <Badge variant="destructive">Habis</Badge>
                      ) : p.stockQuantity <= p.minStockLevel ? (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Menipis
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          Aman
                        </span>
                      )}
                    </TableCell>
                    <TableCell wrap={false} className="text-right">
                      <div className="flex items-center justify-end">
                        {role === "Admin" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="size-8 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Hapus Produk (Admin)"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : (
                          <div className="flex size-8 items-center justify-center text-xs text-slate-400">
                            —
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <PaginationControl
            meta={meta}
            onPageChange={(p) => setPage(p)}
            disabled={loading}
          />
        </Card>

        {/* Modal Tambah Produk */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <Card className="w-full max-w-lg rounded-3xl border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="size-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Produk Baru</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">SKU / Kode Barang *</label>
                    <Input
                      placeholder="Contoh: ELEC-001"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kategori *</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Produk *</label>
                  <Input
                    placeholder="Contoh: Logitech Wireless Mouse M100"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Harga (Rp) *</label>
                    <Input
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Stok Awal</label>
                    <Input
                      type="number"
                      min={0}
                      value={form.initialStock}
                      onChange={(e) => setForm({ ...form, initialStock: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Batas Min Stok</label>
                    <Input
                      type="number"
                      min={0}
                      value={form.minStockLevel}
                      onChange={(e) => setForm({ ...form, minStockLevel: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Deskripsi (Opsional)</label>
                  <Input
                    placeholder="Spesifikasi atau catatan barang"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : "Simpan Produk"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
