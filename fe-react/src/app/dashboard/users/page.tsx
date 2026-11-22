"use client"

import { Shield } from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { PaginationControl } from "@/components/shared"
import { Card } from "@/components/ui"
import { useAuthStore } from "@/features/auth/store/auth.store"
import {
  useUsers,
  useUserForm,
  UserFilterBar,
  UserTable,
  UserModal,
} from "@/features/users"

export default function UsersPage() {
  const { role } = useAuthStore()
  const {
    users,
    loading,
    search,
    roleFilter,
    statusFilter,
    meta,
    setPage,
    handleSearchChange,
    handleRoleFilterChange,
    handleStatusFilterChange,
    handlePageSizeChange,
    handleToggleStatus,
    handleDelete,
    reload,
  } = useUsers()

  const form = useUserForm(reload)

  if (role && role !== "Admin") {
    return (
      <DashboardShell title="Manajemen Pengguna">
        <Card className="p-8 text-center">
          <Shield className="mx-auto size-12 text-amber-500" />
          <h3 className="mt-3 text-lg font-bold text-foreground">Akses Terbatas</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Halaman ini khusus untuk peran Administrator (Super Admin).
          </p>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell title="Manajemen Pengguna (m_user)">
      <div className="space-y-6">
        <UserFilterBar
          search={search}
          onSearchChange={handleSearchChange}
          roleFilter={roleFilter}
          onRoleFilterChange={handleRoleFilterChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          loading={loading}
          onRefresh={reload}
          onAddNew={form.openModal}
        />

        {/* Presentational Table Component */}
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
          <UserTable
            users={users}
            loading={loading}
            search={search}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            onToggleStatus={handleToggleStatus}
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

      <UserModal
        isOpen={form.isOpen}
        onClose={form.closeModal}
        form={form.form}
        onFieldChange={form.updateFormField}
        submitting={form.submitting}
        onSubmit={form.handleSubmit}
      />
    </DashboardShell>
  )
}
