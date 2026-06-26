export type ApiEnvelope<T> = {
  data: T
  message?: string
}

export type BackendMessage = {
  message?: string
}

export type PaginatedEnvelope<T> = {
  data: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type PermissionEnvelope = {
  adminPermissions: string[]
  role: number
}
