"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, UserCircle, Radio } from "lucide-react"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { ProfileModal } from "@/features/auth"
import { Button } from "@/components/ui"
import { useInventorySocket } from "@/lib/socket"
import { cn } from "@/lib/utils"

type DashboardTopbarProps = {
  title: string
}

export function DashboardTopbar({ title }: DashboardTopbarProps) {
  const router = useRouter()
  const { user, role, logout, updateUser } = useAuthStore()
  const { isConnected, subscribeUserAvatarUpdated } = useInventorySocket()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Real-time synchronization for avatar update across devices / tabs
  useEffect(() => {
    const unsub = subscribeUserAvatarUpdated((event) => {
      if (user && user.userId === event.userId) {
        updateUser({ avatarUrl: event.avatarUrl })
      }
    })
    return unsub
  }, [subscribeUserAvatarUpdated, user, updateUser])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const resolveAvatar = (url?: string | null) => {
    if (!url) return null
    if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }
    const cleanBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "")
    const cleanUrl = url.startsWith("/") ? url : `/${url}`
    return `${cleanBase}${cleanUrl}`
  }

  const avatarSrc = resolveAvatar(user?.avatarUrl || user?.avatar)

  const initials = (user?.fullName || user?.username || "Admin")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <>
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 sm:px-6 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Real-time WebSocket Live Sync Status Indicator */}
          <div
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-800/60"
            title={isConnected ? "WebSocket Real-time Terhubung (Live Sync Aktif)" : "Menghubungkan ke Real-time Server..."}
          >
            <span
              className={cn(
                "size-2 rounded-full transition-all duration-300",
                isConnected ? "bg-emerald-500 shadow-xs shadow-emerald-400 animate-pulse" : "bg-amber-400"
              )}
            />
            <span className="hidden text-[11px] font-medium text-slate-600 sm:inline dark:text-slate-400">
              {isConnected ? "Live Sync" : "Connecting..."}
            </span>
          </div>

          {/* Interactive User Profile Trigger */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="group flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 text-sm transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-xs dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/40 cursor-pointer"
            title="Kelola Profil & Foto Pengguna"
          >
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt="Avatar"
                className="size-7 rounded-full object-cover ring-1 ring-indigo-500/30"
              />
            ) : (
              <div className="flex size-7 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white shadow-xs">
                {initials || <UserCircle className="size-4" />}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-left">
              <span className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                {user?.fullName || user?.username || "Admin"}
              </span>
              <span className="rounded-md bg-indigo-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {role || "Staff"}
              </span>
            </div>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="size-4" />}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50"
          >
            Keluar
          </Button>
        </div>
      </header>

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  )
}
