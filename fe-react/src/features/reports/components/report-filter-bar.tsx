"use client"

import { Search, Download, Printer, RefreshCw } from "lucide-react"
import { Button, Input } from "@/components/ui"

interface ReportFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  loading: boolean
  onExportCSV: () => void
  onPrint: () => void
  onRefresh: () => void
}

export function ReportFilterBar({
  search,
  onSearchChange,
  loading,
  onExportCSV,
  onPrint,
  onRefresh,
}: ReportFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          leftIcon={<Search className="size-4" />}
          placeholder="Cari SKU, nama produk, atau kategori..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-72 sm:w-80"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportCSV}
          leftIcon={<Download className="size-4" />}
        >
          Export CSV
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onPrint}
          leftIcon={<Printer className="size-4" />}
        >
          Cetak / PDF
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRefresh}
          disabled={loading}
          icon={<RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />}
          title="Segarkan Data"
        />
      </div>
    </div>
  )
}
