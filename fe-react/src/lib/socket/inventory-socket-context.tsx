"use client"

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr"
import { toast } from "sonner"
import { TOKEN_STORAGE_KEY, getApiBaseUrl } from "@/lib/api/client"
import type { StockMovementType } from "@/types"

export interface StockMovementEvent {
  id: number
  productId: number
  productName: string
  productSku: string
  type: StockMovementType
  quantity: number
  stockBefore: number
  stockAfter: number
  reason?: string
  referenceNumber?: string
  userName: string
  createdAt: string
}

export interface ProductStockUpdateEvent {
  productId: number
  newStock: number
  status: string
  updatedAt: string
}

export interface LowStockAlertEvent {
  productId: number
  sku: string
  name: string
  currentStock: number
  minStock: number
  isOutOfStock: boolean
  alertTime: string
}

export interface UserAvatarUpdatedEvent {
  userId: number
  avatarUrl: string
  updatedAt: string
}

type StockMovementListener = (movement: StockMovementEvent) => void
type ProductStockListener = (update: ProductStockUpdateEvent) => void
type LowStockListener = (alert: LowStockAlertEvent) => void
type UserAvatarListener = (event: UserAvatarUpdatedEvent) => void

interface InventorySocketContextValue {
  isConnected: boolean
  subscribeStockMovement: (listener: StockMovementListener) => () => void
  subscribeStockUpdate: (listener: ProductStockListener) => () => void
  subscribeLowStockAlert: (listener: LowStockListener) => () => void
  subscribeUserAvatarUpdated: (listener: UserAvatarListener) => () => void
}

const InventorySocketContext = createContext<InventorySocketContextValue>({
  isConnected: false,
  subscribeStockMovement: () => () => {},
  subscribeStockUpdate: () => () => {},
  subscribeLowStockAlert: () => () => {},
  subscribeUserAvatarUpdated: () => () => {},
})

export function InventorySocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const connectionRef = useRef<HubConnection | null>(null)

  // Subscriptions registry
  const movementListeners = useRef<Set<StockMovementListener>>(new Set())
  const updateListeners = useRef<Set<ProductStockListener>>(new Set())
  const alertListeners = useRef<Set<LowStockListener>>(new Set())
  const avatarListeners = useRef<Set<UserAvatarListener>>(new Set())

  const subscribeStockMovement = useCallback((listener: StockMovementListener) => {
    movementListeners.current.add(listener)
    return () => {
      movementListeners.current.delete(listener)
    }
  }, [])

  const subscribeStockUpdate = useCallback((listener: ProductStockListener) => {
    updateListeners.current.add(listener)
    return () => {
      updateListeners.current.delete(listener)
    }
  }, [])

  const subscribeLowStockAlert = useCallback((listener: LowStockListener) => {
    alertListeners.current.add(listener)
    return () => {
      alertListeners.current.delete(listener)
    }
  }, [])

  const subscribeUserAvatarUpdated = useCallback((listener: UserAvatarListener) => {
    avatarListeners.current.add(listener)
    return () => {
      avatarListeners.current.delete(listener)
    }
  }, [])

  useEffect(() => {
    // Only connect in browser environment
    if (typeof window === "undefined") return

    let isMounted = true
    let retryTimer: NodeJS.Timeout | null = null

    const hubUrl = `${getApiBaseUrl()}/hubs/inventory`

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          return localStorage.getItem(TOKEN_STORAGE_KEY) || ""
        },
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
      .configureLogging(LogLevel.None)
      .build()

    // Event: ReceiveStockMovement
    connection.on("ReceiveStockMovement", (movement: StockMovementEvent) => {
      movementListeners.current.forEach((cb) => {
        try {
          cb(movement)
        } catch (e) {
          console.error("Error in stock movement listener", e)
        }
      })
    })

    // Event: ReceiveProductStockUpdate
    connection.on("ReceiveProductStockUpdate", (update: ProductStockUpdateEvent) => {
      updateListeners.current.forEach((cb) => {
        try {
          cb(update)
        } catch (e) {
          console.error("Error in stock update listener", e)
        }
      })
    })

    // Event: ReceiveLowStockAlert
    connection.on("ReceiveLowStockAlert", (alert: LowStockAlertEvent) => {
      // Global toast notification
      if (alert.isOutOfStock) {
        toast.error(`⚠️ Stok Habis! [${alert.sku}] ${alert.name} tersisa 0 unit!`, {
          duration: 6000,
        })
      } else {
        toast.warning(
          `⚠️ Stok Menipis! [${alert.sku}] ${alert.name} tersisa ${alert.currentStock} (Batas Min: ${alert.minStock})`,
          {
            duration: 5000,
          }
        )
      }

      alertListeners.current.forEach((cb) => {
        try {
          cb(alert)
        } catch (e) {
          console.error("Error in low stock listener", e)
        }
      })
    })

    // Event: ReceiveUserAvatarUpdated
    connection.on("ReceiveUserAvatarUpdated", (data: UserAvatarUpdatedEvent) => {
      avatarListeners.current.forEach((cb) => {
        try {
          cb(data)
        } catch (e) {
          console.error("Error in avatar updated listener", e)
        }
      })
    })

    // Connection lifecycle handlers
    connection.onreconnecting(() => {
      if (isMounted) setIsConnected(false)
    })

    connection.onreconnected(() => {
      if (isMounted) setIsConnected(true)
    })

    connection.onclose(() => {
      if (isMounted) setIsConnected(false)
    })

    // Start connection with safe lifecycle & retry guard
    const startConnection = async () => {
      if (!isMounted) return

      try {
        await connection.start()
        if (isMounted) {
          setIsConnected(true)
        }
      } catch {
        if (isMounted) {
          setIsConnected(false)
          // Jika koneksi awal gagal (misal server backend sedang boot/restart), jadwalkan retry 3 detik
          retryTimer = setTimeout(() => {
            if (isMounted && connection.state === HubConnectionState.Disconnected) {
              startConnection()
            }
          }, 3000)
        }
      }
    }

    startConnection()
    connectionRef.current = connection

    return () => {
      isMounted = false
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      if (connectionRef.current) {
        const conn = connectionRef.current
        connectionRef.current = null
        if (conn.state !== HubConnectionState.Disconnected) {
          conn.stop().catch(() => {})
        }
      }
    }
  }, [])

  return (
    <InventorySocketContext.Provider
      value={{
        isConnected,
        subscribeStockMovement,
        subscribeStockUpdate,
        subscribeLowStockAlert,
        subscribeUserAvatarUpdated,
      }}
    >
      {children}
    </InventorySocketContext.Provider>
  )
}

export function useInventorySocket() {
  return useContext(InventorySocketContext)
}
