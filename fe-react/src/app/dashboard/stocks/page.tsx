"use client"

import { DashboardShell } from "@/components/layout"
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

        <StockMovementTable
          movements={movements}
          loading={loading}
          search={search}
          filterProductId={filterProductId}
          filterType={filterType}
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
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
