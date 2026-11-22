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
import { productService } from "@/features/products/services/product.service"
import { categoryService } from "@/features/categories/services/category.service"
import { useAuthStore } from "@/features/auth/store/auth.store"
import type { Product, CreateProductPayload, Category, PaginationMeta } from "@/types"

export default function ProductsPage() {
  const { role } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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

  const loadCategories = useCallback(async () => {
    try {
      const catRes = await categoryService.getAll()
      if (catRes.success && catRes.data) {
        setCategories(catRes.data)
      }
    } catch {
      // ignore
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      const prodRes = await productService.getPaged({
        pageNumber: page,
        pageSize,
        search: search.trim() || undefined,
        categoryId: selectedCategoryId,
        lowStockOnly: lowStockOnly || undefined,
      })

      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data)
        if (prodRes.meta) setMeta(prodRes.meta)
      }
    } catch {
      toast.error("Gagal memuat data produk")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, selectedCategoryId, lowStockOnly])

  const loadData = useCallback(() => {
    loadCategories()
    loadProducts()
  }, [loadCategories, loadProducts])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const openCreateModal = () => {
    setForm({
      sku: "",
      name: "",
      description: "",
      price: 0,
      initialStock: 0,
      minStockLevel: 5,
      categoryId: categories[0]?.id || 0,
    })
    setIsModalOpen(true)
  }

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
            <Input
              leftIcon={<Search className="size-4" />}
              placeholder="Cari SKU atau nama..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-64"
            />

            <NativeSelect
              value={selectedCategoryId || ""}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined)
                setPage(1)
              }}
              className="w-44"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </NativeSelect>

            <Button
              variant={lowStockOnly ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setLowStockOnly(!lowStockOnly)
                setPage(1)
              }}
              leftIcon={<AlertCircle className="size-3.5" />}
            >
              Hanya Stok Tipis
            </Button>
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
              size="sm"
              onClick={openCreateModal}
              leftIcon={<Plus className="size-4" />}
            >
              Tambah Produk
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
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
                      <div className="font-semibold text-foreground">{p.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{p.sku}</div>
                    </TableCell>
                    <TableCell wrap={false} className="text-muted-foreground">
                      {p.categoryName}
                    </TableCell>
                    <TableCell wrap={false} className="font-medium text-foreground">
                      Rp {p.price.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell wrap={false}>
                      <span className="font-bold text-foreground">{p.stockQuantity}</span>
                      <span className="text-xs text-muted-foreground"> (Min: {p.minStockLevel})</span>
                    </TableCell>
                    <TableCell wrap={false}>
                      {p.stockQuantity <= 0 ? (
                        <Badge variant="danger">Habis</Badge>
                      ) : p.stockQuantity <= p.minStockLevel ? (
                        <Badge variant="warning">Menipis</Badge>
                      ) : (
                        <Badge variant="success">Aman</Badge>
                      )}
                    </TableCell>
                    <TableCell wrap={false} className="text-right">
                      <div className="flex items-center justify-end">
                        {role === "Admin" ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Hapus Produk (Admin)"
                            icon={<Trash2 className="size-4" />}
                          />
                        ) : (
                          <div className="flex size-8 items-center justify-center text-xs text-muted-foreground">
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
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
            disabled={loading}
          />
        </Card>

        {/* Modal Tambah Produk */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <Card className="w-full max-w-lg rounded-3xl border-border bg-card p-6 shadow-modal">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="size-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Tambah Produk Baru</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="SKU / Kode Barang" required>
                    <Input
                      placeholder="Contoh: ELEC-001"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      required
                    />
                  </FormField>

                  <FormField label="Kategori" required>
                    <NativeSelect
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </NativeSelect>
                  </FormField>
                </div>

                <FormField label="Nama Produk" required>
                  <Input
                    placeholder="Contoh: Logitech Wireless Mouse M100"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </FormField>

                <div className="grid grid-cols-3 gap-3">
                  <FormField label="Harga (Rp)" required>
                    <Input
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      required
                    />
                  </FormField>

                  <FormField label="Stok Awal">
                    <Input
                      type="number"
                      min={0}
                      value={form.initialStock}
                      onChange={(e) => setForm({ ...form, initialStock: Number(e.target.value) })}
                    />
                  </FormField>

                  <FormField label="Batas Min Stok">
                    <Input
                      type="number"
                      min={0}
                      value={form.minStockLevel}
                      onChange={(e) => setForm({ ...form, minStockLevel: Number(e.target.value) })}
                    />
                  </FormField>
                </div>

                <FormField label="Deskripsi (Opsional)">
                  <Input
                    placeholder="Spesifikasi atau catatan barang"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </FormField>

                <div className="mt-6 flex justify-end gap-3">
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
                    Simpan Produk
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
