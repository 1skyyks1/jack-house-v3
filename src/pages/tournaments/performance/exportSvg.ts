import oxaniumFontUrl from "@fontsource-variable/oxanium/files/oxanium-latin-wght-normal.woff2?url"

let exportFontCssPromise: Promise<string> | null = null

export async function downloadSvgAsPng(svg: SVGSVGElement, filename: string) {
  await document.fonts.ready
  const clone = svg.cloneNode(true) as SVGSVGElement
  await Promise.all([inlineRemoteImages(clone), inlineExportFonts(clone)])

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  const viewBox = clone.viewBox.baseVal
  const width = viewBox.width || 1200
  const height = viewBox.height || 500
  const scale = 3
  const outputWidth = Math.round(width * scale)
  const outputHeight = Math.round(height * scale)
  clone.setAttribute("width", String(outputWidth))
  clone.setAttribute("height", String(outputHeight))
  const source = new XMLSerializer().serializeToString(clone)
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" })
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = await loadImage(objectUrl)
    const canvas = document.createElement("canvas")
    canvas.width = outputWidth
    canvas.height = outputHeight
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas is not available")
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(image, 0, 0, outputWidth, outputHeight)

    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("PNG export failed")), "image/png")
    })
    downloadBlob(png, filename)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function inlineExportFonts(svg: SVGSVGElement) {
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style")
  style.textContent = await getExportFontCss()
  svg.prepend(style)
}

function getExportFontCss() {
  exportFontCssPromise ??= fetchImageAsDataUrl(oxaniumFontUrl).then((dataUrl) => `
    @font-face {
      font-family: "Oxanium Variable";
      font-style: normal;
      font-weight: 200 800;
      src: url("${dataUrl}") format("woff2");
    }
  `)
  return exportFontCssPromise
}

async function inlineRemoteImages(svg: SVGSVGElement) {
  await Promise.all(Array.from(svg.querySelectorAll("image")).map(async (image) => {
    const href = image.getAttribute("href")
    if (!href || href.startsWith("data:")) return
    try {
      image.setAttribute("href", await fetchImageAsDataUrl(href))
    } catch {
      const proxyUrl = getExportProxyUrl(href)
      if (!proxyUrl) {
        image.removeAttribute("href")
        return
      }
      try {
        image.setAttribute("href", await fetchImageAsDataUrl(proxyUrl))
      } catch {
        // Keep the initials fallback when neither the source nor the export proxy is available.
        image.removeAttribute("href")
      }
    }
  }))
}

async function fetchImageAsDataUrl(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Image request failed with ${response.status}`)
  return await blobToDataUrl(await response.blob())
}

function getExportProxyUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.hostname !== "a.ppy.sh") return null
    const source = `${url.hostname}${url.pathname}${url.search}`
    return `https://wsrv.nl/?url=${encodeURIComponent(source)}&output=png`
  } catch {
    return null
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener("load", () => resolve(String(reader.result)))
    reader.addEventListener("error", () => reject(reader.error))
    reader.readAsDataURL(blob)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", () => reject(new Error("SVG rendering failed")))
    image.src = src
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const anchor = document.createElement("a")
  const url = URL.createObjectURL(blob)
  anchor.download = filename
  anchor.href = url
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
