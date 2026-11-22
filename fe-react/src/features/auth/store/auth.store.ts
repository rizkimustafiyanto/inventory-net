import { create } from "zustand"
import { TOKEN_STORAGE_KEY, ROLE_STORAGE_KEY, USER_STORAGE_KEY } from "@/lib/api/client"
import type { LoginResponse } from "@/types"

type AuthUser = {
  userId: number
  username: string
  fullName: string
  email?: string
  avatar?: string
}

type AuthState = {
  token: string | null
  role: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (data: LoginResponse) => void
  updateUser: (updates: Partial<AuthUser>) => void
  logout: () => void
  initAuth: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  role: null,
  user: null,
  isAuthenticated: false,

  setAuth: (data) => {
    const userObj: AuthUser = {
      userId: data.userId,
      username: data.username,
      fullName: data.fullName,
      email: data.email,
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      localStorage.setItem(ROLE_STORAGE_KEY, data.role)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userObj))
    }

    set({
      token: data.token,
      role: data.role,
      user: userObj,
      isAuthenticated: true,
    })
  },

  updateUser: (updates) => {
    const currentUser = get().user
    if (!currentUser) return

    const updatedUser: AuthUser = {
      ...currentUser,
      ...updates,
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser))
    }

    set({ user: updatedUser })
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
    if (get().isAuthenticated) return

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
