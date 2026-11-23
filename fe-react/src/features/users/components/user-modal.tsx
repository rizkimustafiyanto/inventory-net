"use client"

import { UserPlus, X } from "lucide-react"
import { Button, Card, FormField, Input, NativeSelect } from "@/components/ui"
import type { CreateUserPayload } from "@/types"

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  form: CreateUserPayload
  onFieldChange: <K extends keyof CreateUserPayload>(field: K, value: CreateUserPayload[K]) => void
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function UserModal({
  isOpen,
  onClose,
  form,
  onFieldChange,
  submitting,
  onSubmit,
}: UserModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-md rounded-3xl border-border bg-card p-6 shadow-modal max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Tambah Pengguna Baru</h3>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            icon={<X className="size-4" />}
            title="Tutup"
          />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="Username" required>
            <Input
              placeholder="Contoh: staff_gudang1"
              value={form.username}
              onChange={(e) => onFieldChange("username", e.target.value)}
              required
              autoFocus
            />
          </FormField>

          <FormField label="Nama Lengkap" required>
            <Input
              placeholder="Contoh: Budi Santoso"
              value={form.fullName || ""}
              onChange={(e) => onFieldChange("fullName", e.target.value)}
              required
            />
          </FormField>

          <FormField label="Email" required>
            <Input
              type="email"
              placeholder="budi@inventory.local"
              value={form.email}
              onChange={(e) => onFieldChange("email", e.target.value)}
              required
            />
          </FormField>

          <FormField label="Password" required>
            <Input
              type="password"
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={(e) => onFieldChange("password", e.target.value)}
              required
            />
          </FormField>

          <FormField label="Peran (Role)" required>
            <NativeSelect
              value={form.role}
              onChange={(e) => onFieldChange("role", Number(e.target.value))}
              required
            >
              <option value={2}>Staff Gudang (Operasional Mutasi)</option>
              <option value={3}>Supervisor / Manager (Laporan & Monitoring)</option>
              <option value={1}>Administrator (Super Admin)</option>
            </NativeSelect>
          </FormField>

          <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
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
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
