export function getPaginationItems(page: number, totalPages: number) {
  const items: Array<number | "ellipsis"> = []
  const visiblePages = new Set<number>([1, totalPages])
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)

  for (let current = start; current <= end; current += 1) {
    visiblePages.add(current)
  }

  const pages = Array.from(visiblePages).sort((a, b) => a - b)

  pages.forEach((current, index) => {
    const previous = pages[index - 1]
    if (previous && current - previous > 1) {
      items.push("ellipsis")
    }
    items.push(current)
  })

  return items
}

export function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}
