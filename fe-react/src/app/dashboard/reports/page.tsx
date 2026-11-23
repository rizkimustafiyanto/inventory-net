"use client"

import { DashboardShell } from "@/components/layout"
import { PaginationControl } from "@/components/shared"
import { Card } from "@/components/ui"
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

        {/* Controls & Filter Bar Card */}
        <Card className="rounded-2xl border-border bg-card p-4 sm:p-5 shadow-xs">
          <ReportFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            loading={loading}
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
            onRefresh={reload}
          />
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
          <ReportTable
            reports={reports}
            loading={loading}
            search={search}
          />

          <PaginationControl
            meta={meta}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            disabled={loading}
          />
        </Card>
      </div>
    </DashboardShell>
  )
}
