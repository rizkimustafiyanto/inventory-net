"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/layout"
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
import { useAuthStore } from "@/features/auth/store/auth.store"
import { userService } from "@/features/users/services/user.service"
import type { User, CreateUserPayload } from "@/types"

export default function UsersPage() {
  const { role } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Modal create
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateUserPayload>({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: 2, // 1: Admin, 2: Staff, 3: Manager
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await userService.getAll()
      if (res.success && res.data) {
        setUsers(res.data)
      }
    } catch {
      toast.error("Gagal memuat daftar pengguna")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password) {
      toast.error("Username dan password wajib diisi")
      return
    }

    try {
      setSubmitting(true)
      const res = await userService.create(form)
      if (res.success) {
        toast.success("Pengguna baru berhasil didaftarkan!")
        setIsModalOpen(false)
        setForm({
          username: "",
          email: "",
          password: "",
          fullName: "",
          role: 2,
        })
        loadData()
      } else {
        toast.error(res.message || "Gagal menambah pengguna")
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal menambah pengguna"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (user: User) => {
    if (user.username === "admin") {
      toast.error("Akun administrator utama tidak dapat dinonaktifkan")
      return
    }

    try {
      const res = await userService.updateStatus(user.id, !user.isActive)
      if (res.success) {
        toast.success(`Status ${user.username} berhasil diubah`)
        loadData()
      } else {
        toast.error(res.message || "Gagal memperbarui status")
      }
    } catch {
      toast.error("Gagal memperbarui status pengguna")
    }
  }

  const handleDelete = async (user: User) => {
    if (user.username === "admin") {
      toast.error("Akun administrator utama tidak dapat dihapus")
      return
    }

    if (!confirm(`Hapus akun pengguna "${user.username}"?`)) return

    try {
      const res = await userService.delete(user.id)
      if (res.success) {
        toast.success("Pengguna berhasil dihapus")
        loadData()
      } else {
        toast.error(res.message || "Gagal menghapus pengguna")
      }
    } catch {
      toast.error("Gagal menghapus pengguna")
    }
  }

  if (role && role !== "Admin") {
    return (
      <DashboardShell title="Manajemen Pengguna">
        <Card className="p-8 text-center">
          <Shield className="mx-auto size-12 text-amber-500" />
          <h3 className="mt-3 text-lg font-bold text-slate-900">Akses Terbatas</h3>
          <p className="mt-1 text-sm text-slate-500">
            Halaman ini khusus untuk peran Administrator (Super Admin).
          </p>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell title="Manajemen Pengguna (m_user)">
      <div className="space-y-6">
        {/* Header Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                Daftar Akun Pengguna ({users.length})
              </h3>
              <p className="text-xs text-slate-500">
                Kelola hak akses role Admin, Staff Gudang, dan Supervisor
              </p>
            </div>
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
              onClick={() => setIsModalOpen(true)}
              leftIcon={<UserPlus className="size-4" />}
            >
              Tambah Pengguna
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
          <Table minWidth="750px">
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran (Role)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="w-[88px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableEmpty colSpan={6} loading={loading} message="Belum ada data pengguna." />
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell wrap={true} className="max-w-[200px]">
                      <div className="font-semibold text-foreground">
                        {u.fullName || u.username}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">@{u.username}</div>
                    </TableCell>
                    <TableCell wrap={false} className="text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell wrap={false}>
                      <Badge
                        variant={
                          u.roleName === "Admin"
                            ? "brand"
                            : u.roleName === "Manager"
                            ? "purple"
                            : "info"
                        }
                      >
                        {u.roleName === "Admin"
                          ? "Super Admin"
                          : u.roleName === "Manager"
                          ? "Supervisor"
                          : "Staff Gudang"}
                      </Badge>
                    </TableCell>
                    <TableCell wrap={false}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        className="inline-flex items-center gap-1.5 cursor-pointer"
                        title="Klik untuk ubah status"
                      >
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="size-3.5" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <XCircle className="size-3.5" />
                            Nonaktif
                          </span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell wrap={false} className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell wrap={false} className="text-right">
                      <div className="flex items-center justify-end">
                        {u.username !== "admin" ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(u)}
                            className="text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Hapus Pengguna"
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

        {/* Modal Tambah User */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <Card className="w-full max-w-md rounded-3xl border-border bg-card p-6 shadow-modal">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="size-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">
                    Tambah Pengguna Baru
                  </h3>
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
                <FormField label="Username" required>
                  <Input
                    placeholder="Contoh: staff_gudang1"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </FormField>

                <FormField label="Nama Lengkap" required>
                  <Input
                    placeholder="Contoh: Budi Santoso"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </FormField>

                <FormField label="Email" required>
                  <Input
                    type="email"
                    placeholder="budi@inventory.local"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </FormField>

                <FormField label="Password" required>
                  <Input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </FormField>

                <FormField label="Peran (Role)" required>
                  <NativeSelect
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: Number(e.target.value) })}
                    required
                  >
                    <option value={2}>Staff Gudang (Operasional Mutasi)</option>
                    <option value={3}>Supervisor / Manager (Laporan & Monitoring)</option>
                    <option value={1}>Administrator (Super Admin)</option>
                  </NativeSelect>
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
                    Simpan Pengguna
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
