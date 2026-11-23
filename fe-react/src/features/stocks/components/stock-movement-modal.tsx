"use client"

import { ArrowLeftRight, X } from "lucide-react"
import { Button, Card, FormField, Input, NativeSelect } from "@/components/ui"
import type { Product, StockMovementType } from "@/types"

interface StockMovementModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  selectedProductId: number
  onSelectedProductChange: (id: number) => void
  movementType: StockMovementType
  onMovementTypeChange: (type: StockMovementType) => void
  quantity: number
  onQuantityChange: (qty: number) => void
  reason: string
  onReasonChange: (reason: string) => void
  referenceNumber: string
  onReferenceNumberChange: (ref: string) => void
  submitting: boolean
  selectedProduct?: Product
  calculatedPreviewStock: number
  onSubmit: (e: React.FormEvent) => void
}

export function StockMovementModal({
  isOpen,
  onClose,
  products,
  selectedProductId,
  onSelectedProductChange,
  movementType,
  onMovementTypeChange,
  quantity,
  onQuantityChange,
  reason,
  onReasonChange,
  referenceNumber,
  onReferenceNumberChange,
  submitting,
  selectedProduct,
  calculatedPreviewStock,
  onSubmit,
}: StockMovementModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-lg overflow-hidden rounded-3xl border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="size-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Catat Pergerakan Stok</h3>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            icon={<X className="size-4" />}
            title="Tutup"
          />
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <FormField label="Pilih Produk" required>
            <NativeSelect
              value={selectedProductId}
              onChange={(e) => onSelectedProductChange(Number(e.target.value))}
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} (Sisa: {p.stockQuantity})
                </option>
              ))}
            </NativeSelect>
          </FormField>

          <FormField label="Tipe Pergerakan" required>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={movementType === 1 ? "success" : "outline"}
                size="sm"
                onClick={() => onMovementTypeChange(1)}
                className="w-full text-xs"
              >
                + Masuk
              </Button>
              <Button
                type="button"
                variant={movementType === 2 ? "destructive" : "outline"}
                size="sm"
                onClick={() => onMovementTypeChange(2)}
                className="w-full text-xs"
              >
                - Keluar
              </Button>
              <Button
                type="button"
                variant={movementType === 3 ? "default" : "outline"}
                size="sm"
                onClick={() => onMovementTypeChange(3)}
                className="w-full text-xs"
              >
                ⚙ Koreksi
              </Button>
            </div>
          </FormField>

          <FormField
            label={movementType === 3 ? "Stok Aktual Hasil Koreksi" : "Jumlah / Kuantitas"}
            required
          >
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => onQuantityChange(Number(e.target.value))}
              required
            />
          </FormField>

          {/* Live preview */}
          {selectedProduct && (
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Stok Saat Ini:</span>
                <span className="font-semibold text-foreground">{selectedProduct.stockQuantity}</span>
              </div>
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span>Estimasi Stok Baru:</span>
                <span className="font-bold text-primary">{calculatedPreviewStock} unit</span>
              </div>
            </div>
          )}

          <FormField label="Alasan / Keterangan">
            <Input
              placeholder="Contoh: Penerimaan Supplier / Pengeluaran Penjualan"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
            />
          </FormField>

          <FormField label="No. Referensi / PO / Faktur">
            <Input
              placeholder="Contoh: PO-2026-008"
              value={referenceNumber}
              onChange={(e) => onReferenceNumberChange(e.target.value)}
            />
          </FormField>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="w-full sm:w-auto"
            >
              Simpan Mutasi
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
