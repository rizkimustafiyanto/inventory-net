export interface PaginationMeta {
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  meta?: PaginationMeta
  errors?: string[] | null
}

export interface PagedResult<T> {
  items: T[]
  meta?: PaginationMeta
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}
