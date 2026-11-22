"use client"

import { useState } from "react"
import { toast } from "sonner"
import { categoryService } from "../services/category.service"
import type { Category, CreateCategoryPayload } from "@/types"

interface UseCategoryFormOptions {
  onSuccess?: () => void
}

export function useCategoryForm({ onSuccess }: UseCategoryFormOptions = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState<CreateCategoryPayload>({ name: "", description: "" })
  const [submitting, setSubmitting] = useState(false)

  const openCreateModal = () => {
    setEditingCategory(null)
    setForm({ name: "", description: "" })
    setIsOpen(true)
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setForm({ name: category.name, description: category.description || "" })
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setEditingCategory(null)
    setForm({ name: "", description: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error("Nama kategori wajib diisi")
      return
    }

    try {
      setSubmitting(true)
      if (editingCategory) {
        const res = await categoryService.update(editingCategory.id, {
          name: form.name.trim(),
          description: form.description?.trim() || undefined,
        })
        if (res.success) {
          toast.success("Kategori berhasil diperbarui!")
          closeModal()
          onSuccess?.()
        } else {
          toast.error(res.message || "Gagal memperbarui kategori")
        }
      } else {
        const res = await categoryService.create({
          name: form.name.trim(),
          description: form.description?.trim() || undefined,
        })
        if (res.success) {
          toast.success("Kategori baru berhasil ditambahkan!")
          closeModal()
          onSuccess?.()
        } else {
          toast.error(res.message || "Gagal membuat kategori")
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal memproses kategori"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    isOpen,
    isEdit: !!editingCategory,
    editingCategory,
    form,
    submitting,
    openCreateModal,
    openEditModal,
    closeModal,
    setForm,
    handleSubmit,
  }
}
