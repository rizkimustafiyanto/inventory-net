"use client"

import { Calendar, FileText } from "lucide-react"
import { PaginationControl } from "@/components/shared"
import {
  Badge,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui"
import type { StockMovement, PaginationMeta } from "@/types"

interface StockMovementTableProps {
  movements: StockMovement[]
  loading: boolean
  search: string
  filterProductId?: number
  filterType: number
  meta?: PaginationMeta
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function StockMovementTable({
  movements,
  loading,
  search,
  filterProductId,
  filterType,
  meta,
  onPageChange,
  onPageSizeChange,
}: StockMovementTableProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
      <Table minWidth="800px" wrapHeader={false} wrapBody={false}>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Sebelum → Sesudah</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead>Waktu</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 ? (
            <TableEmpty
              colSpan={6}
              loading={loading}
              message={
                search || filterProductId || filterType > 0
                  ? "Tidak ada riwayat pergerakan stok yang cocok dengan filter."
                  : "Belum ada riwayat pergerakan stok."
              }
            />
          ) : (
            movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell wrap={true} className="max-w-[200px]">
                  <div className="font-semibold text-foreground">{m.productName}</div>
                  <div className="text-xs font-mono text-muted-foreground">{m.productSku}</div>
                </TableCell>
                <TableCell wrap={false}>
                  <Badge
                    variant={m.type === 1 ? "success" : m.type === 2 ? "danger" : "info"}
                    className="text-xs"
                  >
                    {m.type === 1 ? "Masuk" : m.type === 2 ? "Keluar" : "Koreksi"}
                  </Badge>
                </TableCell>
                <TableCell wrap={false} className="font-bold text-foreground">
                  {m.type === 1 ? `+${m.quantity}` : m.type === 2 ? `-${m.quantity}` : m.quantity}
                </TableCell>
                <TableCell wrap={false} className="text-xs text-muted-foreground">
                  {m.stockBefore} → <span className="font-semibold text-foreground">{m.stockAfter}</span>
                </TableCell>
                <TableCell wrap={true} className="max-w-[220px] text-xs text-muted-foreground">
                  <div>{m.reason || "—"}</div>
                  {m.referenceNumber && (
                    <div className="flex items-center gap-1 font-mono text-primary font-medium mt-0.5">
                      <FileText className="size-3" />
                      <span>{m.referenceNumber}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell wrap={false} className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    <span>{new Date(m.createdAt).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Oleh: {m.userName || "Petugas"}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Server-Side Pagination */}
      <PaginationControl
        meta={meta}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        disabled={loading}
      />
    </Card>
  )
}
