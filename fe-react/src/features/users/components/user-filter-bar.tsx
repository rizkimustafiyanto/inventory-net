"use client"

import { Search, RefreshCw, UserPlus } from "lucide-react"
import { Button, Input, NativeSelect } from "@/components/ui"

interface UserFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  roleFilter: string
  onRoleFilterChange: (role: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  loading: boolean
  onRefresh: () => void
  onAddNew: () => void
}

export function UserFilterBar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  loading,
  onRefresh,
  onAddNew,
}: UserFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2.5 sm:gap-3">
        <Input
          leftIcon={<Search className="size-4" />}
          placeholder="Cari pengguna, nama, email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:w-64 lg:w-72"
        />

        <NativeSelect
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="w-full sm:w-40"
        >
          <option value="">Semua Peran</option>
          <option value="Admin">Admin</option>
          <option value="Staff">Staff Gudang</option>
          <option value="Manager">Supervisor</option>
        </NativeSelect>

        <NativeSelect
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="w-full sm:w-36"
        >
          <option value="">Semua Status</option>
          <option value="active">Hanya Aktif</option>
          <option value="inactive">Hanya Nonaktif</option>
        </NativeSelect>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          title="Segarkan Data"
          icon={<RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />}
        />
        <Button
          onClick={onAddNew}
          leftIcon={<UserPlus className="size-4" />}
          className="flex-1 sm:flex-none"
        >
          Tambah Pengguna
        </Button>
      </div>
    </div>
  )
}
