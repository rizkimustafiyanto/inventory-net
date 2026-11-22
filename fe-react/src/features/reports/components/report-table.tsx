"use client"

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui"
import type { StockReport } from "@/types"

interface ReportTableProps {
  reports: StockReport[]
  loading: boolean
  search: string
}

export function ReportTable({
  reports,
  loading,
  search,
}: ReportTableProps) {
  return (
    <Table minWidth="950px" wrapHeader={false} wrapBody={false}>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>SKU & Produk</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-center">Awal</TableHead>
            <TableHead className="text-center">Masuk (+)</TableHead>
            <TableHead className="text-center">Keluar (-)</TableHead>
            <TableHead className="text-center">Akhir</TableHead>
            <TableHead className="text-right">Harga Satuan</TableHead>
            <TableHead className="text-right">Nilai Aset</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.length === 0 ? (
            <TableEmpty
              colSpan={9}
              loading={loading}
              message={
                search
                  ? `Tidak ada rekaman laporan yang cocok dengan "${search}".`
                  : "Belum ada rekaman laporan stok."
              }
            />
          ) : (
            reports.map((r) => (
              <TableRow key={r.id}>
                <TableCell wrap={false} className="text-xs text-muted-foreground">
                  {new Date(r.reportDate).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell wrap={true} className="max-w-[220px]">
                  <div className="font-semibold text-foreground">{r.productName}</div>
                  <div className="text-xs font-mono text-muted-foreground">{r.productSku}</div>
                </TableCell>
                <TableCell wrap={false} className="text-muted-foreground">
                  {r.categoryName || "—"}
                </TableCell>
                <TableCell
                  wrap={false}
                  className="text-center font-mono text-xs text-muted-foreground"
                >
                  {r.openingStock}
                </TableCell>
                <TableCell
                  wrap={false}
                  className="text-center font-mono text-xs font-semibold text-emerald-600"
                >
                  +{r.totalIn}
                </TableCell>
                <TableCell
                  wrap={false}
                  className="text-center font-mono text-xs font-semibold text-rose-600"
                >
                  -{r.totalOut}
                </TableCell>
                <TableCell wrap={false} className="text-center font-bold text-foreground">
                  {r.closingStock}
                </TableCell>
                <TableCell wrap={false} className="text-right text-xs text-muted-foreground">
                  Rp {r.unitPrice.toLocaleString("id-ID")}
                </TableCell>
                <TableCell
                  wrap={false}
                  className="text-right font-bold text-emerald-600 dark:text-emerald-400"
                >
                  Rp {r.totalStockValue.toLocaleString("id-ID")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
  )
}
