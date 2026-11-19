"use client"

import { useEffect, useState, useCallback } from "react"
import { Layers, Plus, Trash2, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/layout"
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
import type { Category, CreateCategoryPayload } from "@/types"

export default function CategoriesPage() {
  const { role } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [form, setForm] = useState<CreateCategoryPayload>({ name: "", description: "" })
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await categoryService.getAll()
      if (res.success && res.data) setCategories(res.data)
    } catch {
      toast.error("Gagal memuat kategori barang")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Tambah Kategori */}
        <div className="w-full">
          <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
            <div className="mb-4 flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              <h3 className="font-bold text-foreground">Tambah Kategori Baru</h3>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <FormField label="Nama Kategori" required>
                <Input
                  placeholder="Contoh: Alat Kesehatan / Perkakas"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="Deskripsi (Opsional)">
                <Input
                  placeholder="Keterangan kategori"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </FormField>

              <Button
                type="submit"
                loading={submitting}
                className="w-full py-5 font-semibold"
              >
                Simpan Kategori
              </Button>
            </form>
          </Card>
        </div>

        {/* Daftar Kategori */}
        <div className="min-w-0 w-full">
          <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="font-semibold text-foreground">Daftar Kategori ({categories.length})</h3>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={loadData}
                disabled={loading}
                title="Segarkan Data"
                icon={<RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />}
              />
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
                  <TableEmpty colSpan={4} loading={loading} message="Belum ada kategori." />
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
                              className="text-rose-500 hover:bg-rose-50 hover:text-rose-700"
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
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
