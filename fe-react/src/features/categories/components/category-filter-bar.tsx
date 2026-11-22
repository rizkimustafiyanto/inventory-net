"use client"

import { Plus, RefreshCw, Search } from "lucide-react"
import { Button, Input } from "@/components/ui"

interface CategoryFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  loading: boolean
  onRefresh: () => void
  onAddNew: () => void
}

export function CategoryFilterBar({
  search,
  onSearchChange,
  loading,
  onRefresh,
  onAddNew,
}: CategoryFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          leftIcon={<Search className="size-4" />}
          placeholder="Cari nama atau deskripsi kategori..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-72 sm:w-80"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onRefresh}
          disabled={loading}
          title="Segarkan Data"
          icon={<RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />}
        />
        <Button onClick={onAddNew} leftIcon={<Plus className="size-4" />}>
          Tambah Kategori
        </Button>
      </div>
    </div>
  )
}
