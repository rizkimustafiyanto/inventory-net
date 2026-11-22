"use client"

import { useState } from "react"
import { toast } from "sonner"
import { stockService } from "../services/stock.service"
import type { StockMovementType, Product } from "@/types"

export function useStockMovementForm(products: Product[], onSuccess?: () => void) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number>(0)
  const [movementType, setMovementType] = useState<StockMovementType>(1) // 1: In, 2: Out, 3: Adjustment
  const [quantity, setQuantity] = useState<number>(1)
  const [reason, setReason] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  const openModal = () => {
    if (products.length > 0) {
      setSelectedProductId(products[0].id)
    }
    setQuantity(1)
    setReason("")
    setReferenceNumber("")
    setMovementType(1)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  const calculatePreviewStock = () => {
    if (!selectedProduct) return 0
    if (movementType === 1) return selectedProduct.stockQuantity + quantity
    if (movementType === 2) return Math.max(0, selectedProduct.stockQuantity - quantity)
    return quantity // Adjustment
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId) {
      toast.error("Pilih produk terlebih dahulu")
      return
    }

    if (quantity <= 0 && movementType !== 3) {
      toast.error("Jumlah harus lebih dari 0")
      return
    }

    if (movementType === 2 && selectedProduct && quantity > selectedProduct.stockQuantity) {
      toast.error(`Stok tidak mencukupi! Tersisa hanya ${selectedProduct.stockQuantity}`)
      return
    }

    try {
      setSubmitting(true)
      const res = await stockService.recordMovement({
        productId: selectedProductId,
        type: movementType,
        quantity,
        reason: reason.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
      })

      if (res.success) {
        toast.success("Mutasi stok berhasil dicatat!")
        closeModal()
        onSuccess?.()
      } else {
        toast.error(res.message || "Gagal mencatat mutasi")
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal mencatat mutasi stok"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    isOpen,
    openModal,
    closeModal,
    selectedProductId,
    setSelectedProductId,
    movementType,
    setMovementType,
    quantity,
    setQuantity,
    reason,
    setReason,
    referenceNumber,
    setReferenceNumber,
    submitting,
    selectedProduct,
    calculatePreviewStock,
    handleSubmit,
  }
}
