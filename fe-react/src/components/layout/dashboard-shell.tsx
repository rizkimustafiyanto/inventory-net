"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Boxes,
  LayoutDashboard,
  Package,
  Layers,
  ArrowLeftRight,
  BarChart3,
  Users,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { cn } from "@/lib/utils"
import { DashboardTopbar } from "./dashboard-topbar"

const baseNavItems = [
  { label: "Ringkasan Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Katalog Produk", href: "/dashboard/products", icon: Package },
  { label: "Mutasi & Stok", href: "/dashboard/stocks", icon: ArrowLeftRight },
  { label: "Kategori Barang", href: "/dashboard/categories", icon: Layers },
  { label: "Laporan & Nilai Aset", href: "/dashboard/reports", icon: BarChart3 },
]

type DashboardShellProps = {
  title: string
  children: React.ReactNode
}

export function DashboardShell({ title, children }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, initAuth, role } = useAuthStore()

  const navItems = [
    ...baseNavItems,
    ...(role === "Admin" ? [{ label: "Manajemen Pengguna", href: "/dashboard/users", icon: Users }] : []),
  ]

  useEffect(() => {
    initAuth()
  }, [initAuth])

  useEffect(() => {
    // If not authenticated and checking finished, redirect to login
    const token = typeof window !== "undefined" ? localStorage.getItem("inventory_auth_token") : null
    if (!token && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="w-full space-y-4 lg:w-[260px]">
          <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white/95 p-0 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
            <div className="space-y-6 p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none">
                  <Boxes className="size-6" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 dark:text-white">InventoryNet</h1>
                  <p className="text-xs text-slate-500">Sistem Gudang & Stok</p>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs text-indigo-900 dark:border-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-300">
                <p className="font-semibold">Backend .NET 8 + Oracle</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Clean Architecture & EF Core</p>
              </div>
            </div>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 w-full space-y-6">
          <DashboardTopbar title={title} />
          {children}
        </main>
      </div>
    </div>
  )
}
