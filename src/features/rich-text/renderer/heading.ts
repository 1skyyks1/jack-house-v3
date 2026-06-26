import type { TocItem } from "../model/types"

const HEADING_SELECTOR = "h1, h2, h3, h4"

export function normalizeHeadingId(text: string, fallback: string): string {
  const normalized = text
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}_-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return normalized || fallback
}

export function applyHeadingIdsAndExtractToc(root: ParentNode): TocItem[] {
  const seenIds = new Map<string, number>()
  const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>(HEADING_SELECTOR))

  return headings
    .map((heading, index) => {
      const text = heading.textContent?.trim() ?? ""
      if (!text) return undefined

      const rawId = heading.id || normalizeHeadingId(text, `section-${index + 1}`)
      const nextId = getUniqueId(rawId, seenIds)
      heading.id = nextId

      return {
        id: nextId,
        depth: Number(heading.tagName.slice(1)),
        text,
      }
    })
    .filter((item): item is TocItem => Boolean(item))
}

function getUniqueId(id: string, seenIds: Map<string, number>): string {
  const count = seenIds.get(id) ?? 0
  seenIds.set(id, count + 1)

  if (count === 0) return id
  return `${id}-${count + 1}`
}

