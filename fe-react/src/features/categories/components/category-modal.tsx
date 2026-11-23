"use client"

import { Layers, X } from "lucide-react"
import { Button, Card, FormField, Input } from "@/components/ui"
import type { CreateCategoryPayload } from "@/types"

interface CategoryModalProps {
  isOpen: boolean
  isEdit?: boolean
  form: CreateCategoryPayload
  submitting: boolean
  onChange: (form: CreateCategoryPayload) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function CategoryModal({
  isOpen,
  isEdit = false,
  form,
  submitting,
  onChange,
  onClose,
  onSubmit,
}: CategoryModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-md overflow-hidden rounded-3xl border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              {isEdit ? "Edit Kategori Barang" : "Tambah Kategori Baru"}
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
          <FormField label="Nama Kategori" required>
            <Input
              placeholder="Contoh: Alat Kesehatan / Perkakas"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </FormField>

          <FormField label="Deskripsi (Opsional)">
            <Input
              placeholder="Keterangan kategori"
              value={form.description || ""}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
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
              {isEdit ? "Simpan Perubahan" : "Simpan Kategori"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
