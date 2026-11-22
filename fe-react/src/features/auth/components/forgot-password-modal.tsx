"use client"

import { useState } from "react"
import { KeyRound, Lock, User, CheckCircle2, ArrowRight, X } from "lucide-react"
import { toast } from "sonner"
import { Button, Card, FormField, Input } from "@/components/ui"
import { authService } from "../services/auth.service"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessReset?: (username: string) => void
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  onSuccessReset,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"verify" | "reset">("verify")
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [verifiedUsername, setVerifiedUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usernameOrEmail.trim()) {
      toast.error("Harap masukkan username atau email akun Anda")
      return
    }

    try {
      setLoading(true)
      const res = await authService.forgotPassword({ usernameOrEmail: usernameOrEmail.trim() })
      if (res.success && res.data) {
        setResetToken(res.data.resetToken)
        setVerifiedUsername(res.data.username)
        setStep("reset")
        toast.success(res.message || "Akun terverifikasi. Silakan atur password baru.")
      } else {
        toast.error(res.message || "Akun tidak ditemukan")
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal memverifikasi akun"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok")
      return
    }

    try {
      setLoading(true)
      const res = await authService.resetPassword({
        usernameOrEmail: verifiedUsername || usernameOrEmail,
        resetToken,
        newPassword,
      })

      if (res.success) {
        toast.success("Password berhasil diperbarui! Silakan masuk dengan password baru.")
        onSuccessReset?.(verifiedUsername || usernameOrEmail)
        handleClose()
      } else {
        toast.error(res.message || "Gagal memperbarui password")
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal mereset password"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep("verify")
    setUsernameOrEmail("")
    setResetToken("")
    setVerifiedUsername("")
    setNewPassword("")
    setConfirmPassword("")
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-md overflow-hidden rounded-3xl border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <KeyRound className="size-4" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {step === "verify" ? "Lupa Password" : "Atur Password Baru"}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            icon={<X className="size-4" />}
            title="Tutup"
          />
        </div>

        <div className="p-6">
          {step === "verify" ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Masukkan <strong>Username</strong> atau <strong>Email</strong> yang terdaftar pada akun Anda. Sistem akan memverifikasi identitas akun untuk pembaruan password.
              </p>

              <FormField label="Username atau Email" required>
                <Input
                  placeholder="Contoh: admin atau staff@inventory.local"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  leftIcon={<User className="size-4" />}
                  autoFocus
                  required
                />
              </FormField>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Batal
                </Button>
                <Button type="submit" loading={loading} rightIcon={<ArrowRight className="size-4" />}>
                  Verifikasi Akun
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Akun <strong>@{verifiedUsername}</strong> terverifikasi. Masukkan password baru di bawah ini.
                </span>
              </div>

              <FormField label="Password Baru" required>
                <Input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  leftIcon={<Lock className="size-4" />}
                  autoFocus
                  required
                />
              </FormField>

              <FormField label="Konfirmasi Password Baru" required>
                <Input
                  type="password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="size-4" />}
                  required
                />
              </FormField>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep("verify")}>
                  Kembali
                </Button>
                <Button type="submit" loading={loading} leftIcon={<KeyRound className="size-4" />}>
                  Simpan Password Baru
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  )
}
