"use client"

import { useState } from "react"
import { toast } from "sonner"
import { productService } from "../services/product.service"
import type { CreateProductPayload, Product, Category } from "@/types"

interface UseProductFormOptions {
  categories: Category[]
  onSuccess?: () => void
}

const defaultForm: CreateProductPayload = {
  sku: "",
  name: "",
  description: "",
  price: 0,
  initialStock: 0,
  minStockLevel: 5,
  categoryId: 0,
}

export function useProductForm({ categories, onSuccess }: UseProductFormOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateProductPayload>(defaultForm)

  const openCreateModal = () => {
    setEditingProduct(null)
    setForm({
      ...defaultForm,
      categoryId: categories[0]?.id || 0,
    })
    setIsOpen(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      price: product.price,
      initialStock: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      categoryId: product.categoryId,
    })
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setEditingProduct(null)
    setForm(defaultForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.sku.trim() || !form.name.trim()) {
      toast.error("SKU dan Nama produk wajib diisi")
      return
    }

    try {
      setSubmitting(true)
      if (editingProduct) {
        const res = await productService.update(editingProduct.id, {
          name: form.name.trim(),
          description: form.description?.trim() || undefined,
          price: Number(form.price),
          minStockLevel: Number(form.minStockLevel),
          categoryId: Number(form.categoryId),
        })

        if (res.success) {
          toast.success("Produk berhasil diperbarui!")
          closeModal()
          onSuccess?.()
        } else {
          toast.error(res.message || "Gagal memperbarui produk")
        }
      } else {
        const res = await productService.create({
          sku: form.sku.trim(),
          name: form.name.trim(),
          description: form.description?.trim() || undefined,
          price: Number(form.price),
          initialStock: Number(form.initialStock),
          minStockLevel: Number(form.minStockLevel),
          categoryId: Number(form.categoryId),
        })

        if (res.success) {
          toast.success("Produk baru berhasil ditambahkan!")
          closeModal()
          onSuccess?.()
        } else {
          toast.error(res.message || "Gagal membuat produk")
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal memproses produk"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    isOpen,
    isEdit: !!editingProduct,
    editingProduct,
    form,
    submitting,
    openCreateModal,
    openEditModal,
    closeModal,
    setForm,
    handleSubmit,
  }
}
