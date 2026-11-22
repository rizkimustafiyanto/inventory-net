"use client"

import { useState, useEffect } from "react"
import {
  UserCircle,
  Mail,
  Shield,
  KeyRound,
  CheckCircle2,
  X,
  Lock,
  Save,
  Clock,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Button, Card, FormField, Input, Badge } from "@/components/ui"
import { ImageUploader } from "@/components/shared"
import { useAuthStore } from "../store/auth.store"
import { authService } from "../services/auth.service"
import type { ProcessedImageResult } from "@/lib/image"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, role, updateUser } = useAuthStore()

  const [activeTab, setActiveTab] = useState<"profile" | "password" | "security">("profile")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "")
      setEmail(user.email || "")
      setAvatar(user.avatar || null)
    }
  }, [user])

  if (!isOpen) return null

  const handleAvatarUploaded = (result: ProcessedImageResult) => {
    setAvatar(result.dataUrl)
    updateUser({ avatar: result.dataUrl })
    toast.success(`Foto profil dikonversi ke WebP (${result.compressedFormattedSize}, hemat ${result.savingsPercent}%)`)
  }

  const handleAvatarRemoved = () => {
    setAvatar(null)
    updateUser({ avatar: undefined })
    toast.info("Foto profil dihapus")
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      toast.error("Nama lengkap dan email tidak boleh kosong")
      return
    }

    try {
      setSavingProfile(true)
      const res = await authService.updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
      })

      if (res.success && res.data) {
        updateUser({
          fullName: res.data.fullName,
          email: res.data.email,
          avatar: avatar || undefined,
        })
        toast.success("Profil Anda berhasil diperbarui!")
      } else {
        toast.error(res.message || "Gagal memperbarui profil")
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal memperbarui profil"
      toast.error(msg)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      toast.error("Harap masukkan password saat ini")
      return
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru tidak cocok")
      return
    }

    try {
      setSavingPassword(true)
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
      })

      if (res.success) {
        toast.success("Password Anda berhasil diubah!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setActiveTab("profile")
      } else {
        toast.error(res.message || "Gagal mengubah password")
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal mengubah password"
      toast.error(msg)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-lg overflow-hidden rounded-3xl border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <UserCircle className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Profil Pengguna</h3>
              <p className="text-xs text-muted-foreground">Kelola informasi akun & keamanan Anda</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            icon={<X className="size-4" />}
            title="Tutup"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-muted/30 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "profile"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Data Akun
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("password")}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "password"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Ubah Password
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "security"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Hak Akses & Sesi
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* WebP Avatar Uploader */}
              <div className="flex flex-col items-center justify-center pb-2">
                <ImageUploader
                  currentImageUrl={avatar}
                  onImageUploaded={handleAvatarUploaded}
                  onImageRemoved={handleAvatarRemoved}
                  variant="avatar"
                  size="md"
                  fallbackName={fullName || user?.username || "Admin"}
                />
                <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Sparkles className="size-3 text-indigo-500" />
                  Konversi otomatis ke format WebP terkompresi
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Username (Tetap)">
                  <Input
                    value={`@${user?.username || ""}`}
                    disabled
                    className="bg-muted/50 cursor-not-allowed font-mono text-xs"
                  />
                </FormField>

                <FormField label="Peran / Role">
                  <div className="flex h-9 items-center px-1">
                    <Badge variant={role === "Admin" ? "brand" : role === "Manager" ? "purple" : "info"}>
                      {role === "Admin" ? "Super Admin" : role === "Manager" ? "Supervisor" : "Staff Gudang"}
                    </Badge>
                  </div>
                </FormField>
              </div>

              <FormField label="Nama Lengkap" required>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  required
                />
              </FormField>

              <FormField label="Email" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alamat@email.com"
                  leftIcon={<Mail className="size-4" />}
                  required
                />
              </FormField>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={onClose}>
                  Batal
                </Button>
                <Button type="submit" loading={savingProfile} leftIcon={<Save className="size-4" />}>
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <FormField label="Password Saat Ini" required>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password akun Anda saat ini"
                  leftIcon={<Lock className="size-4" />}
                  autoFocus
                  required
                />
              </FormField>

              <FormField label="Password Baru" required>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  leftIcon={<KeyRound className="size-4" />}
                  required
                />
              </FormField>

              <FormField label="Konfirmasi Password Baru" required>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  leftIcon={<KeyRound className="size-4" />}
                  required
                />
              </FormField>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setActiveTab("profile")}>
                  Batal
                </Button>
                <Button type="submit" loading={savingPassword} leftIcon={<Save className="size-4" />}>
                  Perbarui Password
                </Button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <div className="space-y-4 text-xs">
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Shield className="size-3.5 text-indigo-500" />
                    ID Akun:
                  </span>
                  <span className="font-mono font-semibold text-foreground">#{user?.userId || 1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    Status Akun:
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Aktif (Verified)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-sky-500" />
                    Otorisasi JWT:
                  </span>
                  <span className="font-medium text-foreground">Masa berlaku 24 Jam</span>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-indigo-900 dark:border-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-300">
                <p className="font-semibold">Hak Akses Role {role}:</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">
                  {role === "Admin"
                    ? "Memiliki hak penuh untuk mengelola pengguna, data master produk, transaksi pergerakan stok, dan laporan finansial aset."
                    : role === "Manager"
                    ? "Memiliki akses untuk melihat katalog produk, memantau riwayat mutasi stok, dan mengekspor laporan valuasi aset."
                    : "Memiliki akses operasional untuk mencatat mutasi stok masuk, stok keluar, dan opname fisik."}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
