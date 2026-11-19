"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Boxes, Lock, User, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button, Card, Input } from "@/components/ui"
import { authService } from "@/features/auth/services/auth.service"
import { useAuthStore } from "@/features/auth/store/auth.store"

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("admin123")
  const [loading, setLoading] = useState(false)

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
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Koneksi ke backend gagal"
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
      <Card className="w-full max-w-md overflow-hidden rounded-3xl border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 w-full gap-2 rounded-xl py-5 text-sm font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="size-4" />
                </>
              )}
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
                className="rounded-lg bg-white px-2 py-1 font-mono text-[11px] shadow-xs border border-slate-200 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600"
              >
                admin / admin123
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername("staff")
                  setPassword("staff123")
                }}
                className="rounded-lg bg-white px-2 py-1 font-mono text-[11px] shadow-xs border border-slate-200 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600"
              >
                staff / staff123
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
