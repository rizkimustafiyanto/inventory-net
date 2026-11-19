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
} from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/layout"
import {
  Button,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui"
import { reportService } from "@/features/reports/services/report.service"
import type { StockReport } from "@/types"

export default function ReportsPage() {
  const [reports, setReports] = useState<StockReport[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await reportService.getStockSummary()
      if (res.success && res.data) {
        setReports(res.data)
      }
    } catch {
      toast.error("Gagal memuat data laporan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Summary Metrics
  const totalValuation = reports.reduce((acc, r) => acc + (r.totalStockValue || 0), 0)
  const totalClosingItems = reports.reduce((acc, r) => acc + (r.closingStock || 0), 0)
  const totalStockIn = reports.reduce((acc, r) => acc + (r.totalIn || 0), 0)
  const totalStockOut = reports.reduce((acc, r) => acc + (r.totalOut || 0), 0)

  // Export CSV
  const handleExportCSV = () => {
    if (reports.length === 0) {
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

    const rows = reports.map((r) => [
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

    toast.success("File CSV laporan berhasil diunduh!")
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <DashboardShell title="Laporan & Valuasi Aset Stok">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-slate-200 p-5 shadow-xs dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Valuasi Total Aset</span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Coins className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                Rp {totalValuation.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-500">Nilai fisik seluruh stok</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 p-5 shadow-xs dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Stok Fisik</span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <PackageCheck className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {totalClosingItems} Unit
              </div>
              <p className="text-xs text-slate-500">{reports.length} jenis SKU terdata</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 p-5 shadow-xs dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Akumulasi Masuk (+)</span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                <TrendingUp className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-sky-600 dark:text-sky-400">
                +{totalStockIn} Unit
              </div>
              <p className="text-xs text-slate-500">Total restock barang</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 p-5 shadow-xs dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Akumulasi Keluar (-)</span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <TrendingUp className="size-5 rotate-180" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                -{totalStockOut} Unit
              </div>
              <p className="text-xs text-slate-500">Total penggunaan/penjualan</p>
            </div>
          </Card>
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white">Laporan Stok & Tabel (r_stock_summary)</h3>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 rounded-xl text-slate-700 dark:text-slate-200"
            >
              <Download className="size-4" />
              <span>Export CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 rounded-xl text-slate-700 dark:text-slate-200"
            >
              <Printer className="size-4" />
              <span>Cetak / PDF</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="rounded-xl text-slate-500"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
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
                <TableEmpty colSpan={9} loading={loading} message="Belum ada rekaman laporan stok." />
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
                    <TableCell wrap={false} className="text-center font-mono text-xs text-slate-500">
                      {r.openingStock}
                    </TableCell>
                    <TableCell wrap={false} className="text-center font-mono text-xs font-semibold text-emerald-600">
                      +{r.totalIn}
                    </TableCell>
                    <TableCell wrap={false} className="text-center font-mono text-xs font-semibold text-rose-600">
                      -{r.totalOut}
                    </TableCell>
                    <TableCell wrap={false} className="text-center font-bold text-slate-900 dark:text-white">
                      {r.closingStock}
                    </TableCell>
                    <TableCell wrap={false} className="text-right text-xs text-slate-600 dark:text-slate-300">
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
        </Card>
      </div>
    </DashboardShell>
  )
}
