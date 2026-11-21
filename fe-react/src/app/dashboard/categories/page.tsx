"use client"

import { useEffect, useState, useCallback } from "react"
import { Layers, Plus, Trash2, RefreshCw, X, Search } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/layout"
import { PaginationControl } from "@/components/shared"
import {
  Button,
  Card,
  FormField,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui"
import { categoryService } from "@/features/categories/services/category.service"
import { useAuthStore } from "@/features/auth/store/auth.store"
import type { Category, CreateCategoryPayload, PaginationMeta } from "@/types"

export default function CategoriesPage() {
  const { role } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Pagination state (Server-Side)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined)

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<CreateCategoryPayload>({ name: "", description: "" })
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await categoryService.getPaged({
        pageNumber: page,
        pageSize,
        search: search.trim() || undefined,
      })
      if (res.success && res.data) {
        setCategories(res.data)
        if (res.meta) setMeta(res.meta)
      }
    } catch {
      toast.error("Gagal memuat kategori barang")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreateModal = () => {
    setForm({ name: "", description: "" })
    setIsModalOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error("Nama kategori wajib diisi")
      return
    }

    try {
      setSubmitting(true)
      const res = await categoryService.create(form)
      if (res.success) {
        toast.success("Kategori berhasil ditambahkan!")
        setIsModalOpen(false)
        setForm({ name: "", description: "" })
        loadData()
      } else {
        toast.error(res.message || "Gagal menambah kategori")
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal menambah kategori"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return

    try {
      const res = await categoryService.delete(id)
      if (res.success) {
        toast.success("Kategori berhasil dihapus")
        loadData()
      } else {
        toast.error(res.message || "Gagal menghapus kategori")
      }
    } catch {
      toast.error("Gagal menghapus kategori")
    }
  }

  return (
    <DashboardShell title="Kategori Barang">
      <div className="space-y-6">
        {/* Full-width Tabel Daftar Kategori */}
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
          {/* Header & Controls */}
          <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                leftIcon={<Search className="size-4" />}
                placeholder="Cari nama atau deskripsi kategori..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-72 sm:w-80"
              />
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
                Tambah Kategori
              </Button>
            </div>
          </div>

          <Table minWidth="650px" wrapHeader={false} wrapBody={false}>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Jumlah Produk</TableHead>
                <TableHead className="w-[88px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableEmpty
                  colSpan={4}
                  loading={loading}
                  message={search ? `Tidak ada kategori yang cocok dengan "${search}".` : "Belum ada kategori."}
                />
              ) : (
                categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell wrap={false} className="font-semibold text-foreground">{c.name}</TableCell>
                    <TableCell wrap={true} className="max-w-[300px] text-muted-foreground">{c.description || "—"}</TableCell>
                    <TableCell wrap={false}>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
                        {c.productCount ?? 0} Produk
                      </span>
                    </TableCell>
                    <TableCell wrap={false} className="text-right">
                      <div className="flex items-center justify-end">
                        {role === "Admin" ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(c.id, c.name)}
                            className="text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                            title="Hapus Kategori (Admin)"
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

      {/* Pop-up Modal Tambah Kategori */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="w-full max-w-md overflow-hidden rounded-3xl border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Layers className="size-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Tambah Kategori Baru</h3>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsModalOpen(false)}
                icon={<X className="size-4" />}
                title="Tutup"
              />
            </div>

            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <FormField label="Nama Kategori" required>
                <Input
                  placeholder="Contoh: Alat Kesehatan / Perkakas"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </FormField>

              <FormField label="Deskripsi (Opsional)">
                <Input
                  placeholder="Keterangan kategori"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  Simpan Kategori
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}
