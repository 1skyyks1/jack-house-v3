export type ApiErrorKind = "auth" | "forbidden" | "not-found" | "network" | "server" | "unknown"

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(message: string, kind: ApiErrorKind = "unknown", status?: number) {
    super(message)
    this.name = "ApiError"
    this.kind = kind
    this.status = status
  }
}

export function getApiErrorKind(status?: number): ApiErrorKind {
  if (status === 401) return "auth"
  if (status === 403) return "forbidden"
  if (status === 404) return "not-found"
  if (!status) return "network"
  if (status >= 500) return "server"
  return "unknown"
}

