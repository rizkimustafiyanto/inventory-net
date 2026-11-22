"use client"

import { DashboardShell } from "@/components/layout"
import {
  useStockReports,
  ReportKpiCards,
  ReportFilterBar,
  ReportTable,
} from "@/features/reports"

export default function ReportsPage() {
  const {
    reports,
    loading,
    search,
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
  } = useStockReports()

  return (
    <DashboardShell title="Laporan & Valuasi Aset Stok">
      <div className="space-y-6">
        <ReportKpiCards
          totalValuation={totalValuation}
          totalClosingItems={totalClosingItems}
          totalStockIn={totalStockIn}
          totalStockOut={totalStockOut}
          totalSkus={totalSkus}
        />

        <ReportFilterBar
          search={search}
          onSearchChange={handleSearchChange}
          loading={loading}
          onExportCSV={handleExportCSV}
          onPrint={handlePrint}
          onRefresh={reload}
        />

        <ReportTable
          reports={reports}
          loading={loading}
          search={search}
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </DashboardShell>
  )
}
