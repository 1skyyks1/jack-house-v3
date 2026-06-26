import DOMPurify from "dompurify"
import type { TocItem } from "../model/types"
import { applyHeadingIdsAndExtractToc } from "./heading"

export type SanitizedRichText = {
  html: string
  toc: TocItem[]
}

export function sanitizeRichTextHtml(rawHtml: string): SanitizedRichText {
  if (!rawHtml.trim()) {
    return { html: "", toc: [] }
  }

  const sanitized = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target"],
  })

  const template = document.createElement("template")
  template.innerHTML = sanitized

  normalizeLinks(template.content)
  normalizeImages(template.content)
  const toc = applyHeadingIdsAndExtractToc(template.content)

  return {
    html: template.innerHTML,
    toc,
  }
}

function normalizeLinks(root: ParentNode) {
  const links = root.querySelectorAll<HTMLAnchorElement>("a[href]")
  links.forEach((link) => {
    const href = link.getAttribute("href") ?? ""
    const isExternal = /^https?:\/\//i.test(href)

    if (isExternal) {
      link.setAttribute("target", "_blank")
      link.setAttribute("rel", "noopener noreferrer")
    }
  })
}

function normalizeImages(root: ParentNode) {
  const images = root.querySelectorAll<HTMLImageElement>("img")
  images.forEach((image) => {
    image.setAttribute("loading", "lazy")
    image.setAttribute("decoding", "async")

    if (!image.getAttribute("alt")) {
      image.setAttribute("alt", "")
    }
  })
}

