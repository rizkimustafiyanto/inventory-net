"use client"

import { useState, useEffect } from "react"
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
  Globe,
  X,
} from "lucide-react"
import { Card, Button } from "@/components/ui"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { cn } from "@/lib/utils"
import { DashboardTopbar } from "./dashboard-topbar"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const baseNavItems: NavItem[] = [
  { label: "Ringkasan Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Katalog Produk", href: "/dashboard/products", icon: Package },
  { label: "Mutasi & Stok", href: "/dashboard/stocks", icon: ArrowLeftRight },
  { label: "Kategori Barang", href: "/dashboard/categories", icon: Layers },
  { label: "Laporan & Nilai Aset", href: "/dashboard/reports", icon: BarChart3 },
]

interface SidebarContentProps {
  pathname: string
  navItems: NavItem[]
  onItemClick?: () => void
  onClose?: () => void
  showCloseButton?: boolean
}

function SidebarContent({
  pathname,
  navItems,
  onItemClick,
  onClose,
  showCloseButton = false,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-6">
        {/* Brand header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <Boxes className="size-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white">InventoryNet</h1>
              <p className="text-xs text-slate-500">Sistem Gudang & Stok</p>
            </div>
          </div>
          {showCloseButton && onClose && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="lg:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              title="Tutup Menu"
              icon={<X className="size-4" />}
            />
          )}
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
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

        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* Public Website Link */}
        <div>
          <Link
            href="/"
            onClick={onItemClick}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <Globe className="size-4 shrink-0 text-slate-400" />
            <span>Lihat Web Publik</span>
          </Link>
        </div>
      </div>

      {/* Footer Info Badge */}
      <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs text-indigo-900 dark:border-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-300">
        <p className="font-semibold">Backend .NET 8 + Oracle</p>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Clean Architecture & EF Core</p>
      </div>
    </div>
  )
}

type DashboardShellProps = {
  title: string
  children: React.ReactNode
}

export function DashboardShell({ title, children }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, initAuth, role } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  // Automatically close mobile menu when navigating to another route
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileMenuOpen])

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Desktop Sidebar (hidden on mobile/tablet screens < lg) */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-6 self-start space-y-4">
          <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white/95 p-0 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
            <div className="p-6">
              <SidebarContent pathname={pathname} navItems={navItems} />
            </div>
          </Card>
        </aside>

        {/* Mobile Navigation Slide-Over Drawer (< lg) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-over Drawer Panel */}
            <div className="fixed inset-y-0 left-0 z-50 flex w-full max-w-xs flex-col bg-white shadow-2xl transition-transform animate-in slide-in-from-left duration-300 dark:bg-slate-900">
              <div className="h-2 shrink-0 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
              <div className="flex-1 overflow-y-auto p-6">
                <SidebarContent
                  pathname={pathname}
                  navItems={navItems}
                  onItemClick={() => setIsMobileMenuOpen(false)}
                  onClose={() => setIsMobileMenuOpen(false)}
                  showCloseButton={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="min-w-0 w-full space-y-6">
          <DashboardTopbar
            title={title}
            onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          {children}
        </main>
      </div>
    </div>
  )
}
