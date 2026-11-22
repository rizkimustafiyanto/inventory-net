"use client"

import { Search, AlertCircle, RefreshCw, Plus } from "lucide-react"
import { Button, Input, NativeSelect } from "@/components/ui"
import type { Category } from "@/types"

interface ProductFilterBarProps {
  search: string
  selectedCategoryId?: number
  categoryFilter?: number
  lowStockOnly: boolean
  categories: Category[]
  loading: boolean
  onSearchChange: (value: string) => void
  onCategoryChange?: (catId?: number) => void
  onCategoryFilterChange?: (catId?: number) => void
  onLowStockToggle?: () => void
  onToggleLowStock?: () => void
  onRefresh: () => void
  onAddClick?: () => void
  onAddNew?: () => void
}

export function ProductFilterBar({
  search,
  selectedCategoryId,
  categoryFilter,
  lowStockOnly,
  categories,
  loading,
  onSearchChange,
  onCategoryChange,
  onCategoryFilterChange,
  onLowStockToggle,
  onToggleLowStock,
  onRefresh,
  onAddClick,
  onAddNew,
}: ProductFilterBarProps) {
  const currentCategory = categoryFilter !== undefined ? categoryFilter : selectedCategoryId
  const handleCategoryChange = onCategoryFilterChange || onCategoryChange
  const handleToggle = onToggleLowStock || onLowStockToggle
  const handleAdd = onAddNew || onAddClick

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          leftIcon={<Search className="size-4" />}
          placeholder="Cari SKU atau nama..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-64"
        />

        <NativeSelect
          value={currentCategory || ""}
          onChange={(e) =>
            handleCategoryChange?.(e.target.value ? Number(e.target.value) : undefined)
          }
          className="w-44"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>

        <Button
          variant={lowStockOnly ? "default" : "outline"}
          size="sm"
          onClick={() => handleToggle?.()}
          leftIcon={<AlertCircle className="size-3.5" />}
        >
          Hanya Stok Tipis
        </Button>
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
        <Button
          size="sm"
          onClick={() => handleAdd?.()}
          leftIcon={<Plus className="size-4" />}
        >
          Tambah Produk
        </Button>
      </div>
    </div>
  )
}
