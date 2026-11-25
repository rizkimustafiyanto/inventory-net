"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { categoryService } from "../services/category.service"
import { useDebounce } from "@/hooks"
import type { Category, PaginationMeta } from "@/types"

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Pagination state (Server-Side)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 350)
  const [prevSearch, setPrevSearch] = useState(debouncedSearch)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined)

  if (debouncedSearch !== prevSearch) {
    setPrevSearch(debouncedSearch)
    setPage(1)
  }

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      const res = await categoryService.getPaged({
        pageNumber: page,
        pageSize,
        search: debouncedSearch.trim() || undefined,
      })
      if (res.success && res.data) {
        setCategories(res.data)
        if (res.meta) setMeta(res.meta)
      }
    } catch {
      toast.error("Gagal memuat kategori barang")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch])

  useEffect(() => {
    queueMicrotask(() => {
      void loadCategories()
    })
  }, [loadCategories])

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus kategori "${name}"? Produk yang terkait akan terpengaruh.`)) return

    try {
      const res = await categoryService.delete(id)
      if (res.success) {
        toast.success(`Kategori "${name}" berhasil dihapus`)
        loadCategories()
      } else {
        toast.error(res.message || "Gagal menghapus kategori")
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal menghapus kategori"
      toast.error(msg)
    }
  }

  return {
    categories,
    loading,
    search,
    page,
    pageSize,
    meta,
    setPage,
    handleSearchChange,
    handlePageSizeChange,
    handleDelete,
    reload: loadCategories,
  }
}
