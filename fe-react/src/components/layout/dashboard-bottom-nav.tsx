"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Layers,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardBottomNavProps {
  onOpenMobileMenu: () => void
}

export function DashboardBottomNav({ onOpenMobileMenu }: DashboardBottomNavProps) {
  const pathname = usePathname()

  const tabs = [
    {
      label: "Ringkasan",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      label: "Produk",
      href: "/dashboard/products",
      icon: Package,
      isActive: pathname.startsWith("/dashboard/products"),
    },
    {
      label: "Mutasi",
      href: "/dashboard/stocks",
      icon: ArrowLeftRight,
      isActive: pathname.startsWith("/dashboard/stocks"),
    },
    {
      label: "Kategori",
      href: "/dashboard/categories",
      icon: Layers,
      isActive: pathname.startsWith("/dashboard/categories"),
    },
  ]

  // Check if current route is a secondary route (reports, users, etc.)
  const isOtherActive =
    pathname.startsWith("/dashboard/reports") || pathname.startsWith("/dashboard/users")

  return (
    <nav
      aria-label="Mobile Bottom Navigation Bar"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-900/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-center px-1.5 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.35rem)]">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "group flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 px-1 transition-all",
                tab.isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              )}
            >
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg transition-colors",
                  tab.isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
                )}
              >
                <Icon className="size-4 shrink-0" />
              </div>
              <span className="text-[10px] tracking-tight leading-tight">
                {tab.label}
              </span>
              {tab.isActive && (
                <span className="size-1 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-in fade-in zoom-in" />
              )}
            </Link>
          )
        })}

        {/* 5th Tab: Menu / Lainnya (opens slide-over drawer) */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className={cn(
            "group flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 px-1 transition-all cursor-pointer",
            isOtherActive
              ? "text-indigo-600 dark:text-indigo-400 font-semibold"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          )}
          title="Buka Menu Lengkap"
        >
          <div
            className={cn(
              "flex size-7 items-center justify-center rounded-lg transition-colors",
              isOtherActive
                ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
            )}
          >
            <Menu className="size-4 shrink-0" />
          </div>
          <span className="text-[10px] tracking-tight leading-tight">
            Menu
          </span>
          {isOtherActive && (
            <span className="size-1 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-in fade-in zoom-in" />
          )}
        </button>
      </div>
    </nav>
  )
}
