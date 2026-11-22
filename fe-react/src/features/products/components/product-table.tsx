"use client"

import { Pencil, Trash2 } from "lucide-react"
import {
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui"
import type { Product } from "@/types"

interface ProductTableProps {
  products: Product[]
  loading: boolean
  search?: string
  role?: string | null
  onEdit: (product: Product) => void
  onDelete: (id: number, name: string) => void
}

export function ProductTable({
  products,
  loading,
  search,
  role,
  onEdit,
  onDelete,
}: ProductTableProps) {
  return (
    <Table minWidth="800px" wrapHeader={false} wrapBody={false}>
      <TableHeader>
        <TableRow>
          <TableHead>SKU & Produk</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead className="text-right">Harga Satuan</TableHead>
          <TableHead className="text-center">Stok Fisik</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[100px] text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length === 0 ? (
          <TableEmpty
            colSpan={6}
            loading={loading}
            message={
              search ? `Tidak ada produk yang cocok dengan "${search}".` : "Belum ada produk."
            }
          />
        ) : (
          products.map((p) => (
            <TableRow key={p.id}>
              <TableCell wrap={true} className="max-w-[240px]">
                <div className="font-semibold text-foreground">{p.name}</div>
                <div className="text-xs font-mono text-muted-foreground">{p.sku}</div>
              </TableCell>
              <TableCell wrap={false} className="text-muted-foreground">
                {p.categoryName}
              </TableCell>
              <TableCell wrap={false} className="text-right font-medium text-foreground">
                Rp {p.price.toLocaleString("id-ID")}
              </TableCell>
              <TableCell wrap={false} className="text-center">
                <span className="font-bold text-foreground">{p.stockQuantity}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  (Min: {p.minStockLevel})
                </span>
              </TableCell>
              <TableCell wrap={false}>
                {p.stockQuantity === 0 ? (
                  <Badge variant="destructive">Habis</Badge>
                ) : p.stockQuantity <= p.minStockLevel ? (
                  <Badge variant="warning">Menipis</Badge>
                ) : (
                  <Badge variant="success">Aman</Badge>
                )}
              </TableCell>
              <TableCell wrap={false} className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(p)}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Edit Data Produk"
                    icon={<Pencil className="size-3.5" />}
                  />
                  {role === "Admin" ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(p.id, p.name)}
                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                      title="Hapus Produk (Admin)"
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
