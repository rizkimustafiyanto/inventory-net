"use client"

import { useState } from "react"
import { toast } from "sonner"
import { userService } from "../services/user.service"
import type { CreateUserPayload } from "@/types"

const initialForm: CreateUserPayload = {
  username: "",
  email: "",
  password: "",
  fullName: "",
  role: 2, // 1: Admin, 2: Staff, 3: Manager
}

export function useUserForm(onSuccess?: () => void) {
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateUserPayload>(initialForm)

  const openModal = () => {
    setForm(initialForm)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  const updateFormField = <K extends keyof CreateUserPayload>(field: K, value: CreateUserPayload[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password) {
      toast.error("Username dan password wajib diisi")
      return
    }

    try {
      setSubmitting(true)
      const res = await userService.create(form)
      if (res.success) {
        toast.success("Pengguna baru berhasil didaftarkan!")
        closeModal()
        setForm(initialForm)
        onSuccess?.()
      } else {
        toast.error(res.message || "Gagal menambah pengguna")
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal menambah pengguna"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    isOpen,
    openModal,
    closeModal,
    form,
    updateFormField,
    submitting,
    handleSubmit,
  }
}
