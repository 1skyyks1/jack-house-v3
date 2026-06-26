import { ArrowSquareOutIcon, ChatsCircleIcon, DiscordLogoIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { RichTextRenderer } from "@/features/rich-text/renderer"

type CommunityLinkItem = {
  descriptionKey?: string
  href: string
  imageUrl: string
  title?: string
  titleKey?: string
}

const qqGroups: CommunityLinkItem[] = [
  {
    descriptionKey: "about.communities.qq.first.description",
    href: "https://qm.qq.com/q/YH43Qvz48G",
    imageUrl: "https://pub-1d83badff2eb42d5be2db70eeb6a4b78.r2.dev/286a8026e7cdb48f93be5454ec508d45_720.png",
    title: "4Key Jack House",
  },
  {
    descriptionKey: "about.communities.qq.second.description",
    href: "https://qm.qq.com/q/5ONvppOKWc",
    imageUrl: "https://pub-1d83badff2eb42d5be2db70eeb6a4b78.r2.dev/10cd81aa5ee18a56fc4f57abf285f493_720.png",
    title: "4Key Jack House v2",
  },
  {
    descriptionKey: "about.communities.qq.shop.description",
    href: "https://qm.qq.com/q/TLt8gQrqca",
    imageUrl: "https://pub-1d83badff2eb42d5be2db70eeb6a4b78.r2.dev/shop.jpg",
    title: "REM Shop!",
  },
  {
    descriptionKey: "about.communities.qq.jhc.description",
    href: "https://qm.qq.com/q/x8CpVXAB20",
    imageUrl: "https://pub-1d83badff2eb42d5be2db70eeb6a4b78.r2.dev/61cbd092c7136aa5e98a9aa19730bb7a_720.png",
    title: "JHC",
  },
  {
    descriptionKey: "about.communities.qq.mjhc.description",
    href: "https://qm.qq.com/q/PRaI9t6P62",
    imageUrl: "https://pub-1d83badff2eb42d5be2db70eeb6a4b78.r2.dev/mjhc.jpg",
    title: "MJHC",
  },
  {
    descriptionKey: "about.communities.qq.delta.description",
    href: "https://qm.qq.com/q/IjR5BlujWE",
    imageUrl: "https://pub-1d83badff2eb42d5be2db70eeb6a4b78.r2.dev/sjz.jpg",
    titleKey: "about.communities.qq.delta.title",
  },
  {
    descriptionKey: "about.communities.qq.codm.description",
    href: "https://qm.qq.com/q/dh4elzESLm",
    imageUrl: "https://pub-1d83badff2eb42d5be2db70eeb6a4b78.r2.dev/codm.jpg",
    title: "REcodM",
  },
  {
    descriptionKey: "about.communities.qq.mc.description",
    href: "https://qm.qq.com/q/Er1DSoL7sm",
    imageUrl: "https://pub-1d83badff2eb42d5be2db70eeb6a4b78.r2.dev/mc.jpg",
    title: "MC House",
  },
]

const discordServers: CommunityLinkItem[] = [
  {
    href: "https://discord.gg/rv4vQ96vBv",
    imageUrl: "https://pub-1d83badff2eb42d5be2db70eeb6a4b78.r2.dev/286a8026e7cdb48f93be5454ec508d45_720.png",
    title: "Jack House",
  },
  {
    descriptionKey: "about.communities.discord.jhc.description",
    href: "https://discord.gg/bjKwc4Z2Yw",
    imageUrl: "https://pub-1d83badff2eb42d5be2db70eeb6a4b78.r2.dev/61cbd092c7136aa5e98a9aa19730bb7a_720.png",
    title: "JHC",
  },
  {
    descriptionKey: "about.communities.discord.mjhc.description",
    href: "https://discord.gg/uQhBXZ2Y7s",
    imageUrl: "https://pub-1d83badff2eb42d5be2db70eeb6a4b78.r2.dev/mjhc.jpg",
    title: "MJHC",
  },
]

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{t("common.about")}</h1>
        <RichTextRenderer content={t("about.p")} />
      </section>

      <CommunitySection
        icon={<ChatsCircleIcon className="size-5" weight="bold" />}
        items={qqGroups}
        title={t("about.qq")}
      />

      <CommunitySection
        icon={<DiscordLogoIcon className="size-5" weight="bold" />}
        items={discordServers}
        title={t("about.dc")}
      />

      <footer className="py-2 text-center text-sm text-muted-foreground">
        <span>{t("about.footerPrefix")}</span>{" "}
        <a
          className="font-medium text-primary underline-offset-4 hover:underline"
          href="https://osu.ppy.sh/users/26030234"
          rel="noopener noreferrer"
          target="_blank"
        >
          yks1
        </a>
        <span>{t("about.footerSuffix")}</span>
      </footer>
    </div>
  )
}

type CommunitySectionProps = {
  icon: React.ReactNode
  items: CommunityLinkItem[]
  title: string
}

function CommunitySection({ icon, items, title }: CommunitySectionProps) {
  const { t } = useTranslation()

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const itemTitle = item.titleKey ? t(item.titleKey) : (item.title ?? "")
          const itemDescription = item.descriptionKey ? t(item.descriptionKey) : itemTitle

          return (
          <a
            className="block h-full"
            href={item.href}
            key={item.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Card className="h-full border bg-card/80 transition hover:-translate-y-0.5 hover:ring-foreground/15" size="sm">
              <CardContent className="flex h-full items-center gap-3 px-4 py-0">
                <Avatar className="size-12 rounded-xl" size="default">
                  <AvatarImage alt={itemTitle} className="rounded-xl" src={item.imageUrl} />
                  <AvatarFallback className="rounded-xl text-sm font-semibold">
                    {itemTitle.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{itemTitle}</div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {itemDescription}
                  </div>
                </div>
                <ArrowSquareOutIcon className="size-4 shrink-0 text-muted-foreground" weight="bold" />
              </CardContent>
            </Card>
          </a>
          )
        })}
      </div>
    </section>
  )
}
