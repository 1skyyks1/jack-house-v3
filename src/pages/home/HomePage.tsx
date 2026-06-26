import { ArrowRightIcon } from "@phosphor-icons/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type HomeVisual = {
  descriptionKey: string
  displayTitle: string
  id: string
  imageUrl: string
  link: string
  titleKey: string
}

type HomeSection = HomeVisual & {
  ctaKey: string
}

const homeVisuals: HomeVisual[] = [
  {
    descriptionKey: "home.visuals.community.description",
    displayTitle: "JACK HOUSE",
    id: "community",
    imageUrl: "https://raw.githubusercontent.com/1skyyks1/jack-house-img/main/jackhouse.jpg",
    link: "/forum",
    titleKey: "home.visuals.community.title",
  },
  {
    descriptionKey: "home.visuals.packs.description",
    displayTitle: "JACKMAPS",
    id: "packs",
    imageUrl: "https://raw.githubusercontent.com/1skyyks1/jack-house-img/main/packs.png",
    link: "/pack",
    titleKey: "home.visuals.packs.title",
  },
  {
    descriptionKey: "home.visuals.tourney.description",
    displayTitle: "TOURNEY",
    id: "tourney",
    imageUrl: "https://raw.githubusercontent.com/1skyyks1/jack-house-img/main/jhc2026.png",
    link: "/t",
    titleKey: "home.visuals.tourney.title",
  },
]

const homeSections: HomeSection[] = homeVisuals.map((visual) => ({
  ...visual,
  ctaKey:
    visual.id === "community"
      ? "home.forumCta"
      : visual.id === "packs"
        ? "home.packCta"
        : "home.tourneyCta",
}))

export function HomePage() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLElement | null>(null)
  const previousThemeRef = useRef<string | null>(null)
  const isAnimatingRef = useRef(false)
  const touchStartYRef = useRef<number | null>(null)

  const { theme, setTheme } = useTheme()
  const [activeIndex, setActiveIndex] = useState(0)

  const activeId = homeSections[activeIndex]?.id ?? "community"

  useEffect(() => {
    if (previousThemeRef.current === null) {
      previousThemeRef.current = theme ?? "system"
    }

    setTheme("dark")

    return () => {
      const previousTheme = previousThemeRef.current ?? "system"
      if (previousTheme !== "dark") {
        setTheme(previousTheme)
      }
    }
  }, [setTheme, theme])

  const goToSection = useCallback((nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(nextIndex, homeSections.length - 1))

    if (safeIndex === activeIndex) return
    if (isAnimatingRef.current) return

    isAnimatingRef.current = true
    setActiveIndex(safeIndex)

    window.dispatchEvent(
      new CustomEvent("jackhouse:home-fullpage-change", {
        detail: {
          anchor: homeSections[safeIndex].id,
          index: safeIndex,
        },
      }),
    )

    window.setTimeout(() => {
      isAnimatingRef.current = false
    }, 850)
  }, [activeIndex])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()

      if (Math.abs(event.deltaY) < 12) return
      if (isAnimatingRef.current) return

      if (event.deltaY > 0) {
        goToSection(activeIndex + 1)
      } else {
        goToSection(activeIndex - 1)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isAnimatingRef.current) return

      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault()
        goToSection(activeIndex + 1)
      }

      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault()
        goToSection(activeIndex - 1)
      }
    }

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null
    }

    const handleTouchEnd = (event: TouchEvent) => {
      const startY = touchStartYRef.current
      const endY = event.changedTouches[0]?.clientY

      if (startY === null || endY === undefined) return

      const diff = startY - endY

      if (Math.abs(diff) < 48) return
      if (isAnimatingRef.current) return

      if (diff > 0) {
        goToSection(activeIndex + 1)
      } else {
        goToSection(activeIndex - 1)
      }

      touchStartYRef.current = null
    }

    container.addEventListener("wheel", handleWheel, { passive: false })
    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchend", handleTouchEnd, { passive: true })
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      container.removeEventListener("wheel", handleWheel)
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [activeIndex, goToSection])

  return (
    <section
      ref={containerRef}
      className="relative isolate h-dvh overflow-hidden bg-black"
    >
      <div className="fixed right-5 top-1/2 z-20 hidden -translate-y-1/2 lg:flex">
        <div className="flex flex-col gap-3">
          {homeSections.map((section) => (
            <button
              aria-label={t(section.titleKey)}
              className="flex items-center justify-center"
              key={section.id}
              onClick={() => goToSection(homeSections.findIndex((item) => item.id === section.id))}
              type="button"
            >
              <span
                className={cn(
                  "block h-2.5 w-2.5 rounded-full transition-all duration-300",
                  activeId === section.id
                    ? "bg-white shadow-[0_0_0_5px_rgba(255,255,255,0.12)]"
                    : "bg-white/28 hover:bg-white/52",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative z-10 h-dvh will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]"
        style={{
          transform: `translate3d(0, -${activeIndex * 100}dvh, 0)`,
        }}
      >
        {homeSections.map((section, index) => (
          <HomeSectionPanel
            entry={section}
            index={index}
            key={section.id}
          />
        ))}
      </div>
    </section>
  )
}

type HomeSectionPanelProps = {
  entry: HomeSection
  index: number
}

function HomeSectionPanel({ entry, index }: HomeSectionPanelProps) {
  const { t } = useTranslation()

  return (
    <article
      className="relative isolate h-dvh overflow-hidden"
      data-anchor={entry.id}
      data-home-section
      data-index={index}
    >
      <img alt="" className="absolute inset-0 -z-30 size-full object-cover" src={entry.imageUrl} />
      <div className="absolute inset-0 -z-20 bg-black/60" />
      <div className="mx-auto flex h-dvh w-full max-w-[1420px] flex-col items-center justify-center px-4 pt-24 pb-8 text-center sm:px-6 lg:px-8 lg:pt-28 lg:pb-10">
        <div className="space-y-5">
          <h2 className="font-heading text-5xl font-semibold tracking-[-0.06em] text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.12)] sm:text-7xl lg:text-[8rem]">
            {entry.displayTitle}
          </h2>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-6 shadow-[0_10px_32px_rgba(15,23,42,0.22)]">
            <Link to={entry.link}>
              {t(entry.ctaKey)}
              <ArrowRightIcon data-icon="inline-end" weight="bold" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
