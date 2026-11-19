import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui"
import type { PaginationMeta } from "@/types"

export type { PaginationMeta }

export interface PaginationControlProps {
  meta?: PaginationMeta
  onPageChange: (newPage: number) => void
  onPageSizeChange?: (newPageSize: number) => void
  pageSizeOptions?: number[]
  disabled?: boolean
}

export function PaginationControl({
  meta,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50, 100],
  disabled = false,
}: PaginationControlProps) {
  if (!meta || meta.totalCount === 0) return null

  const fromIndex = (meta.pageNumber - 1) * meta.pageSize + 1
  const toIndex = Math.min(meta.pageNumber * meta.pageSize, meta.totalCount)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3.5 sm:flex-row bg-card text-foreground">
      {/* Left: Total data & Page size selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <div>
          Menampilkan{" "}
          <span className="font-semibold text-foreground">
            {fromIndex} - {toIndex}
          </span>{" "}
          dari total{" "}
          <span className="font-semibold text-foreground">
            {meta.totalCount}
          </span>{" "}
          data
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 border-l border-border pl-3">
            <span>Baris per halaman:</span>
            <select
              value={meta.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className="h-7 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground shadow-xs transition-all outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 100 ? "100 (Max)" : opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          Halaman <span className="font-semibold text-foreground">{meta.pageNumber}</span> dari{" "}
          <span className="font-semibold text-foreground">{meta.totalPages || 1}</span>
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(meta.pageNumber - 1)}
            disabled={!meta.hasPreviousPage || disabled}
            title="Halaman Sebelumnya"
            icon={<ChevronLeft className="size-4" />}
          />

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(meta.pageNumber + 1)}
            disabled={!meta.hasNextPage || disabled}
            title="Halaman Berikutnya"
            icon={<ChevronRight className="size-4" />}
          />
        </div>
      </div>
    </div>
  )
}
