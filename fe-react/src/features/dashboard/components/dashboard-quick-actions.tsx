"use client"

import Link from "next/link"
import { ArrowLeftRight, PlusCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui"

interface DashboardQuickActionsProps {
  loading: boolean
  onRefresh: () => void
}

export function DashboardQuickActions({ loading, onRefresh }: DashboardQuickActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Aksi Cepat:
        </span>
        <Link href="/dashboard/stocks">
          <Button size="sm" leftIcon={<ArrowLeftRight className="size-3.5" />}>
            Catat Mutasi Stok
          </Button>
        </Link>
        <Link href="/dashboard/products">
          <Button size="sm" variant="outline" leftIcon={<PlusCircle className="size-3.5" />}>
            Tambah Produk
          </Button>
        </Link>
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={onRefresh}
        disabled={loading}
        leftIcon={<RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />}
        className="text-slate-500"
      >
        Segarkan Data
      </Button>
    </div>
  )
}
