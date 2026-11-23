"use client"

import { DashboardShell } from "@/components/layout"
import { PaginationControl } from "@/components/shared"
import { Card } from "@/components/ui"
import { useAuthStore } from "@/features/auth/store/auth.store"
import {
  useCategories,
  useCategoryForm,
  CategoryFilterBar,
  CategoryTable,
  CategoryModal,
} from "@/features/categories"

export default function CategoriesPage() {
  const { role } = useAuthStore()

  // Business logic & data handling hook
  const {
    categories,
    loading,
    search,
    meta,
    setPage,
    handleSearchChange,
    handlePageSizeChange,
    handleDelete,
    reload,
  } = useCategories()

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
  } = useCategoryForm({ onSuccess: reload })

  return (
    <DashboardShell title="Kategori Barang">
      <div className="space-y-6">
        {/* Controls & Filter Bar Card */}
        <Card className="rounded-2xl border-border bg-card p-4 sm:p-5 shadow-xs">
          <CategoryFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            loading={loading}
            onRefresh={reload}
            onAddNew={openCreateModal}
          />
        </Card>

        {/* Presentational Table Component */}
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
          <CategoryTable
            categories={categories}
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
      <CategoryModal
        isOpen={isOpen}
        isEdit={isEdit}
        form={form}
        submitting={submitting}
        onChange={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </DashboardShell>
  )
}
