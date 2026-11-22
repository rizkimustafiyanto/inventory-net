"use client"

import { Pencil, Trash2 } from "lucide-react"
import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui"
import type { Category } from "@/types"

interface CategoryTableProps {
  categories: Category[]
  loading: boolean
  search?: string
  role?: string | null
  onEdit: (category: Category) => void
  onDelete: (id: number, name: string) => void
}

export function CategoryTable({
  categories,
  loading,
  search,
  role,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  return (
    <Table minWidth="650px" wrapHeader={false} wrapBody={false}>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Kategori</TableHead>
          <TableHead>Deskripsi</TableHead>
          <TableHead>Jumlah Produk</TableHead>
          <TableHead className="w-[100px] text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.length === 0 ? (
          <TableEmpty
            colSpan={4}
            loading={loading}
            message={
              search
                ? `Tidak ada kategori yang cocok dengan "${search}".`
                : "Belum ada kategori."
            }
          />
        ) : (
          categories.map((c) => (
            <TableRow key={c.id}>
              <TableCell wrap={false} className="font-semibold text-foreground">
                {c.name}
              </TableCell>
              <TableCell wrap={true} className="max-w-[300px] text-muted-foreground">
                {c.description || "—"}
              </TableCell>
              <TableCell wrap={false}>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
                  {c.productCount ?? 0} Produk
                </span>
              </TableCell>
              <TableCell wrap={false} className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(c)}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Edit Kategori"
                    icon={<Pencil className="size-3.5" />}
                  />
                  {role === "Admin" ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(c.id, c.name)}
                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                      title="Hapus Kategori (Admin)"
                      icon={<Trash2 className="size-3.5" />}
                    />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
