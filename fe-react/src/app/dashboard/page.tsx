"use client"

import { DashboardShell } from "@/components/layout"
import {
  useDashboardOverview,
  DashboardKpiCards,
  DashboardQuickActions,
  DashboardAlertsGrid,
} from "@/features/dashboard"

export default function DashboardPage() {
  const { summary, recentMovements, lowStockProducts, loading, reload } =
    useDashboardOverview()

  return (
    <DashboardShell title="Ringkasan Inventaris">
      <div className="space-y-6">
        {/* Top Summary Cards */}
        <DashboardKpiCards summary={summary} />

        {/* Quick Actions Row */}
        <DashboardQuickActions loading={loading} onRefresh={reload} />

        {/* Low Stock Alerts & Recent Movements Grid */}
        <DashboardAlertsGrid
          lowStockProducts={lowStockProducts}
          recentMovements={recentMovements}
        />
      </div>
    </DashboardShell>
  )
}
