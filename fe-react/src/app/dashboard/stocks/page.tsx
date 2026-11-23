"use client"

import { DashboardShell } from "@/components/layout"
import { PaginationControl } from "@/components/shared"
import { Card } from "@/components/ui"
import {
  useStockMovements,
  useStockMovementForm,
  StockFilterBar,
  StockMovementTable,
  StockMovementModal,
} from "@/features/stocks"

export default function StockMovementsPage() {
  const {
    movements,
    products,
    loading,
    search,
    filterProductId,
    filterType,
    meta,
    setPage,
    handleSearchChange,
    handleProductFilterChange,
    handleTypeFilterChange,
    handlePageSizeChange,
    reload,
    reloadAll,
  } = useStockMovements()

  const form = useStockMovementForm(products, reload)

  return (
    <DashboardShell title="Mutasi & Pergerakan Stok">
      <div className="space-y-6">
        {/* Controls & Filter Bar Card */}
        <Card className="rounded-2xl border-border bg-card p-4 sm:p-5 shadow-xs">
          <StockFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            filterProductId={filterProductId}
            onProductFilterChange={handleProductFilterChange}
            filterType={filterType}
            onTypeFilterChange={handleTypeFilterChange}
            products={products}
            loading={loading}
            onRefresh={reloadAll}
            onAddNew={form.openModal}
          />
        </Card>

        {/* Presentational Table Component */}
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
          <StockMovementTable
            movements={movements}
            loading={loading}
            search={search}
            filterProductId={filterProductId}
            filterType={filterType}
          />

          {/* Pagination */}
          <PaginationControl
            meta={meta}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            disabled={loading}
          />
        </Card>
      </div>

      <StockMovementModal
        isOpen={form.isOpen}
        onClose={form.closeModal}
        products={products}
        selectedProductId={form.selectedProductId}
        onSelectedProductChange={form.setSelectedProductId}
        movementType={form.movementType}
        onMovementTypeChange={form.setMovementType}
        quantity={form.quantity}
        onQuantityChange={form.setQuantity}
        reason={form.reason}
        onReasonChange={form.setReason}
        referenceNumber={form.referenceNumber}
        onReferenceNumberChange={form.setReferenceNumber}
        submitting={form.submitting}
        selectedProduct={form.selectedProduct}
        calculatedPreviewStock={form.calculatePreviewStock()}
        onSubmit={form.handleSubmit}
      />
    </DashboardShell>
  )
}
