"use client"

import { Search, RefreshCw, Plus } from "lucide-react"
import { Button, Input, NativeSelect } from "@/components/ui"
import type { Product } from "@/types"

interface StockFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  filterProductId?: number
  onProductFilterChange: (id?: number) => void
  filterType: number
  onTypeFilterChange: (type: number) => void
  products: Product[]
  loading: boolean
  onRefresh: () => void
  onAddNew: () => void
}

export function StockFilterBar({
  search,
  onSearchChange,
  filterProductId,
  onProductFilterChange,
  filterType,
  onTypeFilterChange,
  products,
  loading,
  onRefresh,
  onAddNew,
}: StockFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          leftIcon={<Search className="size-4" />}
          placeholder="Cari No. PO, alasan, SKU, petugas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-64"
        />

        <NativeSelect
          value={filterProductId || ""}
          onChange={(e) =>
            onProductFilterChange(e.target.value ? Number(e.target.value) : undefined)
          }
          className="w-48"
        >
          <option value="">Semua Produk</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              [{p.sku}] {p.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={filterType}
          onChange={(e) => onTypeFilterChange(Number(e.target.value))}
          className="w-40"
        >
          <option value={0}>Semua Tipe Mutasi</option>
          <option value={1}>+ Barang Masuk</option>
          <option value={2}>- Barang Keluar</option>
          <option value={3}>⚙ Koreksi Opname</option>
        </NativeSelect>
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
          Catat Mutasi Baru
        </Button>
      </div>
    </div>
  )
}
