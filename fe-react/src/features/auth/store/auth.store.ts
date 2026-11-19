import { create } from "zustand"
import { TOKEN_STORAGE_KEY, ROLE_STORAGE_KEY, USER_STORAGE_KEY } from "@/lib/api/client"
import type { LoginResponse } from "../types"

type AuthState = {
  token: string | null
  role: string | null
  user: {
    userId: number
    username: string
    fullName: string
  } | null
  isAuthenticated: boolean
  setAuth: (data: LoginResponse) => void
  logout: () => void
  initAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  user: null,
  isAuthenticated: false,

  setAuth: (data) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      localStorage.setItem(ROLE_STORAGE_KEY, data.role)
      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify({ userId: data.userId, username: data.username, fullName: data.fullName })
      )
    }

    set({
      token: data.token,
      role: data.role,
      user: { userId: data.userId, username: data.username, fullName: data.fullName },
      isAuthenticated: true,
    })
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(ROLE_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
    }

    set({
      token: null,
      role: null,
      user: null,
      isAuthenticated: false,
    })
  },

  initAuth: () => {
    if (typeof window === "undefined") return

    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const role = localStorage.getItem(ROLE_STORAGE_KEY)
    const rawUser = localStorage.getItem(USER_STORAGE_KEY)

    if (token) {
      let parsedUser = null
      if (rawUser) {
        try {
          parsedUser = JSON.parse(rawUser)
        } catch {
          // ignore error
        }
      }

      set({
        token,
        role,
        user: parsedUser,
        isAuthenticated: true,
      })
    }
  },
}))
