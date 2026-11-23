"use client"

import React from "react"
import { InventorySocketProvider } from "@/lib/socket"

/**
 * DashboardLayout membungkus seluruh sub-halaman dashboard (/dashboard/*).
 * Dengan menaruh InventorySocketProvider di level layout, koneksi SignalR
 * tetap persisten (hidup terus) dan TIDAK melakukan re-negotiate setiap kali
 * user berpindah halaman di dalam dashboard.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <InventorySocketProvider>{children}</InventorySocketProvider>
}
