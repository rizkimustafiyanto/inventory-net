"use client"

import { DashboardShell } from "@/components/layout"
import { PaginationControl } from "@/components/shared"
import { Card } from "@/components/ui"
import { useAuthStore } from "@/features/auth/store/auth.store"
import {
  useProducts,
  useProductForm,
  ProductFilterBar,
  ProductTable,
  ProductModal,
} from "@/features/products"

export default function ProductsPage() {
  const { role } = useAuthStore()

  // Business logic & data handling hook
  const {
    products,
    categories,
    loading,
    search,
    categoryFilter,
    lowStockOnly,
    meta,
    setPage,
    handleSearchChange,
    handleCategoryFilterChange,
    handleLowStockToggle,
    handlePageSizeChange,
    handleDelete,
    reload,
    reloadAll,
  } = useProducts()

  // Modal & form handling hook
  const {
    isOpen,
    isEdit,
    form,
    submitting,
    openCreateModal,
    openEditModal,
    closeModal,
    setForm,
    handleSubmit,
  } = useProductForm({ categories, onSuccess: reload })

  return (
    <DashboardShell title="Katalog Produk">
      <div className="space-y-6">
        {/* Controls & Filter Bar Card */}
        <Card className="rounded-2xl border-border bg-card p-4 sm:p-5 shadow-xs">
          <ProductFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={handleCategoryFilterChange}
            lowStockOnly={lowStockOnly}
            onToggleLowStock={handleLowStockToggle}
            categories={categories}
            loading={loading}
            onRefresh={reloadAll}
            onAddNew={openCreateModal}
          />
        </Card>

        {/* Presentational Table Component */}
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
          <ProductTable
            products={products}
            loading={loading}
            search={search}
            role={role}
            onEdit={openEditModal}
            onDelete={handleDelete}
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

      {/* Presentational Modal Component */}
      <ProductModal
        isOpen={isOpen}
        isEdit={isEdit}
        form={form}
        categories={categories}
        submitting={submitting}
        onChange={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </DashboardShell>
  )
}
