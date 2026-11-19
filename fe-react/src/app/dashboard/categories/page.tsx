"use client"

import { useEffect, useState, useCallback } from "react"
import { Layers, Plus, Trash2, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { categoryService } from "@/features/categories/services/category.service"
import { useAuthStore } from "@/features/auth/store/auth.store"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui/table"
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
          <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <Layers className="size-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 dark:text-white">Tambah Kategori Baru</h3>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Kategori *</label>
                <Input
                  placeholder="Contoh: Alat Kesehatan / Perkakas"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Deskripsi</label>
                <Input
                  placeholder="Keterangan kategori"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-indigo-600 py-5 font-semibold hover:bg-indigo-700"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : "Simpan Kategori"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Daftar Kategori */}
        <div className="min-w-0 w-full">
          <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">Daftar Kategori ({categories.length})</h3>
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
                      <TableCell wrap={false} className="font-semibold text-slate-900 dark:text-white">{c.name}</TableCell>
                      <TableCell wrap={true} className="max-w-[300px] text-slate-500">{c.description || "—"}</TableCell>
                      <TableCell wrap={false}>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {c.productCount ?? 0} Produk
                        </span>
                      </TableCell>
                      <TableCell wrap={false} className="text-right">
                        <div className="flex items-center justify-end">
                          {role === "Admin" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(c.id, c.name)}
                              className="size-8 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                              title="Hapus Kategori (Admin)"
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
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
