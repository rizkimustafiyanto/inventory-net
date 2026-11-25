"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Boxes, Lock, User, ArrowRight, ArrowLeft, KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button, Card, FormField, Input } from "@/components/ui"
import { authService } from "@/features/auth/services/auth.service"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { ForgotPasswordModal } from "@/features/auth"
import { TOKEN_STORAGE_KEY } from "@/lib/api/client"

export default function LoginPage() {
  const router = useRouter()
  const { setAuth, initAuth, isAuthenticated } = useAuthStore()

  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("admin123")
  const [loading, setLoading] = useState(false)
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Redirect if already authenticated
  useEffect(() => {
    initAuth()
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null
    if (token || isAuthenticated) {
      router.replace("/dashboard")
    } else {
      queueMicrotask(() => setCheckingAuth(false))
    }
  }, [router, initAuth, isAuthenticated])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      toast.error("Harap isi username dan password")
      return
    }

    try {
      setLoading(true)
      const res = await authService.login({ username, password })
      if (res.success && res.data) {
        setAuth(res.data)
        toast.success(`Selamat datang, ${res.data.fullName || res.data.username}!`)
        router.push("/dashboard")
      } else {
        toast.error(res.message || "Gagal masuk ke sistem")
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Koneksi ke backend gagal"
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="size-8 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Memeriksa status login...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md">
        {/* Navigasi Kembali ke Landing Page */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            <ArrowLeft className="size-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
          <div className="p-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <Boxes className="size-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                InventoryNet
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Masuk untuk mengelola stok & pergerakan inventaris
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <FormField label="Username" required>
                <Input
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  leftIcon={<User className="size-4" />}
                  required
                />
              </FormField>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Password <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
                  >
                    <KeyRound className="size-3" />
                    Lupa Password?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="size-4" />}
                  required
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                rightIcon={<ArrowRight className="size-4" />}
                className="mt-2 w-full py-5 text-sm font-semibold"
              >
                Masuk ke Dashboard
              </Button>
            </form>

            {/* Quick preset credentials */}
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Akun Pengujian Bawaan:</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUsername("admin")
                    setPassword("admin123")
                  }}
                  className="rounded-lg bg-white px-2.5 py-1 font-mono text-[11px] shadow-xs border border-slate-200 transition hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 cursor-pointer"
                >
                  admin / admin123
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsername("staff")
                    setPassword("staff123")
                  }}
                  className="rounded-lg bg-white px-2.5 py-1 font-mono text-[11px] shadow-xs border border-slate-200 transition hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 cursor-pointer"
                >
                  staff / staff123
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        onSuccessReset={(verifiedUser) => {
          setUsername(verifiedUser)
          setPassword("")
        }}
      />
    </div>
  )
}
