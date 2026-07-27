import { ArrowRight } from "@phosphor-icons/react"
import { useEffect, useRef, useState, type ComponentType } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export type TournamentNavigationItem = {
  href: string
  icon: ComponentType<{ className?: string; weight?: "bold" }>
  label: string
}

type TournamentPageHeaderProps = {
  acronym: string
  description: string
  heroImage: string | null
  name: string
  navigationItems: TournamentNavigationItem[]
  navigationLabel: string
}

export function TournamentPageHeader({
  acronym,
  description,
  heroImage,
  name,
  navigationItems,
  navigationLabel,
}: TournamentPageHeaderProps) {
  const dockMarkerRef = useRef<HTMLDivElement>(null)
  const [isDocked, setIsDocked] = useState(false)

  useEffect(() => {
    const syncDockedState = () => {
      setIsDocked((dockMarkerRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY) <= 64)
    }

    syncDockedState()
    window.addEventListener("resize", syncDockedState)
    window.addEventListener("scroll", syncDockedState, { passive: true })

    return () => {
      window.removeEventListener("resize", syncDockedState)
      window.removeEventListener("scroll", syncDockedState)
    }
  }, [])

  return (
    <>
      <TournamentHero acronym={acronym} description={description} heroImage={heroImage} name={name} />
      <TournamentNavigation items={navigationItems} label={navigationLabel} />
      <div aria-hidden="true" className="h-px" data-tournament-dock-marker ref={dockMarkerRef} />
      <div
        aria-hidden={!isDocked}
        className={cn(
          "pointer-events-none fixed inset-x-0 top-16 z-30 -translate-y-3 opacity-0 transition-[opacity,transform] duration-300 motion-reduce:transition-none",
          isDocked && "pointer-events-auto translate-y-0 opacity-100",
        )}
        data-tournament-docked={isDocked ? "true" : "false"}
        inert={!isDocked}
      >
        <div className="w-full overflow-hidden bg-background/88 shadow-sm backdrop-blur-2xl supports-backdrop-filter:bg-background/76 sm:grid sm:grid-cols-[minmax(14rem,0.38fr)_minmax(0,1fr)]">
          <CompactTournamentHero acronym={acronym} heroImage={heroImage} name={name} />
          <TournamentNavigation compact items={navigationItems} label={navigationLabel} />
        </div>
      </div>
    </>
  )
}

function TournamentHero({ acronym, description, heroImage, name }: Pick<TournamentPageHeaderProps, "acronym" | "description" | "heroImage" | "name">) {
  return (
    <section className="relative min-h-[18rem] overflow-hidden rounded-[1.75rem] bg-muted text-white sm:min-h-[24rem]">
      <HeroBackdrop heroImage={heroImage} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,7,16,0.08)_10%,rgba(4,7,16,0.9)_100%)]" />
      <div className="relative z-10 flex min-h-[18rem] max-w-5xl flex-col justify-end px-6 py-7 sm:min-h-[24rem] sm:px-10 sm:py-9 lg:px-14">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/65">{acronym}</p>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">{name}</h1>
        {description ? <p className="mt-4 max-w-3xl text-sm leading-6 text-white/76 sm:mt-5 sm:text-lg sm:leading-7">{description}</p> : null}
      </div>
    </section>
  )
}

function CompactTournamentHero({ acronym, heroImage, name }: Pick<TournamentPageHeaderProps, "acronym" | "heroImage" | "name">) {
  return (
    <div className="relative flex h-12 min-w-0 items-center overflow-hidden px-4 text-white sm:h-16 sm:px-5">
      <HeroBackdrop heroImage={heroImage} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,7,16,0.9),rgba(4,7,16,0.48))]" />
      <div className="relative z-10 min-w-0">
        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-white/60 sm:text-[0.65rem]">{acronym}</p>
        <p className="truncate font-heading text-sm font-semibold tracking-tight sm:text-base">{name}</p>
      </div>
    </div>
  )
}

function HeroBackdrop({ heroImage }: Pick<TournamentPageHeaderProps, "heroImage">) {
  return heroImage ? (
    <img alt="" className="absolute inset-0 size-full object-cover" decoding="async" fetchPriority="high" src={heroImage} />
  ) : (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.35),transparent_45%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]" />
  )
}

function TournamentNavigation({ compact = false, items, label }: { compact?: boolean; items: TournamentNavigationItem[]; label: string }) {
  return (
    <nav aria-label={label} className={cn(!compact && "mt-3", compact && "bg-background/90")}>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <TournamentNavigationLink compact={compact} href={item.href} icon={item.icon} key={item.href} label={item.label} />
        ))}
      </div>
    </nav>
  )
}

function TournamentNavigationLink({ compact, href, icon: Icon, label }: TournamentNavigationItem & { compact: boolean }) {
  return (
    <Link
      aria-label={label}
      className={cn(
        "group flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.65rem] font-medium leading-none text-muted-foreground transition hover:bg-muted/50 hover:text-foreground sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
        compact ? "h-14 sm:h-16" : "py-3 sm:py-4",
      )}
      title={label}
      to={href}
    >
      <Icon className="size-[1.1rem] shrink-0 transition group-hover:text-primary sm:size-4" weight="bold" />
      <span className="max-w-full truncate">{label}</span>
      {!compact ? <ArrowRight className="hidden size-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 lg:block" weight="bold" /> : null}
    </Link>
  )
}
