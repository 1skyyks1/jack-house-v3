import { Translate } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type AppLocale } from "@/shared/i18n/client"

type LanguageSwitchProps = {
  invert?: boolean
}

export function LanguageSwitch({ invert = false }: LanguageSwitchProps) {
  const { i18n, t } = useTranslation()
  const currentLocale: AppLocale = i18n.language === "en" ? "en" : "zh"
  const nextLocale: AppLocale = currentLocale === "zh" ? "en" : "zh"

  const toggleLocale = () => {
    void i18n.changeLanguage(nextLocale)
    window.localStorage.setItem("locale", nextLocale)
  }

  return (
    <Button
      type="button"
      className={cn(
        "border border-border/60 bg-background/55 backdrop-blur",
        invert
          ? "text-foreground/72 hover:bg-background/70 hover:text-foreground dark:border-white/15 dark:bg-white/6 dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
          : "text-muted-foreground hover:text-foreground",
      )}
      aria-label={`${t("common.language")}: ${nextLocale}`}
      onClick={toggleLocale}
      size="sm"
      variant="outline"
    >
      <Translate className="size-4" weight="bold" />
    </Button>
  )
}
