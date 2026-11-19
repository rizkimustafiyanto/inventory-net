"use client"

import { useRouter } from "next/navigation"
import { LogOut, UserCircle } from "lucide-react"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { Button } from "@/components/ui"

type DashboardTopbarProps = {
  title: string
}

export function DashboardTopbar({ title }: DashboardTopbarProps) {
  const router = useRouter()
  const { user, role, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 sm:px-6 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <UserCircle className="size-5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-medium text-slate-900 dark:text-white">
            {user?.fullName || user?.username || "Admin"}
          </span>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            {role || "Staff"}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50"
        >
          <LogOut className="size-4" />
          <span>Keluar</span>
        </Button>
      </div>
    </header>
  )
}
