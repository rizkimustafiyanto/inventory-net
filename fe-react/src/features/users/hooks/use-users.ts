"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { userService } from "../services/user.service"
import { useDebounce } from "@/hooks"
import type { User, PaginationMeta } from "@/types"

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Search, Filter & Pagination state (Server-Side)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 350)
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await userService.getPaged({
        pageNumber: page,
        pageSize,
        search: debouncedSearch.trim() || undefined,
        role: roleFilter || undefined,
        isActive:
          statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
      })
      if (res.success && res.data) {
        setUsers(res.data)
        if (res.meta) setMeta(res.meta)
      }
    } catch {
      toast.error("Gagal memuat daftar pengguna")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, roleFilter, statusFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role)
    setPage(1)
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const handleToggleStatus = async (user: User) => {
    if (user.username === "admin") {
      toast.error("Akun administrator utama tidak dapat dinonaktifkan")
      return
    }

    try {
      const res = await userService.updateStatus(user.id, !user.isActive)
      if (res.success) {
        toast.success(`Status ${user.username} berhasil diubah`)
        loadUsers()
      } else {
        toast.error(res.message || "Gagal memperbarui status")
      }
    } catch {
      toast.error("Gagal memperbarui status pengguna")
    }
  }

  const handleDelete = async (user: User) => {
    if (user.username === "admin") {
      toast.error("Akun administrator utama tidak dapat dihapus")
      return
    }

    if (!confirm(`Hapus akun pengguna "${user.username}"?`)) return

    try {
      const res = await userService.delete(user.id)
      if (res.success) {
        toast.success("Pengguna berhasil dihapus")
        loadUsers()
      } else {
        toast.error(res.message || "Gagal menghapus pengguna")
      }
    } catch {
      toast.error("Gagal menghapus pengguna")
    }
  }

  return {
    users,
    loading,
    search,
    roleFilter,
    statusFilter,
    page,
    pageSize,
    meta,
    setPage,
    handleSearchChange,
    handleRoleFilterChange,
    handleStatusFilterChange,
    handlePageSizeChange,
    handleToggleStatus,
    handleDelete,
    reload: loadUsers,
  }
}
