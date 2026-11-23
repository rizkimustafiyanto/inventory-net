import axios from "axios"

export const TOKEN_STORAGE_KEY = "inventory_auth_token"
export const ROLE_STORAGE_KEY = "inventory_auth_role"
export const USER_STORAGE_KEY = "inventory_auth_user"

/**
 * Mengambil Base URL API dan WebSocket secara dinamis:
 * - Jika NEXT_PUBLIC_API_BASE_URL diset bukan localhost (misal domain produksi https://domain.com), gunakan itu.
 * - Di browser, jika diakses dari device lain (misal via IP lokal http://192.168.x.x:3000 atau IP VPS),
 *   secara otomatis arahkan ke hostname yang sama pada port 8080 (http://<hostname>:8080).
 * - Jika diakses via reverse proxy (Nginx pada port standar 80/443), gunakan origin saat ini (window.location.origin).
 * - Fallback ke localhost:8080 saat diakses dari PC lokal sendiri atau SSR.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl.replace(/\/$/, "")
    }

    const { protocol, hostname, port } = window.location

    // Di balik Nginx reverse proxy (port 80 atau 443 atau tanpa port di URL)
    if (!port || port === "80" || port === "443") {
      return window.location.origin
    }

    // Jika diakses dari port dev (misal :3000), arahkan ke backend di port 8080 pada hostname yang sama
    return `${protocol}//${hostname}:8080`
  }

  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "")
}

export const API_BASE_URL = getApiBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request Interceptor: Attach dynamic Base URL & JWT Bearer Token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.baseURL = getApiBaseUrl()
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(ROLE_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default api
