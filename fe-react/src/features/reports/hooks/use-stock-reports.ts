"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { reportService } from "../services/report.service"
import { useDebounce } from "@/hooks"
import type { StockReport, PaginationMeta } from "@/types"

export function useStockReports() {
  const [reports, setReports] = useState<StockReport[]>([])
  const [allReports, setAllReports] = useState<StockReport[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Pagination state (Server-Side)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 350)
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
        search: debouncedSearch.trim() || undefined,
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
  }, [page, pageSize, debouncedSearch])

  const reload = useCallback(() => {
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
  const totalSkus = allReports.length

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

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
    link.setAttribute(
      "download",
      `laporan_stok_inventaris_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success(`Berhasil mengunduh ${exportData.length} baris data laporan CSV!`)
  }

  const handlePrint = () => {
    window.print()
  }

  return {
    reports,
    allReports,
    loading,
    search,
    page,
    pageSize,
    meta,
    totalValuation,
    totalClosingItems,
    totalStockIn,
    totalStockOut,
    totalSkus,
    setPage,
    handleSearchChange,
    handlePageSizeChange,
    handleExportCSV,
    handlePrint,
    reload,
  }
}
