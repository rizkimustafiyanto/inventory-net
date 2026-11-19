import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PaginationMeta } from "@/types"

export type { PaginationMeta }

type PaginationControlProps = {
  meta?: PaginationMeta
  onPageChange: (newPage: number) => void
  disabled?: boolean
}

export function PaginationControl({
  meta,
  onPageChange,
  disabled = false,
}: PaginationControlProps) {
  if (!meta || meta.totalCount === 0) return null

  const fromIndex = (meta.pageNumber - 1) * meta.pageSize + 1
  const toIndex = Math.min(meta.pageNumber * meta.pageSize, meta.totalCount)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row dark:border-slate-800">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Menampilkan{" "}
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {fromIndex} - {toIndex}
        </span>{" "}
        dari total{" "}
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {meta.totalCount}
        </span>{" "}
        data
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Halaman {meta.pageNumber} dari {meta.totalPages || 1}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(meta.pageNumber - 1)}
            disabled={!meta.hasPreviousPage || disabled}
            className="size-8 p-0 rounded-lg"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(meta.pageNumber + 1)}
            disabled={!meta.hasNextPage || disabled}
            className="size-8 p-0 rounded-lg"
            title="Halaman Berikutnya"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
