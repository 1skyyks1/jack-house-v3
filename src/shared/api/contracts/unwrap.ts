import type { PaginatedEnvelope } from "./common"

export function unwrapData<T>(raw: unknown): T {
  if (hasObjectData(raw)) {
    return raw.data as T
  }

  return raw as T
}

export function unwrapPagination<T>(raw: unknown): PaginatedEnvelope<T> {
  if (!raw || typeof raw !== "object") {
    return {
      data: [],
      page: 1,
      pageSize: 0,
      total: 0,
      totalPages: 0,
    }
  }

  const record = raw as Record<string, unknown>
  const data = Array.isArray(record.data) ? record.data as T[] : []
  const pageSize = toNumber(record.pageSize, data.length)

  return {
    data,
    page: toNumber(record.page, 1),
    pageSize,
    total: toNumber(record.total, data.length),
    totalPages: toNumber(record.totalPages, pageSize > 0 ? Math.ceil(data.length / pageSize) : 0),
  }
}

export function getBackendMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object" || !("message" in data)) return undefined

  const message = data.message
  return typeof message === "string" ? message : undefined
}

function hasObjectData(raw: unknown): raw is { data: unknown } {
  return raw !== null && typeof raw === "object" && "data" in raw
}

function toNumber(value: unknown, fallback: number) {
  const numberValue = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}
