"use client"

import { Package, X } from "lucide-react"
import {
  Button,
  Card,
  FormField,
  Input,
  NativeSelect,
} from "@/components/ui"
import type { CreateProductPayload, Category } from "@/types"

interface ProductModalProps {
  isOpen: boolean
  isEdit?: boolean
  form: CreateProductPayload
  categories: Category[]
  submitting: boolean
  onChange: (form: CreateProductPayload) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function ProductModal({
  isOpen,
  isEdit = false,
  form,
  categories,
  submitting,
  onChange,
  onClose,
  onSubmit,
}: ProductModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-lg overflow-hidden rounded-3xl border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              {isEdit ? "Edit Data Produk" : "Tambah Produk Baru"}
            </h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Kode SKU" required>
              <Input
                placeholder="Contoh: ELEC-001"
                value={form.sku}
                onChange={(e) => onChange({ ...form, sku: e.target.value.toUpperCase() })}
                disabled={isEdit}
                required
              />
            </FormField>

            <FormField label="Kategori" required>
              <NativeSelect
                value={form.categoryId}
                onChange={(e) => onChange({ ...form, categoryId: Number(e.target.value) })}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </div>

          <FormField label="Nama Produk" required>
            <Input
              placeholder="Contoh: Keyboard Mechanical RGB"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Deskripsi">
            <Input
              placeholder="Keterangan singkat produk"
              value={form.description || ""}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Harga Satuan (Rp)" required>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => onChange({ ...form, price: Number(e.target.value) })}
                required
              />
            </FormField>

            <FormField label="Batas Min. Stok" required>
              <Input
                type="number"
                min={0}
                value={form.minStockLevel}
                onChange={(e) => onChange({ ...form, minStockLevel: Number(e.target.value) })}
                required
              />
            </FormField>
          </div>

          {!isEdit && (
            <FormField label="Stok Awal">
              <Input
                type="number"
                min={0}
                value={form.initialStock}
                onChange={(e) => onChange({ ...form, initialStock: Number(e.target.value) })}
              />
            </FormField>
          )}

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
              {isEdit ? "Simpan Perubahan" : "Simpan Produk"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
