import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui"
import { paginationStyles } from "@/theme/components/pagination.theme"
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
    <div className={paginationStyles.root}>
      {/* Left: Total data & Page size selector */}
      <div className={paginationStyles.infoWrapper}>
        <div>
          Menampilkan{" "}
          <span className={paginationStyles.highlightText}>
            {fromIndex} - {toIndex}
          </span>{" "}
          dari total{" "}
          <span className={paginationStyles.highlightText}>
            {meta.totalCount}
          </span>{" "}
          data
        </div>

        {onPageSizeChange && (
          <div className={paginationStyles.limitWrapper}>
            <span>Baris per halaman:</span>
            <select
              value={meta.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className={paginationStyles.limitSelect}
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
      <div className={paginationStyles.navWrapper}>
        <span className={paginationStyles.pageInfo}>
          Halaman <span className={paginationStyles.highlightText}>{meta.pageNumber}</span> dari{" "}
          <span className={paginationStyles.highlightText}>{meta.totalPages || 1}</span>
        </span>

        <div className={paginationStyles.buttonGroup}>
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
