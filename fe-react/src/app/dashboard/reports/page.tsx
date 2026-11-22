"use client"

import { useEffect, useState, useCallback } from "react"
import {
  BarChart3,
  Download,
  Printer,
  RefreshCw,
  Coins,
  PackageCheck,
  TrendingUp,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/layout"
import { PaginationControl } from "@/components/shared"
import {
  Button,
  Card,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui"
import { reportService } from "@/features/reports/services/report.service"
import type { StockReport, PaginationMeta } from "@/types"

export default function ReportsPage() {
  const [reports, setReports] = useState<StockReport[]>([])
  const [allReports, setAllReports] = useState<StockReport[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Pagination state (Server-Side)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined)

  const loadKpis = useCallback(async () => {
    try {
      const allRes = await reportService.getAllStockSummary()
      if (allRes.success && allRes.data) {
        setAllReports(allRes.data)
      }
    } catch {
      // ignore
    }
  }, [])

  const loadPagedReports = useCallback(async () => {
    try {
      setLoading(true)
      const pagedRes = await reportService.getPagedStockSummary({
        pageNumber: page,
        pageSize,
        search: search.trim() || undefined,
      })

      if (pagedRes.success && pagedRes.data) {
        setReports(pagedRes.data)
        if (pagedRes.meta) setMeta(pagedRes.meta)
      }
    } catch {
      toast.error("Gagal memuat data laporan")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  const loadData = useCallback(() => {
    loadKpis()
    loadPagedReports()
  }, [loadKpis, loadPagedReports])

  useEffect(() => {
    loadKpis()
  }, [loadKpis])

  useEffect(() => {
    loadPagedReports()
  }, [loadPagedReports])

  // Summary Metrics (dihitung dari seluruh snapshot server)
  const totalValuation = allReports.reduce((acc, r) => acc + (r.totalStockValue || 0), 0)
  const totalClosingItems = allReports.reduce((acc, r) => acc + (r.closingStock || 0), 0)
  const totalStockIn = allReports.reduce((acc, r) => acc + (r.totalIn || 0), 0)
  const totalStockOut = allReports.reduce((acc, r) => acc + (r.totalOut || 0), 0)

  // Export CSV
  const handleExportCSV = () => {
    const exportData = allReports.length > 0 ? allReports : reports
    if (exportData.length === 0) {
      toast.error("Tidak ada data untuk diekspor")
      return
    }

    const headers = [
      "Tanggal",
      "SKU",
      "Nama Produk",
      "Kategori",
      "Stok Awal",
      "Masuk",
      "Keluar",
      "Stok Akhir",
      "Harga Satuan",
      "Total Nilai Aset",
    ]

    const rows = exportData.map((r) => [
      new Date(r.reportDate).toLocaleDateString("id-ID"),
      r.productSku,
      `"${r.productName.replace(/"/g, '""')}"`,
      `"${r.categoryName || ""}"`,
      r.openingStock,
      r.totalIn,
      r.totalOut,
      r.closingStock,
      r.unitPrice,
      r.totalStockValue,
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `laporan_stok_inventaris_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success(`Berhasil mengunduh ${exportData.length} baris data laporan CSV!`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <DashboardShell title="Laporan & Valuasi Aset Stok">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Valuasi Total Aset</span>
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                  <Coins className="size-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 tabular-nums dark:text-emerald-400">
                  Rp {totalValuation.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>Nilai fisik seluruh stok aktif</span>
            </div>
          </Card>

          <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Stok Fisik</span>
                <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
                  <PackageCheck className="size-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
                  {totalClosingItems}
                </span>
                <span className="text-xs font-medium text-slate-400">Unit</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span className="size-1.5 rounded-full bg-indigo-500" />
              <span>{allReports.length} jenis SKU terdata</span>
            </div>
          </Card>

          <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">Akumulasi Masuk (+)</span>
                <div className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400">
                  <TrendingUp className="size-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sky-600 tabular-nums dark:text-sky-400">
                  +{totalStockIn}
                </span>
                <span className="text-xs font-medium text-sky-600/70">Unit</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 border-t border-sky-100 pt-3 text-xs text-sky-600 dark:border-slate-800 dark:text-sky-400">
              <span className="size-1.5 rounded-full bg-sky-500" />
              <span>Total restock barang masuk</span>
            </div>
          </Card>

          <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">Akumulasi Keluar (-)</span>
                <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400">
                  <TrendingUp className="size-5 rotate-180" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-600 tabular-nums dark:text-rose-400">
                  -{totalStockOut}
                </span>
                <span className="text-xs font-medium text-rose-600/70">Unit</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 border-t border-rose-100 pt-3 text-xs text-rose-600 dark:border-slate-800 dark:text-rose-400">
              <span className="size-1.5 rounded-full bg-rose-500" />
              <span>Total penjualan / pemakaian</span>
            </div>
          </Card>
        </div>

        {/* Action & Filter Row */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              leftIcon={<Search className="size-4" />}
              placeholder="Cari SKU, nama produk, atau kategori..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-72 sm:w-80"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="size-4" />}
            >
              Export CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="size-4" />}
            >
              Cetak / PDF
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={loadData}
              disabled={loading}
              icon={<RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />}
              title="Segarkan Data"
            />
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
          <Table minWidth="950px" wrapHeader={false} wrapBody={false}>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>SKU & Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">Awal</TableHead>
                <TableHead className="text-center">Masuk (+)</TableHead>
                <TableHead className="text-center">Keluar (-)</TableHead>
                <TableHead className="text-center">Akhir</TableHead>
                <TableHead className="text-right">Harga Satuan</TableHead>
                <TableHead className="text-right">Nilai Aset</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableEmpty
                  colSpan={9}
                  loading={loading}
                  message={search ? `Tidak ada rekaman laporan yang cocok dengan "${search}".` : "Belum ada rekaman laporan stok."}
                />
              ) : (
                reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell wrap={false} className="text-xs text-muted-foreground">
                      {new Date(r.reportDate).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell wrap={true} className="max-w-[220px]">
                      <div className="font-semibold text-foreground">{r.productName}</div>
                      <div className="text-xs font-mono text-muted-foreground">{r.productSku}</div>
                    </TableCell>
                    <TableCell wrap={false} className="text-muted-foreground">
                      {r.categoryName || "—"}
                    </TableCell>
                    <TableCell wrap={false} className="text-center font-mono text-xs text-muted-foreground">
                      {r.openingStock}
                    </TableCell>
                    <TableCell wrap={false} className="text-center font-mono text-xs font-semibold text-emerald-600">
                      +{r.totalIn}
                    </TableCell>
                    <TableCell wrap={false} className="text-center font-mono text-xs font-semibold text-rose-600">
                      -{r.totalOut}
                    </TableCell>
                    <TableCell wrap={false} className="text-center font-bold text-foreground">
                      {r.closingStock}
                    </TableCell>
                    <TableCell wrap={false} className="text-right text-xs text-muted-foreground">
                      Rp {r.unitPrice.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell wrap={false} className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      Rp {r.totalStockValue.toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Server-Side Pagination */}
          <PaginationControl
            meta={meta}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
            disabled={loading}
          />
        </Card>
      </div>
    </DashboardShell>
  )
}
