"use client"

import { Trash2, CheckCircle2, XCircle } from "lucide-react"
import { PaginationControl } from "@/components/shared"
import {
  Badge,
  Button,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui"
import type { User, PaginationMeta } from "@/types"

interface UserTableProps {
  users: User[]
  loading: boolean
  search: string
  roleFilter: string
  statusFilter: string
  meta?: PaginationMeta
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onToggleStatus: (user: User) => void
  onDelete: (user: User) => void
}

export function UserTable({
  users,
  loading,
  search,
  roleFilter,
  statusFilter,
  meta,
  onPageChange,
  onPageSizeChange,
  onToggleStatus,
  onDelete,
}: UserTableProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
      <Table minWidth="750px">
        <TableHeader>
          <TableRow>
            <TableHead>Pengguna</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Peran (Role)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Terdaftar</TableHead>
            <TableHead className="w-[88px] text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableEmpty
              colSpan={6}
              loading={loading}
              message={
                search || roleFilter || statusFilter
                  ? "Tidak ada akun pengguna yang cocok dengan filter."
                  : "Belum ada data pengguna."
              }
            />
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell wrap={true} className="max-w-[200px]">
                  <div className="font-semibold text-foreground">
                    {u.fullName || u.username}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">@{u.username}</div>
                </TableCell>
                <TableCell wrap={false} className="text-muted-foreground">
                  {u.email}
                </TableCell>
                <TableCell wrap={false}>
                  <Badge
                    variant={
                      u.roleName === "Admin"
                        ? "brand"
                        : u.roleName === "Manager"
                        ? "purple"
                        : "info"
                    }
                  >
                    {u.roleName === "Admin"
                      ? "Super Admin"
                      : u.roleName === "Manager"
                      ? "Supervisor"
                      : "Staff Gudang"}
                  </Badge>
                </TableCell>
                <TableCell wrap={false}>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(u)}
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                    title="Klik untuk ubah status"
                  >
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="size-3.5" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <XCircle className="size-3.5" />
                        Nonaktif
                      </span>
                    )}
                  </button>
                </TableCell>
                <TableCell wrap={false} className="text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell wrap={false} className="text-right">
                  <div className="flex items-center justify-end">
                    {u.username !== "admin" ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDelete(u)}
                        className="text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        title="Hapus Pengguna"
                        icon={<Trash2 className="size-4" />}
                      />
                    ) : (
                      <div className="flex size-8 items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Server-Side Pagination */}
      <PaginationControl
        meta={meta}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        disabled={loading}
      />
    </Card>
  )
}
