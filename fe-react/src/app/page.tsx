"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("inventory_auth_token")
    if (token) {
      router.replace("/dashboard")
    } else {
      router.replace("/login")
    }
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center text-sm text-slate-500">Memuat halaman...</div>
    </div>
  )
}
