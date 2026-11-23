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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2.5 sm:gap-3">
        <Input
          leftIcon={<Search className="size-4" />}
          placeholder="Cari SKU, nama produk, atau kategori..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:w-72 lg:w-80"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={onExportCSV}
          leftIcon={<Download className="size-4" />}
          className="flex-1 sm:flex-none"
        >
          Export CSV
        </Button>

        <Button
          variant="outline"
          onClick={onPrint}
          leftIcon={<Printer className="size-4" />}
          className="flex-1 sm:flex-none"
        >
          Cetak / PDF
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          icon={<RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />}
          title="Segarkan Data"
        />
      </div>
    </div>
  )
}
